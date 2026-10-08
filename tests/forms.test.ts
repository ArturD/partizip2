import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { formsApi } from '../src/features/forms/api.ts';
test('combined forms enforce sequence, preserve retries and isolate modes and learners',async()=>{
 const sql=new DatabaseSync(':memory:');sql.exec(readFileSync(new URL('../migrations/0006_forms.sql',import.meta.url),'utf8'));
 const db={prepare(query:string){let args:any[]=[];return{bind(...values:any[]){args=values;return this;},async run(){return sql.prepare(query).run(...args);},async first(){return sql.prepare(query).get(...args)||null;},async all(){return{results:sql.prepare(query).all(...args)};}};},async batch(items:any[]){return Promise.all(items.map(i=>i.all()));}} as unknown as D1Database;
 const get=async(path:string,learner='one')=>{const r=await formsApi(new Request('https://test.local/api/forms/'+path),db,learner);assert.equal(r.status,200);return r.json() as Promise<any>;};
 const roundId=crypto.randomUUID();const body={id:crypto.randomUUID(),roundId,verbId:'gehen',form:'preterite',mode:'recall',practice:'standard',answer:'bad'};
 const post=(b:any)=>formsApi(new Request('https://test.local/api/forms/attempts',{method:'POST',headers:{Origin:'https://test.local','Content-Type':'application/json'},body:JSON.stringify(b)}),db,'one');
 try{
  const recall=await get('verbs');assert.equal(recall.length,110);assert.ok(!('participle' in recall[0]));assert.ok(!('preterite' in recall[0]));
  const learn=await get('verbs?mode=learn');assert.ok(learn.every((v:any)=>v.preterite&&v.participle));
  assert.equal((await post({...body,form:'participle'})).status,409);
  const saved=await (await post(body)).json();assert.deepEqual(await (await post({...body,answer:'ging'})).json(),saved);
  assert.equal((await post({...body,id:crypto.randomUUID(),form:'participle',mode:'learn'})).status,409);
  assert.equal((await post({...body,id:crypto.randomUUID(),form:'participle',answer:'gegangen'})).status,200);
  assert.equal((await get('verbs?practice=errors'))[0].id,'gehen');
  await post({...body,id:crypto.randomUUID(),roundId:crypto.randomUUID(),mode:'learn',answer:'ging'});
  await post({...body,id:crypto.randomUUID(),roundId:crypto.randomUUID(),practice:'errors',answer:'ging'});
  const progress=await get('progress');assert.equal(progress.summary.reduce((n:number,r:any)=>n+r.total,0),2);assert.equal(progress.lesson.length,2);
  assert.equal((await get('progress?mode=learn')).lesson.length,1);assert.equal((await get('progress?practice=errors')).lesson.length,1);
  assert.equal((await get('progress','two')).lesson.length,0);
  for(let i=0;i<5;i++)await post({...body,id:crypto.randomUUID(),roundId:crypto.randomUUID(),answer:'ging'});
  assert.equal((await get('verbs?practice=errors')).length,0);
 }finally{sql.close();}
});
