import {movies} from './movies.ts';
import {apiUrl} from './runtime-config.ts';
import {narrationSamples,wavBytes} from './audio-utils.ts';
const generate=document.getElementById('generate') as HTMLButtonElement,progress=document.getElementById('progress')!,preview=document.getElementById('preview') as HTMLAudioElement,downloadArea=document.getElementById('download')!;
const base64=(bytes:Uint8Array)=>new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(new Blob([bytes]));});
generate.addEventListener('click',async()=>{
 generate.disabled=true;downloadArea.replaceChildren();let context:AudioContext|undefined;
 try{
  context=new AudioContext({sampleRate:22050});await context.resume();
  const cache=await caches.open('brick-by-brick-narration-v1');const pack:{id:string;seconds:number;maxSpeed:number;wav:string}[]=[];
  let done=0;const total=movies.reduce((n,m)=>n+m.scenes.length,0);
  for(const movie of movies){const clips:Float32Array[]=[];
   for(let k=0;k<movie.scenes.length;k++){
    progress.textContent=`Making voice ${done+1} of ${total}: ${movie.title}, step ${k+1}. Keep this tab open.`;
    const url=await apiUrl(`/api/narration?movie=${encodeURIComponent(movie.id)}&scene=${k}`);const cacheUrl=new URL(url);cacheUrl.searchParams.set('caption',movie.scenes[k].caption);const key=cacheUrl.href;
    let response=await cache.match(key);
    if(!response){response=await fetch(url,{signal:AbortSignal.timeout(50000)});if(!response.ok)throw Error(`Narration request returned HTTP ${response.status}. Check that the updated Worker code was deployed. If the free allowance is exhausted, try tomorrow.`);if(!response.headers.get('Content-Type')?.startsWith('audio/'))throw Error('The narration endpoint did not return audio.');await cache.put(key,response.clone());}
    const audio=await context.decodeAudioData(await response.arrayBuffer());if(audio.duration<=0||audio.duration>40)throw Error('Unexpected voice duration');clips.push(new Float32Array(audio.getChannelData(0)));done++;
   }
   const voice=narrationSamples(movie.scenes,clips,context.sampleRate),bytes=wavBytes(voice.samples,context.sampleRate);
   if(pack.length===0){preview.src=URL.createObjectURL(new Blob([bytes],{type:'audio/wav'}));preview.hidden=false;}
   pack.push({id:movie.id,seconds:voice.samples.length/context.sampleRate,maxSpeed:voice.maxSpeed,wav:await base64(bytes)});
  }
  let blob=new Blob([JSON.stringify({version:1,sampleRate:context.sampleRate,movies:pack})],{type:'application/json'}),filename='brick-narration.json';
  if(typeof CompressionStream!=='undefined'){blob=await new Response(blob.stream().pipeThrough(new CompressionStream('gzip'))).blob();filename+='.gz';}
  const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=filename;link.textContent='Download the completed narration files';downloadArea.append(link);link.click();
  progress.textContent='All 14 lesson voices are ready. Listen to the preview, keep the downloaded file in Downloads, and tell the project helper it is ready to embed into the videos.';
 }catch(error){progress.textContent=`Stopped: ${error instanceof Error?error.message:'Unable to generate narration'}. Completed scenes are saved here; you can retry.`;}
 finally{await context?.close();generate.disabled=false;generate.textContent='Retry / download narration again';}
});
