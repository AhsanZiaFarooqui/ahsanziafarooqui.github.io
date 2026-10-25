import {test} from 'node:test';
import assert from 'node:assert/strict';
import {learnerReport,adultReport,reportHtml} from '../src/study-reports.ts';
import {emptyStudy,createSession,answerQuiz,quizItems,beginTutorial,recordDelivery,answerGuided,nextSegment,metrics,summary,exportCsv,STUDY_KEY,validateStore} from '../src/study.ts';
import type {StudySession,StudyStore,Group,Mode} from '../src/study.ts';
import {assessment} from '../src/assessment.ts';
import {builtInDelivery,tailoringInput} from '../src/tailoring.ts';
import {setupDom} from './dom-harness.ts';
const generated='2026-10-25T12:00:00.000Z';
let code=0;
// Synthetic records only. Some fixtures explicitly clear the label to exercise real-summary filters in isolated memory.
function session(topic:'time'|'fractions'='time',arm:Group='ai',before=4,after:number|null=6,mode:Mode='comparison',fallback=false):StudySession {
 let s=createSession(emptyStudy(),topic,mode,`BBB-R${String(++code).padStart(5,'0')}`,true,()=>.1,true);
 for(let i=0;i<8;i++)s=answerQuiz(s,i<before?quizItems(s,'initial')[i].answer:null,()=>arm==='ai'?.9:.1);
 s=beginTutorial(s,mode==='practice'?arm:undefined);
 for(let i=0;i<4;i++){const id=s.sequence[s.segmentIndex];s=recordDelivery(s,builtInDelivery(id,arm==='standard'?'standard':fallback?'fallback':'live',tailoringInput(s,id),'Synthetic provider failure'));s=answerGuided(s,null);s=nextSegment(s);}
 if(after!==null)for(let i=0;i<8;i++)s=answerQuiz(s,i<after?quizItems(s,'final')[i].answer:null);
 return {...s,tutorialMs:180000};
}
const storeOf=(...sessions:StudySession[]):StudyStore=>({schema:2,sessions,activeId:null});
const real=(s:StudySession)=>({...s,synthetic:false});
const section=(report:ReturnType<typeof learnerReport>,name:string)=>report.sections.find(s=>s.heading===name)!;

