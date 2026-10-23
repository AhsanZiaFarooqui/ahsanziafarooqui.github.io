import {stripTypeScriptTypes} from 'node:module';
import {readdir,readFile,writeFile,mkdir,copyFile,cp} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
for(const file of await readdir('src')) if(file.endsWith('.ts')) {
 const code=stripTypeScriptTypes(await readFile(`src/${file}`,'utf8'),{mode:'strip'}).replace(/(from\s+['"]\.\/[^'"]+)\.ts(['"])/g,'$1.js$2');
 await writeFile(`dist/${file.replace(/\.ts$/,'.js')}`,code);
}
await copyFile('index.html','dist/index.html');
await copyFile('src/style.css','dist/style.css');
await cp('public','dist',{recursive:true});
console.log('Built browser ES modules in dist. Native TypeScript stripping checks syntax, not static types.');
