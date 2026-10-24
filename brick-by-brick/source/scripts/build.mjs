import {stripTypeScriptTypes} from 'node:module';
import {createHash} from 'node:crypto';
import {readdir,readFile,writeFile,mkdir,copyFile,cp} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
const sourceFiles=(await readdir('src')).filter(f=>f.endsWith('.ts')||f.endsWith('.css')).sort();
const digest=createHash('sha256');
for(const file of sourceFiles)digest.update(await readFile(`src/${file}`));
digest.update(await readFile('public/config.json'));digest.update(await readFile('index.html'));
const version=digest.digest('hex').slice(0,12);
for(const file of await readdir('src')) if(file.endsWith('.ts')) {
 const code=stripTypeScriptTypes(await readFile(`src/${file}`,'utf8'),{mode:'strip'}).replace(/(from\s+['"]\.\/[^'"]+)\.ts(['"])/g,`$1.js?v=${version}$2`);
 await writeFile(`dist/${file.replace(/\.ts$/,'.js')}`,code);
}
await writeFile('dist/index.html',(await readFile('index.html','utf8')).replace('./main.js',`./main.js?v=${version}`).replace('./style.css',`./style.css?v=${version}`));
await copyFile('src/style.css','dist/style.css');
await cp('public','dist',{recursive:true});
console.log('Built browser ES modules in dist. Native TypeScript stripping checks syntax, not static types.');
