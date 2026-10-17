import {syntheticSales,parseCsv,validateSales,trainValuation,predictValue,comparableSales} from './valuation-model.js';
const $=id=>document.getElementById(id);
const fmt=x=>'PKR '+Math.round(x).toLocaleString('en-GB');
let sales=syntheticSales(),model=null,source='Synthetic';
const report=(msg,error=false)=>{const e=$('dataset-info');e.textContent=msg;e.className=error?'status error':'status';};
function setOptions(){
  const select=$('neighborhood'),current=select.value;
  select.replaceChildren();
  for(const name of [...new Set(sales.map(x=>x.neighborhood))].sort()){const opt=document.createElement('option');opt.value=name;opt.textContent=name;select.append(opt);}
  if([...select.options].some(o=>o.value===current))select.value=current;
}
function clearModel(){model=null;$('diagnostics').hidden=true;$('diag-placeholder').hidden=false;$('forecast').hidden=true;}
function showSource(){report(`${source} dataset: ${sales.length} sales across ${new Set(sales.map(r=>r.neighborhood)).size} neighborhoods. No file leaves your browser.`);}
$('reset-sample').addEventListener('click',()=>{sales=syntheticSales(47,240);source='Synthetic';$('upload').value='';clearModel();setOptions();showSource();train();});
$('upload').addEventListener('change',async event=>{
  const file=event.target.files?.[0];if(!file)return;
  try{if(file.size>1.5e6)throw Error('CSV exceeds 1.5 MB; use up to 1,500 rows.');const rows=validateSales(parseCsv(await file.text()));sales=rows;source='Uploaded CSV';clearModel();setOptions();showSource();}
  catch(error){report(error.message,true);$('upload').value='';}
});
function train(){
  try{
    $('train').disabled=true;
    const seed=Number($('seed').value),tau=Number($('tau').value);
    model=trainValuation(sales,{seed,tau});const d=model.diagnostics;
    $('mae').textContent=fmt(d.mae);$('rf-mae').textContent=fmt(d.forestMae);
    $('mape').textContent=d.mape.toFixed(1)+'%';$('coverage').textContent=(100*d.coverage).toFixed(1)+'%';
    $('split-info').textContent=`Training: ${d.train} sales; calibration: ${d.calibration}; untouched holdout: ${d.test}. Coverage: ${d.inside}/${d.test}.`;
    const problematic=d.coverage<.75 || d.mape>20;
    $('model-warning').textContent=problematic?'Caution: high error or low interval coverage on this holdout. Do not use this model for consequential valuations.':'Holdout metrics are descriptive, not guarantees of future performance. Review neighborhood coverage and extrapolation warnings.';
    $('model-warning').className=problematic?'status error':'status';
    $('diagnostics').hidden=false;$('diag-placeholder').hidden=true;
    showSource();predict();
  }catch(error){model=null;$('diagnostics').hidden=true;$('forecast').hidden=true;report('Training failed: '+error.message,true);}
  finally{$('train').disabled=false;}
}
function predict(){
  if(!model){report('Train a model before making predictions.',true);return;}
  try{
    const neighborhood=$('neighborhood').value,land_area_sqft=Number($('land').value),covered_area_sqft=Number($('covered').value);
    if(!Number.isFinite(land_area_sqft)||!Number.isFinite(covered_area_sqft))throw Error('Enter both land and covered floor areas.');
    const row={neighborhood,land_area_sqft,covered_area_sqft},p=predictValue(model,row),b=model.bounds.get(neighborhood);
    const outside=land_area_sqft<b.landMin||land_area_sqft>b.landMax||covered_area_sqft<b.coveredMin||covered_area_sqft>b.coveredMax;
    $('estimate').textContent=fmt(p.estimate);$('interval').textContent=`${fmt(p.lower)} to ${fmt(p.upper)}`;
    $('extrapolation').textContent=outside?`WARNING: Outside the observed range for ${neighborhood}. Land: ${b.landMin}–${b.landMax} sq ft; covered: ${b.coveredMin}–${b.coveredMax} sq ft. Predictions may be unreliable.`:`Inside observed area ranges for ${neighborhood} (${b.n} recorded sales). This does not establish representativeness or precision.`;
    $('extrapolation').className=outside?'status error':'status';
    $('adjustment').textContent=`Random-forest-only estimate: ${fmt(p.forestOnly)}. Neighborhood posterior adjustment: ${p.neighborhoodShiftPct.toFixed(1)}% (${p.calibrationN} calibration sales).`;
    const body=$('comparables');body.replaceChildren();
    for(const r of comparableSales(model,row)){const tr=document.createElement('tr');for(const v of [r.neighborhood,String(r.land_area_sqft),String(r.covered_area_sqft),fmt(r.sale_price_pkr)]){const td=document.createElement('td');td.textContent=v;tr.append(td);}body.append(tr);}
    $('forecast').hidden=false;
  }catch(error){$('forecast').hidden=true;report(error.message,true);}
}
function downloadTemplate(e){e.preventDefault();const csv=['property_id,land_area_sqft,covered_area_sqft,neighborhood,sale_price_pkr',...syntheticSales(47,120).map(x=>[x.property_id,x.land_area_sqft,x.covered_area_sqft,x.neighborhood,x.sale_price_pkr].join(','))].join('\r\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='synthetic_comparable_sales.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('template').addEventListener('click',downloadTemplate);$('train').addEventListener('click',train);$('predict').addEventListener('click',predict);
setOptions();showSource();train();
