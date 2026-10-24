import {test} from 'node:test';
import assert from 'node:assert/strict';
import {narrationSamples,wavBytes} from '../src/audio-utils.ts';
import {cloudflareFetch} from '../server/cloudflare.ts';
import {movies} from '../src/movies.ts';
const origin='https://ahsanziafarooqui.github.io';let counter=0;
const request=(suffix='movie=hands&scene=0')=>new Request(`https://example.workers.dev/api/narration?${suffix}`,{headers:{Origin:origin,'CF-Connecting-IP':`voice-test-${counter++}`}});
test('narration endpoint speaks only checked scene captions and rejects arbitrary input',async()=>{
 const wave=wavBytes(Float32Array.from({length:2205},(_,i)=>Math.sin(i*.1)*.2));let calls=0;
 const AI={run:async(model:string,input:unknown)=>{calls++;assert.equal(model,'@cf/myshell-ai/melotts');assert.deepEqual(input,{prompt:movies[0].scenes[0].caption,lang:'en'});return {audio:Buffer.from(wave).toString('base64')};}};
 const result=await cloudflareFetch(request(),{AI:AI as any});assert.equal(result.status,200);assert.equal(result.headers.get('Content-Type'),'audio/wav');assert.equal(result.headers.get('Access-Control-Allow-Origin'),origin);assert.equal((await result.arrayBuffer()).byteLength,wave.length);
 for(const query of ['movie=hands&scene=999','movie=unknown&scene=0','movie=hands&scene=0&text=say-anything','movie=hands&scene=-1','movie=hands'])assert.equal((await cloudflareFetch(request(query),{AI:AI as any})).status,400);
 assert.equal(calls,1);assert.equal((await cloudflareFetch(request(),{})).status,503);
 assert.equal((await cloudflareFetch(request(),{AI:{run:async()=>{throw Error('quota');}}})).status,502);
 assert.equal((await cloudflareFetch(request(),{AI:{run:async()=>({response:'not audio'})}})).status,502);
});
test('narration timing reserves scene gaps and exports valid mono PCM without clipping',()=>{
 const rate=100,clip=new Float32Array(100).fill(.5),result=narrationSamples([{seconds:3},{seconds:4}],[clip,clip],rate);
 assert.equal(result.samples.length,700);assert.equal(result.samples[0],0);assert.equal(result.samples[12],.5);assert.equal(result.samples[200],0);assert.equal(result.samples[312],.5);assert.equal(result.maxSpeed,1);
 const bytes=wavBytes(result.samples,rate),v=new DataView(bytes.buffer);assert.equal(new TextDecoder().decode(bytes.slice(0,4)),'RIFF');assert.equal(v.getUint32(24,true),rate);assert.equal(v.getUint16(22,true),1);assert.equal(v.getUint32(40,true),1400);assert.equal(bytes.length,1444);
 assert.throws(()=>narrationSamples([{seconds:3}],[new Float32Array(100)],rate),/silent/);
 assert.throws(()=>narrationSamples([{seconds:3}],[new Float32Array(1000).fill(.2)],rate),/too long/);
});
