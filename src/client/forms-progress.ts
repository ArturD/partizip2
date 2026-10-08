import { api, element } from './api.js';
import { multiChart } from './multi-chart.js';
import { smoothLesson, type LessonAnswer } from './trends.js';
interface Data { summary:{form:string;total:number;accuracy:number}[];days:{form:string;day:string;total:number;accuracy:number}[];lesson:(LessonAnswer & {form:string})[] }
let generation=0;
async function load(){
 const gen=++generation;const params=new URLSearchParams();
 for(const name of ['mode','practice','tier','type'])params.set(name,element<HTMLSelectElement>(name).value);
 const period=Number(element<HTMLInputElement>('period').value);
 if(!Number.isInteger(period)||period<1||period>100){element('status').textContent='Choose a period from 1 to 100.';return;}
 element('status').textContent='Loading…';
 try {const data=await api<Data>(`/api/forms/progress?${params}`);if(gen!==generation)return;
 element('status').textContent=data.summary.length?data.summary.map(s=>`${s.form==='preterite'?'Präteritum':'Partizip II'}: ${Math.round(s.accuracy)}% (${s.total} answers)`).join(' · '):'No combined practice yet.';
 const definitions=[{form:'preterite',name:'Präteritum',color:'#236db0',dash:''},{form:'participle',name:'Partizip II',color:'#b45309',dash:'9 4'}];
 multiChart(element('lesson'),definitions.map(s=>({...s,points:smoothLesson(data.lesson.filter(a=>a.form===s.form),period,element<HTMLSelectElement>('method').value==='ema'?'ema':'sma').slice(-500).map(a=>({x:a.number,label:`Answer ${a.number}`,value:a.accuracy,detail:a.answered_at}))})),'Combined practice: latest lesson');
 const today=new Date();today.setUTCHours(0,0,0,0);
 multiChart(element('daily'),definitions.map(s=>({...s,points:Array.from({length:90},(_,i)=>{const x=today.getTime()-(89-i)*86400000,label=new Date(x).toISOString().slice(0,10),day=data.days.find(d=>d.form===s.form&&d.day===label);return{x,label,value:day?.accuracy??null,detail:day?`${day.total} answers`:'No practice'};})})),'Combined practice: daily accuracy');
 }catch(e){if(gen===generation)element('status').textContent=e instanceof Error?e.message:'Could not load progress.';}
}
for(const name of ['mode','practice','tier','type','period','method'])element(name).addEventListener('change',()=>void load());
element('refresh').addEventListener('click',()=>void load());
document.addEventListener('visibilitychange',()=>{if(!document.hidden)void load();});void load();
