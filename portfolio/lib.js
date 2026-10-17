/** Synthetic-only, dependency-free research demonstration functions. */
export const mean = a => a.length ? a.reduce((s,x)=>s+x,0)/a.length : NaN;
export const round = (x,d=2) => Number(x.toFixed(d));
export const logistic = x => x >= 0 ? 1/(1+Math.exp(-x)) : Math.exp(x)/(1+Math.exp(x));
export function seeded(seed=54123) { let x=seed>>>0; return ()=>{x=(Math.imul(1664525,x)+1013904223)>>>0;return x/4294967296;}; }
export function priorGrid(){ const theta=Array.from({length:101},(_,i)=>-7500+i*150);return {theta,w:theta.map(()=>1/theta.length)};}
export function probability(theta,cost,scale=1800){return logistic((theta-cost)/scale);}
export function bayesUpdate(posterior,cost,satellite){let raw=posterior.theta.map((t,i)=>posterior.w[i]*(satellite?probability(t,cost):1-probability(t,cost)));let z=raw.reduce((a,b)=>a+b,0);if(!(z>0)) throw Error('Invalid posterior');return {theta:posterior.theta,w:raw.map(x=>x/z)};}
export function weightedQuantile(p,q){let total=0;for(let i=0;i<p.theta.length;i++){total+=p.w[i];if(total>=q)return p.theta[i];}return p.theta.at(-1);}
export function summary(p){return {mean:meanWeighted(p),lower:weightedQuantile(p,.05),upper:weightedQuantile(p,.95),satProb:p.w.reduce((s,w,i)=>s+w*probability(p.theta[i],0),0)};}
export function meanWeighted(p){return p.theta.reduce((s,t,i)=>s+t*p.w[i],0);}
export function entropy(weights){return -weights.reduce((s,w)=>s+(w>0?w*Math.log(w):0),0);}
export const CHOICE_COSTS=[-6000,-4500,-3000,-2000,-1000,0,1000,2000,3000,4500,6000];
export function informationGain(p,cost){let pi=p.theta.map(t=>probability(t,cost));let p1=pi.reduce((s,x,i)=>s+x*p.w[i],0);let w1=p.w.map((w,i)=>w*pi[i]/p1),w0=p.w.map((w,i)=>w*(1-pi[i])/(1-p1));return entropy(p.w)-(p1*entropy(w1)+(1-p1)*entropy(w0));}
export function nextCost(p,used=[]){return CHOICE_COSTS.filter(c=>!used.includes(c)).sort((a,b)=>informationGain(p,b)-informationGain(p,a))[0]??0;}
export function runAdaptiveBenchmark(seed=20261017,n=60,questions=6){const rnd=seeded(seed);let adaptive=[],fixed=[];for(let k=0;k<n;k++){let trueTheta=-6000+12000*rnd();let pairedDraws=Array.from({length:questions},()=>rnd());for(let method of ['adaptive','fixed']){let p=priorGrid(),used=[];for(let j=0;j<questions;j++){let cost=method==='adaptive'?nextCost(p,used):CHOICE_COSTS[[5,1,9,3,7,0][j%6]];used.push(cost);let choice=pairedDraws[j]<probability(trueTheta,cost);p=bayesUpdate(p,cost,choice);} (method==='adaptive'?adaptive:fixed).push(Math.abs(meanWeighted(p)-trueTheta));}}return {adaptive:mean(adaptive),fixed:mean(fixed),n,questions,seed};}
export function syntheticProperties(seed=72,n=120){const rnd=seeded(seed);return Array.from({length:n},(_,i)=>{let low=i<n/2;let actual=60+Math.floor(rnd()*90)+(low?0:100);let benchmark=actual*45000;let legacy=actual*(low?.84:1.16)+(rnd()-.5)*45;let remote=actual*(1+(rnd()-.5)*.12);return {id:`S${String(i+1).padStart(3,'0')}`,group:low?'Lower-value':'Higher-value',actual,benchmark,legacy:Math.max(1,legacy)*45000,remote:Math.max(1,remote)*45000};});}
export function taxBill(value,exemption=5e6,rate=.008){return Math.max(0,value-exemption)*rate;}
export function measureProperty(p,exemption=5e6,rate=.008){const mae=x=>mean(p.map(r=>Math.abs(r[x]-r.benchmark)));let low=p.filter(r=>r.group==='Lower-value'),hi=p.filter(r=>r.group==='Higher-value');return {oldMae:mae('legacy'),newMae:mae('remote'),oldTax:mean(p.map(r=>taxBill(r.legacy,exemption,rate))),newTax:mean(p.map(r=>taxBill(r.remote,exemption,rate))),benchmarkTax:mean(p.map(r=>taxBill(r.benchmark,exemption,rate))),lowError:mean(low.map(r=>r.remote-r.benchmark)),highError:mean(hi.map(r=>r.remote-r.benchmark))};}
export const AUDIT_BASE=[
 {pin:'A101',circle:'North',land:100,owner:'Yes',tax:14000},
 {pin:'A102',circle:'North',land:80,owner:'Yes',tax:8000},
 {pin:'A103',circle:'North',land:95,owner:'No',tax:10000},
 {pin:'A104',circle:'South',land:130,owner:'Yes',tax:22000},
 {pin:'A105',circle:'South',land:120,owner:'No',tax:16000},
 {pin:'A106',circle:'South',land:110,owner:'Yes',tax:18000}
];
export const AUDIT_SURVEY=[
 {pin:'A101',circle:'North',land:101,respondent:'R1'},
 {pin:'A102',circle:'North',land:82,respondent:'R2'},
 {pin:'A102',circle:'North',land:82,respondent:'R2-DUP'},
 {pin:'A103',circle:'South',land:97,respondent:'R3'},
 {pin:'A104',circle:'South',land:-12,respondent:'R4'},
 {pin:'A105',circle:'South',land:null,respondent:'R5'},
 {pin:'A999',circle:'North',land:73,respondent:'R6'}
];
export function auditData(admin=AUDIT_BASE,survey=AUDIT_SURVEY){let byPin=new Map(admin.map(x=>[x.pin,x])),freq=new Map;for(let r of survey)freq.set(r.pin,(freq.get(r.pin)||0)+1);let issues=[];for(let r of survey){if(freq.get(r.pin)>1)issues.push({pin:r.pin,kind:'Duplicate linkage key',detail:r.respondent});let a=byPin.get(r.pin);if(!a)issues.push({pin:r.pin,kind:'Unmatched survey record',detail:'No admin PIN'});if(a&&a.circle!==r.circle)issues.push({pin:r.pin,kind:'Stratum mismatch',detail:`${r.circle} vs ${a.circle}`});if(r.land==null)issues.push({pin:r.pin,kind:'Missing measurement',detail:'Survey land area'});else if(r.land<=0)issues.push({pin:r.pin,kind:'Invalid measurement',detail:String(r.land)});}let seen=new Set(survey.map(r=>r.pin));for(let r of admin)if(!seen.has(r.pin))issues.push({pin:r.pin,kind:'Unmatched admin record',detail:'Not observed in survey'});return issues;}
export function evaluateReview(marked){let expected=['arithmetic','dependencies','denominator','conflict'];return {correct:expected.filter(x=>marked.includes(x)).length,missed:expected.filter(x=>!marked.includes(x)),falsePositives:marked.filter(x=>!expected.includes(x))};}
export function roi({n,cost,benefit,attribution,otherCosts=0}){const investment=cost+otherCosts;const gross=n*benefit*attribution;return {gross,investment,net:gross-investment,roi:investment>0?(gross-investment)/investment:NaN,breakEven: n*attribution>0?investment/(n*attribution):Infinity};}
export function incidence(households,rate=.008,threshold=5e6,passThrough=0){return households.map(h=>{let statutory=taxBill(h.propertyValue,threshold,rate);return {...h,statutory,ownerBurden:statutory*(1-passThrough),tenantBurden:statutory*passThrough,effective:statutory/h.income};});}
export function sampleHouseholds(seed=91){let rand=seeded(seed);return Array.from({length:100},(_,i)=>{let quintile=Math.floor(i/20)+1;return {id:`H${i+1}`,quintile,income:(300000+quintile*420000)*(0.75+rand()*.5),propertyValue:(800000+quintile*2200000)*(0.8+rand()*.4)};});}
export function groupedIncidence(rows){return Array.from({length:5},(_,i)=>{let subset=rows.filter(x=>x.quintile===i+1);return {quintile:i+1,meanTax:mean(subset.map(x=>x.statutory)),burden:mean(subset.map(x=>x.effective))*100,owner:mean(subset.map(x=>x.ownerBurden)),tenant:mean(subset.map(x=>x.tenantBurden))};});}
