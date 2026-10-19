/** Bounded synthetic RFC 7946 measurement; no imagery, segmentation or valuation. */
import {SQFT_PER_SQM} from './rs-measure.js';
const A=6378137, F=1/298.257223563, E2=F*(2-F), E=Math.sqrt(E2), RAD=Math.PI/180;
const roles=['parcel','roof','reference_parcel','reference_roof'];
const fail=message=>{throw Error(message);};
const same=(a,b)=>a[0]===b[0]&&a[1]===b[1];
// Ellipsoidal authalic integral: d(q/2)/d(phi) = (1-e²)cos(phi)/(1-e²sin²(phi))².
function q(phi){const s=Math.sin(phi);return (1-E2)*(s/(1-E2*s*s)+Math.atanh(E*s)/E);}
function ringArea(ring){
  const origin=q(ring[0][1]*RAD);let integral=0;
  for(let i=1;i<ring.length;i++){
    const a=ring[i-1],b=ring[i],p=a[1]*RAD,d=(b[1]-a[1])*RAD;
    // Composite Simpson integrates the RFC's straight longitude/latitude edges.
    // Eight subintervals, limited to a 0.1-degree scene; subtract origin for stability.
    let sum=0;for(let j=0;j<=8;j++)sum+=(j===0||j===8?1:j%2?4:2)*(q(p+d*j/8)-origin);
    integral+=(b[0]-a[0])*RAD*sum/24;
  }
  return Math.abs(integral*A*A/2);
}
const area=rings=>ringArea(rings[0])-rings.slice(1).reduce((s,r)=>s+ringArea(r),0);
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const side=(a,b,c)=>Math.abs(cross(a,b,c))<=1e-8?0:Math.sign(cross(a,b,c));
const on=(a,b,p)=>side(a,b,p)===0&&p[0]>=Math.min(a[0],b[0])-1e-7&&p[0]<=Math.max(a[0],b[0])+1e-7&&p[1]>=Math.min(a[1],b[1])-1e-7&&p[1]<=Math.max(a[1],b[1])+1e-7;
function intersects(a,b,c,d){const s1=side(a,b,c),s2=side(a,b,d),s3=side(c,d,a),s4=side(c,d,b);return s1*s2<0&&s3*s4<0||on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b);}
function ringsIntersect(a,b){for(let i=1;i<a.length;i++)for(let j=1;j<b.length;j++)if(intersects(a[i-1],a[i],b[j-1],b[j]))return true;return false;}
// -1 boundary, 0 outside, 1 inside. All topology uses a local affine transform,
// preserving the RFC longitude/latitude straight-line intersection semantics.
function inside(p,ring){let yes=false;for(let i=1;i<ring.length;i++){const a=ring[i-1],b=ring[i];if(on(a,b,p))return -1;if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes?1:0;}
function inPolygon(p,rings){if(inside(p,rings[0])!==1)return false;return rings.slice(1).every(r=>inside(p,r)===0);}
function validateTopology(rings,label){
  for(const ring of rings){
    for(let i=1;i<ring.length;i++)if(Math.hypot(ring[i-1][0]-ring[i][0],ring[i-1][1]-ring[i][1])<1e-7)fail(`${label}: duplicate adjacent vertices.`);
    for(let i=1;i<ring.length;i++){
      const a=ring[i-1],b=ring[i];
      // Adjacent edges may share an endpoint, but must not backtrack/overlap.
      const c=ring[(i+1)%(ring.length-1)];if(side(a,b,c)===0&&(on(a,b,c)||on(b,c,a)))fail(`${label}: overlapping adjacent edges.`);
      for(let j=i+1;j<ring.length;j++){if(j===i+1||i===1&&j===ring.length-1)continue;if(intersects(a,b,ring[j-1],ring[j]))fail(`${label}: self-intersection or repeated boundary point.`);}
    }
  }
  for(let i=1;i<rings.length;i++){
    if(ringsIntersect(rings[0],rings[i])||inside(rings[i][0],rings[0])!==1)fail(`${label}: hole must be strictly inside the outer ring.`);
    for(let j=1;j<i;j++)if(ringsIntersect(rings[i],rings[j])||inside(rings[i][0],rings[j])!==0||inside(rings[j][0],rings[i])!==0)fail(`${label}: holes overlap, touch or nest.`);
  }
}
function contained(roof,parcel,label){
  if(!roof[0].slice(0,-1).every(p=>inPolygon(p,parcel))||roof.some(r=>parcel.some(p=>ringsIntersect(r,p)))||parcel.slice(1).some(r=>inPolygon(r[0],roof)))fail(`${label}: roof must lie strictly within the parcel, without crossing or touching its boundaries/holes.`);
}
function noLegacyCRS(obj){if(obj&&Object.hasOwn(obj,'crs'))fail('Legacy/custom CRS is unsupported. Reproject to RFC 7946 WGS84 longitude, latitude and remove the legacy crs member.');}
export function measureGeoJSON(input){
  if(typeof input==='string'){if(input.length>262144)fail('GeoJSON exceeds 256 KiB.');try{input=JSON.parse(input);}catch{fail('Invalid GeoJSON JSON text.');}}
  noLegacyCRS(input);
  if(input?.type!=='FeatureCollection'||!Array.isArray(input.features)||input.features.length<2||input.features.length>4)fail('Use a FeatureCollection with parcel, roof and optional reference_parcel/reference_roof Polygon features.');
  if(input.synthetic!==true)fail('This demonstration accepts only synthetic fixtures: set the collection synthetic member to true for fictional geometries.');
  const geometries={},all=[];
  for(const feature of input.features){
    noLegacyCRS(feature);noLegacyCRS(feature?.geometry);
    const role=feature?.properties?.role;
    if(feature?.type!=='Feature'||!roles.includes(role)||geometries[role])fail('Each feature needs a unique properties.role: parcel, roof, reference_parcel or reference_roof.');
    const g=feature.geometry;if(g?.type!=='Polygon'||!Array.isArray(g.coordinates)||g.coordinates.length<1||g.coordinates.length>10)fail(`${role}: only Polygon geometry with 1–10 rings is supported (no MultiPolygon).`);
    let count=0;
    for(const ring of g.coordinates){
      if(!Array.isArray(ring)||ring.length<4)fail(`${role}: closed rings require at least four positions.`);
      count+=ring.length;if(count>500)fail(`${role}: maximum 500 positions including ring closures.`);
      for(const p of ring){if(!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)||Math.abs(p[0])>180||Math.abs(p[1])>85)fail(`${role}: use finite 2D [longitude, latitude] degrees (longitude ±180, latitude ±85). Altitude/projected coordinates are unsupported.`);all.push(p);}
      if(!same(ring[0],ring.at(-1)))fail(`${role}: ring is not closed; first and last position must match.`);
    }
    geometries[role]=g.coordinates;
  }
  if(!geometries.parcel||!geometries.roof)fail('Both parcel and roof features are required.');
  const xs=all.map(p=>p[0]),ys=all.map(p=>p[1]);const bounds=[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];
  if(bounds[2]-bounds[0]>.1||bounds[3]-bounds[1]>.1)fail('Scene must span at most 0.1 degree per axis; antimeridian/polar or regional datasets are unsupported.');
  const x0=bounds[0],y0=bounds[1],scaleX=111320*Math.cos(y0*RAD);
  const topology=Object.fromEntries(Object.entries(geometries).map(([role,rings])=>[role,rings.map(r=>r.map(p=>[(p[0]-x0)*scaleX,(p[1]-y0)*111320]))]));
  const measurements={};
  for(const [role,rings] of Object.entries(geometries)){
    validateTopology(topology[role],role);
    if(rings.some(r=>ringArea(r)<.01))fail(`${role}: each ring must enclose at least 0.01 m².`);
    const sqm=area(rings);if(sqm<.01)fail(`${role}: polygon area must be at least 0.01 m² after holes.`);
    measurements[role]={sqm,sqft:sqm*SQFT_PER_SQM};
  }
  contained(topology.roof,topology.parcel,'Measurement');
  if(topology.reference_roof&&topology.reference_parcel)contained(topology.reference_roof,topology.reference_parcel,'Reference');
  const errors={};for(const role of ['parcel','roof'])if(measurements['reference_'+role]){
    const reference=measurements['reference_'+role].sqm,signed=measurements[role].sqm-reference;
    errors[role]={referenceSqm:reference,signedSqm:signed,absoluteSqm:Math.abs(signed),signedPercent:100*signed/reference,absolutePercent:100*Math.abs(signed)/reference};
  }
  return {crs:'OGC:CRS84 (RFC 7946 WGS84 longitude, latitude)',method:'WGS84 ellipsoidal surface area; longitude/latitude-linear edges, composite Simpson integration',synthetic:true,bounds,geometries,measurements,errors,warnings:[
    'Synthetic geometry checks only. CRS conventions and ranges are checked; the truth of the coordinates or synthetic declaration cannot be verified.',
    'Horizontal footprint only; terrain, roof slope, storeys and total covered floor area are not measured.',
    'Area agreement does not establish positional overlap or segmentation quality. Reference provenance and independence are not verified.',
    'No image georeferencing, orthorectification, automatic segmentation or independently validated valuation is performed.'
  ]};
}
