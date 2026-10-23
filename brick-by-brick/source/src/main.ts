import {el,button} from './dom.ts';
import {visual,clock,minuteBricks,clockExplorer} from './visuals.ts';
import {items,itemById,skillNames,skillsFor} from './bank.ts';
import {evidenceStatus,marginals,misconceptionEvidence,prior} from './model.ts';
import {chooseTutorial,tutorialById} from './tutorials.ts';
import {newSession,beginTeaching,recordAnswer,startPractice,retryTeaching,loadStore,emptyStore,csv,STORAGE_KEY} from './session.ts';
import type {Store} from './session.ts';
import type {Session,Module,Outcome,Phase} from './types.ts';
import {shuffle,score} from './math.ts';
import {animation} from './animation.ts';
import {moviePlayer} from './movie-player.ts';
import {apiUrl} from './runtime-config.ts';
import type {Timeline,AnimationAction} from './animation.ts';
import {fallback,trustedAiVisual,validOutput} from './ai-contract.ts';
import type {AiResult} from './ai-contract.ts';

const root=document.getElementById('root')!;
let store:Store;try{store=loadStore(localStorage);}catch{store=emptyStore();}
let storageError=false,activeId:string|undefined,screen:'home'|'learn'|'adult'|'bridge'='home',cleanup=()=>{},renderVersion=0,aiMode='built-in';
const current=()=>store.sessions.find(s=>s.id===activeId)!;
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(store));storageError=false;}catch{storageError=true;}}
function commit(s:Session){const index=store.sessions.findIndex(x=>x.id===s.id);if(index<0)store.sessions.push(s);else store.sessions[index]=s;activeId=s.id;save();}
function navigate(next:typeof screen){screen=next;render();}
function start(module:Module,evaluation=false){commit(newSession(module,evaluation));navigate('learn');}
function download(name:string,content:string,type:string){const url=URL.createObjectURL(new Blob([content],{type}));const link=el('a',{href:url,download:name});document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function brickMark(){return el('div',{class:'brick-mark','aria-hidden':'true'},el('i'),el('i'),el('i'));}
function shell(){cleanup();cleanup=()=>{};renderVersion++;const main=el('main',{id:'main',tabindex:'-1'});root.replaceChildren(el('header',{class:'header'},button('Brick by Brick',()=>navigate('home'),'brand'),el('span',{class:'brand-sub'},'MY MATHS HELPER'),el('nav',{'aria-label':'Main'},button('Home',()=>navigate('home'),'nav-button'),button('Grown-ups',()=>navigate('adult'),'nav-button'))),main,el('footer',{},el('span',{},'A little understanding, one brick at a time.'),el('span',{},'No login. Your progress stays on this device.')));if(storageError)main.append(el('p',{class:'notice',role:'alert'},'This browser could not save progress. You can keep learning and export this visit before closing the page.'));return main;}
function render(){const main=shell();if(screen==='home')home(main);if(screen==='adult')adult(main);if(screen==='bridge')bridge(main);if(screen==='learn'){const s=current();if(!s){screen='home';home(main);return;}learn(main,s);}const heading=main.querySelector<HTMLElement>('h1,h2');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}window.scrollTo({top:0,behavior:'instant'});}
function home(main:HTMLElement){
 const intro=el('section',{class:'hero'},el('div',{class:'eyebrow'},'SMALL STEPS. BIG DISCOVERIES.'),el('h1',{},'Let’s build your',el('br'),'maths together.'),el('p',{class:'lead'},'Answer a few questions so I can find a helpful place to start.'),el('p',{class:'small'},'Take your time. “I’m not sure” is always an option.'),brickMark());main.append(intro);
 const time=button('',()=>start('time'),'topic-card time-card');time.append(el('div',{class:'card-illustration'},clock(195)),el('span',{class:'card-kicker'},'HANDS • HOURS • MINUTES'),el('h2',{},'Read the Time'),el('p',{},'Make sense of the moving hands.'),el('span',{class:'card-go'},'Let’s start  →'));
 const frac=button('',()=>start('fractions'),'topic-card fraction-card');frac.append(el('div',{class:'card-illustration fraction-preview'},visual({kind:'fraction',n:2,d:4,units:8,labels:true})),el('span',{class:'card-kicker'},'WHOLES • PARTS • SHARING'),el('h2',{},'Explore Fractions'),el('p',{},'See how little parts fit together.'),el('span',{class:'card-go'},'Let’s start  →'));main.append(el('section',{class:'topic-grid','aria-label':'Choose a topic'},time,frac));
 const unfinished=store.sessions.filter(s=>s.stage!=='result').slice(-2);if(unfinished.length)main.append(el('section',{class:'resume panel'},el('h2',{},'Pick up where you left off'),...unfinished.map(s=>button(`Continue ${s.module==='time'?'Read the Time':'Explore Fractions'}`,()=>{activeId=s.id;navigate('learn');},'secondary'))));
 const revisit=store.sessions.filter(s=>s.completed&&!s.observations.some(o=>o.phase==='revisit')&&((store.lastBridgeAt&&Date.parse(store.lastBridgeAt)>Date.parse(s.completed))||store.sessions.some(other=>other.id!==s.id&&other.completed&&Date.parse(other.completed)>Date.parse(s.completed!))||Date.now()>=Date.parse(s.revisitAfter||''))).at(-1);
 if(revisit)main.append(el('section',{class:'panel'},el('h2',{},'A little revisit'),el('p',{},'Would you like to try a fresh question from before?'),button('Try a revisit',()=>{commit(startPractice({...revisit,checkPrior:prior(Array(5).fill(.5))},'revisit'));navigate('learn');},'secondary')));
 main.append(el('section',{class:'bridge-card'},el('div',{},el('span',{class:'eyebrow'},'CONNECT THE IDEAS'),el('h2',{},'Fractions of an Hour'),el('p',{},'What do fifteen minutes and one quarter have in common?')),button('Explore together →',()=>navigate('bridge'),'secondary')),
 el('div',{class:'journey-strip'},el('span',{},'1 · A few questions'),el('span',{},'2 · A helpful explanation'),el('span',{},'3 · Have a go')));
}
function learn(main:HTMLElement,s:Session){
 const phase=s.stage==='diagnostic'?0:s.stage==='tutorial'?1:s.stage==='guided'?2:3;
 main.append(el('div',{class:'lesson-top'},el('span',{class:'eyebrow'},s.module==='time'?'READ THE TIME':'EXPLORE FRACTIONS'),button('Save & take a break',()=>navigate('home'),'quiet')),el('ol',{class:'stepper','aria-label':'Your journey'},...['Quick check','Learn together','Guided practice','Try on your own'].map((label,i)=>el('li',{class:phase===i?'active':phase>i?'done':'','aria-current':phase===i?'step':undefined},`${i+1}`,el('span',{},label)))));
 if(['diagnostic','guided','independent','revisit'].includes(s.stage)){question(main,s);return;}
 if(s.stage==='tutorial'){lesson(main,s);return;}
 result(main,s);
}
function question(main:HTMLElement,s:Session){
 if(!s.currentItemId){commit({...s,stage:'result'});render();return;}
 const item=itemById(s.currentItemId);const diagnosis=s.stage==='diagnostic',guided=s.stage==='guided';
 const pick=chooseTutorial(s.module,s.posterior,s.observations,[],s.incomplete);
 let hinted=guided&&pick.scaffolding==='extra',selected:string|undefined,locked=false;
 const title=diagnosis?'Let’s see where to start.':guided?'Let’s try one together.':s.stage==='revisit'?'Try a little revisit.':'Your turn to try.';
 main.append(el('div',{class:'activity-heading'},el('h1',{},title),el('p',{},diagnosis?`Question ${s.observations.filter(o=>o.phase==='diagnostic').length+1} · a short check, at most 8 questions`:guided?'You can use a hint whenever it helps.':'A fresh example. Try this one without hints.')));
 const panel=el('section',{class:'question-panel panel','data-item-id':item.id},el('h2',{id:'question-prompt'},item.prompt));
 const choices=el('div',{class:'choices',role:'group','aria-labelledby':'question-prompt'});
 const submit=button('Check this answer',()=>{if(selected)answer(score(item.correct,selected),selected);},'primary',{disabled:true});if(diagnosis)submit.textContent='That’s my answer';
 for(const [index,option]of shuffle(item.choices).entries()){
 const optionButton=button('',()=>{selected=option.id;for(const c of choices.querySelectorAll('button'))c.setAttribute('aria-pressed','false');optionButton.setAttribute('aria-pressed','true');submit.disabled=false;},'choice',{'aria-pressed':false,'data-choice-id':option.id});optionButton.append(el('span',{class:'choice-letter','aria-hidden':'true'},String.fromCharCode(65+index)),el('span',{},option.label));choices.append(optionButton);
 }
 const hintPanel=el('p',{class:'hint',role:'status'},hinted?item.hint:'');if(!hinted)hintPanel.hidden=true;
 const controls=el('div',{class:'answer-actions'},submit,button('I’m not sure',()=>answer('uncertain'),'secondary'),button('Skip this question',()=>answer('skipped'),'quiet'));
 panel.append(el('div',{class:'question-grid'},el('div',{class:'question-visual'},visual(item.visual,item.accessible)),el('div',{class:'question-answer'},choices,guided?button('Show a hint',()=>{hinted=true;hintPanel.hidden=false;hintPanel.textContent=item.hint;},'hint-button'):null,hintPanel,controls)));
 main.append(panel);
 if(diagnosis)main.append(button('Stop the check & show me a lesson',()=>{commit(beginTeaching(s,'Learner requested help; diagnosis incomplete.',true));render();},'quiet stop-button'));
 function answer(outcome:Outcome,choice?:string){if(locked)return;locked=true;const next=recordAnswer(s,outcome,choice,hinted);commit(next);const message=diagnosis?'Thanks. Let’s keep going.':guided?outcome==='correct'?'You’ve put those pieces together. Let’s try a fresh one.':`Let’s look at this together. ${item.hint} The answer here is ${item.choices.find(c=>c.id===item.correct)!.label}.`:outcome==='correct'?'You answered this fresh example independently.':'Thanks for trying. We can look at this another way.';
 panel.replaceChildren(el('div',{class:'acknowledgement',role:'status'},el('span',{class:'ack-symbol','aria-hidden':'true'},diagnosis?'▰':'◇'),el('h2',{},message),button(diagnosis?'Continue':guided?'Try on my own':'See what’s next',()=>render(),'primary')));
 main.querySelector('.stop-button')?.remove();panel.querySelector('button')?.focus();
 }
}
function lesson(main:HTMLElement,s:Session){
 const t=tutorialById(s.tutorialId!);const player=moviePlayer(t.id);
 main.append(el('div',{class:'activity-heading'},el('span',{class:'eyebrow'},'LET’S LOOK AT THIS TOGETHER'),el('h1',{},t.title),el('p',{},s.incomplete?'We stopped the check early. Let’s watch one simple idea together.':'A short brick-style video. Pause or replay any part.')),player.element);
 cleanup=player.dispose;
 const helpArea=el('section',{class:'help-area'});
 main.append(el('div',{class:'lesson-actions'},button('Explain differently',()=>explainDifferently(helpArea,s),'secondary'),button('Try it myself →',()=>{commit(startPractice(s,'guided'));render();},'primary')),helpArea);
 main.append(button('Use the interactive step view',()=>{player.dispose();main.replaceChildren();stepLesson(main,s);},'quiet'));
 if(s.module==='time')main.append(el('details',{class:'panel exploration'},el('summary',{},'Explore a clock yourself'),clockExplorer()));
 if(s.attempts>0)explainDifferently(helpArea,s);
}
function stepLesson(main:HTMLElement,s:Session){
 const t=tutorialById(s.tutorialId!);let timeline:Timeline={step:0,elapsed:1200,playing:false};let frame=0,lastTime=0;
 main.append(el('div',{class:'activity-heading'},el('span',{class:'eyebrow'},'LET’S LOOK AT THIS TOGETHER'),el('h1',{},t.title),s.incomplete?el('p',{},'We stopped the check early. Here’s a helpful place to begin.'):el('p',{},'Watch, pause, and take one step at a time.')));
 const stage=el('div',{class:'tutorial-stage'}),caption=el('p',{class:'step-caption','aria-live':'polite'}),counter=el('span',{class:'step-count'}),play=button('Play',()=>act({type:'play'}),'primary'),pause=button('Pause',()=>act({type:'pause'}),'secondary');
 const prev=button('← Previous step',()=>act({type:'previous'}),'secondary'),next=button('Next step →',()=>act({type:'next'}),'secondary');
 main.append(el('section',{class:'panel lesson-panel'},stage,el('div',{class:'caption-area'},counter,caption),el('div',{class:'player-controls'},prev,play,pause,button('Replay',()=>act({type:'replay'}),'secondary'),next)));
 const helpArea=el('section',{class:'help-area'});main.append(el('div',{class:'lesson-actions'},button('Explain differently',()=>explainDifferently(helpArea,s),'secondary'),button('Try it myself →',()=>{commit(startPractice(s,'guided'));render();},'primary')),helpArea);
 if(s.module==='time'){const details=el('details',{class:'panel exploration'},el('summary',{},'Explore a clock yourself'),clockExplorer());main.append(details);}
 function draw(){const step=t.steps[timeline.step],previous=t.steps[Math.max(0,timeline.step-1)];const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;stage.replaceChildren(visual(step.visual,undefined,previous.visual,reduced?1:Math.min(1,timeline.elapsed/1200)));if(caption.textContent!==step.caption)caption.textContent=step.caption;counter.textContent=`STEP ${timeline.step+1} OF ${t.steps.length}`;prev.disabled=timeline.step===0;next.disabled=timeline.step===t.steps.length-1;play.disabled=timeline.playing;pause.disabled=!timeline.playing;}
 function tick(now:number){if(!timeline.playing)return;timeline=animation(timeline,{type:'tick',ms:lastTime?now-lastTime:16},t.steps.length);lastTime=now;draw();if(timeline.playing)frame=requestAnimationFrame(tick);}
 function act(action:AnimationAction){cancelAnimationFrame(frame);timeline=animation(timeline,action,t.steps.length);lastTime=0;draw();if(timeline.playing)frame=requestAnimationFrame(tick);}
 cleanup=()=>cancelAnimationFrame(frame);draw();
 if(s.attempts>0)explainDifferently(helpArea,s);
}
function explainDifferently(area:HTMLElement,s:Session){
 const t=tutorialById(s.tutorialId!),version=renderVersion;
 const input=el('textarea',{id:'reasoning',rows:2,maxlength:300,placeholder:'For example: I counted the little studs.'});
 const output=el('div',{class:'ai-output'});
 const send=button('Help with my explanation',()=>request(true),'secondary');
 area.replaceChildren(el('div',{class:'panel'},el('h2',{},'Let’s try a different way.'),el('p',{class:'mode-label'},aiMode==='configured'?'Live AI wording helper available. Only this maths context is sent.':'Built-in explanation mode · live AI is not configured.'),el('label',{for:'reasoning'},'Optional: how were you thinking about it?'),input,el('p',{class:'small'},'Please leave out names and personal details. If live AI is configured, this short explanation is sent to the AI provider when you press the button. It is not saved in your session.'),send,output));
 request(false);
 async function request(includeText:boolean){send.disabled=true;output.replaceChildren(el('p',{role:'status'},'Finding another way to explain…'));let response:AiResult;
 try{const last=s.observations.at(-1);const evidence=evidenceStatus(s.posterior,s.observations,s.module).find(e=>e.skill===t.skill)!;
 const body={conceptId:t.id,...(last?{itemId:last.itemId,response:last.outcome}:{}),skillEvidence:{skill:t.skill,status:evidence.status},...(includeText?{learnerText:input.value}:{})};const r=await fetch(await apiUrl('/api/explain'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(18000)});response=await r.json();if(!r.ok||!['live','built-in'].includes(response.mode)||!validOutput(response.output,t.id))throw Error('Invalid response');
 }catch{response=fallback(t.id,'Built-in explanation — the live helper is unavailable.');}
 if(version!==renderVersion||activeId!==s.id)return;
 send.disabled=false;output.replaceChildren(el('p',{class:'mode-label'},response.reason),el('p',{class:'alternative-copy'},response.output.explanation),visual(trustedAiVisual(response.output)),...response.output.stepCaptions.map(c=>el('p',{},c)));
 const follow=itemById(response.output.followUpItemId);if(!s.observations.some(o=>o.itemId===follow.id))output.append(button('Try the suggested practice question',()=>{commit({...s,stage:'guided',currentItemId:follow.id,selectionReason:'AI selected a whitelisted guided item. Deterministic scoring; no mastery update.'});render();},'secondary'));
 }
}
function result(main:HTMLElement,s:Session){
 const latest=s.observations.filter(o=>['independent','revisit'].includes(o.phase)).at(-1);const correct=latest?.outcome==='correct';
 main.append(el('section',{class:'panel result-panel'},el('div',{class:'eyebrow'},'ONE MORE BRICK IN PLACE'),el('h1',{},correct?'You tried it on your own.':'We can keep building.'),el('p',{class:'lead'},correct?'You answered this example independently. A different question another time can help us see what stays with you.':s.attempts>=2?'Let’s take a break. A grown-up can try these pictures with you. You don’t have to figure it all out today.':'Would another example help? We can use a different explanation or look at a smaller step.'),el('div',{class:'button-row'},...(!correct&&s.attempts<2?[button('Explain another way',()=>{commit(retryTeaching(s));render();},'primary'),button('Look at an earlier step',()=>{commit(retryTeaching(s,true));render();},'secondary')]:[]),button('Explore Fractions of an Hour',()=>navigate('bridge'),'secondary'),button('Choose another topic',()=>navigate('home'),'secondary'))));
 const feedback=el('section',{class:'panel feedback'},el('h2',{},'How did that feel?'),el('p',{},'Optional. There is no right answer.'));for(const label of ['That helped','Still puzzling','I’d like another picture'])feedback.append(button(label,()=>{commit({...current(),feedback:label});feedback.replaceChildren(el('p',{role:'status'},'Thank you. Your feedback is saved on this device.'));},'secondary',{'aria-pressed':s.feedback===label}));main.append(feedback);
}
function bridge(main:HTMLElement){
 const player=moviePlayer('hour-fractions');cleanup=player.dispose;
 main.append(el('div',{class:'activity-heading'},el('div',{class:'eyebrow'},'CONNECT THE IDEAS'),el('h1',{},'Fractions of an Hour'),el('p',{class:'lead'},'This is an amount of time: a duration. Start at twelve and count the minutes that pass.')));
 main.append(el('details',{class:'bridge-movie'},el('summary',{},'Watch the Fractions of an Hour mini movie'),player.element));
 const stage=el('div',{class:'bridge-stage'}),caption=el('p',{class:'bridge-equation','aria-live':'polite'});const choices=el('div',{class:'button-row'});const fractions=['1/4','1/2','3/4'];
 function show(i:number){const minutes=[15,30,45][i];stage.replaceChildren(clock(minutes,{counts:false,arc:minutes}),minuteBricks(minutes));caption.textContent=`${minutes} minutes = ${fractions[i]} hour`;for(const [k,b]of Array.from(choices.children).entries())b.setAttribute('aria-pressed',String(k===i));}
 [15,30,45].forEach((m,i)=>choices.append(button(`${m} minutes`,()=>show(i),'secondary',{'aria-pressed':i===0})));
 main.append(el('section',{class:'panel bridge-activity'},choices,stage,caption,el('p',{},'Sixty little studs make one whole hour. Each brick group holds five minutes.')),el('aside',{class:'notice'},el('h2',{},'A duration is different from a clock reading.'),el('p',{},'“Quarter to four” names 3:45: fifteen minutes remain until four. It does not mean a duration of three quarters of an hour.')),button('Finish this activity',()=>{store.bridgeVisits++;store.lastBridgeAt=new Date().toISOString();save();navigate('home');},'primary'));show(0);
}
const journalPrompts=['What difficulty did I notice?','Which design decisions did I make?','Why did I choose these examples?','What did classmates say?','What did I change?','What did I learn?','What help did I receive from adults, AI and coding tools?'];
function adult(main:HTMLElement){
 main.append(el('div',{class:'activity-heading'},el('div',{class:'eyebrow'},'PARENT / TEACHER AREA'),el('h1',{},'See the learning journey.'),el('p',{class:'lead'},'Provisional evidence, useful questions, and room to reflect. This is an adaptive diagnostic tutor, not a validated ability test.')));
 const exportStore=()=>({schemaVersion:1,exportedAt:new Date().toISOString(),sessions:store.sessions,bridgeVisits:store.bridgeVisits});
 const deletion=el('div');
 main.append(el('section',{class:'panel'},el('h2',{},'This device’s evidence'),el('p',{},`${store.sessions.length} anonymous sessions. No sample sessions are mixed into these records.`),el('div',{class:'button-row'},button('Export anonymous JSON',()=>download('brick-by-brick-evidence.json',JSON.stringify(exportStore(),null,2),'application/json'),'secondary'),button('Export anonymous CSV',()=>download('brick-by-brick-evidence.csv',csv(store),'text/csv'),'secondary'),button('Delete this app’s data',()=>deletion.replaceChildren(el('p',{},'Delete sessions and journal saved by this app on this browser?'),button('Yes, delete app data',()=>{try{localStorage.removeItem(STORAGE_KEY);}catch{}store=emptyStore();activeId=undefined;render();},'danger'),button('Keep my data',()=>deletion.replaceChildren(),'secondary')),'quiet')),deletion));
 main.append(el('section',{class:'panel'},el('h2',{},'Optional small trial'),el('p',{},'Use the same journey as usual, marked as an evaluation visit. Initial diagnostic items and fresh targeted final items are recorded separately. Item difficulty is only provisionally comparable; the final check targets the lesson, so an aggregate before–after score is not a valid learning-gain estimate.'),el('div',{class:'button-row'},button('Start a time trial',()=>start('time',true),'secondary'),button('Start a fractions trial',()=>start('fractions',true),'secondary'))));
 for(const s of [...store.sessions].reverse()){
 const diagnostic=s.observations.filter(o=>o.phase==='diagnostic'),independent=s.observations.filter(o=>o.phase==='independent'),retention=s.observations.filter(o=>o.phase==='revisit');
 const summary=el('details',{class:'panel session-debug'},el('summary',{},`${s.module==='time'?'Time':'Fractions'} · ${new Date(s.started).toLocaleString()} · ${s.id.slice(0,8)}${s.evaluation?' · evaluation':''}`));
 const status=evidenceStatus(s.posterior,s.observations,s.module);
 summary.append(el('p',{},`Engagement: ${s.observations.length} answered/uncertain/skipped events. Diagnostic observations: ${diagnostic.length}. Independent accuracy: ${independent.filter(o=>o.outcome==='correct').length}/${independent.filter(o=>['correct','incorrect'].includes(o.outcome)).length} scored attempts (${independent.filter(o=>!['correct','incorrect'].includes(o.outcome)).length} uncertain/skipped). Revisit: ${retention.length?retention.map(o=>o.outcome).join(', '):'not yet observed'}. These are separate indicators, not proof of learning.`),el('p',{},`Stopped: ${s.stopReason||'check in progress'}. Incomplete: ${s.incomplete}.`),el('p',{},`Tutorial: ${s.tutorialId||'not yet selected'}. ${s.tutorialReason||''}`),el('p',{},`Current selection: ${s.selectionReason}`),el('p',{},'Prior marginals: '+marginals(prior()).map(p=>p.toFixed(2)).join(', ')),el('ul',{},...status.map(e=>el('li',{},`${e.skill}: ${skillNames[e.skill]} — ${e.status}; posterior ${e.probability.toFixed(3)}, ${e.count} scored diagnostic observations.`))),el('p',{},`Wrong-option evidence (heuristic counts, not probabilities): ${JSON.stringify(misconceptionEvidence(s.observations))}`));
 for(const o of s.observations){const item=itemById(o.itemId);summary.append(el('details',{class:'observation'},el('summary',{},`${o.phase} · ${item.id} · ${o.outcome}${o.hints?' · hint shown':''}`),el('p',{},item.prompt),el('p',{},`Required skills: ${item.skills.join(', ')}. Answer: ${item.choices.find(c=>c.id===o.choiceId)?.label||o.outcome}.`),el('p',{},o.reason),el('p',{},`Prior: ${o.prior.map(x=>x.toFixed(3)).join(', ')}. Posterior: ${o.posterior.map(x=>x.toFixed(3)).join(', ')}.`),el('p',{},o.misconception?`Provisional interpretation: ${item.choices.find(c=>c.id===o.choiceId)?.meaning}`:'No wrong-option interpretation.')));}
 summary.append(button('Reset this session',()=>{store.sessions=store.sessions.filter(x=>x.id!==s.id);save();render();},'quiet'));main.append(summary);
 }
 main.append(el('section',{class:'panel limitations'},el('h2',{},'How to read this evidence'),el('p',{},'The model tracks 32 possible combinations of five skills. Correctness updates those probabilities using assumed guessing and slip rates. Expected information gain helps choose a useful next diagnostic question. Wrong choices are clues, not diagnoses.'),el('p',{},'Watching a lesson never marks a skill as mastered. Guided responses do not update mastery. Independent checks start from a separate uncertain prior of 0.5 per skill; the diagnostic snapshot stays intact. One correct answer is limited evidence. Thresholds and item parameters are uncalibrated.'),el('p',{},'The AI only changes wording or chooses a checked visual/example. It cannot score answers or alter the learner model. Visual parameters are validated; arbitrary prose cannot be completely verified.'),el('p',{class:'mode-label'},aiMode==='configured'?'Live AI configured; each returned response labels whether it was live or a fallback.':'Built-in explanation mode. Live AI awaits server-side credentials.')));
 const journal=el('section',{class:'panel journal'},el('h2',{},'My project journal'),el('p',{},'These fields are blank until the student writes in them. Use anonymous notes about classmates; do not add names. Journal text stays separate from evidence exports.'));
 journalPrompts.forEach((prompt,k)=>{const input=el('textarea',{id:`journal-${k}`,rows:3,maxlength:3000});input.value=store.journal[prompt]||'';input.addEventListener('input',()=>{store.journal[prompt]=input.value;save();});journal.append(el('label',{for:`journal-${k}`},prompt),input);});
 journal.append(button('Export my journal',()=>download('my-project-journal.txt',journalPrompts.map(p=>`${p}\n${store.journal[p]||'[Not yet recorded]'}`).join('\n\n'),'text/plain'),'secondary'));main.append(journal);
}
apiUrl('/api/status').then(url=>fetch(url)).then(r=>r.json()).then(r=>{aiMode=r.mode==='configured'?'configured':'built-in';}).catch(()=>{});
render();
