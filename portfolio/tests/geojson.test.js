import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {measureGeoJSON} from '../geojson-measure.js';
const fixture=JSON.parse(readFileSync(new URL('../fixtures/synthetic-property.geojson',import.meta.url),'utf8'));
const oracle=JSON.parse(readFileSync(new URL('../fixtures/geojson-area-oracles.json',import.meta.url),'utf8'));
const fresh=()=>structuredClone(fixture);
const rect=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]];
function scene(parcel=rect(0,0,.001,.001),roof=rect(.0002,.0002,.0002,.0002)){
  return {type:'FeatureCollection',synthetic:true,features:[{type:'Feature',properties:{role:'parcel'},geometry:{type:'Polygon',coordinates:[parcel]}},{type:'Feature',properties:{role:'roof'},geometry:{type:'Polygon',coordinates:[roof]}}]};
}
function near(a,b,tolerance=1e-4){assert.ok(Math.abs(a-b)<=tolerance,`${a} != ${b} within ${tolerance}`);}
function changeRing(ring){const s=scene();s.features[0].geometry.coordinates=[ring];return s;}

test('fixture areas match independent analytic rectangle integrals, with exact SI-to-square-foot conversion',()=>{
  const result=measureGeoJSON(JSON.stringify(fixture));
  for(const [role,expected] of Object.entries(oracle.sceneAreasSqm)){
    near(result.measurements[role].sqm,expected);
    near(result.measurements[role].sqft,result.measurements[role].sqm/(.3048**2),1e-8);
  }
  assert.match(result.crs,/longitude, latitude/);assert.equal(result.synthetic,true);
  assert.equal('coveredSqm' in result,false);assert.equal('floors' in result,false);
});
test('ellipsoidal areas at equator, Lahore latitude and both high-latitude hemispheres',()=>{
  for(const {bounds:[w,s,e,n],areaSqm} of oracle.rectangles){
    const result=measureGeoJSON(scene(rect(w,s,e-w,n-s),rect(w+.0002,s+.0002,.0002,.0002)));
    near(result.measurements.parcel.sqm,areaSqm);
  }
  const equator=measureGeoJSON(scene()).measurements.parcel.sqm;
  const high=measureGeoJSON(scene(rect(0,70,.001,.001),rect(.0002,70.0002,.0002,.0002))).measurements.parcel.sqm;
  assert.ok(high/equator<.35&&high/equator>.34,'degree areas must vary with latitude');
});
test('holes subtract area and orientation reversal leaves measurements invariant',()=>{
  const s=scene();s.features[0].geometry.coordinates.push(rect(.0006,.0006,.0001,.0001));
  const result=measureGeoJSON(s),full=measureGeoJSON(scene()).measurements.parcel.sqm;
  const small=measureGeoJSON(scene(rect(.0006,.0006,.0001,.0001),rect(.00062,.00062,.00002,.00002))).measurements.parcel.sqm;
  near(result.measurements.parcel.sqm,full-small);
  for(const f of s.features)for(const r of f.geometry.coordinates)r.reverse();
  near(measureGeoJSON(s).measurements.parcel.sqm,result.measurements.parcel.sqm);
});
test('signed, absolute and percentage errors use the reference as denominator',()=>{
  const result=measureGeoJSON(fixture);
  near(result.errors.parcel.signedPercent,-6.25,1e-7);
  near(result.errors.roof.signedPercent,-100*2/17,1e-7);
  for(const e of Object.values(result.errors)){near(e.absoluteSqm,Math.abs(e.signedSqm));near(e.absolutePercent,100*e.absoluteSqm/e.referenceSqm);}
  const positive=fresh();[positive.features[0].geometry,positive.features[2].geometry]=[positive.features[2].geometry,positive.features[0].geometry];
  assert.ok(measureGeoJSON(positive).errors.parcel.signedSqm>0);
});
test('equal-area translated roof illustrates why area error is not segmentation validation',()=>{
  const s=scene(rect(0,0,.01,.01),rect(.001,.001,.001,.001));
  s.features.push({type:'Feature',properties:{role:'reference_roof'},geometry:{type:'Polygon',coordinates:[rect(.007,.001,.001,.001)]}});
  const result=measureGeoJSON(s);near(result.errors.roof.absoluteSqm,0,1e-4);
  assert.ok(result.warnings.some(w=>/does not establish positional overlap/.test(w)));
});
test('missing references produce no invented measurement errors',()=>{assert.deepEqual(measureGeoJSON(scene()).errors,{});});
test('RFC 7946 implicit CRS accepted; legacy CRS is rejected at every supported level',()=>{
  assert.ok(measureGeoJSON(scene()));
  for(const where of ['collection','feature','geometry'])for(const crs of [null,{type:'name',properties:{name:'EPSG:3857'}},{type:'name',properties:{name:'EPSG:4326'}}]){
    const s=scene(),obj=where==='collection'?s:where==='feature'?s.features[0]:s.features[0].geometry;obj.crs=crs;
    assert.throws(()=>measureGeoJSON(s),/Legacy\/custom CRS/);
  }
});
test('projected, malformed, extra-dimensional, out-of-range and non-finite positions fail',()=>{
  for(const p of [[500000,3500000],[181,31],[74,86],[NaN,31],[Infinity,31],['74',31],[74,31,0],null]){
    const s=scene();s.features[0].geometry.coordinates[0][1]=p;assert.throws(()=>measureGeoJSON(s),/finite 2D/);
  }
});
test('swapped coordinates cannot be inferred if numerically plausible; result states provenance limits',()=>{
  const s=fresh();for(const f of s.features)for(const r of f.geometry.coordinates)for(const p of r)p.reverse();
  const result=measureGeoJSON(s);assert.ok(result.warnings.some(w=>/truth of the coordinates/.test(w)));
});
test('unsupported, repeated or missing roles and non-synthetic inputs fail',()=>{
  for(const mutation of [s=>delete s.synthetic,s=>s.synthetic=false,s=>s.features[1].properties.role='parcel',s=>s.features[1].properties.role='building',s=>s.features[1].properties=null,s=>s.features[1].geometry=null,s=>s.features[1].geometry.type='MultiPolygon',s=>s.features[1].type='Polygon',s=>s.features.pop(),s=>s.type='Polygon']){
    const s=scene();mutation(s);assert.throws(()=>measureGeoJSON(s));
  }
  assert.throws(()=>measureGeoJSON('{'),/Invalid GeoJSON/);
  assert.throws(()=>measureGeoJSON(' '.repeat(262145)),/256 KiB/);
  const unicode=scene();unicode.description='測'.repeat(100000);assert.throws(()=>measureGeoJSON(JSON.stringify(unicode)),/256 KiB/);
});
test('open, degenerate and duplicate rings fail without silent repair',()=>{
  const open=rect(0,0,.001,.001);open.pop();assert.throws(()=>measureGeoJSON(changeRing(open)),/not closed/);
  assert.throws(()=>measureGeoJSON(changeRing([[0,0],[.001,0],[0,0]])),/four positions/);
  assert.throws(()=>measureGeoJSON(changeRing([[0,0],[.001,0],[.001,0],[0,.001],[0,0]])),/duplicate adjacent/);
  assert.throws(()=>measureGeoJSON(changeRing([[0,0],[.001,0],[.002,0],[0,0]])),/overlapping adjacent|self-intersection|0.01/);
  assert.throws(()=>measureGeoJSON(scene(rect(0,0,.00000001,.00000001),rect(.000000002,.000000002,.000000002,.000000002))),/0.01/);
});
test('bow-tie, nonzero-area self-crossing, repeated vertex and backtracking boundaries fail',()=>{
  const rings=[[[0,0],[.001,.001],[0,.001],[.001,0],[0,0]],[[0,0],[.002,.002],[0,.002],[.001,0],[0,0]],[[0,0],[.001,0],[.001,.001],[0,0],[0,.001],[0,0]],[[0,0],[.002,0],[.001,0],[.001,.001],[0,.001],[0,0]]];
  for(const r of rings)assert.throws(()=>measureGeoJSON(changeRing(r)),/self-intersection|overlapping/);
});
test('holes outside, touching, intersecting, overlapping or nested are rejected',()=>{
  const bad=[[rect(.002,.002,.001,.001)],[rect(0,.0006,.0001,.0001)],[rect(.0009,.0006,.0002,.0002)],[rect(.0005,.0005,.0003,.0003),rect(.0006,.0006,.0003,.0003)],[rect(.0005,.0005,.0004,.0004),rect(.0006,.0006,.0001,.0001)]];
  for(const holes of bad){const s=scene();s.features[0].geometry.coordinates.push(...holes);assert.throws(()=>measureGeoJSON(s),/hole/);}
});
test('roof cannot leave or touch parcel, cross its concavity, or cover a parcel hole',()=>{
  for(const roof of [rect(.002,0,.0002,.0002),rect(0,.0002,.0002,.0002),rect(.0009,.0002,.0002,.0002)])assert.throws(()=>measureGeoJSON(scene(undefined,roof)),/strictly within/);
  const s=scene(undefined,rect(.0002,.0002,.0005,.0005));s.features[0].geometry.coordinates.push(rect(.0004,.0004,.0001,.0001));assert.throws(()=>measureGeoJSON(s),/strictly within/);
  const concave=[[0,0],[.001,0],[.001,.001],[.0006,.001],[.0006,.0004],[.0004,.0004],[.0004,.001],[0,.001],[0,0]];
  assert.throws(()=>measureGeoJSON(scene(concave,rect(.0002,.0006,.0006,.0002))),/strictly within/);
});
test('valid concave polygon, negative longitudes and southern hemisphere are supported',()=>{
  const s=scene();s.features[0].geometry.coordinates=[[[0,0],[.001,0],[.001,.001],[.0005,.0007],[0,.001],[0,0]]];
  for(const f of s.features)for(const r of f.geometry.coordinates)for(const p of r){p[0]-=74;p[1]-=31;}
  assert.ok(measureGeoJSON(s).measurements.parcel.sqm>0);
});
test('extent, antimeridian and complexity caps fail explicitly',()=>{
  assert.throws(()=>measureGeoJSON(scene(rect(0,0,.11,.001))),/0.1 degree/);
  assert.throws(()=>measureGeoJSON(scene([[179.99,0],[-179.99,0],[-179.99,.001],[179.99,.001],[179.99,0]])),/antimeridian/);
  const s=scene();s.features[0].geometry.coordinates[0]=Array.from({length:501},()=>[0,0]);assert.throws(()=>measureGeoJSON(s),/500 positions/);
  const t=scene();t.features[0].geometry.coordinates=Array.from({length:11},()=>rect(0,0,.001,.001));assert.throws(()=>measureGeoJSON(t),/1–10 rings/);
});
test('reference geometries are subject to the same validity checks',()=>{
  const s=fresh();s.features[3].geometry.coordinates=[rect(74.31,31.51,.001,.001)];assert.throws(()=>measureGeoJSON(s),/Reference: roof/);
});

test('oblique edges near maximum scene extent match an independent surface-density integral',()=>{
  for(const {ring,areaSqm} of oracle.triangles){
    const result=measureGeoJSON(scene(ring,rect(12.001,31.501,.001,.001)));
    near(result.measurements.parcel.sqm,areaSqm,.001);
  }
});
test('roof holes and a parcel hole inside a roof hole are handled without filling voids',()=>{
  const s=scene(rect(0,0,.01,.01),rect(.001,.001,.008,.008));
  s.features[0].geometry.coordinates.push(rect(.004,.004,.001,.001));
  s.features[1].geometry.coordinates.push(rect(.003,.003,.003,.003));
  assert.ok(measureGeoJSON(s).measurements.roof.sqm>0);
});
test('collinear forward boundary vertices remain valid',()=>{
  const ring=[[0,0],[.0005,0],[.001,0],[.001,.001],[0,.001],[0,0]];
  near(measureGeoJSON(changeRing(ring)).measurements.parcel.sqm,measureGeoJSON(scene()).measurements.parcel.sqm);
});
