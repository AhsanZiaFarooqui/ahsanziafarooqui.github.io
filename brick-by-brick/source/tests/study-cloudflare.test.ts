import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cloudflareStudyFetch,cloudflareStudyExplain} from '../server/study-cloudflare.ts';
import {formItems} from '../src/assessment.ts';
import {checkedExplanations,segment} from '../src/curriculum.ts';
import {validTailoringOutput} from '../src/tailoring.ts';
const origin='https://ahsanziafarooqui.github.io';
let requests=0;
const request=(path:string,body?:unknown,headers:Record<string,string>={})=>new Request('https://example.workers.dev'+path,{method:body===undefined?'GET':'POST',headers:{Origin:origin,'Content-Type':'application/json','CF-Connecting-IP':'synthetic-'+requests++,...headers},body:body===undefined?undefined:JSON.stringify(body)});
function proofCache(){const entries=new Map<string,Response>();return {entries,match:async(key:Request)=>entries.get(key.url)?.clone(),put:async(key:Request,value:Response)=>{entries.set(key.url,value.clone());}};}
function input(id='time-0'){const t=segment(id);return {segmentId:id,initial:formItems(t.topic,'A').filter(q=>q.concept===t.concept).map(q=>({itemId:q.id,choice:null})),different:false,previousExplanation:null,clarification:'unsure' as const};}
const ai={run:async(_model:string,data:any)=>{const context=JSON.parse(data.messages[1].content);assert.doesNotMatch(data.messages[1].content,/participantCode|finalScore|school|birthday/);return {response:{explanationIndex:context.explanations[0].index,visualExampleId:context.workedExamples[0].id,guidedPracticeItemId:context.guidedPractice[0].id,followUpIndex:0}};}};
test('Cloudflare study gate requires eight real-mode samples, adult review and the matching origin receipt',async()=>{
 const cache=proofCache(),env={AI:ai};let status=await(await cloudflareStudyFetch(request('/api/study-status'),env,cache)).json();assert.equal(status.verified,false);assert.equal(status.provider,'cloudflare');
 const verification=await(await cloudflareStudyFetch(request('/api/study-verify',{}),env,cache)).json();assert.equal(verification.samples.length,8);assert.equal(verification.readyForReview,true);assert.ok(verification.samples.every((s:any)=>s.mode==='live'));
 assert.equal((await cloudflareStudyFetch(request('/api/study-enable',{token:verification.token,reviewed:false}),env,cache)).status,409);
 const enabled=await(await cloudflareStudyFetch(request('/api/study-enable',{token:verification.token,reviewed:true}),env,cache)).json();assert.equal(enabled.verificationToken,verification.token);
 status=await(await cloudflareStudyFetch(request('/api/study-status',undefined,{'X-Study-Token':enabled.verificationToken}),env,cache)).json();assert.equal(status.verified,true);
 assert.equal((await(await cloudflareStudyFetch(request('/api/study-status'),env,cache)).json()).verified,false);
 cache.entries.clear();assert.equal((await(await cloudflareStudyFetch(request('/api/study-status',undefined,{'X-Study-Token':enabled.verificationToken}),env,cache)).json()).verified,false);
});
test('Cloudflare live selections map only to checked packages; unsupported text and failures fall back',async()=>{
 const good=await cloudflareStudyExplain(input(),{AI:ai});assert.equal(good.mode,'live');assert.equal(validTailoringOutput({targetConcept:good.segmentId,explanation:good.explanation,visualExampleId:good.exampleId,stepCaptions:good.stepCaptions,guidedPracticeItemId:good.practiceId,followUpResponse:good.followUpResponse},'time-0'),true);
 const different=await cloudflareStudyExplain({...input(),different:true,previousExplanation:checkedExplanations('time-0')[0]},{AI:ai});assert.notEqual(different.explanation,good.explanation);
 for(const run of [async()=>{throw Error('synthetic quota failure');},async()=>({response:{explanationIndex:99,visualExampleId:'time-B-1',guidedPracticeItemId:'time-B-2',followUpIndex:0}}),async()=>({response:'invalid JSON'})]){assert.equal((await cloudflareStudyExplain(input(),{AI:{run}})).mode,'fallback');}
 const cache=proofCache();const failed=await(await cloudflareStudyFetch(request('/api/study-verify',{}),{AI:{run:async()=>{throw Error('synthetic failure');}}},cache)).json();assert.equal(failed.readyForReview,false);assert.equal(failed.token,null);assert.equal(cache.entries.size,0);
});
test('Cloudflare public routes enforce CORS, request sizes, input validation and fail closed without receipt storage',async()=>{
 assert.equal((await cloudflareStudyFetch(request('/api/study-explain',input(),{Origin:'https://bad.test'}),{AI:ai})).status,403);
 assert.equal((await cloudflareStudyFetch(request('/api/study-explain',{...input(),name:'not allowed'}),{AI:ai})).status,400);
 assert.equal((await cloudflareStudyFetch(request('/api/study-explain',{payload:'x'.repeat(5000)}),{AI:ai})).status,413);
 assert.equal((await cloudflareStudyFetch(request('/api/study-verify',{}),{AI:ai})).status,503);
 const cors=await cloudflareStudyFetch(new Request('https://example.workers.dev/api/study-status',{method:'OPTIONS',headers:{Origin:origin}}),{AI:ai});assert.equal(cors.status,204);assert.match(cors.headers.get('Access-Control-Allow-Headers')!,/X-Study-Token/);
});
test('static-site routing uses configured Workers endpoint; Node development stays local',async()=>{
 const prior=globalThis.fetch;globalThis.fetch=async()=>Response.json({});try{const {resolveStudyBase}=await import('../src/study-network.ts');const config={aiEndpoint:'https://brick-maths-ai.ahsan-zia-farooqui.workers.dev'};assert.equal(resolveStudyBase(config,'ahsanziafarooqui.github.io'),config.aiEndpoint);assert.equal(resolveStudyBase(config,'127.0.0.1'),'');assert.equal(resolveStudyBase({aiEndpoint:'https://unexpected.test'},'ahsanziafarooqui.github.io'),'');}finally{globalThis.fetch=prior;}
});
