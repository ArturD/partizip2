import { lessonQuery } from './trends';
import { commonErrorsQuery } from './common-errors';
import { verbs } from '../data/verbs';
import { grade } from './grading';
interface Env { DB: D1Database; ASSETS: Fetcher }
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });

async function api(request: Request, env: Env, learner: string): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === 'GET' && url.pathname === '/api/verbs') {
    return json(verbs.map(({ participle, explanation, ...verb }) => verb));
  }
  if (request.method === 'GET' && url.pathname === '/api/common-errors') {
    const rows = await env.DB.prepare(commonErrorsQuery).bind(learner).all<{ verb_id: string }>();
    return json(rows.results.flatMap(row => {
      const verb = verbs.find(verb => verb.id === row.verb_id);
      if (!verb) return [];
      const { explanation, ...prompt } = verb;
      return [prompt];
    }));
  }
  if (request.method === 'POST' && url.pathname === '/api/attempts') {
    if (request.headers.get('Origin') !== url.origin) return json({ error: 'Invalid request origin.' }, 403);
    if (!request.headers.get('Content-Type')?.startsWith('application/json')) return json({ error: 'JSON required.' }, 415);
    // Bound the body even if Content-Length is absent or inaccurate.
    const reader = request.body?.getReader();
    if (!reader) return json({ error: 'Answer required.' }, 400);
    let raw = '', size = 0;
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 2048) { await reader.cancel(); return json({ error: 'Answer too long.' }, 413); }
      raw += decoder.decode(value, { stream: true });
    }
    raw += decoder.decode();
    let body: { id?: unknown; verbId?: unknown; answer?: unknown; mode?: unknown };
    try { body = JSON.parse(raw); } catch { return json({ error: 'Invalid JSON.' }, 400); }
    if (!body || typeof body.id !== 'string' || !uuid.test(body.id) || typeof body.answer !== 'string' || !body.answer.trim() || body.answer.length > 100) return json({ error: 'Enter an answer of 1–100 characters.' }, 400);
    const verb = verbs.find(v => v.id === body.verbId);
    const mode = body.mode ?? 'standard';
    if (mode !== 'standard' && mode !== 'errors') return json({ error: 'Invalid practice mode.' }, 400);
    if (!verb) return json({ error: 'Unknown verb.' }, 400);
    const result = grade(body.answer, verb.participle);
    await env.DB.prepare('INSERT INTO attempts (id, learner_id, verb_id, tier, verb_type, answer, expected, result, answered_at, practice_mode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING')
      .bind(body.id, learner, verb.id, verb.tier, verb.type, body.answer, verb.participle, result, new Date().toISOString(), mode).run();
    const saved = await env.DB.prepare('SELECT id, verb_id, answer, expected, result, answered_at, practice_mode FROM attempts WHERE id = ? AND learner_id = ?').bind(body.id, learner).first();
    if (!saved) return json({ error: 'Attempt ID conflict. Reload and try again.' }, 409);
    // Use the saved verb for idempotent retries, not a possibly changed request body.
    return json({ ...saved, explanation: verbs.find(v => v.id === saved.verb_id)?.explanation ?? '' });
  }
  if (request.method === 'GET' && ['/api/progress', '/api/trends'].includes(url.pathname)) {
    const tier = url.searchParams.get('tier') || '', type = url.searchParams.get('type') || '';
    const offset = Number(url.searchParams.get('offset') || 0);
    const mode = url.searchParams.get('mode') || 'standard';
    if (!['standard', 'errors', 'all'].includes(mode)) return json({ error: 'Invalid practice mode.' }, 400);
    if (!['', 'essential', 'common', 'extended'].includes(tier) || !['', 'regular', 'irregular'].includes(type) || !Number.isSafeInteger(offset) || offset < 0 || offset > 1000000) return json({ error: 'Invalid filter.' }, 400);
    const where = 'learner_id = ? AND (? = \'all\' OR practice_mode = ?) AND (? = \'\' OR tier = ?) AND (? = \'\' OR verb_type = ?)';
    const bindings = [learner, mode, mode, tier, tier, type, type];
    if (url.pathname === '/api/trends') {
      const since = new Date(); since.setUTCHours(0, 0, 0, 0); since.setUTCDate(since.getUTCDate() - 95);
      const results = await env.DB.batch([
        // Infer the latest lesson before applying filters, so filters cannot split a lesson.
        env.DB.prepare(lessonQuery).bind(...bindings),
        env.DB.prepare(`SELECT substr(answered_at, 1, 10) AS day, COUNT(*) AS total,
          SUM(result = 'correct') AS correct, SUM(result = 'typo') AS typo FROM attempts
          WHERE ${where} AND answered_at >= ? GROUP BY day ORDER BY day`).bind(...bindings, since.toISOString()),
      ]);
      return json({ lesson: results[0].results.reverse(), days: results[1].results, today: new Date().toISOString().slice(0, 10) });
    }
    const results = await env.DB.batch([
      env.DB.prepare(`SELECT COUNT(*) AS total, COALESCE(SUM(result = 'correct'), 0) AS correct, COALESCE(SUM(result = 'typo'), 0) AS typo, COALESCE(SUM(result = 'wrong'), 0) AS wrong, COUNT(DISTINCT verb_id) AS practiced FROM attempts WHERE ${where}`).bind(...bindings),
      env.DB.prepare(`SELECT id, verb_id, answer, expected, result, answered_at, tier, verb_type, practice_mode FROM attempts WHERE ${where} ORDER BY answered_at DESC, id DESC LIMIT 50 OFFSET ?`).bind(...bindings, offset),
    ]);
    return json({ summary: results[0].results[0], attempts: results[1].results, offset });
  }
  return json({ error: 'Route not found.' }, 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (!new URL(request.url).pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    const existing = request.headers.get('Cookie')?.split(';').map(s => s.trim()).find(s => s.startsWith('learner='))?.slice(8);
    const learner = existing && uuid.test(existing) ? existing : crypto.randomUUID();
    let response: Response;
    try { response = await api(request, env, learner); }
    catch (error) { console.error('API failure', error instanceof Error ? error.message : 'unknown'); response = json({ error: 'Could not access your progress. Please try again.' }, 503); }
    response.headers.set('X-Content-Type-Options', 'nosniff');
    if (learner !== existing) response.headers.set('Set-Cookie', `learner=${learner}; HttpOnly; SameSite=Strict; Path=/; Max-Age=31536000${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`);
    return response;
  },
};
