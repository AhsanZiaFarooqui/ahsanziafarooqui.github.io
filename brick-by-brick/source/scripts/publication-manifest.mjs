import {readdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const entries=[];
async function collect(dir,prefix){for(const e of await readdir(dir,{withFileTypes:true})){const file=`${dir}/${e.name}`,path=`${prefix}/${e.name}`;if(e.isDirectory())await collect(file,path);else if(!e.name.endsWith('.log')&&e.name!=='update-video-docs.mjs'){const b=await readFile(file);entries.push({file,path,binary:/\.(mp4|png)$/.test(file),bytes:b.length,sha:createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex')});}}}
await collect('dist','brick-by-brick');
for(const dir of ['src','server','tests','scripts','docs','reports','deploy','public'])await collect(dir,`brick-by-brick/source/${dir}`);
for(const file of ['README.md','package.json','index.html','tsconfig.json','.gitignore','.env.example']){const b=await readFile(file);entries.push({file,path:`brick-by-brick/source/${file}`,binary:false,bytes:b.length,sha:createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex')});}
await writeFile('media-work/publication-manifest.json',JSON.stringify(entries));
console.log(JSON.stringify({files:entries.length,bytes:entries.reduce((sum,e)=>sum+e.bytes,0),uniqueBlobs:new Set(entries.map(e=>e.sha)).size}));
