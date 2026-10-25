import type {Module} from './types.ts';
import {formItems,question} from './assessment.ts';
import type {Form} from './assessment.ts';
import {segments,segment,checkedExplanations,checkedFollowUps} from './curriculum.ts';
export type Group='standard'|'ai';
export type Mode='practice'|'comparison';
export type Stage='initial'|'baseline'|'tutorial'|'final'|'results';
export interface ResponseRecord {itemId:string;choice:number|null;kind:'choice'|'uncertain';correct:boolean;at:string}
export interface Interaction {at:string;action:string;segmentId?:string;value?:string}
export interface Delivery {segmentId:string;mode:'standard'|'live'|'simulated'|'fallback';reason:string;explanation:string;exampleId:string;practiceId:string;stepCaptions:string[];followUpResponse:string}
export interface StudySession {id:string;code:string;mode:Mode;topic:Module;order:Form;assigned:Group|null;selected:Group|null;stage:Stage;status:'active'|'stopped'|'complete';created:string;completed:string|null;initialScore:number|null;finalScore:number|null;initial:ResponseRecord[];final:ResponseRecord[];sequence:string[];segmentIndex:number;stepIndex:number;deliveries:Delivery[];guided:{segmentId:string;practiceId:string;choice:number|null;correct:boolean}[];interactions:Interaction[];deviations:{at:string;reason:string}[];tutorialStarted:string|null;tutorialCompleted:string|null;tutorialMs:number;feedback:string|null;synthetic:boolean}
export interface StudyStore {schema:2;sessions:StudySession[];activeId:string|null}
export const STUDY_KEY='brick-by-brick:comparison:v2';
export const emptyStudy=():StudyStore=>({schema:2,sessions:[],activeId:null});
export const now=()=>new Date().toISOString();
export function coin(){return crypto.getRandomValues(new Uint32Array(1))[0]/4294967296;}
export const normalCode=(v:string)=>v.trim().toUpperCase();
export function createSession(store:StudyStore,topic:Module,mode:Mode,code:string,liveVerified:boolean,rng=coin,synthetic=false):StudySession {
 code=normalCode(code);if(!/^BBB-[A-Z0-9]{6}$/.test(code))throw Error('Use an anonymous code in the format BBB-A1B2C3. Do not enter a name.');
 if(mode==='comparison'&&!liveVerified)throw Error('An adult must configure and verify live AI before starting a comparison.');
 if(mode==='comparison'&&store.sessions.some(s=>s.mode==='comparison'&&s.code===code))throw Error('This code already has a primary comparison session. Resume it or choose practice.');
 return {id:crypto.randomUUID(),code,mode,topic,order:rng()<.5?'A':'B',assigned:null,selected:null,stage:'initial',status:'active',created:now(),completed:null,initialScore:null,finalScore:null,initial:[],final:[],sequence:[],segmentIndex:0,stepIndex:0,deliveries:[],guided:[],interactions:[],deviations:[],tutorialStarted:null,tutorialCompleted:null,tutorialMs:0,feedback:null,synthetic};
}
export const quizItems=(s:StudySession,phase:'initial'|'final')=>formItems(s.topic,phase==='initial'?s.order:s.order==='A'?'B':'A');
export function total(responses:ResponseRecord[]):number|null {return responses.length===8?responses.reduce((n,r)=>n+Number(question(r.itemId).answer===r.choice),0):null;}
export const metrics=(s:StudySession)=>{const before=total(s.initial),after=total(s.final);return {before,after,gain:before===null||after===null?null:after-before,percentagePoints:before===null||after===null?null:(after-before)*12.5};};
export function answerQuiz(s:StudySession,choice:number|null,rng=coin):StudySession {
 if(s.status!=='active'||!['initial','final'].includes(s.stage))throw Error('No scored quiz is active');
 const phase=s.stage as 'initial'|'final',q=quizItems(s,phase)[s[phase].length];if(!q)throw Error('Quiz is already complete');
 if(choice!==null&&(!Number.isInteger(choice)||choice<0||choice>=q.options.length))throw Error('Invalid response');
 const answers=[...s[phase],{itemId:q.id,choice,kind:choice===null?'uncertain' as const:'choice' as const,correct:choice===q.answer,at:now()}];
 const result={...s,[phase]:answers,[phase==='initial'?'initialScore':'finalScore']:total(answers)};
 if(answers.length===8){if(phase==='initial'){result.stage='baseline';if(s.mode==='comparison')result.assigned=rng()<.5?'standard':'ai';}else{result.stage='results';result.status='complete';result.completed=now();}}
 return result;
}
export const group=(s:StudySession)=>s.mode==='comparison'?s.assigned:s.selected;
export function beginTutorial(s:StudySession,choice?:Group):StudySession {
 if(s.stage!=='baseline'||total(s.initial)===null)throw Error('Initial results must come first');
 if(s.mode==='comparison'&&choice!==undefined)throw Error('Comparison assignment cannot be changed');
 const selected=s.mode==='practice'?choice:null;if(s.mode==='practice'&&!selected)throw Error('Choose a tutorial');
 const result={...s,selected,stage:'tutorial' as const,tutorialStarted:now()};
 const sequence=segments(s.topic).map(t=>t.id);
 // All four concepts remain. Only the AI package reorders by initial errors.
 if(group(result)==='ai')sequence.sort((a,b)=>initialEvidence(s,b).errors-initialEvidence(s,a).errors);
 return {...result,sequence};
}
export function initialEvidence(s:StudySession,segmentId:string){const t=segment(segmentId);const answers=s.initial.filter(r=>question(r.itemId).concept===t.concept);return {concept:t.concept,correct:answers.filter(r=>r.correct).length,errors:answers.filter(r=>!r.correct).length,uncertain:answers.filter(r=>r.kind==='uncertain').length,responses:answers.map(r=>({itemId:r.itemId,choice:r.choice}))};}
export function log(s:StudySession,action:string,value?:string):StudySession {return {...s,interactions:[...s.interactions,{at:now(),action,segmentId:s.sequence[s.segmentIndex],value}]};}
export function deviation(s:StudySession,reason:string):StudySession {return {...s,deviations:[...s.deviations,{at:now(),reason}]};}
export function recordDelivery(s:StudySession,d:Delivery):StudySession {
 if(s.stage!=='tutorial'||d.segmentId!==s.sequence[s.segmentIndex])throw Error('Wrong delivery segment');
 let next={...s,deliveries:[...s.deliveries,d]};if(d.mode==='fallback')next=deviation(next,d.reason);return next;
}
export function answerGuided(s:StudySession,choice:number|null):StudySession {
 if(s.stage!=='tutorial')throw Error('No tutorial active');const id=s.sequence[s.segmentIndex];if(s.guided.some(p=>p.segmentId===id))throw Error('Practice already recorded');
 const delivered=s.deliveries.filter(d=>d.segmentId===id).at(-1);if(!delivered)throw Error('Tutorial must be delivered first');
 const p=segment(id).practice.find(p=>p.id===delivered.practiceId)!;
 if(choice!==null&&(!Number.isInteger(choice)||choice<0||choice>=p.options.length))throw Error('Invalid practice choice');
 return {...s,guided:[...s.guided,{segmentId:id,practiceId:p.id,choice,correct:choice===p.answer}]};
}
export function nextSegment(s:StudySession):StudySession {
 if(s.stage!=='tutorial'||!s.guided.some(p=>p.segmentId===s.sequence[s.segmentIndex]))throw Error('Try the guided practice first');
 return s.segmentIndex===3?{...s,stage:'final',tutorialCompleted:now(),stepIndex:0}:{...s,segmentIndex:s.segmentIndex+1,stepIndex:0};
}
export function breakdown(responses:ResponseRecord[],topic:Module){return segments(topic).map(t=>({concept:t.concept,answered:responses.filter(r=>question(r.itemId).concept===t.concept).length,correct:responses.filter(r=>question(r.itemId).concept===t.concept&&r.correct).length}));}
const mean=(v:number[])=>v.length?v.reduce((a,b)=>a+b,0)/v.length:null;
export function summary(store:StudyStore,topic:Module,assigned:Group){const all=store.sessions.filter(s=>!s.synthetic&&s.mode==='comparison'&&s.topic===topic&&s.assigned===assigned);const completed=all.filter(s=>metrics(s).gain!==null);return {assigned:all.length,initial:all.filter(s=>total(s.initial)!==null).length,started:all.filter(s=>s.tutorialStarted).length,final:completed.length,deviations:all.filter(s=>s.deviations.length||s.deliveries.some(d=>d.mode==='fallback')).length,failures:all.filter(s=>s.deliveries.some(d=>d.mode==='fallback')).length,meanInitial:mean(all.map(s=>total(s.initial)).filter((n):n is number=>n!==null)),meanFinal:mean(completed.map(s=>total(s.final)!)),meanGain:mean(completed.map(s=>metrics(s).gain!)),distribution:Array.from({length:17},(_,i)=>({gain:i-8,count:completed.filter(s=>metrics(s).gain===i-8).length})),meanTutorialSeconds:mean(all.filter(s=>s.tutorialStarted).map(s=>s.tutorialMs/1000))};}
export function deliveredLabel(s:StudySession){return [...new Set(s.deliveries.map(d=>d.mode))].join('+')||'not started';}
export function assignedDelivered(s:StudySession){if(!s.tutorialCompleted)return false;return s.sequence.every(id=>s.deliveries.some(d=>d.segmentId===id&&d.mode===(group(s)==='standard'?'standard':'live')))&&!s.deliveries.some(d=>d.mode==='fallback'||d.mode==='simulated');}
export function exportCsv(store:StudyStore){const headers=['id','code','mode','topic','formOrder','assigned','selected','actuallyDelivered','assignedTutorialDelivered','initialScore','finalScore','gain','percentagePointChange','status','stage','initialResponses','finalResponses','tutorialSeconds','hintUse','interactions','deviations','guided','deliveries','created','completed','tutorialStarted','tutorialCompleted','feedback','synthetic'];const rows=store.sessions.map(s=>{const m=metrics(s);return [s.id,s.code,s.mode,s.topic,s.order+' then '+(s.order==='A'?'B':'A'),s.assigned,s.selected,deliveredLabel(s),assignedDelivered(s),m.before,m.after,m.gain,m.percentagePoints,s.status,s.stage,JSON.stringify(s.initial),JSON.stringify(s.final),s.tutorialMs/1000,s.interactions.filter(i=>i.action==='hint').length,JSON.stringify(s.interactions),JSON.stringify(s.deviations),JSON.stringify(s.guided),JSON.stringify(s.deliveries),s.created,s.completed,s.tutorialStarted,s.tutorialCompleted,s.feedback,s.synthetic];});return [headers,...rows].map(row=>row.map(v=>{let value=v===null?'':String(v);if(/^[=+@\-\t\r]/.test(value))value="'"+value;return '"'+value.replaceAll('"','""')+'"';}).join(',')).join('\r\n');}
// Strict import: unknown fields, inconsistent scores, duplicate primary codes and mixed versions are rejected.
const keys=(v:object,allowed:string[])=>Object.keys(v).every(k=>allowed.includes(k));
const text=(v:unknown,max=600):v is string=>typeof v==='string'&&v.length<=max;
const date=(v:unknown)=>typeof v==='string'&&Number.isFinite(Date.parse(v));
export function validateStore(value:unknown):asserts value is StudyStore {
 const store=value as StudyStore;if(!store||!keys(store,['schema','sessions','activeId'])||store.schema!==2||!Array.isArray(store.sessions)||store.sessions.length>10000)throw Error('Unsupported study export');
 const ids=new Set<string>(),codes=new Set<string>();
 for(const s of store.sessions){
  if(!s||!keys(s,['id','code','mode','topic','order','assigned','selected','stage','status','created','completed','initialScore','finalScore','initial','final','sequence','segmentIndex','stepIndex','deliveries','guided','interactions','deviations','tutorialStarted','tutorialCompleted','tutorialMs','feedback','synthetic'])||!text(s.id,80)||!/^BBB-[A-Z0-9]{6}$/.test(s.code)||!['time','fractions'].includes(s.topic)||!['practice','comparison'].includes(s.mode)||!['A','B'].includes(s.order)||!['initial','baseline','tutorial','final','results'].includes(s.stage)||!['active','stopped','complete'].includes(s.status)||![null,'standard','ai'].includes(s.assigned)||![null,'standard','ai'].includes(s.selected)||typeof s.synthetic!=='boolean'||!date(s.created)||!(s.completed===null||date(s.completed))||!(s.feedback===null||['Helpful','Still confusing','Prefer not to say'].includes(s.feedback)))throw Error('Invalid session fields');
  if(ids.has(s.id))throw Error('Duplicate session ID');ids.add(s.id);if(s.mode==='comparison'){if(codes.has(s.code))throw Error('Duplicate primary participant code');codes.add(s.code);}
  for(const phase of ['initial','final'] as const){if(!Array.isArray(s[phase])||s[phase].length>8)throw Error('Invalid responses');s[phase].forEach((r,i)=>{const q=quizItems(s,phase)[i];if(!keys(r,['itemId','choice','kind','correct','at'])||r.itemId!==q.id||!(r.choice===null||Number.isInteger(r.choice)&&r.choice>=0&&r.choice<q.options.length)||r.kind!==(r.choice===null?'uncertain':'choice')||r.correct!==(r.choice===q.answer)||!date(r.at))throw Error('Inconsistent response or score');});}
  if(s.initialScore!==total(s.initial)||s.finalScore!==total(s.final))throw Error('Stored score disagrees with item responses');
  if(s.stage==='results'?!s.completed:s.completed!==null)throw Error('Invalid completion timestamp');
  if(s.mode==='practice'&&s.assigned!==null||s.mode==='comparison'&&s.selected!==null||s.mode==='comparison'&&(s.initial.length===8)!==(s.assigned!==null))throw Error('Inconsistent assignment');
  if(s.stage==='initial'&&s.initial.length===8||s.stage!=='initial'&&s.initial.length!==8||s.stage==='results'&&s.final.length!==8||s.stage!=='results'&&s.final.length===8||s.status==='complete'&&s.stage!=='results'||s.stage==='results'&&s.status!=='complete'||s.final.length>0&&!['final','results'].includes(s.stage))throw Error('Inconsistent completion status');
  if(!Array.isArray(s.sequence)||!Number.isInteger(s.segmentIndex)||s.segmentIndex<0||s.segmentIndex>3||!Number.isInteger(s.stepIndex)||s.stepIndex<0||s.stepIndex>2||!Number.isFinite(s.tutorialMs)||s.tutorialMs<0||!(s.tutorialStarted===null||date(s.tutorialStarted))||!(s.tutorialCompleted===null||date(s.tutorialCompleted)))throw Error('Invalid tutorial progress');
  if(['initial','baseline'].includes(s.stage)&&(s.sequence.length||s.deliveries.length||s.guided.length||s.final.length||s.tutorialStarted||s.tutorialCompleted))throw Error('Teaching before baseline');
  if(['tutorial','final','results'].includes(s.stage)){if(s.sequence.length!==4||new Set(s.sequence).size!==4||s.sequence.some(id=>!segments(s.topic).some(t=>t.id===id))||!group(s)||!s.tutorialStarted)throw Error('Missing tutorial sequence');if(group(s)==='standard'&&s.sequence.join()!==segments(s.topic).map(t=>t.id).join())throw Error('Standard sequence changed');}
  if(!Array.isArray(s.deliveries)||!Array.isArray(s.guided)||!Array.isArray(s.interactions)||!Array.isArray(s.deviations))throw Error('Missing activity logs');
  for(const d of s.deliveries){if(!keys(d,['segmentId','mode','reason','explanation','exampleId','practiceId','stepCaptions','followUpResponse'])||!s.sequence.includes(d.segmentId)||!['standard','live','fallback','simulated'].includes(d.mode)||!text(d.reason)||!text(d.explanation)||!checkedExplanations(d.segmentId).includes(d.explanation)||!text(d.followUpResponse)||!checkedFollowUps.includes(d.followUpResponse)||!Array.isArray(d.stepCaptions)||d.stepCaptions.length!==3||!d.stepCaptions.every((text,i)=>text===segment(d.segmentId).steps[i].caption)||!segment(d.segmentId).steps.some(e=>e.id===d.exampleId)||!segment(d.segmentId).practice.some(p=>p.id===d.practiceId))throw Error('Invalid delivery');if(s.mode==='comparison'&&d.mode==='simulated'||group(s)==='standard'&&d.mode!=='standard'||group(s)==='ai'&&d.mode==='standard')throw Error('Delivery contradicts assignment');}
  if(s.guided.length>s.segmentIndex+1||s.guided.some((g,i)=>g.segmentId!==s.sequence[i]))throw Error('Invalid guided sequence');
  if(new Set(s.guided.map(p=>p.segmentId)).size!==s.guided.length)throw Error('Repeated practice');
  for(const g of s.guided){const p=segments(s.topic).flatMap(t=>t.practice).find(p=>p.id===g.practiceId);if(!keys(g,['segmentId','practiceId','choice','correct'])||!p||!segment(g.segmentId).practice.includes(p)||!s.deliveries.some(d=>d.segmentId===g.segmentId&&d.practiceId===g.practiceId)||!(g.choice===null||Number.isInteger(g.choice)&&g.choice>=0&&g.choice<p.options.length)||g.correct!==(g.choice===p.answer))throw Error('Invalid guided response');}
  if(['final','results'].includes(s.stage)&&(s.guided.length!==4||!s.tutorialCompleted))throw Error('Tutorial incomplete');
  for(const i of s.interactions)if(!keys(i,['at','action','segmentId','value'])||!date(i.at)||!text(i.action,80)||!(i.value===undefined||text(i.value,300))||!(i.segmentId===undefined||s.sequence.includes(i.segmentId)))throw Error('Invalid interaction');
  for(const d of s.deviations)if(!keys(d,['at','reason'])||!date(d.at)||!text(d.reason))throw Error('Invalid deviation');
 }
 if(store.activeId!==null&&!ids.has(store.activeId))throw Error('Invalid active session');
}
export function loadStudy(storage:Pick<Storage,'getItem'>):StudyStore {const raw=storage.getItem(STUDY_KEY);if(!raw)return emptyStudy();const data=JSON.parse(raw);validateStore(data);return data;}
export function mergeStudy(current:StudyStore,incoming:unknown){validateStore(incoming);const merged={schema:2 as const,sessions:[...current.sessions,...incoming.sessions],activeId:current.activeId};validateStore(merged);return merged;}
