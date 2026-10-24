// Lossless combination of our single-track H264 MP4 and VLC-encoded AAC MP4.
// No codec data is changed. Unsupported containers fail instead of guessing.
import {Buffer} from 'node:buffer';
export function boxes(b,start=0,end=b.length){const list=[];for(let at=start;at<end;){let size=b.readUInt32BE(at),header=8;if(size===1){size=Number(b.readBigUInt64BE(at+8));header=16;}else if(size===0)size=end-at;if(size<header||at+size>end)throw Error('Invalid MP4 box');list.push({type:b.toString('ascii',at+4,at+8),at,size,data:at+header,end:at+size});at+=size;}return list;}
const one=(list,type)=>{const matches=list.filter(x=>x.type===type);if(matches.length!==1)throw Error(`Expected one ${type}`);return matches[0];};
const children=(b,parent)=>boxes(b,parent.data,parent.end);
const containers=new Set(['moov','trak','mdia','minf','stbl','edts']);
function walk(b,visitor,start=0,end=b.length){for(const box of boxes(b,start,end)){visitor(box);if(containers.has(box.type))walk(b,visitor,box.data,box.end);}}
function clockInfo(b,box){const v=b[box.data];if(v!==0)throw Error('Only version-0 movie timing is supported');return {scale:b.readUInt32BE(box.data+12),duration:b.readUInt32BE(box.data+16)};}
function boxBytes(b,box){return Buffer.from(b.subarray(box.at,box.end));}
function makeBox(type,parts){const payload=Buffer.concat(parts),head=Buffer.alloc(8);head.writeUInt32BE(payload.length+8);head.write(type,4,4,'ascii');return Buffer.concat([head,payload]);}
function verifiedVideoTrack(video,trak){
 const found=[];walk(video,box=>found.push(box),trak.at,trak.end);
 const stsz=one(found,'stsz'),stco=one(found,'stco'),stss=one(found,'stss');
 if(video.readUInt32BE(stco.data+4)!==1||video.readUInt32BE(stsz.data+4)!==0)throw Error('Expected one variable-size video chunk');
 const count=video.readUInt32BE(stsz.data+8),sync=[];let offset=video.readUInt32BE(stco.data+8);
 // VLC omitted the first sync marker in the initial exports. Derive all sync
 // samples from actual H264 IDR NALs rather than declaring an arbitrary frame safe.
 for(let i=0;i<count;i++){const length=video.readUInt32BE(stsz.data+12+i*4),end=offset+length;let at=offset,idr=false;while(at<end){if(at+4>end)throw Error('Truncated H264 length');const n=video.readUInt32BE(at);if(n<1||at+4+n>end)throw Error('Invalid H264 sample');if((video[at+4]&31)===5)idr=true;at+=4+n;}if(idr)sync.push(i+1);offset=end;}
 if(sync[0]!==1)throw Error('The movie must begin with a real H264 IDR frame');
 const payload=Buffer.alloc(8+sync.length*4);payload.writeUInt32BE(sync.length,4);sync.forEach((sample,i)=>payload.writeUInt32BE(sample,8+i*4));
 function rebuild(parent){return makeBox(parent.type,children(video,parent).map(box=>box.at===stss.at?makeBox('stss',[payload]):containers.has(box.type)?rebuild(box):boxBytes(video,box)));}
 return rebuild(trak);
}
export function inspectMp4(b){const top=boxes(b),moov=one(top,'moov'),movie=clockInfo(b,one(children(b,moov),'mvhd')),tracks=[];
 for(const trak of children(b,moov).filter(x=>x.type==='trak')){const mdia=one(children(b,trak),'mdia'),hdlr=one(children(b,mdia),'hdlr'),kind=b.toString('ascii',hdlr.data+8,hdlr.data+12),offsets=[];let count=0;
  walk(b,box=>{if(box.type==='stsz')count=b.readUInt32BE(box.data+8);if(box.type==='stco'){const n=b.readUInt32BE(box.data+4);for(let i=0;i<n;i++)offsets.push(b.readUInt32BE(box.data+8+i*4));}},trak.at,trak.end);
  tracks.push({kind,count,offsets});
 }return {seconds:movie.duration/movie.scale,tracks};
}
export function combineVideoAudio(video,audio){
 const vt=boxes(video),at=boxes(audio),vm=one(vt,'moov'),am=one(at,'moov'),vd=one(vt,'mdat'),ad=one(at,'mdat');
 if(inspectMp4(video).tracks.map(t=>t.kind).join()!=='vide'||inspectMp4(audio).tracks.map(t=>t.kind).join()!=='soun')throw Error('Expected a single video and a single audio track');
 const vc=children(video,vm),ac=children(audio,am),vClock=clockInfo(video,one(vc,'mvhd')),aClock=clockInfo(audio,one(ac,'mvhd'));
 const header=boxBytes(video,one(vc,'mvhd')),vTrack=verifiedVideoTrack(video,one(vc,'trak')),aTrack=boxBytes(audio,one(ac,'trak'));
 const headerBox=boxes(header)[0];header.writeUInt32BE(Math.max(vClock.duration,Math.ceil(aClock.duration/aClock.scale*vClock.scale)),headerBox.data+16);header.writeUInt32BE(3,header.length-4);
 walk(aTrack,box=>{if(box.type==='tkhd'){if(aTrack[box.data]!==0)throw Error('Unsupported track version');aTrack.writeUInt32BE(2,box.data+12);aTrack.writeUInt32BE(Math.round(aTrack.readUInt32BE(box.data+20)/aClock.scale*vClock.scale),box.data+20);}if(box.type==='elst'){if(aTrack[box.data]!==0)throw Error('Unsupported edit version');const n=aTrack.readUInt32BE(box.data+4);for(let i=0;i<n;i++){const at=box.data+8+i*12;aTrack.writeUInt32BE(Math.round(aTrack.readUInt32BE(at)/aClock.scale*vClock.scale),at);}}});
 const ftyp=boxBytes(video,one(vt,'ftyp'));let moov=makeBox('moov',[header,vTrack,aTrack]);
 const videoStart=ftyp.length+moov.length,audioStart=videoStart+vd.size;
 const move=(track,delta)=>walk(track,box=>{if(box.type==='co64')throw Error('64-bit chunk offsets are not supported');if(box.type==='stco'){const n=track.readUInt32BE(box.data+4);for(let i=0;i<n;i++){const at=box.data+8+i*4;track.writeUInt32BE(track.readUInt32BE(at)+delta,at);}}});
 move(vTrack,videoStart-vd.at);move(aTrack,audioStart-ad.at);moov=makeBox('moov',[header,vTrack,aTrack]);
 const combined=Buffer.concat([ftyp,moov,boxBytes(video,vd),boxBytes(audio,ad)]),report=inspectMp4(combined);
 for(const track of report.tracks){const start=track.kind==='vide'?videoStart:audioStart,end=start+(track.kind==='vide'?vd.size:ad.size);if(!track.count||track.offsets.some(offset=>offset<start+8||offset>=end))throw Error('Invalid combined media offsets');}
 return combined;
}
