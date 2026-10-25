import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';
import {posix} from 'node:path';
// Small deterministic bundler for our local, named-import ES modules. Keep module scopes separate.
const modules=new Map(),parts=[];
async function bundle(path){
 if(modules.has(path))return modules.get(path);
 const name=`module${modules.size}`;modules.set(path,name);
 let code=stripTypeScriptTypes(await readFile(path,'utf8'),{mode:'strip'}),exports=[];
 const dependencies=[...code.matchAll(/(?:import|export)\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"];?/g)];
 for(const match of dependencies){if(!match[2].startsWith('.'))throw Error('External imports are unsupported');const target=posix.normalize(posix.join(posix.dirname(path),match[2])),dependency=await bundle(target);if(match[0].startsWith('export')){const names=match[1].split(',').map(s=>s.trim());exports.push(...names.map(s=>({public:s.split(/\s+as\s+/).at(-1),local:s.split(/\s+as\s+/).at(-1)})));code=code.replace(match[0],'');}else{const bindings=match[1].replace(/\s+as\s+/g,':');code=code.replace(match[0],`const {${bindings}}=${dependency};`);}}
 code=code.replace(/\bexport\s+(?=(?:async\s+)?function\s+|(?:const|let|class)\s+)/g,(match,offset)=>{const tail=code.slice(offset+match.length),id=tail.match(/^(?:async\s+)?(?:function|const|let|class)\s+(\w+)/)?.[1];if(!id)throw Error('Unsupported export');exports.push({public:id,local:id});return '';});
 if(/export default/.test(code)){exports.push({public:'default',local:'defaultExport'});code=code.replace(/export default /g,'const defaultExport=');}
 code=code.replace(/export\s*\{\s*\};?/g,'');
 if(/^import |^export /m.test(code))throw Error('Unsupported module syntax: '+path);
 const fields=[...new Map(exports.map(e=>[e.public,e])).values()].map(e=>`${JSON.stringify(e.public)}:${e.local}`).join(',');
 parts.push(`// ${path}\nconst ${name}=(()=>{\n${code}\nreturn {${fields}};\n})();`);return name;
}
const root=await bundle('server/cloudflare.ts');
await mkdir('deploy',{recursive:true});
await writeFile('deploy/cloudflare-worker.js',`// Brick by Brick. Workers Free; no API key in this file.\n${parts.join('\n')}\nexport default ${root}.default;\n`);
console.log('Built standalone Worker with scoped modules and comparison endpoints.');
