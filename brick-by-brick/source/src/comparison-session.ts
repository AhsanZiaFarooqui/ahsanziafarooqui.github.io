import type {Module,Skill} from './types.ts';
import type {AiResult} from './ai-contract.ts';
import {validOutput} from './ai-contract.ts';
import {skillsFor} from './bank.ts';
import {tutorialById} from './tutorials.ts';
import {BLUEPRINT_VERSION,otherForm,quizForms,quizItem} from './assessment-bank.ts';
import type {Form,QuizItem} from './assessment-bank.ts';

export type Mode='practice'|'comparison';
export type Arm='standard'|'ai';
export type Stage='pre'|'initial'|'lesson'|'post'|'results'|'other';
export interface ResponseRecord {itemId:string;choiceId:string|null;type:'answer'|'uncertain';correct:boolean;submittedAt:string}
export interface Quiz {form:Form;status:'incomplete'|'complete';answers:ResponseRecord[];completedAt?:string}
export interface Deviation {code:string;detail:string;at:string}
export interface Learning {arm:Arm;order:string[];index:number;step:number;visited:string[];startedAt:string;completedAt?:string;ai:Record<string,{status:'pending'|'ready';result?:AiResult;requestedAt:string;receivedAt?:string;context:string}>}
export interface LearningSession {id:string;version:typeof BLUEPRINT_VERSION;topic:Module;mode:Mode;startedAt:string;updatedAt:string;stage:Stage;paused:boolean;pre:Quiz;post:Quiz;assignment?:{arm:Arm;at:string;method:'independent-crypto-bernoulli-0.5'};selectedArm?:Arm;learning?:Learning;otherLearning?:Learning;choiceOrders:Record<string,string[]>;deviations:Deviation[];completedAt?:string}
export interface ComparisonStore {schemaVersion:2;revision:number;activeId?:string;sessions:LearningSession[]}
export const COMPARISON_KEY='brick-by-brick:comparison:v2';
export const emptyComparisonStore=():ComparisonStore=>({schemaVersion:2,revision:0,sessions:[]});
export const now=()=>new Date().toISOString();
// Independent fair draws, not alternation and not an outcome-dependent rule.
export const fairBit=():number=>crypto.getRandomValues(new Uint32Array(1))[0]<0x80000000?0:1;
function shuffled<T>(values:T[]):T[]{const result=[...values];for(let k=result.length-1;k>0;k--){const limit=0x100000000-(0x100000000%(k+1));let draw:number;do{draw=crypto.getRandomValues(new Uint32Array(1))[0];}while(draw>=limit);const j=draw%(k+1);[result[k],result[j]]=[result[j],result[k]];}return result;}
export function createLearningSession(topic:Module,mode:Mode,bit=fairBit):LearningSession {
 const form:Form=bit()===0?'A':'B';
 return {id:crypto.randomUUID(),version:BLUEPRINT_VERSION,topic,mode,startedAt:now(),updatedAt:now(),stage:'pre',paused:false,pre:{form,status:'incomplete',answers:[]},post:{form:otherForm(form),status:'incomplete',answers:[]},choiceOrders:Object.fromEntries([...quizForms[topic].A,...quizForms[topic].B].map(i=>[i.id,shuffled(i.choices.map(c=>c.id))])),deviations:[]};
}
export function currentQuestion(s:LearningSession):QuizItem {if(s.stage!=='pre'&&s.stage!=='post')throw Error('No quiz active');const q=s[s.stage];return quizForms[s.topic][q.form][q.answers.length];}
export function submitAnswer(s:LearningSession,itemId:string,choiceId:string|null,bit=fairBit):LearningSession {
 if(s.stage!=='pre'&&s.stage!=='post')throw Error('Quiz is not active');
 const phase=s.stage,q=s[phase],item=currentQuestion(s);
 if(!item||item.id!==itemId)throw Error('Stale or duplicate response');
 if(choiceId!==null&&!item.choices.some(c=>c.id===choiceId))throw Error('Unknown response');
 const next=structuredClone(s);next.updatedAt=now();next.paused=false;
 next[phase].answers.push({itemId,choiceId,type:choiceId===null?'uncertain':'answer',correct:choiceId===item.correct,submittedAt:now()});
 if(q.answers.length===7){next[phase].status='complete';next[phase].completedAt=now();next.stage=phase==='pre'?'initial':'results';
  if(phase==='pre'&&s.mode==='comparison'&&!s.assignment)next.assignment={arm:bit()===0?'standard':'ai',at:now(),method:'independent-crypto-bernoulli-0.5'};
  if(phase==='post')next.completedAt=now();
 }
 return next;
}
export function scoreQuiz(q:Quiz):number|null {return q.status==='complete'&&q.answers.length===8?q.answers.filter(a=>a.correct).length:null;}
export function conceptScores(s:LearningSession,phase:'pre'|'post'){return skillsFor(s.topic).map(skill=>{const answers=s[phase].answers.filter(a=>quizItem(a.itemId).concept===skill);return {skill,correct:answers.filter(a=>a.correct).length,answered:answers.length,total:quizForms[s.topic][s[phase].form].filter(i=>i.concept===skill).length};});}
export const coreLessons:Record<Module,string[]>={time:['hands','fives','moving-hour','half-past','quarters','read-time'],fractions:['whole','equal-parts','fraction-symbols','picture-fraction','half-quarters','third-sixths','compare']};
export function lessonOrder(s:LearningSession,arm:Arm):string[]{const ids=[...coreLessons[s.topic]];if(arm==='standard')return ids;const totals=conceptScores(s,'pre');const need=(id:string)=>{const c=totals.find(c=>c.skill===tutorialById(id).skill)!;return (c.total-c.correct)/c.total;};return ids.sort((a,b)=>need(b)-need(a));}
export function startLearning(s:LearningSession,arm:Arm,other=false):LearningSession {
 if(other){if(s.stage!=='results'||scoreQuiz(s.post)===null)throw Error('Finish the final quiz first');if(arm===(s.assignment?.arm||s.selectedArm))throw Error('Choose the other tutorial');}
 else {if(s.stage!=='initial'||scoreQuiz(s.pre)===null)throw Error('Finish the initial quiz first');if(s.mode==='comparison'&&s.assignment?.arm!==arm)throw Error('Comparison assignment is locked');}
 const next=structuredClone(s),key=other?'otherLearning':'learning';
 if(!other&&s.mode==='practice')next.selectedArm=arm;
 next[key]=next[key]||{arm,order:lessonOrder(s,arm),index:0,step:0,visited:[],startedAt:now(),ai:{}};next.stage=other?'other':'lesson';next.updatedAt=now();return next;
}
export function beginFinalQuiz(s:LearningSession):LearningSession {if(s.stage!=='lesson'||!s.learning||s.learning.visited.length!==s.learning.order.length)throw Error('Review every concept first');return {...s,stage:'post',learning:{...s.learning,completedAt:now()},updatedAt:now()};}
export function addDeviation(s:LearningSession,code:string,detail:string):LearningSession {return {...s,deviations:[...s.deviations,{code,detail,at:now()}],updatedAt:now()};}
export function tailoringContext(s:LearningSession,skill:Skill):string {
 // Only initial responses for this concept. No name, ID, final item or final answer is sent.
 const answers=s.pre.answers.filter(a=>quizItem(a.itemId).concept===skill);
 const evidence=answers.map(a=>{const i=quizItem(a.itemId);const stimulus=i.visual.kind==='clock'?`clock ${Math.floor(i.visual.total/60)}:${String(i.visual.total%60).padStart(2,'0')}`:i.visual.kind==='fraction'?`${i.visual.n}/${i.visual.d} shaded`:i.prompt.slice(0,70);return `${stimulus}; chose ${a.type==='uncertain'?"I'm not sure":i.choices.find(c=>c.id===a.choiceId)!.label}; ${a.correct?'correct':'incorrect'}.`;}).join(' ');
 return (`Initial ${skill} maths answers: `+evidence).slice(0,300);
}
export function resultWords(before:number,after:number):string {const diff=after-before;return diff>0?`${diff} more correct ${diff===1?'answer':'answers'}, or ${diff*12.5} percentage points higher.`:diff<0?`${-diff} fewer correct ${diff===-1?'answer':'answers'}, or ${-diff*12.5} percentage points lower.`:'The same number correct: no change (0 percentage points).';}
export function exportEvidence(store:ComparisonStore,mode:Mode){return {schemaVersion:2,blueprint:BLUEPRINT_VERSION,exportedAt:now(),mode,unit:'session; not a verified unique participant',sessions:store.sessions.filter(s=>s.mode===mode)};}
export function summaryCsv(store:ComparisonStore,mode:Mode):string {
 const rows:unknown[][]=[['sessionId','mode','topic','blueprint','initialForm','assignedArm','selectedArm','stage','paused','initialStatus','initialAnswered','initialScore','finalStatus','finalAnswered','finalScore','changeCorrect','changePercentagePoints','liveExplanations','builtInExplanations','deviations']];
 for(const s of store.sessions.filter(s=>s.mode===mode)){const pre=scoreQuiz(s.pre),post=scoreQuiz(s.post),responses=Object.values(s.learning?.ai||{});rows.push([s.id,s.mode,s.topic,s.version,s.pre.form,s.assignment?.arm||'',s.selectedArm||'',s.stage,s.paused,s.pre.status,s.pre.answers.length,pre??'',s.post.status,s.post.answers.length,post??'',pre!==null&&post!==null?post-pre:'',pre!==null&&post!==null?(post-pre)*12.5:'',responses.filter(r=>r.result?.mode==='live').length,responses.filter(r=>r.result?.mode==='built-in').length,JSON.stringify(s.deviations)]);}
 return rows.map(row=>row.map(v=>{let text=String(v);if(/^[=+@\-\t\r]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';}).join(',')).join('\r\n');
}
export function parseComparisonStore(raw:string|null):ComparisonStore {
 if(raw===null)return emptyComparisonStore();const store=JSON.parse(raw);
 if(store?.schemaVersion!==2||!Number.isInteger(store.revision)||!Array.isArray(store.sessions))throw Error('Unrecognised saved data');
 const ids=new Set<string>();
 for(const s of store.sessions as LearningSession[]){
  if(!s.id||ids.has(s.id)||s.version!==BLUEPRINT_VERSION||!['time','fractions'].includes(s.topic)||!['practice','comparison'].includes(s.mode)||!['pre','initial','lesson','post','results','other'].includes(s.stage)||!Array.isArray(s.deviations))throw Error('Invalid saved session');ids.add(s.id);
  for(const phase of ['pre','post'] as const){const q=s[phase];if(!q||!['A','B'].includes(q.form)||!['incomplete','complete'].includes(q.status)||!Array.isArray(q.answers)||q.answers.length>8||((q.status==='complete')!==(q.answers.length===8)))throw Error('Invalid saved quiz');
   q.answers.forEach((a,k)=>{const item=quizForms[s.topic][q.form][k];if(a.itemId!==item.id||!['answer','uncertain'].includes(a.type)||(a.type==='uncertain'?a.choiceId!==null:!item.choices.some(c=>c.id===a.choiceId))||a.correct!==(a.choiceId===item.correct))throw Error('Invalid saved answer');});
  }
  if(s.post.form!==otherForm(s.pre.form)||(s.stage!=='pre'&&s.pre.status!=='complete')||(['results','other'].includes(s.stage)!==(s.post.status==='complete')))throw Error('Invalid saved progression');
  if(s.mode==='comparison'&&s.pre.status==='complete'&&(!s.assignment||!['standard','ai'].includes(s.assignment.arm)||s.assignment.method!=='independent-crypto-bernoulli-0.5'))throw Error('Missing saved assignment');
  if(s.mode==='practice'&&s.assignment)throw Error('Practice cannot have a random assignment');
  for(const item of [...quizForms[s.topic].A,...quizForms[s.topic].B]){const order=s.choiceOrders?.[item.id];if(!Array.isArray(order)||[...order].sort().join()!==item.choices.map(c=>c.id).sort().join())throw Error('Invalid answer order');}
  if(['lesson','post','results','other'].includes(s.stage)&&!s.learning)throw Error('Missing tutorial');
  for(const l of [s.learning,s.otherLearning].filter(Boolean) as Learning[]){if(!['standard','ai'].includes(l.arm)||!Array.isArray(l.order)||[...l.order].sort().join()!==[...coreLessons[s.topic]].sort().join()||!Number.isInteger(l.index)||l.index<0||l.index>=l.order.length||!Number.isInteger(l.step)||l.step<0||l.step>=tutorialById(l.order[l.index]).steps.length||!Array.isArray(l.visited)||new Set(l.visited).size!==l.visited.length||l.visited.some(id=>!l.order.includes(id))||!l.ai)throw Error('Invalid saved lesson');for(const [id,record] of Object.entries(l.ai)){if(!l.order.includes(id)||!['pending','ready'].includes(record.status)||(record.status==='ready'&&(!record.result||!['live','built-in'].includes(record.result.mode)||!validOutput(record.result.output,id))))throw Error('Invalid saved explanation');}}
  if(s.learning&&s.learning.arm!==(s.mode==='comparison'?s.assignment?.arm:s.selectedArm))throw Error('Tutorial differs from saved allocation');
 }
 if(store.activeId&&!ids.has(store.activeId))throw Error('Unknown active session');return store;
}
