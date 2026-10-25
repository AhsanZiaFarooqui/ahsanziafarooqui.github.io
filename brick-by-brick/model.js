import {initial,itemById,items,skillsFor} from './bank.js?v=1ba93cb048bd';
                                                                          
export const assumptions={masteryPrior:.55,slip:.1,minQuestions:4,targetQuestions:6,maxQuestions:8,low:.3,high:.8,minGain:.025};
export function normalise(p         ) {const sum=p.reduce((a,b)=>a+b,0);if(!Number.isFinite(sum)||sum<=0)throw Error('Invalid probability distribution');return p.map(v=>v/sum);}
export function prior(probabilities         =Array(5).fill(assumptions.masteryPrior)) {if(probabilities.length!==5||probabilities.some(p=>p<=0||p>=1))throw Error('Five nondegenerate priors required');return normalise(Array.from({length:32},(_,state)=>probabilities.reduce((p,v,k)=>p*((state>>k)&1?v:1-v),1)));}
export function marginals(p         ) {return Array.from({length:5},(_,k)=>p.reduce((s,v,state)=>s+v*((state>>k)&1),0));}
export const entropy=(p         )=>-p.reduce((s,v)=>s+(v>0?v*Math.log2(v):0),0);
export function likelihood(item     ,state       ) {const skills=skillsFor(item.module);const mastered=item.skills.every(s=>(state>>skills.indexOf(s))&1);return Math.min(1-1e-9,Math.max(1e-9,mastered?1-item.slip:item.guess));}
export function update(p         ,item     ,outcome        ) {if(outcome==='uncertain'||outcome==='skipped')return [...p];return normalise(p.map((v,state)=>v*(outcome==='correct'?likelihood(item,state):1-likelihood(item,state))));}
export function informationGain(p         ,item     ) {const correct=p.reduce((s,v,state)=>s+v*likelihood(item,state),0);return Math.max(0,entropy(p)-correct*entropy(update(p,item,'correct'))-(1-correct)*entropy(update(p,item,'incorrect')));}
export function misconceptionEvidence(history              ) {const evidence                      ={};for(const o of history)if(o.phase==='diagnostic'&&o.misconception)evidence[o.misconception]=(evidence[o.misconception]||0)+1;return evidence;}
export function evidenceStatus(p         ,history              ,module       ) {return skillsFor(module).map((skill,k)=>{const answers=history.filter(o=>o.phase==='diagnostic'&&!o.hints&&['correct','incorrect'].includes(o.outcome)&&itemById(o.itemId).skills.includes(skill));return {skill,probability:marginals(p)[k],count:answers.length,status:answers.length<2?'insufficient evidence':marginals(p)[k]<assumptions.low?'likely difficulty':marginals(p)[k]>assumptions.high?'evidence of understanding':'uncertain'};});}
function distinguish(history              )         {
 const wrong=history.filter(o=>o.phase==='diagnostic'&&o.misconception);
 const last=wrong.at(-1);if(!last)return [];
 const map                       ={'swap-hands':['T1','T2'],'numeral-minutes':['T2'],'next-hour':['T3'],'fixed-hour':['T3'],'past-to':['T4'],'swap-fraction':['F2','F3'],'denominator-size':['F1','F5'],'different-wholes':['F1'],'unequal-pieces':['F1'],'different-symbols':['F4']};
 // Require a new distinguishing response after the ambiguous wrong option, not repeated confirmation of it.
 const index=history.indexOf(last);if(history.slice(index+1).some(o=>!initial[itemById(last.itemId).module].includes(o.itemId)))return [];
 return map[last.misconception ]||[];
}
export function selectNext(module       ,p         ,history              ,broad=true) {
 const diag=history.filter(o=>o.phase==='diagnostic');const seen=new Set(history.map(o=>o.itemId));const families=new Set(history.map(o=>itemById(o.itemId).family));
 if(broad&&diag.length<3){const item=itemById(initial[module][diag.length]);return {item,gain:informationGain(p,item),reason:'Initial broad question: sample a different part of the topic.'};}
 let eligible=items.filter(i=>i.module===module&&i.phases.includes('diagnostic')&&!seen.has(i.id)&&!families.has(i.family));
 const focus=distinguish(diag);let constraint='';
 const patterns=misconceptionEvidence(diag);
 const requiredProbes=[...(module==='fractions'&&patterns['swap-fraction']?['f-total','f-selected']:[]),...(module==='fractions'&&patterns['denominator-size']?['f-compare-visual']:[]),...(module==='time'&&patterns['swap-hands']?['t-shorthour','t-minute3']:[]),...(module==='time'&&patterns['numeral-minutes']?['t-minute3','t-minute7']:[])];
 const pending=eligible.filter(i=>requiredProbes.includes(i.id));
 if(pending.length){eligible=pending;constraint='Distinguishing probes: separate symbol counts, equal-whole quantities, or hand roles from minute counting. ';}
 else if(focus.length){const relevant=eligible.filter(i=>i.skills.length<=2&&i.skills.some(s=>focus.includes(s))&&(diag.at(-1)?.misconception!=='denominator-size'||i.visual.kind==='fraction'));if(relevant.length){eligible=relevant;constraint=`Distinguish a provisional wrong-option pattern using ${focus.join(', ')}. `;}}
 // Cap single-skill probing; integrated items may still need prerequisite skills.
 const counts=Object.fromEntries(skillsFor(module).map(s=>[s,diag.filter(o=>{const i=itemById(o.itemId);return i.skills.length===1&&i.skills[0]===s;}).length]));
 const balanced=eligible.filter(i=>i.skills.length>1||counts[i.skills[0]]<2);if(balanced.length)eligible=balanced;
 const ranked=eligible.map(item=>({item,gain:informationGain(p,item)})).sort((a,b)=>b.gain-a.gain||a.item.id.localeCompare(b.item.id));
 const best=ranked[0];if(!best)return undefined;
 return {...best,reason:`${constraint}Highest expected joint-entropy reduction among ${ranked.length} eligible items (${best.gain.toFixed(3)} bits); seen families excluded and narrow-skill coverage limited.`};
}
export function stopRule(module       ,p         ,history              ,requested=false) {
 const n=history.filter(o=>o.phase==='diagnostic').length;
 if(requested)return 'Learner requested help; diagnosis incomplete.';
 if(n>=assumptions.maxQuestions)return 'Absolute maximum of eight diagnostic questions.';
 if(n<assumptions.minQuestions)return undefined;
 const states=evidenceStatus(p,history,module);
 // Complete the explicitly distinguishing probes before stopping for a likely difficulty.
 const patterns=misconceptionEvidence(history),seen=new Set(history.map(o=>o.itemId));
 if(n<assumptions.maxQuestions&&module==='fractions'&&patterns['swap-fraction']&&(!seen.has('f-total')||!seen.has('f-selected')))return undefined;
 if(n<assumptions.maxQuestions&&module==='fractions'&&patterns['denominator-size']&&!seen.has('f-compare-visual'))return undefined;
 if(states.some(s=>s.status==='likely difficulty')&&n>=5)return 'Repeated evidence supports a helpful teaching target (provisional threshold).';
 const next=selectNext(module,p,history);if(!next||next.gain<assumptions.minGain)return 'Little expected information remains among eligible items.';
 if(n>=assumptions.targetQuestions&&states.some(s=>s.status==='evidence of understanding'||s.status==='likely difficulty'))return 'Six-question budget reached with usable but provisional evidence.';
 return undefined;
}
