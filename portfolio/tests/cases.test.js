import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync, existsSync, statSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root = fileURLToPath(new URL('../..', import.meta.url));
const cases = resolve(root, 'portfolio/cases');
const txt = p => readFileSync(resolve(cases, p), 'utf8');
// Independent RFC-style reader: quoted commas, doubled quotes and CRLF matter
// for the revised questionnaire. Reject malformed fixtures instead of shifting columns.
function parseCSV(text) {
  const records=[]; let row=[], value='', quoted=false;
  for (let i=0; i<text.length; i++) {
    const c=text[i];
    if(c==='"') {if(quoted && text[i+1]==='"'){value+='"';i++;} else quoted=!quoted;}
    else if(c===',' && !quoted){row.push(value);value='';}
    else if(c==='\n' && !quoted){row.push(value.replace(/\r$/, ''));records.push(row);row=[];value='';}
    else value+=c;
  }
  assert.equal(quoted,false,'Unterminated CSV quote');
  if(value || row.length) {row.push(value.replace(/\r$/, ''));records.push(row);}
  const [header,...data]=records;
  return data.map(r=>{assert.equal(r.length,header.length,'CSV row width');return Object.fromEntries(header.map((k,i)=>[k,r[i]]));});
}
const csv=p=>parseCSV(txt('assets/'+p));
const slugs=['survey-instrument-review','quantitative-analysis-review','professional-deliverable-review'];

