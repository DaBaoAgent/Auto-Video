import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import puppeteer from "puppeteer-core";
const ROOT=String.raw`D:\@kaifa\Auto-Video`; const CHROME="C:\\Users\\Administrator\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe";
const server=http.createServer((q,r)=>{const u=decodeURIComponent(q.url.split("?")[0]); if(u==="/favicon.ico"){r.writeHead(204);r.end();return;} const p=path.join(ROOT,u); if(!fs.existsSync(p)){r.writeHead(404);r.end("404");return;} r.writeHead(200,{"Content-Type":path.extname(p)===".ttf"?"font/ttf":path.extname(p)===".js"?"text/javascript":path.extname(p)===".css"?"text/css":path.extname(p)===".json"?"application/json":"text/html"}); fs.createReadStream(p).pipe(r);});
await new Promise(r=>server.listen(0,"127.0.0.1",r)); const port=server.address().port;
const b=await puppeteer.launch({executablePath:CHROME,headless:true,args:["--no-sandbox"]}); const pg=await b.newPage();
await pg.goto(`http://127.0.0.1:${port}/xiangsu/projects/002_血之海滩/index.html`,{waitUntil:"load"});
await pg.waitForFunction("window.__ready===true",{timeout:60000});
for(const ch of ["翻","血"]){ const s=await pg.evaluate(c=>window.__bm(c),ch); console.log("--- "+ch); console.log(s);} 
await b.close(); server.close();