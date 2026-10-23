import {spawn} from 'node:child_process';
import {readdir,stat,unlink} from 'node:fs/promises';
import {resolve} from 'node:path';
const run=(file,args)=>new Promise((ok,no)=>{const p=spawn(file,args,{windowsHide:true,stdio:'inherit'});p.on('error',no);p.on('exit',code=>code?no(Error(`${file}: ${code}`)):ok());});
for(const file of await readdir('media-work/scripts')){
 const id=file.replace('.json','');if(process.argv[2]&&id!==process.argv[2])continue;
 const avi=resolve(`media-work/${id}.avi`),mp4=resolve(`public/videos/${id}.mp4`);
 await run(resolve('media-work/BrickMovie.exe'),[resolve(`media-work/scripts/${file}`),avi,resolve(`public/videos/${id}.png`)]);
 await run('C:/Program Files/VideoLAN/VLC/vlc.exe',['--intf','dummy','--no-one-instance','--no-audio','--no-video-title-show','--no-plugins-cache','--ignore-config','--no-media-library','--no-metadata-network-access','--verbose=1','--file-logging',`--logfile=${resolve(`media-work/${id}-encode.log`)}`,avi,'--sout',`#transcode{vcodec=h264,vb=650,fps=12,venc=x264{preset=ultrafast}}:std{access=file,mux=mp4,dst=${mp4}}`,'vlc://quit']);
 if((await stat(mp4)).size<10000)throw Error(`Video encoding failed: ${id}`);
 await unlink(avi);console.log(`Rendered ${id}`);
}
