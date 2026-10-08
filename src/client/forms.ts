import { api, element, labels } from './api.js';
import { answersMatch } from './answers.js';
interface Verb { id:string; infinitive:string; english:string; tier:string; type:string; preterite?:string; participle?:string }
interface Saved { answer:string;expected:string;result:string;explanation:string }
const mode=element<HTMLSelectElement>('learn-mode'),tier=element<HTMLSelectElement>('tier'),type=element<HTMLSelectElement>('type');
const input=element<HTMLInputElement>('answer'),check=element<HTMLButtonElement>('check'),next=element<HTMLButtonElement>('next'),feedback=element('feedback');
const practice=document.body.dataset.mode==='errors'?'errors':'standard';
let deck:Verb[]=[],current:Verb|undefined,form:'preterite'|'participle'='preterite',roundId='',id='',pending:string|undefined,saved:Saved|undefined,busy=false;
let knownPreterite='',knownParticiple='';
function lock(value:boolean) { for(const select of [mode,tier,type]) select.disabled=value; }
function trio() { element('trio').textContent=current?`${current.infinitive} → ${knownPreterite || '…'} → ${knownParticiple || '…'}`:''; }
function draw() {
 id=crypto.randomUUID();pending=undefined;saved=undefined;input.value='';input.readOnly=false;input.disabled=false;check.disabled=false;check.hidden=false;check.textContent='Check answer ↵';next.hidden=true;feedback.textContent='';element('explanation').textContent='';
 element('answer-label').textContent=form==='preterite'?'Präteritum · ich / er / sie / es':'Partizip II';
 element('model').textContent=mode.value==='learn'?`Copy: ${form==='preterite'?knownPreterite:knownParticiple}`:'';
 trio();input.focus();
}
async function load() {
 busy=true;lock(true);input.disabled=true;check.disabled=true;next.hidden=true;current=undefined;deck=[];trio();feedback.textContent='Loading…';element('word').textContent='Loading…';element('model').textContent='';element('explanation').textContent='';
 try { deck=(await api<Verb[]>(`/api/forms/verbs?${new URLSearchParams({mode:mode.value,practice})}`)).filter(v=>(!tier.value||v.tier===tier.value)&&(!type.value||v.type===type.value));
  for(let i=deck.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]]; }
  start();
 } catch(e) { feedback.textContent=e instanceof Error?e.message:'Could not load. Reload to retry.'; }
 finally {busy=false;lock(false);}
}
function start() {
 current=deck.pop();
 if(!current) { element('word').textContent='No more verbs in this set';feedback.textContent='Choose another filter or reload to practice again. Common errors come from your last five normal Recall answers per form.';input.disabled=true;check.disabled=true;next.hidden=true;element('model').textContent='';element('explanation').textContent='';trio();return; }
 form='preterite';roundId=crypto.randomUUID();knownPreterite=current.preterite||'';knownParticiple=current.participle||'';element('word').textContent=`${current.infinitive} · ${current.english}`;draw();
}
function complete() { input.readOnly=true;check.hidden=true;next.hidden=false;next.textContent=form==='preterite'?'Continue to Partizip II →':'Next verb →';next.focus();if(form==='participle')lock(false); }
element('answer-form').addEventListener('submit',async event=>{
 event.preventDefault();if(busy||!current||input.readOnly||!input.value.trim())return;
 if(saved) { if(!answersMatch(input.value,saved.expected)) { feedback.textContent=`Try again: type ${saved.expected}. You originally typed “${saved.answer}”.`;return; } feedback.textContent=`Correction complete. Original answer: “${saved.answer}”; correct: ${saved.expected}.`;complete();return; }
 pending??=input.value;busy=true;lock(true);check.disabled=true;input.readOnly=true;
 try {
  saved=await api<Saved>('/api/forms/attempts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,roundId,verbId:current.id,form,mode:mode.value,practice,answer:pending})});
  if(form==='preterite')knownPreterite=saved.expected;else knownParticiple=saved.expected;trio();
  feedback.textContent=`${labels[saved.result]}. You typed “${saved.answer}”; correct: ${saved.expected}.`;
  element('explanation').textContent=saved.explanation;
  if(saved.result==='correct')complete();else { input.value='';input.readOnly=false;check.disabled=false;check.textContent='Check correction ↵';feedback.textContent+=' Type the correct form to continue.';input.focus(); }
 } catch(e) { feedback.textContent=`${e instanceof Error?e.message:'Save failed'}. Retry saves your original answer.`;input.readOnly=false;check.disabled=false; }
 finally {busy=false;}
});
next.addEventListener('click',()=>{if(form==='preterite'){form='participle';draw();}else start();});
for(const select of [mode,tier,type])select.addEventListener('change',()=>void load());
void load();
