import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {formItems} from '../src/assessment.ts';
test('HTTP trial gate requires configured live samples AND explicit adult review; same-origin and input checks',async()=>{
 const port=5189,child=spawn(process.execPath,['--experimental-strip-types','--import','./tests/fixtures/study-provider.mjs','server/index.ts'],{env:{...process.env,PORT:String(port),OPENAI_API_KEY:'synthetic-http-test-only',ENABLE_COMPARISON:'true'},stdio:['ignore','pipe','pipe']});
 try{await new Promise<void>((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Startup timed out')),5000);child.once('error',reject);child.stdout.on('data',d=>{if(String(d).includes('Brick by Brick')){clearTimeout(timeout);resolve();}});});const base=`http://127.0.0.1:${port}`;const post=(path:string,body:unknown,headers:Record<string,string>={})=>fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
 assert.equal((await(await fetch(base+'/api/study-status')).json()).verified,false);
 assert.equal((await post('/api/study-enable',{reviewed:true,token:'invented'})).status,409);
 const verification=await(await post('/api/study-verify',{})).json();assert.equal(verification.samples.length,8);assert.equal(verification.readyForReview,true);assert.ok(verification.samples.every((s:any)=>s.mode==='live'));assert.equal((await(await fetch(base+'/api/study-status')).json()).verified,false);
 assert.equal((await post('/api/study-enable',{reviewed:false,token:verification.token})).status,409);
 assert.equal((await post('/api/study-enable',{reviewed:true,token:verification.token})).status,200);assert.equal((await(await fetch(base+'/api/study-status')).json()).verified,true);
 const input={segmentId:'time-0',initial:formItems('time','A').slice(0,2).map(q=>({itemId:q.id,choice:null})),different:false,previousExplanation:null,clarification:'unsure'};
 assert.equal((await(await post('/api/study-explain',input)).json()).mode,'live');assert.equal((await post('/api/study-explain',{...input,final:[]})).status,400);assert.equal((await post('/api/study-explain',input,{Origin:'https://example.org'})).status,403);assert.equal((await post('/api/study-explain',{large:'x'.repeat(5000)})).status,413);
 assert.match(await(await fetch(base)).text(),/comparison-main\.js\?v=/);
 }finally{child.kill();await new Promise<void>(resolve=>{if(child.exitCode!==null)resolve();else child.once('exit',()=>resolve());});}
});
