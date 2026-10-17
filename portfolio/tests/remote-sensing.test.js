import test from 'node:test';
import assert from 'node:assert/strict';
import {areaPixels,validatePolygon,metersPerPixel,measureRemote,SAMPLE_ANNOTATION,syntheticOverheadSvg,distancePixels} from '../rs-measure.js';
const sq=(n)=>[{x:0,y:0},{x:n,y:0},{x:n,y:n},{x:0,y:n}];
test('shoelace area invariant to clockwise/counterclockwise vertex order',()=>{
  assert.equal(areaPixels(sq(20)),400);assert.equal(areaPixels([...sq(20)].reverse()),400);
  assert.equal(areaPixels([{x:0,y:0},{x:10,y:0},{x:0,y:10}]),50);
});
test('self-crossing polygon rejected',()=>{
  const bow=[{x:1,y:1},{x:31,y:31},{x:1,y:31},{x:31,y:1}];
  assert.throws(()=>validatePolygon(bow),/small|crosses/);
  const crossing=[{x:1,y:1},{x:50,y:1},{x:10,y:40},{x:40,y:40},{x:1,y:25}];
  assert.throws(()=>validatePolygon(crossing),/crosses/);
});
test('degenerate and non-finite geometry rejected',()=>{
  assert.throws(()=>validatePolygon([{x:0,y:0},{x:1,y:1}]),/at least three/);
  assert.throws(()=>validatePolygon([{x:0,y:0},{x:1,y:0},{x:0,y:1}]),/too small/);
  assert.throws(()=>validatePolygon([{x:0,y:0},{x:10,y:0},{x:NaN,y:10}]),/Invalid/);
  assert.throws(()=>metersPerPixel({x:0,y:0},{x:1,y:1},20),/at least ten/);
});
test('reference segment correctly calibrates meters per image pixel',()=>{
  assert.equal(distancePixels({x:3,y:4},{x:3,y:104}),100);
  assert.equal(metersPerPixel({x:0,y:0},{x:100,y:0},20),.2);
  assert.throws(()=>metersPerPixel({x:0,y:0},{x:100,y:0},0),/reference length/);
});
test('synthetic calibrated land and covered footprint agree with exact geometry',()=>{
  const m=measureRemote(SAMPLE_ANNOTATION);
  assert.ok(Math.abs(m.metersPerPx-1/30)<1e-12);
  assert.ok(Math.abs(m.parcelSqm-160)<1e-10);
  assert.ok(Math.abs(m.roofSqm-45500/900)<1e-10);
  assert.ok(Math.abs(m.coveredSqm-45500/300)<1e-10);
  assert.ok(m.landSqft>1700&&m.landSqft<1800);
  assert.ok(m.coveredSqft>1600&&m.coveredSqft<1700);
});
test('floor factor and stories are separately applied',()=>{
  const m=measureRemote({...SAMPLE_ANNOTATION,floors:2,usableFraction:.8});
  assert.ok(Math.abs(m.coveredSqm-m.roofSqm*1.6)<1e-9);
  assert.ok(m.flags.some(f=>f.includes('floor')));
});
test('roof larger than parcel rejected',()=>{
  assert.throws(()=>measureRemote({...SAMPLE_ANNOTATION,roof:[{x:1,y:1},{x:850,y:1},{x:850,y:550},{x:1,y:550}]}),/roof polygon/);
});
test('invalid floor parameters rejected instead of hidden silent correction',()=>{
  assert.throws(()=>measureRemote({...SAMPLE_ANNOTATION,floors:2.5}),/integer/);
  assert.throws(()=>measureRemote({...SAMPLE_ANNOTATION,usableFraction:1.5}),/factor/);
});
test('synthetic overhead scene is labeled fictional rather than satellite data',()=>{
  const svg=syntheticOverheadSvg();assert.ok(svg.includes('FICTIONAL OVERHEAD SCENE'));
});

import {syntheticSales,trainValuation,predictValue} from '../valuation-model.js';
test('measured satellite features feed an independently trained prediction engine',()=>{
  const measurements=measureRemote(SAMPLE_ANNOTATION),sales=syntheticSales(47,240),model=trainValuation(sales,{seed:2026,tau:.12});
  const p=predictValue(model,{neighborhood:'Sector A',land_area_sqft:Math.round(measurements.landSqft),covered_area_sqft:Math.round(measurements.coveredSqft)});
  assert.ok(Number.isFinite(p.estimate)&&p.estimate>0);
});
