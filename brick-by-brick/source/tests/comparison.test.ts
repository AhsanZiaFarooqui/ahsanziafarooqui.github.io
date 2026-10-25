import {test} from 'node:test';
import assert from 'node:assert/strict';
import {quizForms,quizItem} from '../src/assessment-bank.ts';
import {createLearningSession,currentQuestion,submitAnswer,scoreQuiz,conceptScores,startLearning,beginFinalQuiz,parseComparisonStore,emptyComparisonStore,lessonOrder,coreLessons,tailoringContext,summaryCsv,exportEvidence,resultWords,addDeviation} from '../src/comparison-session.ts';
import type {LearningSession} from '../src/comparison-session.ts';
import {digital,timeWords} from '../src/math.ts';
function initial(topic:'time'|'fractions',mode:'practice'|'comparison',arm=0,correct=4,form=0){let s=createLearningSession(topic,mode,()=>form);for(let k=0;k<8;k++){const q=currentQuestion(s);s=submitAnswer(s,q.id,k<correct?q.correct:null,()=>arm);}return s;}
function taught(s:LearningSession){return {...s,learning:{...s.learning!,visited:[...s.learning!.order]}};}
function reload(s:LearningSession){return parseComparisonStore(JSON.stringify({...emptyComparisonStore(),activeId:s.id,sessions:[s]})).sessions[0];}
test('matched forms have eight distinct items, identical concept weights and choice counts',()=>{
 for(const topic of ['time','fractions'] as const){const {A,B}=quizForms[topic];assert.equal(A.length,8);assert.equal(B.length,8);assert.equal(new Set([...A,...B].map(q=>q.id)).size,16);assert.deepEqual(A.map(q=>q.concept),B.map(q=>q.concept));assert.deepEqual(A.map(q=>q.choices.length),B.map(q=>q.choices.length));
  for(const q of [...A,...B]){assert.equal(new Set(q.choices.map(c=>c.label)).size,q.choices.length);assert.ok(q.choices.some(c=>c.id===q.correct));assert.equal('hint' in q,false);if(q.visual.kind==='clock')assert.ok(!q.visual.digital&&!q.visual.labels&&!q.visual.counts);}
 }
});
test('assessment answer keys match the mathematics and both forms cover every concept',()=>{
 for(const form of ['A','B'] as const){const time=quizForms.time[form];for(const q of time){const answer=q.choices.find(c=>c.id===q.correct)!.label;if(q.visual.kind==='clock'){if(q.concept==='T2')assert.equal(answer,`${q.visual.total%60} minutes`);if(q.concept==='T3')assert.equal(answer,String(Math.floor(q.visual.total/60)));if(q.concept==='T4')assert.equal(answer,timeWords(q.visual.total));if(q.concept==='T5')assert.equal(answer,digital(q.visual.total));}}
  for(const q of quizForms.fractions[form]){if(q.concept==='F3'&&q.visual.kind==='fraction')assert.equal(q.choices[0].label,`${q.visual.n}/${q.visual.d}`);}
  assert.equal(new Set(time.map(q=>q.concept)).size,5);assert.equal(new Set(quizForms.fractions[form].map(q=>q.concept)).size,5);
 }
});
test('incomplete quizzes never become zero scores; uncertainty is distinct and duplicate answers rejected',()=>{
 let s=createLearningSession('time','comparison',()=>0);assert.equal(scoreQuiz(s.pre),null);assert.equal(s.assignment,undefined);const id=currentQuestion(s).id;
 s=submitAnswer(s,id,null);assert.equal(s.pre.status,'incomplete');assert.equal(s.pre.answers[0].type,'uncertain');assert.equal(s.pre.answers[0].correct,false);assert.equal(scoreQuiz(s.pre),null);assert.throws(()=>submitAnswer(s,id,null),/Stale/);assert.throws(()=>submitAnswer(s,currentQuestion(s).id,'invalid'),/Unknown/);assert.equal(reload(s).pre.answers.length,1);
});
test('random assignment occurs after initial quiz, survives reopening and forbids switching',()=>{
 for(const topic of ['time','fractions'] as const)for(const form of [0,1])for(const arm of [0,1]){let s=initial(topic,'comparison',arm,4,form);assert.equal(s.assignment?.arm,arm?'ai':'standard');assert.equal(scoreQuiz(s.pre),4);assert.equal(s.pre.form,form?'B':'A');s=reload(s);assert.equal(s.assignment?.arm,arm?'ai':'standard');assert.throws(()=>startLearning(s,arm?'standard':'ai'),/locked/);assert.throws(()=>startLearning(s,arm?'standard':'ai',true),/Finish/);s=startLearning(s,s.assignment!.arm);assert.throws(()=>beginFinalQuiz(s),/Review/);assert.equal(reload(s).learning?.arm,s.assignment!.arm);}
});
test('practice choices, full comparable quizzes, honest results and post-completion crossover',()=>{
 for(const topic of ['time','fractions'] as const)for(const mode of ['practice','comparison'] as const)for(const arm of ['standard','ai'] as const)for(const finalScore of [2,4,6]){let s=initial(topic,mode,arm==='ai'?1:0);s=startLearning(s,arm);assert.equal(s.assignment?.arm,mode==='comparison'?arm:undefined);const before=JSON.stringify(s.pre);s=beginFinalQuiz(taught(s));for(let k=0;k<8;k++){const q=currentQuestion(s);s=submitAnswer(s,q.id,k<finalScore?q.correct:q.choices[1].id);}assert.equal(scoreQuiz(s.post),finalScore);assert.equal(s.stage,'results');assert.equal(JSON.stringify(s.pre),before);assert.equal(conceptScores(s,'post').reduce((n,c)=>n+c.total,0),8);assert.equal(new Set([...s.pre.answers,...s.post.answers].map(a=>a.itemId)).size,16);s=reload(s);const other=startLearning(s,arm==='ai'?'standard':'ai',true);assert.deepEqual(other.post,s.post);assert.deepEqual(other.assignment,s.assignment);assert.equal(other.stage,'other');assert.equal(reload(other).otherLearning?.arm,arm==='ai'?'standard':'ai');}
 assert.match(resultWords(4,6),/2 more correct answers, or 25 percentage points/);assert.match(resultWords(4,4),/no change/);assert.match(resultWords(4,2),/2 fewer correct answers, or 25 percentage points lower/);
});
test('AI prioritises initial needs while both arms retain the entire standard curriculum',()=>{
 const s=initial('time','practice',0,4);assert.deepEqual(lessonOrder(s,'standard'),coreLessons.time);assert.equal(lessonOrder(s,'ai')[0],'half-past');assert.deepEqual([...lessonOrder(s,'ai')].sort(),[...coreLessons.time].sort());
 for(const skill of ['T1','T2','T3','T4','T5'] as const){const context=tailoringContext(s,skill);assert.ok(context.length<=300);assert.ok(!context.includes(s.id));assert.match(context,/Initial/);assert.ok(!context.includes(s.post.form+'-'));}
});
test('exports retain missing outcomes, separate modes and record deviations without exclusions',()=>{
 const practice=initial('fractions','practice');const comparison=addDeviation(initial('time','comparison',1),'ai_fallback','offline');const early=createLearningSession('time','comparison');const store={...emptyComparisonStore(),sessions:[practice,comparison,early]};const exported=exportEvidence(store,'comparison');assert.equal(exported.sessions.length,2);assert.ok(exported.sessions.every(s=>s.mode==='comparison'));assert.equal(exported.sessions[0].deviations.length,1);assert.equal(exportEvidence(store,'practice').sessions.length,1);const csv=summaryCsv(store,'comparison');assert.match(csv,/incomplete/);assert.match(csv,/ai_fallback/);assert.ok(!csv.includes(practice.id));assert.match(csv,/"incomplete","0",""/);
});
test('corrupt or inconsistent records fail closed instead of being silently reset',()=>{
 const good=initial('time','comparison');const parse=(s:unknown)=>parseComparisonStore(JSON.stringify({...emptyComparisonStore(),sessions:[s]}));assert.throws(()=>parseComparisonStore('{broken'));assert.throws(()=>parse({...good,assignment:undefined}));assert.throws(()=>parse({...good,post:{...good.post,form:good.pre.form}}));assert.throws(()=>parse({...good,pre:{...good.pre,status:'incomplete'}}));const wrong=structuredClone(good);wrong.pre.answers[0].correct=false;assert.throws(()=>parse(wrong));
});
