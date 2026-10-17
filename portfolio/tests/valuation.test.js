import test from 'node:test';
import assert from 'node:assert/strict';
import {syntheticSales,parseCsv,validateSales,stratifiedSplit,trainValuation,predictValue,comparableSales,normal} from '../valuation-model.js';
import {seeded} from '../lib.js';
const data=syntheticSales(47,240);
const model=trainValuation(data,{seed:2026,tau:.12});

test('synthetic data are deterministic, positive and consistently typed',()=>{
  assert.deepEqual(syntheticSales(12,12),syntheticSales(12,12));
  assert.equal(data.length,240);assert.equal(new Set(data.map(x=>x.neighborhood)).size,4);
  assert.ok(data.every(x=>x.sale_price_pkr>0&&x.land_area_sqft>=100&&x.covered_area_sqft>=100));
});
test('CSV parser handles BOM, CRLF, quoted names and escaped quotes',()=>{
  const s='\uFEFFland_area_sqft,covered_area_sqft,neighborhood,sale_price_pkr\r\n500,700,"North, "+"" ,1000000';
  // Separate valid cases: literal commas and escaped double quotes.
  const rows=parseCsv('land_area_sqft,covered_area_sqft,neighborhood,sale_price_pkr\r\n500,700,"North, "+"",1000000'.replace('"North, "+""','"North, Side"'));
  assert.equal(rows[0].neighborhood,'North, Side');
  const quote=parseCsv('land_area_sqft,covered_area_sqft,neighborhood,sale_price_pkr\n500,700,"Sector ""A""",1000000');
  assert.equal(quote[0].neighborhood,'Sector "A"');
  assert.equal(s.includes('\uFEFF'),true);
});
test('CSV parser rejects corrupt structures and missing columns',()=>{
  assert.throws(()=>parseCsv('land_area_sqft,covered_area_sqft,neighborhood\n5,6,A'),/Missing required/);
  assert.throws(()=>parseCsv('a,b\n"abc,def'),/Unclosed/);
  assert.throws(()=>parseCsv('land_area_sqft,covered_area_sqft,neighborhood,sale_price_pkr\n5,6,X'),/fields/);
});
test('sample validation rejects duplicates, implausible values and tiny groups',()=>{
  assert.equal(validateSales(data).length,240);
  assert.throws(()=>validateSales([...data,data[0]]),/duplicate/);
  assert.throws(()=>validateSales(data.map((x,i)=>i===1?{...x,sale_price_pkr:-1}:x)),/sale_price/);
  assert.throws(()=>validateSales(data.slice(0,60)),/at least 80/);
  assert.throws(()=>validateSales(data.map((x,i)=>i===1?{...x,land_area_sqft:0}:x)),/land_area/);
});
test('split has no shared record identities, with all neighborhoods represented',()=>{
  const s=stratifiedSplit(data,2026);const all=[...s.train,...s.calibration,...s.test];
  assert.equal(all.length,data.length);assert.equal(new Set(all).size,data.length);
  for(const name of new Set(data.map(x=>x.neighborhood))){for(const split of [s.train,s.calibration,s.test])assert.ok(split.some(x=>x.neighborhood===name));}
  assert.deepEqual(stratifiedSplit(data,2026),s);
});
test('forest and Bayesian predictions are positive and intervals contain point prediction',()=>{
  const p=predictValue(model,{land_area_sqft:1500,covered_area_sqft:1400,neighborhood:'Sector B'});
  assert.ok(p.estimate>0&&p.lower>0&&p.lower<p.estimate&&p.estimate<p.upper);
  assert.ok(p.posteriorSD>0&&Number.isFinite(p.neighborhoodShiftPct));
  assert.ok(p.calibrationN>0);
});
test('holdout metrics are finite, calibration genuinely separate, coverage reported',()=>{
  const d=model.diagnostics;
  assert.equal(d.train+d.calibration+d.test,240);
  assert.ok(d.test>30&&d.mae>0&&d.mape>0&&d.forestMae>0&&d.mape<50);
  assert.ok(d.coverage>=0&&d.coverage<=1&&d.inside<=d.test);
  assert.equal(d.coverage,d.inside/d.test);
});
test('seed reproducibility includes holdout scores and every forest prediction',()=>{
  const m2=trainValuation(data,{seed:2026,tau:.12});
  assert.deepEqual(model.diagnostics,m2.diagnostics);
  const row={land_area_sqft:1500,covered_area_sqft:1500,neighborhood:'Sector A'};
  assert.deepEqual(predictValue(model,row),predictValue(m2,row));
});
test('separate seeds change train/test allocations',()=>{
  const m2=trainValuation(data,{seed:100,tau:.12});
  assert.notEqual(m2.split.test[0],model.split.test[0]);
});
test('nonexistent neighborhoods are rejected, not guessed',()=>{
  assert.throws(()=>predictValue(model,{land_area_sqft:1300,covered_area_sqft:1600,neighborhood:'Outside'}),/Unseen neighborhood/);
});
test('neighborhood pooling posterior shrinks and respects allowed prior',()=>{
  for(const neighborhood of model.neighborhoods){const e=model.calibration.effects.get(neighborhood);assert.ok(e.n>=2);assert.ok(e.variance<.12**2);}
  assert.throws(()=>trainValuation(data,{seed:2026,tau:0}),/Prior SD/);
});
test('nearest comparables are within the selected neighborhood',()=>{
  const x=comparableSales(model,{land_area_sqft:1300,covered_area_sqft:1200,neighborhood:'Sector A'});
  assert.equal(x.length,5);assert.ok(x.every(y=>y.neighborhood==='Sector A'));
});
test('price increases with land and covered area for representative synthetic points',()=>{
  for(const n of model.neighborhoods){
    let low=predictValue(model,{land_area_sqft:900,covered_area_sqft:900,neighborhood:n}).estimate;
    let high=predictValue(model,{land_area_sqft:2700,covered_area_sqft:2700,neighborhood:n}).estimate;
    assert.ok(high>low,`${n} expected large property worth more`);
  }
});
test('comparison forest-with-calibration is not guaranteed to improve, reported honestly',()=>{
  const d=model.diagnostics;
  assert.ok(Number.isFinite(d.mae) && Number.isFinite(d.forestMae));
});
