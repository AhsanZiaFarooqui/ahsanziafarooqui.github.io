import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {fallback} from '../src/ai-contract.ts';

test('connection test distinguishes status, transport, response validation and real live success',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=(async()=>Response.json({aiEndpoint:'https://brick-maths-ai.ahsan-zia-farooqui.workers.dev'})) as typeof fetch;
 try{
 const {checkAiConnection}=await import('../src/connection-check.ts');
 const make=(reply:()=>Response|Promise<Response>)=>(async(url:unknown,init:RequestInit)=>{
  assert.match(String(url),/^https:\/\/brick-maths-ai\.ahsan-zia-farooqui\.workers\.dev\/api\//);
  if(String(url).endsWith('/api/status'))return Response.json({mode:'configured'});
  assert.deepEqual(JSON.parse(init.body as string),{conceptId:'hands'});
  return reply();
 }) as typeof fetch;
 assert.equal((await checkAiConnection(make(()=>Response.json({...fallback('hands'),mode:'live'})))).code,'LIVE_VERIFIED');
 assert.equal((await checkAiConnection(make(()=>Response.json(fallback('hands','Provider unavailable'))))).code,'PROVIDER_FALLBACK');
 assert.equal((await checkAiConnection(make(()=>new Response('blocked',{status:403})))).code,'EXPLAIN_HTTP_403');
 assert.equal((await checkAiConnection(make(()=>new Response('Hello World')))).code,'EXPLAIN_NOT_JSON');
 assert.equal((await checkAiConnection(make(()=>Response.json({mode:'live',output:{}})))).code,'RESPONSE_REJECTED');
 assert.equal((await checkAiConnection((async()=>{throw Error('network');}) as typeof fetch)).code,'NETWORK_OR_CORS');
 assert.equal((await checkAiConnection((async()=>{throw new DOMException('late','TimeoutError');}) as typeof fetch)).code,'BROWSER_TIMEOUT');
 assert.equal((await checkAiConnection((async()=>Response.json({mode:'built-in'})) as typeof fetch)).code,'BINDING_NOT_CONFIGURED');
 assert.equal((await checkAiConnection((async()=>new Response('missing',{status:404})) as typeof fetch)).code,'STATUS_HTTP_404');
 }finally{globalThis.fetch=original;}
});

test('published assets use a consistent build version and config bypasses stale caches',async()=>{
 const html=await readFile('dist/index.html','utf8'),version=html.match(/main\.js\?v=([a-f0-9]{12})/)?.[1];assert.ok(version);
 assert.ok(html.includes(`style.css?v=${version}`));
 for(const file of await readdir('dist'))if(file.endsWith('.js')){
  const source=await readFile(`dist/${file}`,'utf8');
  for(const match of source.matchAll(/from\s+['"]\.\/[^'"]+\.js([^'"]*)['"]/g))assert.equal(match[1],`?v=${version}`);
 }
 const source=await readFile('dist/runtime-config.js','utf8');assert.match(source,/cache:\s*['"]no-store/);assert.match(source,/config\.json\?v=/);
});