test('review sources retain synthetic disclosure, scoring anchors and runnable setup',()=>{
  for(const slug of slugs) for(const extension of ['html','md']) {
    const s=txt(slug+'.'+extension);
    for(const pattern of [/synthetic/i,/not captured outputs/,/half/,/zero/i,/git clone/,/python3 portfolio\/cases\/verify.py/,/node --test portfolio\/tests\/cases.test.js/]) assert.match(s,pattern);
  }
});
test('CSV reader retains quoted questionnaire prompts',()=>{
  const rows=parseCSV('id,prompt\r\nQ1,"Minutes, excluding waiting?"\r\nQ2,"Say ""yes"""\r\n');
  assert.equal(rows[0].prompt,'Minutes, excluding waiting?'); assert.equal(rows[1].prompt,'Say "yes"');
  assert.throws(()=>parseCSV('id,value\nQ1,a,b\n'));
});
function trace(items, answers) {
  const known={}, visited=[];
  for(const row of items) {
    const asked=row.asked_if==='Everyone' || row.asked_if.split(' AND ').every(clause=>{
      const [,key,op,value]=clause.match(/^(\w+)(!=|=)(.+)$/);
      return Object.hasOwn(known,key) && (op==='=' ? known[key]===value : known[key]!==value);
    });
    if(asked) {visited.push(row.question_id);if(Object.hasOwn(answers,row.question_id)) known[row.question_id]=answers[row.question_id];}
  }
  return visited;
}
test('survey branches exclude ineligible, unknown, nonuser and no-complaint followups',()=>{
  const items=csv('survey_revised.csv'); assert.equal(items.length,9); assert.equal(new Set(items.map(r=>r.question_id)).size,9);
  for(const s of ['No','Prefer not to say']) assert.deepEqual(trace(items,{S0:s}),['S0']);
  for(const s of ['Do not remember','Prefer not to say']) assert.deepEqual(trace(items,{S0:'Yes',S1:s}),['S0','S1']);
  assert.deepEqual(trace(items,{S0:'Yes',S1:'No'}),['S0','S1','Q7']);
  assert.deepEqual(trace(items,{S0:'Yes',S1:'Yes',Q1:'Cannot recall'}),['S0','S1','Q1']);
  for(const complaint of ['Yes','No','Do not remember']) {
    const path=trace(items,{S0:'Yes',S1:'Yes',Q1:'Bills',Q4:complaint});
    assert.equal(path.includes('Q5'),complaint==='Yes'); assert.ok(!path.includes('Q7'));
  }
  assert.match(items.find(r=>r.question_id==='Q2').response_options,/do not cap/);
});
test('completion proportions derive from a reconciled disposition table',()=>{
  const d=Object.fromEntries(csv('survey_dispositions.csv').map(r=>[r.disposition,+r.count]));
  assert.equal(Object.values(d).reduce((a,b)=>a+b),200);
  assert.equal(d.eligible_complete+d.eligible_not_complete,150);
  assert.equal(d.eligible_complete/150,.64); assert.ok(Math.abs(d.eligible_complete/(150+d.eligibility_unknown)-8/15)<1e-12);
});
function validatePanel(rows) {
  assert.equal(rows.length,40); const keys=new Set(),circles=new Map();
  for(const r of rows) {
    const key=r.circle+'_'+r.year; assert.ok(!keys.has(key),'Duplicate circle-year');keys.add(key);
    assert.ok(['2023','2024'].includes(r.year)); assert.ok(['0','1'].includes(r.treated));
    assert.ok(r.tax_collection_m_pkrs.trim()!=='' && Number.isFinite(+r.tax_collection_m_pkrs) && +r.tax_collection_m_pkrs>=0);
    const group=circles.get(r.circle)||[];group.push(r);circles.set(r.circle,group);
  }
  assert.equal(circles.size,20);
  for(const group of circles.values()){assert.equal(group.length,2);assert.equal(new Set(group.map(r=>r.treated)).size,1);}
  assert.equal([...circles.values()].filter(g=>g[0].treated==='1').length,10);
}
test('corrupt export is exactly reference plus two documented bad rows',()=>{
  const clean=csv('circle_panel.csv'),dirty=csv('circle_panel_dirty.csv');validatePanel(clean);assert.equal(dirty.length,42);
  const bag=rows=>{const m=new Map();for(const r of rows){const s=JSON.stringify(r);m.set(s,(m.get(s)||0)+1);}return m;};
  assert.deepEqual(bag(dirty),bag([...clean,{circle:'T03',treated:'1',year:'2024',tax_collection_m_pkrs:'999'},{circle:'C04',treated:'0',year:'2024',tax_collection_m_pkrs:''}]));
  assert.throws(()=>validatePanel(dirty));
});
test('panel validation rejects subtle changes that preserve group-year means',()=>{
  const source=csv('circle_panel.csv');
  for(const mutate of [a=>a[0].year='2024',a=>a[0].treated='0',a=>a[0].tax_collection_m_pkrs='',a=>a[0].tax_collection_m_pkrs='NaN']) {
    const rows=structuredClone(source);mutate(rows);assert.throws(()=>validatePanel(rows));
  }
});
test('group means and descriptive DiD have per-circle units',()=>{
  const data=csv('circle_panel.csv');validatePanel(data);
  const avg=(t,y)=>data.filter(r=>+r.treated===t && +r.year===y).reduce((s,r)=>s+Number(r.tax_collection_m_pkrs),0)/10;
  const [t0,t1,c0,c1]=[avg(1,2023),avg(1,2024),avg(0,2023),avg(0,2024)];
  assert.deepEqual([t0,t1,c0,c1,t1-c1,(t1-t0)-(c1-c0)],[80,110,75,90,20,15]);
});
test('project figures derive from budget, staffing and date fixtures',()=>{
  const budget=csv('project_budget.csv').reduce((s,r)=>s+Number(r.amount_m_pkrs),0);
  assert.ok(Math.abs(budget-6.4)<1e-12); assert.ok(Math.abs(budget-5.8-.6)<1e-12);
  const capacities=Object.fromEntries(csv('project_capacity.csv').map(r=>[r.scenario,r.enumerators*r.completions_per_day*r.days*r.availability_factor]));
  assert.equal(capacities.draft,1600);assert.equal(2500-capacities.draft,900);assert.equal(capacities.illustrative_alternative,2868.75);
  const dates=Object.fromEntries(csv('project_schedule.csv').map(r=>[r.milestone,r.date]));
  assert.ok(dates.pilot<dates.contract && dates.pilot<dates.frame_delivery);
  assert.match(txt('assets/project_plan.md'),/not a response rate/);
});
test('case HTML and Markdown relative links resolve recursively, including download assets',()=>{
  const files=[...readdirSync(cases).filter(f=>/\.(html|md)$/.test(f)).map(f=>resolve(cases,f)),resolve(root,'portfolio/index.html')];
  for(const file of files) {
    const content=readFileSync(file,'utf8');
    const hrefs=file.endsWith('.html') ? [...content.matchAll(/(?:href|src)="([^"]+)"/g)].map(m=>m[1]) : [...content.matchAll(/\]\(([^)]+)\)/g)].map(m=>m[1]);
    for(const href of hrefs) {
      if(/^(https?:|mailto:|data:)/.test(href))continue;
      const [path,fragment]=href.split('#');
      let target=path.startsWith('/')?resolve(root,'.'+path):resolve(dirname(file),path||'.');
      if(!path)target=file;
      if(existsSync(target)&&statSync(target).isDirectory())target=resolve(target,'index.html');
      assert.ok(existsSync(target),`${file}: missing ${href}`);
      if(fragment && target.endsWith('.html'))assert.ok(readFileSync(target,'utf8').includes(`id="${fragment}"`),`Missing anchor: ${href}`);
    }
  }
});
test('case pages provide keyboard bypass, semantic table headers and shared mobile styles',()=>{
  for(const name of ['index',...slugs]) {
    const h=txt(name+'.html');assert.match(h,/href="#main"/);assert.match(h,/id="main"/);assert.match(h,/href="cases.css"/);
    if(name!=='index'){assert.match(h,/tabindex="0"/);assert.match(h,/<th scope="col">/);}
  }
  assert.match(txt('cases.css'),/overflow-wrap:anywhere/);
});
