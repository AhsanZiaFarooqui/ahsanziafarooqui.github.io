import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
test('real HTTP server serves the built app, protects files, and validates AI requests',async()=>{
 const port=5187;const child=spawn(process.execPath,['--experimental-strip-types','server/index.ts'],{env:{...process.env,PORT:String(port),OPENAI_API_KEY:'replace_test'},stdio:['ignore','pipe','pipe']});
 try{await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('server startup timed out')),5000);child.once('error',reject);child.stdout.on('data',d=>{if(String(d).includes('Brick by Brick')){clearTimeout(timer);resolve();}});child.once('exit',code=>{if(code)reject(Error(`Server exited ${code}`));});});
 const base=`http://127.0.0.1:${port}`;
 const index=await fetch(base);assert.equal(index.status,200);assert.match(await index.text(),/main\.js/);assert.match(index.headers.get('content-security-policy')!,/default-src 'self'/);
 const js=await fetch(base+'/main.js');assert.equal(js.status,200);assert.match(js.headers.get('content-type')!,/javascript/);assert.doesNotMatch(await js.text(),/from '\.\/.*\.ts'/);
 assert.equal((await fetch(base+'/.env')).status,404);assert.equal((await fetch(base+'/server/ai.ts')).status,404);
 const status=await(await fetch(base+'/api/status')).json();assert.equal(status.mode,'built-in');
 const media=await fetch(base+'/videos/hands.mp4',{headers:{Range:'bytes=0-127'}});assert.equal(media.status,206);assert.equal(media.headers.get('content-type'),'video/mp4');assert.equal((await media.arrayBuffer()).byteLength,128);assert.match(media.headers.get('content-range')!,/^bytes 0-127\//);assert.equal((await fetch(base+'/videos/hands.vtt')).headers.get('content-type'),'text/vtt; charset=utf-8');
 const post=(body:unknown,headers={})=>fetch(base+'/api/explain',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
 const fallback=await(await post({conceptId:'hands'})).json();assert.equal(fallback.mode,'built-in');assert.equal((await post({conceptId:'unrelated'})).status,400);assert.equal((await post({conceptId:'hands',name:'not collected'})).status,400);assert.equal((await post({conceptId:'hands'},{Origin:'https://example.org'})).status,403);assert.equal((await post({conceptId:'hands'},{Origin:'bad-origin'})).status,403);assert.equal((await post({conceptId:'hands',learnerText:'x'.repeat(6000)})).status,413);
 }finally{child.kill();await new Promise<void>(resolve=>{if(child.exitCode!==null)resolve();else child.once('exit',()=>resolve());});}
});
