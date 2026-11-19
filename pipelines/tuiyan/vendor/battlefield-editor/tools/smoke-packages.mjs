// Browser smoke for every battle package. Use static hosting so the editor panel does not affect the recording layout.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const BASE=process.env.SMOKE_BASE||'http://127.0.0.1:8125';
const CHROME=process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const allSlugs=JSON.parse(fs.readFileSync(new URL('../packages/index.json',import.meta.url),'utf8'));
const slugs=process.env.SMOKE_MOBILE_ONLY?[]:allSlugs.filter(s=>!process.env.SMOKE_SLUG||s===process.env.SMOKE_SLUG);
const browser=await puppeteer.launch({executablePath:CHROME,headless:'new',
  args:['--no-sandbox','--autoplay-policy=no-user-gesture-required','--ignore-gpu-blocklist','--use-angle=d3d11'],
  defaultViewport:{width:1920,height:1080}});
const results=[];
try{
  for(const slug of slugs){
    const page=await browser.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    const url=`${BASE}/play.html?pkg=packages/${slug}/battlefield.json`;
    try{
      const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
      await page.waitForFunction(()=>document.getElementById('loadMsg')?.classList.contains('off'),{timeout:60000});
      await page.evaluate(()=>document.getElementById('btnAuto').click());
      await page.evaluate(()=>document.getElementById('intro')?.remove());
      await new Promise(r=>setTimeout(r,300));
      if(!await page.evaluate(()=>document.body.classList.contains('deck-mini'))){
        await page.click('#bMin');
        if(!await page.evaluate(()=>document.body.classList.contains('deck-mini')))
          await page.evaluate(()=>document.getElementById('bMin').click());
      }
      const state=await page.evaluate(()=>({
        title:document.getElementById('brdTitle')?.textContent,
        commanderCards:document.querySelectorAll('#commanderCards .commanderCard').length,
        timeline:getComputedStyle(document.getElementById('timeline')).display,
        deckHidden:getComputedStyle(document.getElementById('deck')).display==='none',
        horizontalOverflow:document.documentElement.scrollWidth>innerWidth,
      }));
      if(slug==='chibi-full'){
        fs.mkdirSync('docs/screenshots',{recursive:true});
        await page.screenshot({path:'docs/screenshots/real-1080p-preview.png'});
        if(await page.$('.commanderCard')){
          await page.click('.commanderCard');
          await new Promise(r=>setTimeout(r,350));
          await page.screenshot({path:'docs/screenshots/liquid-glass-unit-card.png'});
        }
        const fps=await page.evaluate(()=>new Promise(resolve=>{
          let count=0;const start=performance.now();
          function step(){count++;const elapsed=performance.now()-start;
            if(elapsed<3000)requestAnimationFrame(step);else resolve(Math.round(count*1000/elapsed));}
          requestAnimationFrame(step);
        }));
        state.fps=fps;
      }
      results.push({slug,status:response.status(),...state,errors});
    }catch(e){results.push({slug,error:String(e),errors});}
    await page.close();
  }
  const mobile=await browser.newPage();
  await mobile.setViewport({width:375,height:812});
  const mobileErrors=[];mobile.on('pageerror',e=>mobileErrors.push(e.message));
  await mobile.goto(`${BASE}/play.html?pkg=packages/chibi-full/battlefield.json`,{waitUntil:'domcontentloaded',timeout:90000});
  await mobile.waitForFunction(()=>document.getElementById('loadMsg')?.classList.contains('off'),{timeout:60000});
  await mobile.evaluate(()=>document.getElementById('btnAuto').click());
  await mobile.evaluate(()=>document.getElementById('intro')?.remove());
  await new Promise(r=>setTimeout(r,300));
  const deckState=await mobile.evaluate(()=>({className:document.body.className,
    rect:document.getElementById('bMin').getBoundingClientRect().toJSON(),
    display:getComputedStyle(document.getElementById('bMin')).display,
    tl:{rect:document.getElementById('tl').getBoundingClientRect().toJSON(),display:getComputedStyle(document.getElementById('tl')).display},
    head:{rect:document.querySelector('.deckHead').getBoundingClientRect().toJSON(),display:getComputedStyle(document.querySelector('.deckHead')).display},
    deck:{rect:document.getElementById('deck').getBoundingClientRect().toJSON(),display:getComputedStyle(document.getElementById('deck')).display},
    editorRemoved:!document.getElementById("editPanel")}));
  if(!await mobile.evaluate(()=>document.body.classList.contains('deck-mini'))){
    if(deckState.rect.width===0||deckState.rect.height===0)throw new Error('手机控制面板不可见: '+JSON.stringify(deckState));
    await mobile.click('#bMin');
    if(!await mobile.evaluate(()=>document.body.classList.contains('deck-mini')))
      await mobile.evaluate(()=>document.getElementById('bMin').click());
  }
  await new Promise(r=>setTimeout(r,500));
  await mobile.screenshot({path:'docs/screenshots/real-mobile-preview.png'});
  const mobileState=await mobile.evaluate(()=>({horizontalOverflow:document.documentElement.scrollWidth>innerWidth,
    timelineWidth:Math.round(document.getElementById('timeline').getBoundingClientRect().width),
    subtitleFont:getComputedStyle(document.getElementById('subtitle')).fontSize}));
  results.push({slug:'chibi-mobile',...mobileState,errors:mobileErrors});
  await mobile.close();
}finally{await browser.close();}
console.log(JSON.stringify(results,null,2));
if(results.some(r=>r.error||r.errors?.length||r.horizontalOverflow||r.status>=400))process.exitCode=1;
