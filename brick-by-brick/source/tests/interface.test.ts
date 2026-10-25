import {test} from 'node:test';
import assert from 'node:assert/strict';
import {setupDom} from './dom-harness.ts';
import {STORAGE_KEY} from '../src/session.ts';
import {readFile} from 'node:fs/promises';
test('DOM integration: full time and fractions journeys, player, hints, exports and scoped deletion',async()=>{
 const h=setupDom();await import('../src/legacy-main.ts');
 const click=(label:string)=>h.button(label).click();
 assert.match(h.root.textContent,/Let’s build yourmaths together/);assert.doesNotMatch(h.root.textContent,/posterior|ability score/);
 for(const topic of ['Read the Time','Explore Fractions']){
 click(topic);let count=0;
 while(h.root.querySelector('.stop-button')){
 assert.equal(h.button('That’s my answer').disabled,true);
 const options=h.root.querySelectorAll('[data-choice-id]');const choice=count===0?options.find(b=>b.getAttribute('data-choice-id')==='d0'):options.find(b=>b.getAttribute('data-choice-id')==='answer');choice!.click();click('That’s my answer');assert.match(h.root.textContent,/Thanks. Let’s keep going/);assert.doesNotMatch(h.root.textContent,/The answer here is/);click('Continue');count++;assert.ok(count<=8);
 }
 assert.ok(count>=4);assert.match(h.root.textContent,/LET’S LOOK AT THIS TOGETHER/);
 const originalCaption=h.root.querySelector('.step-caption')!.textContent;
 click('Play');assert.equal(h.button('Play').disabled,true);h.tick(100);click('Pause');assert.equal(h.frames.size,0);click('Next step');assert.notEqual(h.root.querySelector('.step-caption')!.textContent,originalCaption);click('Previous step');assert.equal(h.root.querySelector('.step-caption')!.textContent,originalCaption);click('Replay');assert.equal(h.button('Pause').disabled,false);click('Pause');
 h.setReduced(true);click('Next step');assert.ok(h.root.querySelector('video'));h.setReduced(false);
 click('Explain differently');await new Promise(resolve=>setTimeout(resolve,20));assert.match(h.root.textContent,/Built-in explanation/);
 click('Try it myself');assert.match(h.root.textContent,/Let’s try one together/);click('Show a hint');h.root.querySelectorAll('[data-choice-id]').find(b=>b.getAttribute('data-choice-id')==='answer')!.click();click('Check this answer');click('Try on my own');
 assert.match(h.root.textContent,/Your turn to try/);assert.equal(h.root.querySelector('.hint-button'),null);h.root.querySelectorAll('[data-choice-id]').find(b=>b.getAttribute('data-choice-id')==='answer')!.click();click('Check this answer');click('See what’s next');assert.match(h.root.textContent,/You tried it on your own/);
 const saved=JSON.parse(h.data.get(STORAGE_KEY)!);const session=saved.sessions.at(-1);assert.ok(session.observations.find((o:any)=>o.phase==='guided').hints);assert.equal(session.observations.find((o:any)=>o.phase==='independent').hints,false);
 click('Explore Fractions of an Hour');click('45 minutes');assert.match(h.root.textContent,/45 minutes = 3\/4 hour/);click('Finish this activity');assert.match(h.root.textContent,/A little revisit/);
 }
 click('Try a revisit');assert.match(h.root.textContent,/Try a little revisit/);click('I’m not sure');click('See what’s next');click('Choose another topic');click('Grown-ups');assert.match(h.root.textContent,/Prior marginals/);click('Export anonymous JSON');click('Export anonymous CSV');click('Delete this app’s data');click('Yes, delete app data');assert.equal(h.data.has(STORAGE_KEY),false);assert.equal(h.data.get('unrelated-project'),'keep me');assert.match(h.root.textContent,/0 anonymous sessions/);
});
test('DOM integration: early stop is recorded as incomplete and independent failure offers a bounded retry',async()=>{
 const h=setupDom();await import('../src/legacy-main.ts?early-stop');h.button('Read the Time').click();h.button('Stop the check').click();assert.match(h.root.textContent,/stopped the check early/);h.button('Try it myself').click();h.button('I’m not sure').click();h.button('Try on my own').click();h.button('I’m not sure').click();h.button('See what’s next').click();assert.match(h.root.textContent,/another example help/);h.button('Explain another way').click();h.button('Try it myself').click();h.button('I’m not sure').click();h.button('See what’s next').click();assert.match(h.root.textContent,/A grown-up can try these pictures/);const s=JSON.parse(h.data.get(STORAGE_KEY)!).sessions[0];assert.equal(s.incomplete,true);assert.equal(s.attempts,2);
});
test('SVG rendering keeps identical whole lengths and sixty clock ticks',async()=>{setupDom();const {clock,fraction}=await import('../src/visuals.ts');const c=clock(225);const lines=(c as any).querySelectorAll('line');assert.equal(lines.length,62);assert.equal(lines.find((n:any)=>n.getAttribute('data-hand')==='hour').getAttribute('data-angle'),'112.5');const f=fraction({kind:'fraction',n:1,d:3,units:12,second:{n:2,d:6}});const wholes=(f as any).querySelectorAll('[data-whole-width]');assert.equal(wholes.length,2);assert.equal(wholes[0].getAttribute('data-whole-width'),wholes[1].getAttribute('data-whole-width'));assert.equal(wholes[0].getAttribute('data-filled-units'),wholes[1].getAttribute('data-filled-units'));});
test('responsive and reduced-motion rules exist; this is not visual browser QA',async()=>{const css=await readFile('src/style.css','utf8');assert.match(css,/@media\(max-width:560px\)/);assert.match(css,/prefers-reduced-motion:reduce/);assert.match(css,/:focus-visible/);assert.match(css,/min-height:48px/);});

test('AI status updates after loading and adult connection check creates no learner session',async()=>{
 const h=setupDom();let release:(value:Response)=>void=()=>{};
 globalThis.fetch=(async()=>new Promise<Response>(resolve=>{release=resolve;})) as typeof fetch;
 await import('../src/legacy-main.ts?connection-status');await new Promise(resolve=>setTimeout(resolve,0));
 h.button('Grown-ups').click();assert.match(h.root.textContent,/Checking the AI connection/);
 release(Response.json({mode:'configured'}));await new Promise(resolve=>setTimeout(resolve,0));
 assert.match(h.root.textContent,/AI connection configured/);assert.doesNotMatch(h.root.textContent,/Checking the AI connection/);
 const {fallback}=await import('../src/ai-contract.ts');
 globalThis.fetch=(async(url:unknown)=>Response.json(String(url).endsWith('/api/status')?{mode:'configured'}:{...fallback('hands'),mode:'live'})) as typeof fetch;
 h.button('Test AI connection').click();await new Promise(resolve=>setTimeout(resolve,20));
 assert.match(h.root.textContent,/LIVE_VERIFIED/);assert.match(h.root.textContent,/0 anonymous sessions/);assert.equal(h.data.has(STORAGE_KEY),false);
});
