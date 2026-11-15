import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const BASE=process.env.SMOKE_BASE||'http://127.0.0.1:8125';
const OUT=process.env.SMOKE_OUT||'docs/screenshots';
const errors=[];
const browser=await puppeteer.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless:'new',args:['--autoplay-policy=no-user-gesture-required','--use-angle=d3d11','--ignore-gpu-blocklist'],
  defaultViewport:{width:1920,height:1080}});
try{
  const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text().slice(0,200));});
  await page.goto(`${BASE}/play.html?pkg=packages/chibi-full/battlefield.json&record=1`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__eng&&document.getElementById('loadMsg')?.classList.contains('off'));
  await page.evaluate(()=>{document.getElementById('btnAuto').click();document.getElementById('intro').remove();document.getElementById('bMin').click();document.getElementById('bPlay').click();});
  for(let i=0;i<46;i++){
    await page.evaluate(i=>window.__eng.goTo(i),i);
    await new Promise(r=>setTimeout(r,70));
  }
  await page.evaluate(()=>{window.__eng.goTo(29);document.getElementById('bPlay').click();});
  await new Promise(r=>setTimeout(r,2000));
  await page.screenshot({path:OUT+'/film-ships-glass-1080p.png'});
  const state=await page.evaluate(()=>{const sub=document.getElementById('subtitle'),css=getComputedStyle(sub);
    return {...window.__eng.state(),subtitle:{text:sub.textContent,font:css.fontFamily,weight:css.fontWeight},
      editorRemoved:!document.getElementById('editPanel'),nodes:document.querySelectorAll('.node').length,
      cards:document.querySelectorAll('.commanderCard').length};});
  await page.evaluate(()=>window.__eng.goTo(31));await new Promise(r=>setTimeout(r,12500));
  await page.screenshot({path:OUT+'/film-fire-glass-1080p.png'});
  const fps=await page.evaluate(()=>new Promise(resolve=>{let n=0;const start=performance.now();
    function tick(){n++;const elapsed=performance.now()-start;if(elapsed<3000)requestAnimationFrame(tick);else resolve(n*1000/elapsed);}requestAnimationFrame(tick);}));
  const report={...state,fireFps:fps,errors};fs.writeFileSync(OUT+'/film-smoke.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
  if(errors.length||!state.editorRemoved||state.nodes!==46||state.subtitle.weight!=='700')process.exitCode=1;
}finally{await browser.close();}
