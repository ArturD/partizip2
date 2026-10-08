import { verbs } from '../../data/verbs.ts';
import { preterite, preteriteExplanation } from '../../data/preterite.ts';
import { grade } from '../../worker/grading.ts';
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function formsApi(request: Request, db: D1Database, learner: string) {
 const url = new URL(request.url);
 if (request.method === 'GET' && url.pathname === '/api/forms/verbs') {
  const mode = url.searchParams.get('mode') || 'recall', practice = url.searchParams.get('practice') || 'standard';
  if (!['recall','learn'].includes(mode) || !['standard','errors'].includes(practice)) return json({ error: 'Invalid mode.' },400);
  let selected = verbs;
  if (practice === 'errors') {
   const rows = await db.prepare(`WITH recent AS (
    SELECT verb_id, form, result, answered_at, ROW_NUMBER() OVER (PARTITION BY verb_id, form ORDER BY answered_at DESC,id DESC) n
    FROM form_attempts WHERE learner_id = ? AND mode = 'recall' AND practice_mode = 'standard'
   ), weak AS (SELECT verb_id, form, SUM(CASE result WHEN 'wrong' THEN 1.0 WHEN 'typo' THEN 0.5 ELSE 0 END) loss, MAX(answered_at) latest
    FROM recent WHERE n <= 5 GROUP BY verb_id, form HAVING loss >= 1)
   SELECT verb_id FROM weak GROUP BY verb_id ORDER BY SUM(loss) DESC, MAX(latest) DESC, verb_id LIMIT 20`).bind(learner).all<{verb_id:string}>();
   selected = rows.results.flatMap(r => verbs.filter(v => v.id === r.verb_id));
  }
  return json(selected.map(v => ({ id:v.id, infinitive:v.infinitive, english:v.english, tier:v.tier, type:v.type,
   ...(mode === 'learn' ? { preterite:preterite[v.id], participle:v.participle } : {}) })));
 }
 if (request.method === 'GET' && url.pathname === '/api/forms/progress') {
  const mode = url.searchParams.get('mode') || 'recall', practice = url.searchParams.get('practice') || 'standard';
  const tier = url.searchParams.get('tier') || '', type = url.searchParams.get('type') || '';
  if (!['recall','learn'].includes(mode) || !['standard','errors'].includes(practice) || !['','essential','common','extended'].includes(tier) || !['','regular','irregular'].includes(type)) return json({ error:'Invalid filter.' },400);
  const where = "learner_id = ? AND mode = ? AND practice_mode = ? AND (? = '' OR tier = ?) AND (? = '' OR verb_type = ?)";
  const bindings = [learner,mode,practice,tier,tier,type,type];
  const score = "CASE result WHEN 'correct' THEN 100.0 WHEN 'typo' THEN 50.0 ELSE 0 END";
  const results = await db.batch([
   db.prepare(`SELECT form, COUNT(*) total, AVG(${score}) accuracy FROM form_attempts WHERE ${where} GROUP BY form`).bind(...bindings),
   db.prepare(`SELECT form, substr(answered_at,1,10) day, AVG(${score}) accuracy, COUNT(*) total FROM form_attempts WHERE ${where} AND answered_at >= ? GROUP BY form,day ORDER BY day`).bind(...bindings,new Date(Date.now()-90*86400000).toISOString()),
   db.prepare(`WITH timeline AS (SELECT *,LAG(answered_at) OVER (ORDER BY answered_at,id) previous_at FROM form_attempts WHERE learner_id = ? AND mode = ? AND practice_mode = ?), boundary AS (SELECT MAX(answered_at) started_at FROM timeline WHERE previous_at IS NULL OR julianday(answered_at) >= julianday(previous_at,'+4 hours'))
    SELECT form, answered_at, ${score} score, ROW_NUMBER() OVER (ORDER BY answered_at,id) number FROM timeline WHERE answered_at >= (SELECT started_at FROM boundary) AND (? = '' OR tier = ?) AND (? = '' OR verb_type = ?) ORDER BY answered_at,id`).bind(...bindings)
  ]);
  return json({summary:results[0].results,days:results[1].results,lesson:results[2].results});
 }
 if (request.method !== 'POST' || url.pathname !== '/api/forms/attempts') return json({error:'Route not found.'},404);
 if (request.headers.get('Origin') !== url.origin) return json({error:'Invalid origin.'},403);
 if (!request.headers.get('Content-Type')?.startsWith('application/json')) return json({error:'JSON required.'},415);
 const reader=request.body?.getReader(); if (!reader) return json({error:'Answer required.'},400);
 let raw='',size=0; const decoder=new TextDecoder();
 while(true) { const {done,value}=await reader.read(); if(done) break; size+=value.byteLength; if(size>2048) { await reader.cancel(); return json({error:'Request too large.'},413); } raw+=decoder.decode(value,{stream:true}); }
 let b; try { b=JSON.parse(raw+decoder.decode()); } catch { return json({error:'Invalid JSON.'},400); }
 if (!b || typeof b.id !== 'string' || !uuid.test(b.id) || typeof b.roundId !== 'string' || !uuid.test(b.roundId) || !['preterite','participle'].includes(b.form) || !['recall','learn'].includes(b.mode) || !['standard','errors'].includes(b.practice) || typeof b.answer !== 'string' || !b.answer.trim() || b.answer.length>100) return json({error:'Invalid answer.'},400);
 const verb=verbs.find(v=>v.id===b.verbId); if(!verb) return json({error:'Unknown verb.'},400);
 const previous=await db.prepare('SELECT verb_id,form,mode,practice_mode FROM form_attempts WHERE learner_id = ? AND round_id = ?').bind(learner,b.roundId).all<{verb_id:string;form:string;mode:string;practice_mode:string}>();
 if(previous.results.some(r=>r.verb_id!==verb.id || r.mode!==b.mode || r.practice_mode!==b.practice) || (b.form==='participle' && !previous.results.some(r=>r.form==='preterite'))) return json({error:'Complete Präteritum first; keep the same verb and mode throughout the round.'},409);
 const expected=b.form==='preterite'?preterite[verb.id]:verb.participle;
 await db.prepare('INSERT INTO form_attempts (id,learner_id,round_id,verb_id,tier,verb_type,form,mode,practice_mode,answer,expected,result,answered_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT DO NOTHING').bind(b.id,learner,b.roundId,verb.id,verb.tier,verb.type,b.form,b.mode,b.practice,b.answer,expected,grade(b.answer,expected),new Date().toISOString()).run();
 const saved=await db.prepare('SELECT answer,expected,result FROM form_attempts WHERE learner_id = ? AND round_id = ? AND form = ?').bind(learner,b.roundId,b.form).first();
 if(!saved) return json({error:'Attempt conflict. Reload to try again.'},409);
 return json({...saved, explanation:b.form==='preterite'?preteriteExplanation(verb):verb.explanation});
}
