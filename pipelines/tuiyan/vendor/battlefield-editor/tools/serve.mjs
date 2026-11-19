import http from 'node:http';
import {createReadStream, existsSync, statSync, realpathSync} from 'node:fs';
import {resolve, dirname, relative, isAbsolute, extname} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=realpathSync(resolve(dirname(fileURLToPath(import.meta.url)),'..'));
const PORT=Number(process.env.PORT||8125);
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript',
  '.json':'application/json','.mp3':'audio/mpeg','.wav':'audio/wav','.css':'text/css',
  '.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg',
  '.webp':'image/webp','.glb':'model/gltf-binary','.gltf':'model/gltf+json','.woff2':'font/woff2'};
const inside=fp=>{const r=relative(ROOT,fp);return r!=='..'&&!r.startsWith('..\\')&&!r.startsWith('../')&&!isAbsolute(r);};

export function createServer(){return http.createServer((req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});return res.end('read only');}
  let fp;
  try{const u=new URL(req.url,'http://localhost');fp=resolve(ROOT,'.'+decodeURIComponent(u.pathname==='/'?'/play.html':u.pathname));}
  catch{res.writeHead(400);return res.end('bad path');}
  if(!inside(fp)||!existsSync(fp)||!statSync(fp).isFile()||!inside(realpathSync(fp))){res.writeHead(404);return res.end('not found');}
  const size=statSync(fp).size;
  if(!size){res.writeHead(200,{'Content-Length':0,'Content-Type':MIME[extname(fp)]||'application/octet-stream'});return res.end();}
  let start=0,end=size-1,status=200;
  if(req.headers.range){
    const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
    if(match){start=match[1]?Number(match[1]):Math.max(0,size-Number(match[2]));end=match[1]&&match[2]?Math.min(size-1,Number(match[2])):size-1;}
    if(!match||start>end||start>=size){res.writeHead(416,{'Content-Range':`bytes */${size}`});return res.end();}
    status=206;
  }
  const headers={'Content-Type':MIME[extname(fp)]||'application/octet-stream',
    'Content-Length':end-start+1,'Accept-Ranges':'bytes','Cache-Control':'no-cache'};
  if(status===206)headers['Content-Range']=`bytes ${start}-${end}/${size}`;
  res.writeHead(status,headers);
  if(req.method==='HEAD')return res.end();
  const stream=createReadStream(fp,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
});}

if(process.argv[1]&&['serve.mjs','editor-server.mjs'].includes(process.argv[1].split(/[\\/]/).at(-1))){
  const server=createServer();
  server.on('error',e=>{console.error(`演示服务启动失败 ${e.message}`);process.exitCode=1;});
  server.listen(PORT,'127.0.0.1',()=>console.log(`战役演示 http://127.0.0.1:${PORT}/play.html?pkg=packages/chibi-full/battlefield.json`));
}
