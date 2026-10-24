export function narrationSamples(scenes:{seconds:number}[],clips:Float32Array[],rate=22050){
 if(scenes.length!==clips.length)throw Error('Every scene needs a voice clip');
 const samples=new Float32Array(Math.round(scenes.reduce((n,s)=>n+s.seconds,0)*rate));let start=0,maxSpeed=1;
 for(let k=0;k<scenes.length;k++){
  const input=clips[k];if(!input.length||!input.some(x=>Math.abs(x)>.0001))throw Error('A voice clip is silent');
  const available=Math.floor((scenes[k].seconds-.5)*rate),length=Math.min(input.length,available),speed=input.length/length;
  if(speed>1.5)throw Error('A voice clip is too long for its scene');maxSpeed=Math.max(maxSpeed,speed);
  const offset=Math.round((start+.12)*rate);
  for(let i=0;i<length;i++){const at=i*speed,lo=Math.floor(at),hi=Math.min(input.length-1,lo+1);samples[offset+i]=input[lo]+(input[hi]-input[lo])*(at-lo);}
  start+=scenes[k].seconds;
 }
 return {samples,maxSpeed};
}
export function wavBytes(samples:Float32Array,rate=22050){
 const bytes=new Uint8Array(44+samples.length*2),v=new DataView(bytes.buffer);
 const str=(at:number,s:string)=>{for(let i=0;i<s.length;i++)bytes[at+i]=s.charCodeAt(i);};
 str(0,'RIFF');v.setUint32(4,bytes.length-8,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);str(36,'data');v.setUint32(40,samples.length*2,true);
 for(let i=0;i<samples.length;i++){const sample=Math.max(-1,Math.min(1,samples[i]));v.setInt16(44+i*2,Math.round(sample*(sample<0?32768:32767)),true);}
 return bytes;
}
