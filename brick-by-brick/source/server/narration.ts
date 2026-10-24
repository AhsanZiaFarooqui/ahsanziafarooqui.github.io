import {movies} from '../src/movies.ts';
export interface NarrationAI {run:(model:string,input:unknown)=>Promise<unknown>}
const narrationCounts=new Map<string,{time:number;count:number}>();
export async function narrationResponse(request:Request,ai:NarrationAI|undefined,headers:Record<string,string>):Promise<Response>{
 const fail=(code:string,status:number)=>new Response(JSON.stringify({error:code}),{status,headers});
 const url=new URL(request.url),id=url.searchParams.get('movie'),index=Number(url.searchParams.get('scene'));
 const movie=movies.find(m=>m.id===id);
 if(request.method!=='GET'||[...url.searchParams.keys()].some(k=>!['movie','scene'].includes(k))||!url.searchParams.has('scene')||!movie||!Number.isInteger(index)||index<0||index>=movie.scenes.length)return fail('Only a checked movie scene can be narrated.',400);
 if(!ai)return fail('Workers AI binding AI is missing.',503);
 const ip=request.headers.get('CF-Connecting-IP')||'local',now=Date.now(),old=narrationCounts.get(ip),rate=old&&now-old.time<3600000?old:{time:now,count:0};
 if(rate.count>=120)return fail('Narration limit reached. Please try again in an hour.',429);
 rate.count++;narrationCounts.set(ip,rate);
 if(narrationCounts.size>500)for(const [key,value]of narrationCounts)if(now-value.time>=3600000)narrationCounts.delete(key);
 let timeout:ReturnType<typeof setTimeout>|undefined;
 try{
  // Only the checked caption is sent, never supplied text or learner information.
  const result:any=await Promise.race([ai.run('@cf/myshell-ai/melotts',{prompt:movie.scenes[index].caption,lang:'en'}),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('timeout')),45000);})]);
  let bytes:Uint8Array;
  if(result instanceof ReadableStream)bytes=new Uint8Array(await new Response(result).arrayBuffer());
  else if(result instanceof ArrayBuffer)bytes=new Uint8Array(result);
  else if(result instanceof Uint8Array)bytes=result;
  else if(typeof result?.audio==='string'&&result.audio.length<=6000000)bytes=Uint8Array.from(atob(result.audio),c=>c.charCodeAt(0));
  else throw Error('Unsupported speech response');
  if(bytes.length<100||bytes.length>4000000)throw Error('Invalid audio size');
  const wave=String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WAVE';
  const mp3=String.fromCharCode(...bytes.slice(0,3))==='ID3'||bytes[0]===255&&(bytes[1]&224)===224;
  if(!wave&&!mp3)throw Error('Unsupported audio type');
  return new Response(bytes,{headers:{...headers,'Content-Type':wave?'audio/wav':'audio/mpeg','Cache-Control':'private, max-age=86400'}});
 }catch{return fail('Speech could not be generated. Keep Workers Free; retry later if the allowance is exhausted.',502);}
 finally{if(timeout)clearTimeout(timeout);}
}
