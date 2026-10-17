/**
 * Remote-sensing measurement primitives for an intentionally human-in-the-loop
 * teaching demonstration. Coordinates are IMAGE PIXELS, not map coordinates.
 * Areas require externally calibrated meters/pixel. Not an automatic detector.
 */
export const SQFT_PER_SQM = 10.763910416709722;
export function distancePixels(a,b){
  if(![a?.x,a?.y,b?.x,b?.y].every(Number.isFinite))throw Error('Calibration points must have finite coordinates.');
  return Math.hypot(b.x-a.x,b.y-a.y);
}
export function signedAreaPixels(vertices){
  if(!Array.isArray(vertices)||vertices.length<3)return 0;
  if(vertices.some(p=>!Number.isFinite(p?.x)||!Number.isFinite(p?.y)))throw Error('Polygon has invalid coordinates.');
  let sum=0;
  for(let i=0;i<vertices.length;i++){
    const a=vertices[i],b=vertices[(i+1)%vertices.length];sum+=a.x*b.y-b.x*a.y;
  }
  return sum/2;
}
export const areaPixels=poly=>Math.abs(signedAreaPixels(poly));
function orientation(a,b,c){const x=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);return Math.abs(x)<1e-8?0:Math.sign(x);}
function onSegment(a,b,p){return p.x>=Math.min(a.x,b.x)-1e-8&&p.x<=Math.max(a.x,b.x)+1e-8&&p.y>=Math.min(a.y,b.y)-1e-8&&p.y<=Math.max(a.y,b.y)+1e-8;}
function intersects(a,b,c,d){
  const abC=orientation(a,b,c),abD=orientation(a,b,d),cdA=orientation(c,d,a),cdB=orientation(c,d,b);
  if(abC!==abD&&cdA!==cdB)return true;
  return (abC===0&&onSegment(a,b,c))||(abD===0&&onSegment(a,b,d))||(cdA===0&&onSegment(c,d,a))||(cdB===0&&onSegment(c,d,b));
}
export function validatePolygon(poly){
  if(!Array.isArray(poly)||poly.length<3)throw Error('Draw at least three vertices for each polygon.');
  if(poly.length>100)throw Error('Too many vertices; maximum is 100.');
  if(poly.some(p=>!Number.isFinite(p?.x)||!Number.isFinite(p?.y)||p.x<0||p.y<0))throw Error('Invalid polygon vertex.');
  if(areaPixels(poly)<20)throw Error('Polygon area is too small to measure reliably.');
  for(let i=0;i<poly.length;i++){
    let a=poly[i],b=poly[(i+1)%poly.length];
    if(distancePixels(a,b)<1)throw Error('Polygon contains overlapping or nearly identical adjacent vertices.');
    for(let j=i+1;j<poly.length;j++){
      if(j===i+1||(i===0&&j===poly.length-1))continue;
      let c=poly[j],d=poly[(j+1)%poly.length];
      if(intersects(a,b,c,d))throw Error('Polygon crosses itself. Redraw its boundary.');
    }
  }
  return true;
}
export function metersPerPixel(a,b,knownMeters){
  if(!Number.isFinite(knownMeters)||knownMeters<=0||knownMeters>5000)throw Error('Enter a positive, externally verified reference length in meters (maximum 5,000).');
  const length=distancePixels(a,b);
  if(length<10)throw Error('Reference segment must be at least ten pixels long.');
  return knownMeters/length;
}
export function measureRemote({parcel,roof,scalePoints,referenceMeters,floors=1,usableFraction=1}){
  validatePolygon(parcel);validatePolygon(roof);
  if(!Array.isArray(scalePoints)||scalePoints.length!==2)throw Error('Set two calibration endpoints first.');
  if(!Number.isInteger(floors)||floors<1||floors>20)throw Error('Number of floors must be an integer from 1 to 20.');
  if(!Number.isFinite(usableFraction)||usableFraction<0.5||usableFraction>1)throw Error('Floor area factor must be between 0.50 and 1.00.');
  const metersPerPx=metersPerPixel(scalePoints[0],scalePoints[1],referenceMeters),s=metersPerPx**2;
  const parcelSqm=areaPixels(parcel)*s,roofSqm=areaPixels(roof)*s;
  if(roofSqm>parcelSqm*1.1)throw Error('The roof polygon is larger than the parcel. Check tracing, scale and land boundaries.');
  const coveredSqm=roofSqm*floors*usableFraction;
  const flags=[];
  if(roofSqm>parcelSqm*.9)flags.push('Very high roof-to-parcel ratio; confirm the parcel and roof boundaries.');
  if(floors>1)flags.push('Total floor area assumes each floor is comparable to the traced roof footprint. Verify floors independently.');
  if(usableFraction!==1)flags.push('A floor-area adjustment factor was assumed rather than observed.');
  return {metersPerPx,parcelSqm,roofSqm,coveredSqm,landSqft:parcelSqm*SQFT_PER_SQM,roofSqft:roofSqm*SQFT_PER_SQM,coveredSqft:coveredSqm*SQFT_PER_SQM,roofToParcel:roofSqm/parcelSqm,flags};
}
export const SAMPLE_ANNOTATION=Object.freeze({
  scalePoints:[{x:100,y:75},{x:700,y:75}], referenceMeters:20,
  parcel:[{x:210,y:150},{x:660,y:150},{x:660,y:470},{x:210,y:470}],
  roof:[{x:310,y:230},{x:570,y:230},{x:570,y:405},{x:310,y:405}],
  floors:3,usableFraction:1
});
/** Fictional overhead graphic; never depict as satellite imagery. */
export function syntheticOverheadSvg(){return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600"><rect width="900" height="600" fill="#a7b79a"/><path d="M0 510H900V600H0Z" fill="#777d7d"/><path d="M0 555H900" stroke="#e7e6cb" stroke-width="3" stroke-dasharray="26 18"/><path d="M105 100H740V520H105Z" fill="#a9bb91" stroke="#668058" stroke-width="6"/><rect x="210" y="150" width="450" height="320" fill="#91ac77" stroke="#ddd8b5" stroke-width="7"/><path d="M310 230H570V405H310Z" fill="#a19e93" stroke="#555a60" stroke-width="6"/><path d="M310 315H570 M440 230V405" stroke="#cecebd" stroke-width="3"/><path d="M670 180H830V390H670Z" fill="#8f8e87" stroke="#ddddca" stroke-width="4"/><g fill="#527853"><circle cx="155" cy="200" r="29"/><circle cx="175" cy="410" r="33"/><circle cx="725" cy="425" r="27"/><circle cx="790" cy="180" r="35"/></g><path d="M100 75H700" stroke="#f7f1b6" stroke-width="3" stroke-dasharray="8 7"/><circle cx="100" cy="75" r="5" fill="#f7f1b6"/><circle cx="700" cy="75" r="5" fill="#f7f1b6"/><text x="400" y="63" fill="#222" text-anchor="middle" font-family="sans-serif" font-size="18">Reference length = 20 m (synthetic)</text><text x="450" y="585" fill="#fff" font-family="sans-serif" font-size="16" text-anchor="middle">FICTIONAL OVERHEAD SCENE — NOT SATELLITE IMAGERY</text></svg>`;}