test('learner reports match scores and CSV for both topics, improvement, unchanged and decline',()=>{
 for(const topic of ['time','fractions'] as const)for(const after of [2,4,6]){
  const s=session(topic,'ai',4,after),original=JSON.stringify(s),r=learnerReport(s,generated),html=reportHtml(r),m=metrics(s);
  validateStore(storeOf(s));assert.match(r.label,/SYNTHETIC/);assert.deepEqual(r.scores,[{label:'Before',value:4},{label:'After',value:after}]);
  assert.deepEqual(section(r,'Before and after').table!.rows.slice(0,2),[['Initial quiz','4/8 — 50%'],['Final quiz',`${after}/8 — ${after*12.5}%`]]);
  assert.equal(section(r,'Before and after').table!.rows[3][1],`${m.percentagePoints!>0?'+':''}${m.percentagePoints} percentage points`);
  assert.match(section(r,'Before and after').paragraphs[0],after<4?/fewer/:after>4?/more/:/same number/);
  assert.ok(exportCsv(storeOf(s)).includes(`"4","${after}",`));assert.equal(JSON.stringify(s),original);
  assert.match(html,/Common scale: 0 to 8/);assert.match(html,/width:50%/);assert.match(html,/cannot show that AI caused/);
  assert.ok(assessment.every(q=>!html.includes(q.prompt)&&!html.includes(q.explanation)));
 }
});
test('incomplete quizzes remain missing and reports withhold partial concept feedback',()=>{
 let initial=createSession(emptyStudy(),'time','practice','BBB-MISS01',false,()=>.1,true);initial=answerQuiz(initial,quizItems(initial,'initial')[0].answer);
 const r=learnerReport(initial,generated);assert.match(section(r,'Before and after').table!.rows[0][1] as string,/Incomplete — 1\/8 answered; score missing/);assert.ok(section(r,'Concept breakdown').table!.rows.every(row=>row[1]==='Incomplete'&&row[2]==='Incomplete'));assert.ok(r.scores!.every(s=>s.value===null));
 let partial=session('fractions','ai',4,null);partial=answerQuiz(partial,null);partial={...partial,status:'stopped'};
 const html=reportHtml(learnerReport(partial,generated));assert.match(html,/Incomplete — 1\/8 answered; score missing/);assert.match(html,/Unanswered questions have not been scored as zero/);assert.doesNotMatch(html,/width:0%/);
});
test('comparison report retains failures and missing outcomes, excludes practice and synthetic, and matches dashboard summaries',()=>{
 const ai=real(session('time','ai',4,6,'comparison',true)),missing=real(session('time','ai',2,null)),standard=real(session('time','standard',4,3)),practice=real(session('time','ai',0,8,'practice')),synthetic=session('time','ai',0,8),fraction=real(session('fractions','standard',6,6));
 const store=storeOf(ai,missing,standard,practice,synthetic,fraction);validateStore(store);const r=adultReport(store,'comparison',generated),time=section(r,'Read the Time'),html=reportHtml(r);
 const a=summary(store,'time','ai'),b=summary(store,'time','standard');assert.deepEqual(time.table!.rows[0],['Number assigned',1,2]);assert.deepEqual(time.table!.rows.find(row=>row[0]==='Mean change / 8 (completers)'),['Mean change / 8 (completers)',b.meanGain!.toFixed(2),a.meanGain!.toFixed(2)]);
 assert.match(time.paragraphs.join(' '),/3.00 points out of 8 \(37.50 percentage points\)/);assert.match(time.paragraphs.join(' '),/1 AI-assigned sessions have no final score/);
 assert.deepEqual(section(r,'Read the Time — distribution of score changes').table!.rows.find(row=>row[0]==='-1'),['-1',1,0]);assert.equal(section(r,'Read the Time — distribution of score changes').table!.rows.length,17);
 assert.match(html,/not a complete intention-to-treat/);assert.match(html,/Synthetic provider failure/);assert.ok(!html.includes(practice.code)&&!html.includes(synthetic.code));assert.match(html,/1 labelled synthetic test sessions excluded/);
 assert.equal(section(r,'Delivery failures and recorded deviations').table!.rows[0][2],'AI-tailored tutorial');assert.match(section(r,'Explore Fractions').paragraphs.join(' '),/not available until each assigned group/);
});
test('practice and empty reports are separate and never fabricate outcomes',()=>{
 const p=real(session('fractions','standard',4,6,'practice')),c=real(session());const r=adultReport(storeOf(p,c),'practice',generated),html=reportHtml(r);
 assert.match(r.label,/PRACTICE ONLY/);assert.ok(html.includes(p.code)&&!html.includes(c.code));assert.match(html,/cannot be interpreted causally/);
 const empty=adultReport(emptyStudy(),'comparison',generated);assert.ok(empty.sections.filter(s=>['Read the Time','Explore Fractions'].includes(s.heading)).every(s=>s.paragraphs.some(p=>p.includes('not available until each assigned group'))));
});
test('downloaded HTML escapes untrusted deviations and remains self-contained and script-free',()=>{
 const s=session();s.deviations.push({at:generated,reason:'<script>alert("x")</script> & <img src=x onerror=alert(1)>'});const html=reportHtml(learnerReport(s,generated));
 assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script|<img|<iframe|<link|<form/i);assert.match(html,/@media print/);assert.match(html,/table-header-group/);assert.match(html,/Generated \(UTC\)/);assert.match(html,/Ctrl\+P/);
});
test('DOM learner report preview, print, HTML download and Back preserve the session',async()=>{
 const h=setupDom(),s=session('fractions','standard',4,6,'practice'),store=storeOf(s);store.activeId=s.id;h.data.set(STUDY_KEY,JSON.stringify(store));await import('../src/comparison-main.ts?report-learner');
 const before=h.data.get(STUDY_KEY);h.button('View learner report').click();assert.match(h.root.textContent,/Learner progress report/);assert.match(h.root.textContent,/\+25 percentage points/);assert.match(h.root.textContent,/PRACTICE RESULTS/);
 let prints=0;Object.assign(window,{print:()=>prints++});h.button('Print / Save as PDF').click();assert.equal(prints,1);
 let downloaded:Blob|undefined;const old=URL.createObjectURL;URL.createObjectURL=(blob:Blob)=>{downloaded=blob;return 'blob:synthetic-report';};try{h.button('Download HTML report').click();assert.equal(downloaded!.type,'text/html;charset=utf-8');assert.match(await downloaded!.text(),/Learner progress report/);}finally{URL.createObjectURL=old;}
 h.button('Back').click();assert.match(h.root.textContent,/Your practice results/);assert.equal(h.data.get(STUDY_KEY),before);
});
test('DOM adult report tabs and incomplete session reports are accessible without changing data',async()=>{
 const h=setupDom(),s=session('time','ai',4,null),store=storeOf(s);h.data.set(STUDY_KEY,JSON.stringify(store));await import('../src/comparison-main.ts?report-adult');const original=h.data.get(STUDY_KEY);
 h.button('Grown-ups').click();h.button('View comparison report').click();assert.match(h.root.textContent,/Randomised comparison report/);assert.doesNotMatch(h.root.textContent,/Live AI setup/);h.button('Back').click();
 h.button('View learner report').click();assert.match(h.root.textContent,/score missing/);assert.doesNotMatch(h.root.textContent,/Correct \/ 2/);h.button('Back').click();h.button('Practice results').click();h.button('View practice summary report').click();assert.match(h.root.textContent,/Practice summary report/);assert.equal(h.data.get(STUDY_KEY),original);
});
