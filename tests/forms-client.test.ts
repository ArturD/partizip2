import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {runInNewContext} from 'node:vm';
import {answersMatch} from '../src/client/answers.ts';
for(const mode of ['recall','learn'])test(`${mode}: combined round reveals forms in order and corrections do not save`,async()=>{
 const elements=new Map();const element=(id:string)=>{if(!elements.has(id))elements.set(id,{value:'',textContent:'',hidden:false,disabled:false,readOnly:false,handlers:new Map(),addEventListener(n:string,f:Function){this.handlers.set(n,f);},focus(){}});return elements.get(id);};
 element('learn-mode').value=mode;const calls:any[]=[];
 runInNewContext(stripTypeScriptTypes(readFileSync(new URL('../src/client/forms.ts',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'')),{element,answersMatch,crypto,URLSearchParams,document:{body:{dataset:{}}},labels:{wrong:'Wrong',correct:'Correct'},api:async(path:string,options:any)=>{
  if(!options)return[{id:'gehen',infinitive:'gehen',english:'go',tier:'essential',type:'irregular',...(mode==='learn'?{preterite:'ging',participle:'gegangen'}:{})}];
  const b=JSON.parse(options.body);calls.push(b);return{answer:b.answer,expected:b.form==='preterite'?'ging':'gegangen',result:b.answer==='wrong'?'wrong':'correct',explanation:'Rule'};
 }});
 await new Promise(r=>setImmediate(r));
 assert.equal(element('trio').textContent,mode==='learn'?'gehen → ging → gegangen':'gehen → … → …');
 const submit=async(value:string)=>{element('answer').value=value;await element('answer-form').handlers.get('submit')({preventDefault(){}});};
 await submit('wrong');assert.equal(element('next').hidden,true);assert.equal(element('learn-mode').disabled,true);
 await submit('ging');assert.equal(calls.length,1);assert.equal(element('next').hidden,false);
 element('next').handlers.get('click')();assert.equal(element('answer-label').textContent,'Partizip II');
 assert.equal(element('trio').textContent,mode==='learn'?'gehen → ging → gegangen':'gehen → ging → …');
 await submit('gegangen');assert.equal(calls.length,2);assert.equal(calls[0].roundId,calls[1].roundId);
 assert.equal(element('trio').textContent,'gehen → ging → gegangen');assert.equal(element('learn-mode').disabled,false);
});

