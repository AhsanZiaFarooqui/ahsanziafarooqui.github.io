/* Development-only browser delivery checks. Node 22+, Playwright 1.62.1.
   PLAYWRIGHT_MODULE may point to an installed playwright package directory.
   CASE_BASE_URL optionally targets the deployed site; otherwise serve checkout.
   BROWSERS=chromium,firefox by default. Output screenshots/reports outside repo
   through CASE_AUDIT_OUTPUT if desired. All inputs remain synthetic. */
const {createServer}=require('node:http');
const fs=require('node:fs/promises');
const {resolve,extname,sep}=require('node:path');
const assert=require('node:assert/strict');
const playwright=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root=resolve(__dirname,'../..');
const output=process.env.CASE_AUDIT_OUTPUT;
const slugs=['survey-instrument-review','quantitative-analysis-review','professional-deliverable-review'];
const results=[];
(async()=>{
  let server, base=process.env.CASE_BASE_URL;
  try {
    if(!base) {
      server=createServer(async(req,res)=>{
        try {
          let path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
          if(!path.startsWith(root+sep) && path!==root){res.writeHead(403).end();return;}
          if((await fs.stat(path)).isDirectory())path=resolve(path,'index.html');
          const type={'.html':'text/html','.css':'text/css','.csv':'text/csv','.md':'text/markdown','.js':'text/javascript'}[extname(path)] || 'application/octet-stream';
          res.writeHead(200,{'Content-Type':type});res.end(await fs.readFile(path));
        }catch {res.writeHead(404).end('Not found');}
      });
      await new Promise(r=>server.listen(0,'127.0.0.1',r));
      base=`http://127.0.0.1:${server.address().port}/`;
    }
    if(output)await fs.mkdir(output,{recursive:true});
    for(const name of (process.env.BROWSERS || 'chromium,firefox').split(',')) {
      const browser=await playwright[name].launch({headless:true});
      try {
        for(const width of [320,375,768,1440]) {
          const context=await browser.newContext({viewport:{width,height:900},acceptDownloads:true});
          try {
            const page=await context.newPage();const errors=[];
            page.on('pageerror',e=>errors.push(e.message));
            page.on('response',r=>{if(r.status()>=400 && r.url().startsWith(base)) errors.push(`${r.status()} ${r.url()}`);});
            await page.goto(new URL('/',base).href);
            await page.getByRole('link',{name:'Research Tools',exact:true}).click();
            await page.getByRole('link',{name:'Three independently checkable review cases →',exact:true}).click();
            assert.match(await page.title(),/Expert Evaluation Case Studies/);
            for(const slug of ['index',...slugs,'reproducibility']) {
              if(slug!=='index') {
                await page.locator(`a[href="${slug}.html"]`).click();
                assert.match(await page.locator('main').innerText(),/synthetic/i);
              }
              const metrics=await page.evaluate(()=>({viewport:innerWidth,width:document.documentElement.scrollWidth}));
              assert.ok(metrics.width<=metrics.viewport+1,`${name} ${width} ${slug}: page overflow ${JSON.stringify(metrics)}`);
              await page.keyboard.press('Tab');
              assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Skip to content');
              await page.keyboard.press('Enter');
              assert.equal(await page.evaluate(()=>location.hash),'#main');
              const links=await page.locator('a[href],link[href]').evaluateAll(elements=>elements.map(e=>e.href));
              for(const href of new Set(links)) {
                const u=new URL(href);if(u.origin!==new URL(base).origin)continue;
                u.hash=''; const response=await context.request.get(u.href);
                assert.equal(response.status(),200,`Link failed: ${u.href}`);
                let local=resolve(root,'.'+decodeURIComponent(u.pathname));
                if((await fs.stat(local)).isDirectory())local=resolve(local,'index.html');
                assert.deepEqual(await response.body(),await fs.readFile(local),`Unexpected deployed bytes: ${u.pathname}`);
              }
              if(slug!=='index') {
                const table=page.locator('.table-scroll').first();
                await table.focus();assert.equal(await table.getAttribute('tabindex'),'0');
                if(await table.evaluate(e=>e.scrollWidth>e.clientWidth)) {
                  await table.press('ArrowRight');
                  await page.waitForFunction(()=>document.querySelector('.table-scroll').scrollLeft>0);
                }
                if(slugs.includes(slug)) {
                const downloadWait=page.waitForEvent('download');
                await page.locator('a[href="verify.py"]').first().click();
                const download=await downloadWait;
                assert.deepEqual(await fs.readFile(await download.path()),await fs.readFile(resolve(root,'portfolio/cases/verify.py')));
                }
              }
              if(output)await page.screenshot({path:resolve(output,`${name}-${width}-${slug}.png`),fullPage:true});
              results.push({browser:name,width,page:slug,result:'pass'});
              if(slug!=='index') {
                await page.getByRole('link',{name:'Review case studies',exact:true}).click();
              }
            }
            assert.deepEqual(errors,[],`Page/network errors in ${name} ${width}`);
          }finally {await context.close();}
        }
      }finally {await browser.close();}
    }
    console.log(JSON.stringify(results,null,2));
    if(output)await fs.writeFile(resolve(output,'browser-results.json'),JSON.stringify(results,null,2)+'\n');
  }finally {if(server)server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
