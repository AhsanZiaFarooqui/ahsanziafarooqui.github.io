import {el,button} from './dom.js?v=fe8d0075f5b4';
import {movieById,chapterAt,chapterStarts} from './movies.js?v=fe8d0075f5b4';
export function moviePlayer(id       ){
 const movie=movieById(id),starts=chapterStarts(movie);
 const video=el('video',{class:'lesson-movie',src:`./videos/${id}.mp4`,poster:`./videos/${id}.png`,preload:'metadata',playsinline:true,controls:true,'aria-label':`${movie.title}, captioned brick-style video`});
 video.append(el('track',{kind:'captions',src:`./videos/${id}.vtt`,srclang:'en',label:'English captions'}));
 let selected=0,spoken=-1,voiceEnabled=false,disposed=false;
 const speech=typeof speechSynthesis!=='undefined'?speechSynthesis:undefined;
 const voice=()=>speech?.getVoices().find(v=>v.localService&&v.lang.toLowerCase().startsWith('en'));
 const caption=el('p',{class:'step-caption','aria-live':'polite'},movie.scenes[0].caption),counter=el('span',{class:'step-count'}),notice=el('p',{class:'small movie-voice-note'},'Captions are included in the video. Read aloud uses an English voice on your device, if available.');
 const play=button('Play',()=>{if(video.ended)video.currentTime=0;void video.play().catch(()=>{notice.textContent='Press the play button on the video to start.';});},'primary');
 const pause=button('Pause',()=>video.pause(),'secondary');
 const previous=button('← Previous step',()=>seek(Math.max(0,selected-1)),'secondary');
 const next=button('Next step →',()=>seek(Math.min(movie.scenes.length-1,selected+1)),'secondary');
 const read=button('Read aloud: off',()=>{if(!voice()){notice.textContent='No local English voice is available on this device. The video and its captions still work.';return;}voiceEnabled=!voiceEnabled;read.textContent=voiceEnabled?'Read aloud: on':'Read aloud: off';read.setAttribute('aria-pressed',String(voiceEnabled));if(!voiceEnabled)speech?.cancel();else if(!video.paused){spoken=-1;speak();}},'secondary',{'aria-pressed':false});
 function speak(){if(!voiceEnabled||!speech||!voice()||spoken===selected||video.paused||disposed)return;speech.cancel();const utterance=new SpeechSynthesisUtterance(movie.scenes[selected].caption);utterance.voice=voice() ;utterance.rate=.86;utterance.onend=()=>{};spoken=selected;speech.speak(utterance);}
 function update(){selected=chapterAt(movie,video.currentTime||0);caption.textContent=movie.scenes[selected].caption;counter.textContent=`STEP ${selected+1} OF ${movie.scenes.length}`;previous.disabled=selected===0;next.disabled=selected===movie.scenes.length-1;play.disabled=!video.paused;pause.disabled=video.paused;speak();}
 function seek(chapter       ){video.pause();speech?.cancel();spoken=-1;video.currentTime=starts[chapter]+.01;selected=chapter;update();}
 video.addEventListener('timeupdate',update);video.addEventListener('play',()=>{speech?.resume();update();});video.addEventListener('pause',()=>{speech?.pause();update();});video.addEventListener('ended',()=>{speech?.cancel();update();});video.addEventListener('seeking',()=>{speech?.cancel();spoken=-1;});
 video.addEventListener('error',()=>{notice.textContent='The video could not load. You can read each explanation below, or use the interactive step view.';});
 const transcript=el('details',{class:'movie-transcript'},el('summary',{},'Read the whole explanation'),el('ol',{},...movie.scenes.map(s=>el('li',{},s.caption))));
 const panel=el('section',{class:'panel movie-panel'},el('div',{class:'eyebrow'},'WATCH A BRICK-BY-BRICK MINI MOVIE'),video,el('div',{class:'caption-area'},counter,caption),el('div',{class:'player-controls'},previous,play,pause,button('Replay',()=>{seek(0);void video.play().catch(()=>{});},'secondary'),next),read,notice,transcript);
 update();return {element:panel,dispose(){disposed=true;video.pause();if(voiceEnabled)speech?.cancel();}};
}
