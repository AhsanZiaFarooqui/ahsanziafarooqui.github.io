import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';
const paths=['src/math.ts','src/bank.ts','src/model.ts','src/tutorials.ts','src/ai-contract.ts','src/ai-schema.ts','server/cloudflare.ts'];
const parts=[];
for(const path of paths){let code=stripTypeScriptTypes(await readFile(path,'utf8'),{mode:'strip'});code=code.replace(/^import[^\n]*\n/gm,'').replace(/\bexport (?=(?:const|function|async function|class)\b)/g,'');parts.push(`// ${path}\n${code}`);}
await mkdir('deploy',{recursive:true});await writeFile('deploy/cloudflare-worker.js','// Brick by Brick. Deploy only on Workers FREE. No API key required.\n'+parts.join('\n'));
console.log('Built standalone deploy/cloudflare-worker.js for the Cloudflare dashboard editor.');
