import {readFile,writeFile,mkdir,stat,copyFile,rename} from 'node:fs/promises';
import {resolve} from 'node:path';
import {gunzipSync} from 'node:zlib';
import {spawn} from 'node:child_process';
import {movies} from '../src/movies.ts';
const input=process.argv[2];if(!input)throw Error('Pass the downloaded brick-narration.json.gz path.');
if((await stat(input)).size>100000000)throw Error('Unexpectedly large narration pack');
let raw=await readFile(input);if(raw[0]===31&&raw[1]===139)raw=gunzipSync(raw,{maxOutputLength:180000000});
const pack=JSON.parse(raw.toString('utf8'));
if(pack.version!==1||!Array.isArray(pack.movies)||pack.movies.length!==movies.length)throw Error('Expected the complete 14-movie narration pack');
await mkdir('media-work/narration',{recursive:true});await mkdir('media-work/silent-videos',{recursive:true});
// Validate the whole pack before changing any published video.
for(const movie of movies){const all=pack.movies.filter(m=>m.id===movie.id);if(all.length!==1)throw Error('Duplicate or missing movie');const entry=all[0];if(typeof entry.wav!=='string'||!/^[A-Za-z0-9+/]*={0,2}$/.test(entry.wav))throw Error('Invalid audio encoding');const wav=Buffer.from(entry.wav,'base64');
 if(wav.toString('ascii',0,4)!=='RIFF'||wav.toString('ascii',8,12)!=='WAVE'||wav.readUInt16LE(20)!==1||wav.readUInt16LE(22)!==1||wav.readUInt16LE(34)!==16)throw Error('Expected mono PCM WAV');
 const rate=wav.readUInt32LE(24),bytes=wav.readUInt32LE(40),seconds=bytes/(rate*2),expected=movie.scenes.reduce((n,s)=>n+s.seconds,0);
 if(rate<8000||rate>96000||Math.abs(seconds-expected)>.01||bytes+44!==wav.length)throw Error('Narration timing mismatch');
 let peak=0;for(let i=44;i<wav.length;i+=2)peak=Math.max(peak,Math.abs(wav.readInt16LE(i)));if(peak<30)throw Error('Narration appears silent');
 await writeFile(`media-work/narration/${movie.id}.wav`,wav);
}
const run=(file,args)=>new Promise((ok,no)=>{const p=spawn(file,args,{windowsHide:true,stdio:'ignore'});p.once('error',no);p.once('exit',code=>code?no(Error(`Video mux failed (${code})`)):ok());});
for(const movie of movies){const source=resolve(`public/videos/${movie.id}.mp4`),out=resolve(`media-work/narration/${movie.id}.mp4`),wave=resolve(`media-work/narration/${movie.id}.wav`);
 await copyFile(source,resolve(`media-work/silent-videos/${movie.id}.mp4`));
 await run('C:/Program Files/VideoLAN/VLC/vlc.exe',['--intf','dummy','--no-one-instance','--ignore-config','--no-media-library','--no-metadata-network-access','--no-plugins-cache',source,`:input-slave=${new URL('file:///'+wave.replaceAll('\\','/')).href}`,'--sout',`#transcode{acodec=mp4a,ab=96,channels=1,samplerate=22050}:std{access=file,mux=mp4,dst=${out}}`,'vlc://quit']);
 const encoded=await readFile(out);if(encoded.length<10000||!encoded.includes(Buffer.from('mp4a'))||!encoded.includes(Buffer.from('avc1')))throw Error('Expected both AAC audio and H264 video');
 await copyFile(out,source);console.log(`Embedded spoken narration: ${movie.id}`);
}
const manifest=JSON.parse(await readFile('public/videos/manifest.json','utf8'));for(const item of manifest)item.audio='Embedded English synthetic narration, generated from the checked captions using Cloudflare MeloTTS.';await writeFile('public/videos/manifest.json',JSON.stringify(manifest,null,2));
await writeFile('media-work/narration/verification.json',JSON.stringify({movies:movies.length,source:'Cloudflare MeloTTS; generated in owner browser',checks:'PCM duration, non-silence, AAC/H264 track markers; listening review still required'},null,2));
