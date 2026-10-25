                                                                  
import {items,itemById} from './bank.js?v=01e72359e68d';
import {marginals,prior,selectNext,stopRule,update} from './model.js?v=01e72359e68d';
import {chooseTutorial,tutorialById} from './tutorials.js?v=01e72359e68d';
export function newSession(module       ,evaluation=false)         {const p=prior(),next=selectNext(module,p,[]) ;return {id:crypto.randomUUID(),module,started:new Date().toISOString(),posterior:p,observations:[],stage:'diagnostic',currentItemId:next.item.id,selectionReason:next.reason,incomplete:false,checkPrior:prior(Array(5).fill(.5)),attempts:0,taught:[],evaluation};}
export function beginTeaching(s        ,reason       ,incomplete=false)         {const pick=chooseTutorial(s.module,s.posterior,s.observations,s.taught,incomplete);return {...s,stage:'tutorial',currentItemId:undefined,diagnosticSnapshot:s.diagnosticSnapshot||[...s.posterior],tutorialId:pick.tutorial.id,tutorialReason:pick.reason,stopReason:reason,incomplete,checkPrior:prior(Array(5).fill(.5)),taught:[...new Set([...s.taught,pick.tutorial.id])]};}
export function recordAnswer(s        ,outcome        ,choiceId        ,hints=false)         {
 if(!s.currentItemId)throw Error('No question is active');const item=itemById(s.currentItemId),phase=s.stage         ;
 if(!['diagnostic','guided','independent','revisit'].includes(phase))throw Error('Invalid answer phase');
 if(s.observations.some(o=>o.itemId===item.id))throw Error('A response cannot be counted twice');
 if(choiceId&&!item.choices.some(c=>c.id===choiceId))throw Error('Invalid choice');
 if(choiceId&&outcome!==(choiceId===item.correct?'correct':'incorrect'))throw Error('Outcome must match deterministic choice scoring');
 const base=phase==='diagnostic'?s.posterior:s.checkPrior;
 const next=phase==='guided'||hints?base:update(base,item,outcome);
 const obs={itemId:item.id,outcome,choiceId,hints,phase,tutorialId:s.tutorialId,time:new Date().toISOString(),prior:marginals(base),posterior:marginals(next),reason:s.selectionReason,misconception:outcome==='incorrect'?item.choices.find(c=>c.id===choiceId)?.misconception:undefined};
 let result        ={...s,observations:[...s.observations,obs],posterior:phase==='diagnostic'?next:s.posterior,checkPrior:phase!=='diagnostic'?next:s.checkPrior};
 if(phase==='diagnostic'){const stop=stopRule(s.module,next,result.observations);if(stop)return beginTeaching(result,stop);const selected=selectNext(s.module,next,result.observations) ;return {...result,currentItemId:selected.item.id,selectionReason:selected.reason};}
 if(phase==='guided')return startPractice(result,'independent');
 return {...result,stage:'result',currentItemId:undefined,attempts:s.attempts+1,completed:new Date().toISOString(),revisitAfter:s.revisitAfter||new Date(Date.now()+86400000).toISOString()};
}
export function practiceItem(s        ,phase      )                {
 const tutorial=tutorialById(s.tutorialId );const seen=new Set(s.observations.map(o=>o.itemId));
 const candidates=items.filter(i=>i.module===s.module&&i.phases.includes(phase)&&i.skills.includes(tutorial.skill)&&!seen.has(i.id));
 // A new check is always a different item. Lower evidence chooses the starting instance; higher evidence the connecting instance.
 if(phase==='independent'&&marginals(s.diagnosticSnapshot||s.posterior)[Number(tutorial.skill[1])-1]>.65)return candidates.at(-1);
 return candidates[0];
}
export function startPractice(s        ,phase      )         {const item=practiceItem(s,phase);if(!item&&phase==='guided')return startPractice(s,'independent');return {...s,stage:item?phase                    :'result',currentItemId:item?.id,selectionReason:phase==='guided'?'Guided practice: scaffold with an optional hint; no mastery update.':`${phase}: unused item for ${tutorialById(s.tutorialId ).skill}; separate uncertain post-teaching prior, no diagnostic evidence reused.`};}
export function retryTeaching(s        ,prerequisite=false)         {
 const current=tutorialById(s.tutorialId );const pre=prerequisite&&current.prerequisite;
 const prerequisiteLessons                      ={T1:'hands',T2:'fives',T3:'moving-hour',T4:'quarters',F1:'whole',F2:'fraction-symbols',F3:'picture-fraction',F4:'half-quarters'};
 const nextId=pre?prerequisiteLessons[pre]:current.id;
 return {...s,stage:'tutorial',tutorialId:nextId,currentItemId:undefined,checkPrior:prior(Array(5).fill(.5)),taught:[...new Set([...s.taught,nextId])],tutorialReason:pre?'Revisit a prerequisite after an independent check.':'Use a different explanation after an independent check. New check prior remains uncertain.'};
}
export const STORAGE_KEY='brick-by-brick:v1';
                                                                                                                                  
export const emptyStore=()      =>({schemaVersion:1,sessions:[],journal:{},bridgeVisits:0});
export function loadStore(storage                        )       {try{const raw=JSON.parse(storage.getItem(STORAGE_KEY)||'null');if(raw?.schemaVersion===1&&Array.isArray(raw.sessions)&&raw.sessions.every((s        )=>s.id&&s.posterior?.length===32&&s.observations?.every(o=>items.some(i=>i.id===o.itemId))))return {...emptyStore(),...raw};}catch{}return emptyStore();}
export function csv(store      ) {const rows            =[['schemaVersion','sessionId','module','evaluation','itemId','skills','outcome','choiceId','hintsUsed','phase','tutorialId','independentCheck','time','feedback']];for(const s of store.sessions)for(const o of s.observations)rows.push([1,s.id,s.module,s.evaluation,o.itemId,itemById(o.itemId).skills.join('|'),o.outcome,o.choiceId||'',o.hints,o.phase,o.tutorialId||'',['independent','revisit'].includes(o.phase)?o.outcome:'',o.time,s.feedback||'']);return rows.map(r=>r.map(v=>{let text=String(v);if(/^[=+@\-\t\r]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';}).join(',')).join('\r\n');}
