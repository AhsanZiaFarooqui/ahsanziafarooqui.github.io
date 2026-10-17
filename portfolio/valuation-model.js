/**
 * Property Valuation Lab: demonstrator, not a professional appraisal.
 * Random forest regression on log sale prices with Bayesian partial pooling
 * of out-of-sample neighborhood residuals. No external dependencies or network.
 */
import { seeded, mean } from './lib.js';

const REQUIRED = ['land_area_sqft','covered_area_sqft','neighborhood','sale_price_pkr'];
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
const variance=a=>a.length>1?mean(a.map(x=>(x-mean(a))**2)):0;
const med=a=>{const s=[...a].sort((x,y)=>x-y),n=s.length;return n%2?s[(n-1)/2]:(s[n/2-1]+s[n/2])/2};
export function normal(rng){let u=Math.max(rng(),1e-12);return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*rng());}
export function syntheticSales(seed=47,n=240){
  const rnd=seeded(seed),neighborhoods=['Sector A','Sector B','Sector C','Sector D'],premiums=[0.76,1.02,1.26,1.55];
  return Array.from({length:n},(_,i)=>{
    let ni=i%4,land=Math.round(650+2550*rnd()),floors=.65+1.1*rnd(),covered=Math.round(land*floors),noise=.09*normal(rnd);
    let logPrice=Math.log(12800000)+.67*Math.log(land/1500)+.31*Math.log(covered/1500)+Math.log(premiums[ni])+noise+.065*Math.sin(land/500);
    return {property_id:`S${String(i+1).padStart(5,'0')}`,land_area_sqft:land,covered_area_sqft:covered,neighborhood:neighborhoods[ni],sale_price_pkr:Math.round(Math.exp(logPrice)/1000)*1000};
  });
}
export function parseCsv(text){
  let rows=[],current=[],cell='',quoted=false;
  const input=String(text).replace(/^\uFEFF/,'');
  for(let i=0;i<input.length;i++){
    const c=input[i];
    if(quoted){if(c==='"'&&input[i+1]==='"'){cell+='"';i++;}else if(c==='"'){quoted=false;}else{cell+=c;}}
    else if(c==='"'){if(cell.trim()!=='')throw Error('Invalid CSV quoting');quoted=true;}
    else if(c===','){current.push(cell.trim());cell='';}
    else if(c==='\n'||c==='\r'){if(c==='\r'&&input[i+1]==='\n')i++;current.push(cell.trim());if(current.some(x=>x!==''))rows.push(current);current=[];cell='';}
    else{cell+=c;}
  }
  if(quoted)throw Error('Unclosed CSV quotation');current.push(cell.trim());if(current.some(x=>x!==''))rows.push(current);
  if(!rows.length)throw Error('CSV has no header');
  const header=rows.shift().map(x=>x.toLowerCase().replace(/\s+/g,'_'));
  if(new Set(header).size!==header.length)throw Error('Duplicate CSV headers');
  for(const field of REQUIRED)if(!header.includes(field))throw Error('Missing required CSV column: '+field);
  return rows.map((vals,index)=>{if(vals.length!==header.length)throw Error(`CSV row ${index+2} has ${vals.length} fields, expected ${header.length}`);const r={};header.forEach((h,i)=>r[h]=vals[i]);return r;});
}
export function validateSales(rows){
  if(!Array.isArray(rows)||rows.length<80)throw Error('Supply at least 80 comparable sales to permit separate training, calibration and test samples.');
  if(rows.length>1500)throw Error('Browser demo supports at most 1,500 sales. Use a separate analytical pipeline for larger datasets.');
  const seen=new Set(),counts=new Map(),data=[];
  for(const [i,r] of rows.entries()){
    const land=Number(r.land_area_sqft),covered=Number(r.covered_area_sqft),price=Number(r.sale_price_pkr),neighborhood=String(r.neighborhood??'').trim();
    if(!Number.isFinite(land)||land<100||land>1e6)throw Error(`Row ${i+1}: land_area_sqft must be 100–1,000,000.`);
    if(!Number.isFinite(covered)||covered<100||covered>2e6)throw Error(`Row ${i+1}: covered_area_sqft must be 100–2,000,000.`);
    if(!Number.isFinite(price)||price<1e5||price>1e12)throw Error(`Row ${i+1}: sale_price_pkr must be 100,000–1,000,000,000,000.`);
    if(!neighborhood||neighborhood.length>80)throw Error(`Row ${i+1}: neighborhood is missing or too long.`);
    const id=String(r.property_id??'').trim();
    if(id.length>80)throw Error(`Row ${i+1}: property_id exceeds 80 characters.`);
    // Repeated property identifiers are rejected; same-size distinct properties are not duplicates.
    const key=id?`id:${id}`:`exact:${neighborhood.toLowerCase()}|${land}|${covered}|${price}`;
    if(seen.has(key))throw Error(`Row ${i+1}: duplicate property identifier or exactly repeated observation. Remove repeated sales of the same property to avoid holdout leakage.`);
    seen.add(key);counts.set(neighborhood,(counts.get(neighborhood)||0)+1);data.push({property_id:id||undefined,land_area_sqft:land,covered_area_sqft:covered,neighborhood,sale_price_pkr:price});
  }
  if(counts.size<2||counts.size>20)throw Error('Use 2–20 neighborhoods; this demo does not support just one or dozens of tiny groups.');
  for(const [name,count] of counts)if(count<12)throw Error(`Neighborhood ${name} has ${count} sales; minimum is 12 for stratified evaluation.`);
  return data;
}
export function stratifiedSplit(data,seed=2026){
  const rnd=seeded(seed),groups=new Map();for(const r of data){if(!groups.has(r.neighborhood))groups.set(r.neighborhood,[]);groups.get(r.neighborhood).push(r);}
  const train=[],calibration=[],test=[];
  for(const group of groups.values()){
    const a=[...group];for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
    const t=Math.floor(a.length*.65),c=Math.floor(a.length*.175);
    train.push(...a.slice(0,t));calibration.push(...a.slice(t,t+c));test.push(...a.slice(t+c));
  }
  return {train,calibration,test};
}
function splitRule(rows,feature,rnd){
  if(feature==='neighborhood')return [...new Set(rows.map(r=>r.neighborhood))].map(value=>({feature,value,category:true}));
  const sample=Array.from({length:Math.min(rows.length,30)},()=>rows[Math.floor(rnd()*rows.length)][feature]).sort((a,b)=>a-b);
  const values=new Set();for(let j=1;j<10;j++){const v=sample[Math.floor(j*sample.length/10)];if(Number.isFinite(v))values.add(v);}
  return [...values].map(value=>({feature,value,category:false}));
}
function leftOf(r,rule){return rule.category?r.neighborhood===rule.value:r[rule.feature]<=rule.value;}
function grow(rows,rnd,depth,maxDepth,minLeaf){
  const y=rows.map(r=>Math.log(r.sale_price_pkr)),mu=mean(y);
  if(rows.length<minLeaf*2||depth>=maxDepth||variance(y)<1e-7)return {value:mu};
  let best=null,bestLoss=Infinity;
  const features=['land_area_sqft','covered_area_sqft','neighborhood'];
  // Random feature subspace per split: two of three attributes.
  const omit=Math.floor(rnd()*3);
  for(let k=0;k<3;k++){
    if(k===omit)continue;
    for(const rule of splitRule(rows,features[k],rnd)){
      let nl=0,nr=0,sl=0,sr=0,sql=0,sqr=0;
      for(const r of rows){const v=Math.log(r.sale_price_pkr);if(leftOf(r,rule)){nl++;sl+=v;sql+=v*v;}else{nr++;sr+=v;sqr+=v*v;}}
      if(nl<minLeaf||nr<minLeaf)continue;
      const loss=Math.max(0,sql-sl*sl/nl)+Math.max(0,sqr-sr*sr/nr);
      if(loss<bestLoss){bestLoss=loss;best=rule;}
    }
  }
  if(!best)return {value:mu};
  const l=[],r=[];for(const row of rows)(leftOf(row,best)?l:r).push(row);
  return {rule:best,left:grow(l,rnd,depth+1,maxDepth,minLeaf),right:grow(r,rnd,depth+1,maxDepth,minLeaf)};
}
function treePredict(tree,row){let cur=tree;while(cur.rule)cur=leftOf(row,cur.rule)?cur.left:cur.right;return cur.value;}
export function trainForest(rows,{seed=77,trees=48,maxDepth=8,minLeaf=5}={}){
  if(rows.length<40)throw Error('Not enough training observations');
  const rnd=seeded(seed),forest=[];
  for(let i=0;i<trees;i++){
    const boot=Array.from({length:rows.length},()=>rows[Math.floor(rnd()*rows.length)]);
    forest.push(grow(boot,rnd,0,maxDepth,minLeaf));
  }
  return forest;
}
export function predictLog(forest,row){return mean(forest.map(tree=>treePredict(tree,row)));}
function calibrate(forest,calibration,tau){
  const residuals=calibration.map(r=>Math.log(r.sale_price_pkr)-predictLog(forest,r));
  const sigma2=Math.max(variance(residuals),.035**2);const byNeighborhood=new Map();
  for(let i=0;i<calibration.length;i++){const n=calibration[i].neighborhood;if(!byNeighborhood.has(n))byNeighborhood.set(n,[]);byNeighborhood.get(n).push(residuals[i]);}
  const effects=new Map();
  for(const [n,arr] of byNeighborhood){const postVar=1/(1/(tau*tau)+arr.length/sigma2);effects.set(n,{mean:postVar*arr.reduce((s,x)=>s+x,0)/sigma2,variance:postVar,n:arr.length});}
  return {effects,sigma2,tau,method:'Gaussian neighborhood residual shrinkage; random forest held fixed'};
}
export function predictValue(model,row){
  if(!model.neighborhoods.includes(row.neighborhood))throw Error('Unseen neighborhood. Supply comparables and retrain.');
  if(!(row.land_area_sqft>=100)||!(row.covered_area_sqft>=100))throw Error('Enter positive areas in square feet.');
  const baseLog=predictLog(model.forest,row),adjustment=model.calibration.effects.get(row.neighborhood)||{mean:0,variance:model.calibration.tau**2,n:0};
  const m=baseLog+adjustment.mean,sd=Math.sqrt(model.calibration.sigma2+adjustment.variance);
  return {estimate:Math.exp(m),lower:Math.exp(m-1.645*sd),upper:Math.exp(m+1.645*sd),forestOnly:Math.exp(baseLog),neighborhoodShiftPct:(Math.exp(adjustment.mean)-1)*100,posteriorSD:Math.sqrt(adjustment.variance),calibrationN:adjustment.n};
}
export function trainValuation(rows,{seed=2026,tau=.12}={}){
  const data=validateSales(rows);
  if(!Number.isInteger(seed)||seed<1||seed>9999999)throw Error('Seed must be an integer between 1 and 9,999,999');
  if(!Number.isFinite(tau)||tau<.02||tau>.40)throw Error('Prior SD (log points) must be 0.02–0.40');
  const split=stratifiedSplit(data,seed),forest=trainForest(split.train,{seed:seed+19});
  const calibration=calibrate(forest,split.calibration,tau),neighborhoods=[...new Set(data.map(r=>r.neighborhood))].sort();
  const model={forest,calibration,neighborhoods,split,seed};
  let abs=[],absForest=[],pct=[],inside=0;
  for(const r of split.test){const p=predictValue(model,r);abs.push(Math.abs(p.estimate-r.sale_price_pkr));absForest.push(Math.abs(p.forestOnly-r.sale_price_pkr));pct.push(Math.abs(p.estimate-r.sale_price_pkr)/r.sale_price_pkr);if(r.sale_price_pkr>=p.lower&&r.sale_price_pkr<=p.upper)inside++;}
  const n=split.test.length;model.diagnostics={train:split.train.length,calibration:split.calibration.length,test:n,mae:mean(abs),forestMae:mean(absForest),mape:100*mean(pct),coverage:inside/n,inside,nominalCoverage:.90};
  model.bounds=new Map(neighborhoods.map(n=>{const rows=data.filter(r=>r.neighborhood===n);return [n,{landMin:Math.min(...rows.map(x=>x.land_area_sqft)),landMax:Math.max(...rows.map(x=>x.land_area_sqft)),coveredMin:Math.min(...rows.map(x=>x.covered_area_sqft)),coveredMax:Math.max(...rows.map(x=>x.covered_area_sqft)),n:rows.length}];}));
  model.comparables=data;
  return model;
}
export function comparableSales(model,row,n=5){
  const b=model.bounds.get(row.neighborhood),ls=Math.max(1,b.landMax-b.landMin),cs=Math.max(1,b.coveredMax-b.coveredMin);
  return model.comparables.filter(x=>x.neighborhood===row.neighborhood).map(x=>({row:x,distance:Math.hypot((x.land_area_sqft-row.land_area_sqft)/ls,(x.covered_area_sqft-row.covered_area_sqft)/cs)})).sort((a,b)=>a.distance-b.distance).slice(0,n).map(x=>x.row);
}
