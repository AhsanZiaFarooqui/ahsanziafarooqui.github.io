/* Development-only integration checks. Playwright 1.62.1; no production dependency.
   PLAYWRIGHT_MODULE points to the installed package. BROWSERS=chromium,firefox.
   Optional GEO_AUDIT_OUTPUT saves screenshots outside the repository. */
const {createServer}=require('node:http');
const fs=require('node:fs/promises');
const {resolve,extname,sep}=require('node:path');
const assert=require('node:assert/strict');
const playwright=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve(__dirname,'../..');
(async()=>{
  const fixture=await fs.readFile(resolve(root,'portfolio/fixtures/synthetic-property.geojson'));
  const server=createServer(async(req,res)=>{try{
    const pathname=new URL(req.url,'http://localhost').pathname;
    if(pathname==='/favicon.ico'){res.writeHead(204).end();return;}
    const path=resolve(root,'.'+decodeURIComponent(pathname));
    if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}
    const type={'.html':'text/html','.css':'text/css','.js':'text/javascript','.geojson':'application/geo+json','.md':'text/plain'}[extname(path)]||'application/octet-stream';
    const body=await fs.readFile(path);
    res.writeHead(200,{'Content-Type':type});res.end(body);
  }catch{res.writeHead(404).end('Not found');}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base=`http://127.0.0.1:${server.address().port}`;
  try{
    for(const name of (process.env.BROWSERS||'chromium,firefox').split(',')){
      const browser=await playwright[name].launch({headless:true});
      try{for(const width of [375,1440]){
        const context=await browser.newContext({viewport:{width,height:900},acceptDownloads:true});
        try{
          const page=await context.newPage(),errors=[];
          page.on('pageerror',e=>errors.push(e.message));
          page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(base))errors.push(`${r.status()} ${r.url()}`);});
          await page.goto(`${base}/portfolio/valuation.html#geospatial`);
          await page.waitForFunction(()=>!document.getElementById('rs-results').hidden);
          assert.equal(await page.locator('#rs-apply').isEnabled(),true,'Manual measurement still available');
          await page.locator('#rs-measure').click();assert.match(await page.locator('#rs-status').innerText(),/calculated locally/);
          await page.locator('#geo-sample').click();await page.waitForFunction(()=>!document.getElementById('geo-results').hidden);
          assert.equal(await page.locator('#geo-table tr').count(),4);
          assert.match(await page.locator('#geo-table').innerText(),/948\.03/);
          assert.match(await page.locator('#geo-errors').innerText(),/-6\.25%/);
          assert.equal(await page.locator('#geo-error-table').isVisible(),true);
          assert.equal(await page.locator('#covered').inputValue(),'1700','GeoJSON must not invent floor area');
          const downloadPromise=page.waitForEvent('download');await page.getByRole('link',{name:'Download synthetic GeoJSON'}).click();
          const download=await downloadPromise;assert.deepEqual(await fs.readFile(await download.path()),fixture);
          const upload=buffer=>page.locator('#geo-file').setInputFiles({name:'synthetic.geojson',mimeType:'application/geo+json',buffer});
          await upload(fixture);assert.match(await page.locator('#geo-status').innerText(),/Confirm WGS84/);
          assert.equal(await page.locator('#geo-results').isHidden(),true);
          await page.locator('#geo-confirm').check();await upload(fixture);
          await page.waitForFunction(()=>!document.getElementById('geo-results').hidden);
          await upload(Buffer.from('{'));await page.waitForFunction(()=>document.getElementById('geo-status').classList.contains('error'));
          assert.match(await page.locator('#geo-status').innerText(),/Invalid GeoJSON/);
          assert.equal(await page.locator('#geo-results').isHidden(),true,'Failed upload clears previous measurement');
          const missing=JSON.parse(fixture);missing.features=missing.features.slice(0,2);
          await upload(Buffer.from(JSON.stringify(missing)));await page.waitForFunction(()=>!document.getElementById('geo-results').hidden);
          assert.equal(await page.locator('#geo-error-table').isHidden(),true);
          assert.match(await page.locator('#geo-reference-status').innerText(),/No reference polygons/);
          const legacy=JSON.parse(fixture);legacy.crs={type:'name',properties:{name:'EPSG:3857'}};
          await upload(Buffer.from(JSON.stringify(legacy)));await page.waitForFunction(()=>document.getElementById('geo-status').classList.contains('error'));
          assert.match(await page.locator('#geo-status').innerText(),/Legacy\/custom CRS/);
          await page.locator('#geo-sample').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>!document.getElementById('geo-results').hidden);
          const dimensions=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
          assert.ok(dimensions.scroll<=dimensions.width+1,`${name} ${width}: page overflow ${JSON.stringify(dimensions)}`);
          await page.locator('#geo-confirm').uncheck();assert.equal(await page.locator('#geo-results').isHidden(),true);
          await page.locator('#geo-sample').click();await page.waitForFunction(()=>!document.getElementById('geo-results').hidden);
          if(process.env.GEO_AUDIT_OUTPUT){await fs.mkdir(process.env.GEO_AUDIT_OUTPUT,{recursive:true});await page.locator('#geospatial').screenshot({path:resolve(process.env.GEO_AUDIT_OUTPUT,`${name}-${width}-geojson.png`)});}
          assert.deepEqual(errors,[],`${name} ${width} runtime/network errors`);
          console.log(`PASS ${name} ${width}: GeoJSON import/errors, keyboard, layout, downloads and manual measurement`);
        }finally{await context.close();}
      }}finally{await browser.close();}
    }
  }finally{server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
