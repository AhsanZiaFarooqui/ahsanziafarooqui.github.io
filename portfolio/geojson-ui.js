import {measureGeoJSON} from './geojson-measure.js';
const $=id=>document.getElementById(id);
const fmt=n=>n.toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2});
const labels={parcel:'Parcel',roof:'Roof footprint',reference_parcel:'Reference parcel',reference_roof:'Reference roof'};
let ticket=0;
function clear(){ $('geo-results').hidden=true; $('geo-table').replaceChildren(); $('geo-errors').replaceChildren(); }
function status(message,bad=false){$('geo-status').textContent=message;$('geo-status').className=bad?'status error':'status';}
function row(target,values){const tr=document.createElement('tr');for(const value of values){const td=document.createElement('td');td.textContent=value;tr.append(td);}target.append(tr);}
function render(result){
  clear();
  for(const [role,m] of Object.entries(result.measurements))row($('geo-table'),[labels[role],fmt(m.sqm),fmt(m.sqft)]);
  for(const [role,e] of Object.entries(result.errors))row($('geo-errors'),[labels[role],fmt(e.signedSqm),fmt(e.absoluteSqm),fmt(e.signedPercent)+'%',fmt(e.absolutePercent)+'%']);
  $('geo-error-table').hidden=!Object.keys(result.errors).length;
  $('geo-reference-status').textContent=Object.keys(result.errors).length?'Comparison with supplied synthetic reference polygons only; their independence is not established. Errors = measurement minus reference.':'No reference polygons supplied; measurement errors cannot be calculated.';
  $('geo-method').textContent=result.crs+'. '+result.method+'.';
  $('geo-warnings').textContent=result.warnings.join(' ');
  const canvas=$('geo-preview'),ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);
  const [x0,y0,x1,y1]=result.bounds,sx=Math.cos((y0+y1)/2*Math.PI/180),w=(x1-x0)*sx,h=y1-y0,scale=Math.min((canvas.width-40)/w,(canvas.height-40)/h);
  const ox=(canvas.width-w*scale)/2,oy=(canvas.height-h*scale)/2;
  const colors={parcel:'#136c53',roof:'#9a5700',reference_parcel:'#405ab2',reference_roof:'#a32669'};
  for(const [role,rings] of Object.entries(result.geometries)){
    ctx.beginPath();for(const ring of rings){ring.forEach((p,i)=>{const x=ox+(p[0]-x0)*sx*scale,y=canvas.height-oy-(p[1]-y0)*scale;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.closePath();}
    ctx.strokeStyle=colors[role];ctx.fillStyle=colors[role]+'18';ctx.lineWidth=2;ctx.setLineDash(role.startsWith('reference_')?[6,4]:[]);ctx.fill('evenodd');ctx.stroke();
  }
  $('geo-results').hidden=false;
  status('Synthetic GeoJSON measured locally. Geometry and arithmetic checks passed; no ground-truth accuracy is established.');
}
async function load(source,isSample=false){
  const current=++ticket;clear();
  try{
    if(!isSample&&!$('geo-confirm').checked)throw Error('Confirm WGS84 longitude, latitude and fictional geometry before importing.');
    const text=await source();if(current!==ticket)return;
    const result=measureGeoJSON(text);render(result);
  }catch(e){if(current===ticket){clear();status(e.message,true);}}
}
$('geo-file').addEventListener('change',e=>{const file=e.target.files?.[0];if(!file)return;load(()=>{if(file.size>262144)throw Error('GeoJSON exceeds 256 KiB.');return file.text();});});
$('geo-confirm').addEventListener('change',()=>{++ticket;clear();$('geo-file').value='';status('Import confirmation changed. Select a synthetic GeoJSON file to measure.');});
$('geo-sample').addEventListener('click',()=>load(async()=>{const response=await fetch('fixtures/synthetic-property.geojson');if(!response.ok)throw Error('Cannot load synthetic fixture.');return response.text();},true));
