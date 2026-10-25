import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
import {loadEnvFile} from 'node:process';
import {explain} from './ai.ts';
import {validInput} from '../src/ai-contract.ts';
import {studyExplain} from './study-ai.ts';
import {validTailoringInput} from '../src/tailoring.ts';
import {curriculum} from '../src/curriculum.ts';
import {formItems} from '../src/assessment.ts';
try{loadEnvFile('.env');}catch{}
const root=resolve('dist');const requests=new Map<string,{time:number;count:number}>();
let studyVerifiedAt:string|null=null;
let studyReviewToken:string|null=null;
let verificationInProgress=false;
const studyConfigured=()=>!!process.env.OPENAI_API_KEY&&!process.env.OPENAI_API_KEY.startsWith('replace_');
let configuredAiOrigin='';
try{const config=JSON.parse(await readFile(resolve(root,'config.json'),'utf8'));if(typeof config.aiEndpoint==='string'&&/^https:\/\/[a-z0-9-]+\.[a-z0-9-]+\.workers\.dev\/?$/i.test(config.aiEndpoint))configuredAiOrigin=new URL(config.aiEndpoint).origin;}catch{}
const server=createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cache-Control','no-store');
 res.setHeader('Content-Security-Policy',`default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self' ${configuredAiOrigin}; object-src 'none'; base-uri 'none'; frame-ancestors 'none'`);
 const send=(status:number,value:unknown)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(value));};
 const url=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`);
 if(url.pathname==='/api/study-status'&&req.method==='GET')return send(200,{configured:studyConfigured(),enabled:process.env.ENABLE_COMPARISON==='true',verifiedAt:studyVerifiedAt,verified:!!studyVerifiedAt});
 if(['/api/study-explain','/api/study-verify','/api/study-enable'].includes(url.pathname)){
  if(req.method!=='POST')return send(405,{error:'POST required'});
  if(req.headers.origin){try{if(new URL(req.headers.origin).host!==req.headers.host)return send(403,{error:'Same origin required'});}catch{return send(403,{error:'Invalid origin'});}}
  if(!req.headers['content-type']?.startsWith('application/json'))return send(415,{error:'JSON required'});
  const ip='study:'+(req.socket.remoteAddress||'local'),stamp=Date.now(),previous=requests.get(ip),rate=previous&&stamp-previous.time<60000?previous:{time:stamp,count:0};requests.set(ip,rate);if(++rate.count>30)return send(429,{error:'Please wait a minute'});
  try{let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>4096)return send(413,{error:'Request too large'});}const input=JSON.parse(body);
   if(url.pathname==='/api/study-explain'){if(!validTailoringInput(input))return send(400,{error:'Invalid initial evidence'});return send(200,await studyExplain(input,{key:process.env.OPENAI_API_KEY,model:process.env.OPENAI_MODEL}));}
   if(!studyConfigured()||process.env.ENABLE_COMPARISON!=='true')return send(409,{error:'Set server credentials and ENABLE_COMPARISON=true first'});
   if(url.pathname==='/api/study-enable'){if(input.reviewed!==true||!studyReviewToken||input.token!==studyReviewToken)return send(409,{error:'Review and approve the live verification samples first'});studyVerifiedAt=new Date().toISOString();studyReviewToken=null;return send(200,{verified:true,verifiedAt:studyVerifiedAt});}
   if(verificationInProgress)return send(409,{error:'Verification already running'});
   verificationInProgress=true;studyVerifiedAt=null;studyReviewToken=null;
   try{const samples=[];for(const s of curriculum){samples.push(await studyExplain({segmentId:s.id,initial:formItems(s.topic,'A').filter(q=>q.concept===s.concept).map(q=>({itemId:q.id,choice:null})),different:false,previousExplanation:null,clarification:'unsure'},{key:process.env.OPENAI_API_KEY,model:process.env.OPENAI_MODEL}));}if(samples.every(s=>s.mode==='live'))studyReviewToken=crypto.randomUUID();return send(200,{samples,token:studyReviewToken,readyForReview:!!studyReviewToken});}finally{verificationInProgress=false;}
  }catch{return send(400,{error:'Invalid request'});}
 }
 if(url.pathname==='/api/status'&&req.method==='GET')return send(200,{mode:process.env.OPENAI_API_KEY&&!process.env.OPENAI_API_KEY.startsWith('replace_')?'configured':'built-in'});
 if(url.pathname==='/api/explain'){
 if(req.method!=='POST')return send(405,{error:'POST required'});
 if(req.headers.origin){try{if(new URL(req.headers.origin).host!==req.headers.host)return send(403,{error:'Same-origin requests only'});}catch{return send(403,{error:'Invalid origin'});}}
 if(!req.headers['content-type']?.startsWith('application/json'))return send(415,{error:'JSON required'});
 const ip=req.socket.remoteAddress||'local',now=Date.now(),current=requests.get(ip);const rate=current&&now-current.time<60000?current:{time:now,count:0};rate.count++;requests.set(ip,rate);
 if(requests.size>1000)for(const [key,v]of requests)if(now-v.time>60000)requests.delete(key);
 if(rate.count>15)return send(429,{error:'Please wait a moment before asking again.'});
 try{let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>4096)return send(413,{error:'Request too large'});}const input=JSON.parse(body);if(!validInput(input))return send(400,{error:'Unsupported maths context'});return send(200,await explain(input,{key:process.env.OPENAI_API_KEY,model:process.env.OPENAI_MODEL}));}catch{return send(400,{error:'Invalid request'});}
 }
 if(req.method!=='GET'&&req.method!=='HEAD')return send(405,{error:'GET required'});
 try {const file=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(root+sep))return send(403,{error:'Forbidden'});const info=await stat(file);if(!info.isFile())return send(404,{error:'Not found'});const mime:Record<string,string>={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.mp4':'video/mp4','.png':'image/png','.vtt':'text/vtt; charset=utf-8','.json':'application/json'};
 const range=req.headers.range;if(range){const match=/^bytes=(\d*)-(\d*)$/.exec(range);if(!match||(!match[1]&&!match[2])){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});return res.end();}const start=match[1]?Number(match[1]):Math.max(0,info.size-Number(match[2]));const end=match[1]&&match[2]?Math.min(Number(match[2]),info.size-1):info.size-1;if(start>=info.size||end<start){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});return res.end();}res.writeHead(206,{'Content-Type':mime[extname(file)]||'application/octet-stream','Content-Range':`bytes ${start}-${end}/${info.size}`,'Accept-Ranges':'bytes','Content-Length':end-start+1});if(req.method==='HEAD')res.end();else createReadStream(file,{start,end}).pipe(res);return;}
 res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Content-Length':info.size,'Accept-Ranges':'bytes'});if(req.method==='HEAD')res.end();else createReadStream(file).pipe(res);
 }catch{send(404,{error:'Not found'});}
});
server.listen(Number(process.env.PORT||5173),process.env.HOST||'127.0.0.1',()=>console.log(`Brick by Brick: http://${process.env.HOST||'127.0.0.1'}:${process.env.PORT||5173} (live AI ${process.env.OPENAI_API_KEY&&!process.env.OPENAI_API_KEY.startsWith('replace_')?'configured, not necessarily verified':'not configured'})`));
