import {mkdir,writeFile} from 'node:fs/promises';
import {movies,chapterStarts} from '../src/movies.ts';
await mkdir('media-work/scripts',{recursive:true});await mkdir('public/videos',{recursive:true});
const stamp=(n:number)=>`${String(Math.floor(n/3600)).padStart(2,'0')}:${String(Math.floor(n%3600/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}.000`;
for(const movie of movies){await writeFile(`media-work/scripts/${movie.id}.json`,JSON.stringify(movie));const starts=chapterStarts(movie);await writeFile(`public/videos/${movie.id}.vtt`,'WEBVTT\n\n'+movie.scenes.map((s,k)=>`${k+1}\n${stamp(starts[k])} --> ${stamp(starts[k]+s.seconds)}\n${s.caption}\n`).join('\n'));}
await writeFile('public/videos/manifest.json',JSON.stringify(movies.map(m=>({id:m.id,title:m.title,seconds:m.scenes.reduce((n,s)=>n+s.seconds,0),captions:`${m.id}.vtt`,video:`${m.id}.mp4`,poster:`${m.id}.png`,audio:'No embedded audio; optional local device narration in app.'})),null,2));
console.log(`Prepared ${movies.length} movie scripts and matching caption tracks.`);
