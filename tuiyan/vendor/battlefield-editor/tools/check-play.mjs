// tools/check-play.mjs — 音频播放实证：performance 采样 + 音色切换后忙状态
import puppeteer from 'puppeteer-core';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const b=await puppeteer.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox','--disable-gpu','--autoplay-policy=no-user-gesture-required']});
try{
 const p=await b.newPage();
 await p.setViewport({width:1600,height:900});
 await p.setRequestInterception(true);
 p.on('request',r=>{const u=r.url(); if(u.startsWith('https://fonts.')||u.includes('fonts.gstatic')) r.abort(); else r.continue();});
 await p.goto('http://127.0.0.1:8124/play.html?pkg=packages/chibi-full/battlefield.json',{waitUntil:'domcontentloaded',timeout:120000});
 await p.waitForFunction('!!window.__audio',{timeout:45000});
 await sleep(1200);
 await p.click('#btnAuto');
 await sleep(6500);
 const res=await p.evaluate(()=>performance.getEntriesByType('resource').filter(e=>e.name.includes('/narration/')).map(e=>({f:e.name.split('/').slice(-2).join('/'), size:e.transferSize, ms:Math.round(e.duration)})));
 const busy=await p.evaluate(()=>window.__audio.narr.busy());
 // 切两次音色 →「解说男」，验证切换后继续播放
 await p.click('#bVoiceTg'); await sleep(400);
 await p.click('#bVoiceTg'); await sleep(2500);
 const busy2=await p.evaluate(()=>window.__audio.narr.busy());
 const label=await p.evaluate(()=>document.querySelector('#bVoiceTg').textContent);
 await p.screenshot({path:'docs/screenshots/zh-04-新音色-解说男.png'});
 console.log(JSON.stringify({busy,busy2,label,res},null,2));
}finally{await b.close();}
