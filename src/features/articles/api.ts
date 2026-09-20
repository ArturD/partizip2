import { nouns, steps, articles, solution, type Question } from './nouns.ts';
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function articlesApi(request: Request, db: D1Database, learner: string) {
  const url = new URL(request.url);
  if (request.method === 'GET' && url.pathname === '/api/articles/nouns') return json(nouns.map(({ gender, ...noun }) => noun));
  if (request.method === 'GET' && url.pathname === '/api/articles/progress') {
    const difficulty = url.searchParams.get('difficulty') || 'easy';
    if (!['easy','hard'].includes(difficulty)) return json({ error: 'Invalid difficulty.' }, 400);
    const tier = url.searchParams.get('tier') || '';
    const question = url.searchParams.get('question') || '';
    if (!['', 'essential', 'common', 'extended'].includes(tier) || (question && !steps.includes(question as Question))) return json({ error: 'Invalid filter.' }, 400);
    const where = "learner_id = ? AND difficulty = ? AND (? = '' OR tier = ?) AND (? = '' OR question = ?)";
    const bindings = [learner, difficulty, tier, tier, question, question];
    const results = await db.batch([
      db.prepare(`SELECT question, COUNT(*) total, SUM(correct) correct FROM article_attempts WHERE ${where} GROUP BY question`).bind(...bindings),
      db.prepare(`SELECT question, substr(answered_at,1,10) day, COUNT(*) total, SUM(correct) correct FROM article_attempts WHERE ${where} AND answered_at >= ? GROUP BY day, question ORDER BY day, question`).bind(...bindings, new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate() - 89)).toISOString()),
    ]);
    return json({ summary: results[0].results, days: results[1].results });
  }
  if (request.method !== 'POST' || url.pathname !== '/api/articles/attempts') return json({ error: 'Route not found.' }, 404);
  if (request.headers.get('Origin') !== url.origin) return json({ error: 'Invalid request origin.' }, 403);
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return json({ error: 'JSON required.' }, 415);
  const reader = request.body?.getReader();
  if (!reader) return json({ error: 'Answer required.' }, 400);
  let raw = '', size = 0; const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.byteLength; if (size > 2048) { await reader.cancel(); return json({ error: 'Request too large.' }, 413); }
    raw += decoder.decode(value, { stream: true });
  }
  let body;
  try { body = JSON.parse(raw + decoder.decode()); } catch { return json({ error: 'Invalid JSON.' }, 400); }
  if (!body || typeof body.id !== 'string' || !uuid.test(body.id) || typeof body.roundId !== 'string' || !uuid.test(body.roundId) || !steps.includes(body.question) || !articles.includes(body.answer)) return json({ error: 'Invalid answer.' }, 400);
  const noun = nouns.find(n => n.id === body.nounId);
  if (!noun || noun.version !== body.version) return json({ error: 'Content changed. Reload the page.' }, 409);
  const difficulty = body.difficulty ?? 'easy';
  if (!['easy','hard'].includes(difficulty)) return json({ error: 'Invalid difficulty.' }, 400);
  const question = body.question as Question;
  const previous = await db.prepare('SELECT noun_id, question, difficulty FROM article_attempts WHERE learner_id = ? AND round_id = ?').bind(learner, body.roundId).all<{ noun_id: string; question: string; difficulty: string }>();
  if (previous.results.some(row => row.noun_id !== noun.id || row.difficulty !== difficulty) || (difficulty === 'hard' ? (question === 'gender' ? [] : ['gender']) : steps.slice(0, steps.indexOf(question))).some(step => !previous.results.some(row => row.question === step))) return json({ error: 'Complete the earlier questions first.' }, 409);
  const result = solution(noun, question);
  await db.prepare('INSERT INTO article_attempts (id, learner_id, round_id, noun_id, content_version, tier, question, answer, expected, correct, answered_at, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING')
    .bind(body.id, learner, body.roundId, noun.id, noun.version, noun.tier, question, body.answer, result.expected, Number(body.answer === result.expected), new Date().toISOString(), difficulty).run();
  const saved = await db.prepare('SELECT id, answer, expected, correct FROM article_attempts WHERE learner_id = ? AND round_id = ? AND question = ?').bind(learner, body.roundId, question).first();
  if (!saved) return json({ error: 'Attempt conflict. Reload and try again.' }, 409);
  return json({ ...saved, explanation: result.explanation });
}
