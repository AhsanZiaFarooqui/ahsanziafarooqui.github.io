import {el,button} from './dom.js?v=01e72359e68d';
import {movieById,chapterAt,chapterStarts} from './movies.js?v=01e72359e68d';
export function moviePlayer(id       ){
 const movie=movieById(id),starts=chapterStarts(movie);
 const revision=new URL(import.meta.url).searchParams.get('v')||'narrated-1';
 const asset=(extension       )=>`./videos/${id}.${extension}?v=${encodeURIComponent(revision)}`;
 const video=el('video',{class:'lesson-movie',src:asset('mp4'),poster:asset('png'),preload:'metadata',playsinline:true,controls:true,'aria-label':`${movie.title}, narrated and captioned brick-style video`});
 video.append(el('track',{kind:'captions',src:asset('vtt'),srclang:'en',label:'English captions'}));
 let selected=0;
 const caption=el('p',{class:'step-caption','aria-live':'polite'},movie.scenes[0].caption),counter=el('span',{class:'step-count'}),notice=el('p',{class:'small movie-voice-note'},'This video includes spoken narration and captions. Use the speaker control on the video to change the volume.');
 const play=button('Play',()=>{if(video.ended)video.currentTime=0;void video.play().catch(()=>{notice.textContent='Press the play button on the video to start.';});},'primary');
 const pause=button('Pause',()=>video.pause(),'secondary');
 const previous=button('← Previous step',()=>seek(Math.max(0,selected-1)),'secondary');
 const next=button('Next step →',()=>seek(Math.min(movie.scenes.length-1,selected+1)),'secondary');
 function update(){selected=chapterAt(movie,video.currentTime||0);caption.textContent=movie.scenes[selected].caption;counter.textContent=`STEP ${selected+1} OF ${movie.scenes.length}`;previous.disabled=selected===0;next.disabled=selected===movie.scenes.length-1;play.disabled=!video.paused;pause.disabled=video.paused;}
 function seek(chapter       ){video.pause();video.currentTime=starts[chapter]+.01;selected=chapter;update();}
 for(const event of ['timeupdate','play','pause','ended'])video.addEventListener(event,update);
 video.addEventListener('error',()=>{notice.textContent='The video could not load. You can read each explanation below, or use the interactive step view.';});
 const transcript=el('details',{class:'movie-transcript'},el('summary',{},'Read the whole explanation'),el('ol',{},...movie.scenes.map(s=>el('li',{},s.caption))));
 const panel=el('section',{class:'panel movie-panel'},el('div',{class:'eyebrow'},'WATCH A BRICK-BY-BRICK MINI MOVIE'),video,el('div',{class:'caption-area'},counter,caption),el('div',{class:'player-controls'},previous,play,pause,button('Replay',()=>{seek(0);void video.play().catch(()=>{});},'secondary'),next),notice,transcript);
 update();return {element:panel,dispose(){video.pause();}};
}
