import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,readdir,unlink,rmdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {emptyStudy,createSession,validateStore} from '../src/study.ts';
test('aggregation CLI preserves labelled synthetic incomplete records and rejects repeat snapshots',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'brick-aggregation-test-'));
 try{for(const [name,code] of [['one','BBB-TESTA1'],['two','BBB-TESTA2']]){const store=emptyStudy();store.sessions.push(createSession(store,'time','practice',code,false,()=>.1,true));await writeFile(join(dir,name+'.json'),JSON.stringify(store));}const output=join(dir,'combined.json');const run=(out:string,...inputs:string[])=>spawnSync(process.execPath,['--experimental-strip-types','scripts/aggregate-studies.ts',out,...inputs],{encoding:'utf8'});const result=run(output,join(dir,'one.json'),join(dir,'two.json'));assert.equal(result.status,0,result.stderr);const combined=JSON.parse(await readFile(output,'utf8'));validateStore(combined);assert.equal(combined.sessions.length,2);assert.ok(combined.sessions.every((s:any)=>s.synthetic&&s.initialScore===null&&s.finalScore===null));assert.match(await readFile(join(dir,'combined.csv'),'utf8'),/initialScore/);assert.notEqual(run(join(dir,'duplicate.json'),join(dir,'one.json'),join(dir,'one.json')).status,0);assert.notEqual(run(output,join(dir,'one.json')).status,0);
 }finally{for(const file of await readdir(dir))await unlink(join(dir,file));await rmdir(dir);}
});
