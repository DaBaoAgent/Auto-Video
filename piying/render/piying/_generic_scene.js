// ============ 全片新增：通用场景引擎 + 剪影变体（炎帝） ============
// 新增资产在基底页之外由注入脚本合并进 ASSETS

// ---- 类型配置表：type → 渲染参数 ----
const TYPE_CFG={
 'civ-big':{kind:'bigword',word:'每一件事',sub:'都够别的文明记几百年',color:'gold'},
 'unstable-q':{kind:'bigword',word:'不稳定',color:'red',icons:['q','q']},
 'origin-big':{kind:'bigword',word:'农业的起源',color:'gold'},
 'civ-bigword':{kind:'bigword',word:'差了一个文明',color:'red'},
 'agri-origin':{kind:'bigword',word:'起点是农业',sub:'不是石头工具 不是火',color:'jade'},
 'staple-big':{kind:'bigword',word:'七千年前就定了',sub:'你今天吃的主食',color:'gold'},
 'med-origin':{kind:'bigword',word:'最早的药物学',sub:'人类历史上',color:'gold'},
 'bencao-big':{kind:'bigword',word:'神农本草经',sub:'中国最早的药物学著作',color:'gold',book:true},
 'clinical-big':{kind:'bigword',word:'最早的临床实验',color:'red'},
 'principle-big':{kind:'bigword',word:'刺激穴位 调节气血',color:'jade',icons:['dot','dot']},
 'who-confirm':{kind:'bigword',word:'WHO承认',sub:'世界卫生组织：针灸对某些症状有效',color:'jade'},
 'save-big':{kind:'bigword',word:'又是一件救命的事',color:'jade'},
 'commerce-big':{kind:'bigword',word:'商业之父',sub:'中国最早的',color:'gold'},
 'market-big':{kind:'bigword',word:'日中为市',sub:'中国最早的市场',color:'gold'},
 'nofight-big':{kind:'bigword',word:'别打了',color:'red'},
 'not-capital':{kind:'bigword',word:'不是资本主义',sub:'是中国人想出来的办法',color:'cream'},
 'peace-origin':{kind:'bigword',word:'和平的起源',sub:'也是商业的起源',color:'jade'},
 'huaxia-big':{kind:'bigword',word:'华夏族',sub:'两个部落合并了',color:'jade'},
 'yanhz-big':{kind:'bigword',word:'炎黄子孙',color:'gold'},
 'alliance-big':{kind:'bigword',word:'炎黄部落联盟',sub:'一起打败蚩尤 统一中亚？统一中原',color:'jade'},
 'huaxia-origin':{kind:'bigword',word:'华夏民族的起源',color:'gold'},
 'pottery-big':{kind:'bigword',word:'发明了陶器',color:'gold'},
 'yan-fire':{kind:'bigword',word:'炎＝两个火',color:'red',fire:true},
 'heritage-big':{kind:'bigword',word:'活在遗产里',sub:'你每天都活在他七千年前的遗产里',color:'gold'},
 'shenong-start':{kind:'bigword',word:'从神农氏开始',sub:'不是从工业革命开始',color:'gold'},
 'bone-big':{kind:'bigword',word:'刻在骨子里',color:'red'},
 'only-civ':{kind:'bigword',word:'唯一没中断的古文明',sub:'种地·治病·做生意 七千年没断',color:'gold'},
 'plant-big':{kind:'center',sp:'farmer',word:'大面积种植'},
 'whatdid':{kind:'center',sp:'yandi-front',word:'神农氏干了什么？'},
 'start-center':{kind:'center',sp:'yandi-front',word:'中国农业的起点',sub:'就是神农氏'},
 'store-center':{kind:'center',sp:'pot',word:'储粮',sats:['防灾年','养人口']},
 'trust-center':{kind:'center',sp:'yandi-front',word:'源头是他',sub:'书是后人托名'},
 'source-center':{kind:'center',sp:'yandi-front',word:'源头在神农',sub:'七千年前'},
 'bian-center':{kind:'center',sp:'stone',word:'砭石',sats:['磨尖的石头','能止痛','能治病']},
 'needle-link':{kind:'center',sp:'stone',word:'就是这根针',sub:'你今天扎的针灸'},
 'birth-intro':{kind:'center',sp:'yandi-front',word:'妇产科祖师爷',sats:['教接生','护产妇']},
 'agri-first':{kind:'center',sp:'yandi-front',word:'最早进入农业文明',sub:'所以最厉害'},
 'bowl-center':{kind:'center',sp:'pot',word:'你今天用的碗'},
 'market-rule':{kind:'center',sp:'booth',word:'日中为市',sub:'以物换物'},
 'today-market':{kind:'center',sp:'booth',word:'菜市场·超市',sub:'源头都是日中为市'},
 'hardendure':{kind:'center',sp:'farmer',word:'硬扛',sub:'没有药 没有医生'},
 'duo-move':{kind:'duo',a:{sp:'farmer',lb:'打猎·天天搬家'},b:{sp:'yandi-front',lb:'种地·定居'}},
 'duo-live':{kind:'duo',a:{lb:'扛过去·活'},b:{lb:'扛不过去·死'},accent:'red'},
 'swap-duo':{kind:'duo',a:{sp:'pot',lb:'粮食 换 陶器'},b:{sp:'skin',lb:'兽皮 换 石斧'}},
 'duo-brothers':{kind:'duo',a:{sp:'yandi-front',lb:'炎帝·居姜水·姓姜'},b:{sp:'huangdi',lb:'黄帝·居姬水·姓姬'},q:'兄弟'},
 'rel-a':{kind:'duo',a:{sp:'rice2',lb:'每碗米饭·尝出来的'},b:{sp:'stone',lb:'每一针·发明的'}},
 'rel-b':{kind:'duo',a:{sp:'luobo',lb:'每把菜·定下的'},b:{sp:'pot',lb:'每个碗·发明的'}},
 'jiangji-timeline':{kind:'timeline',nodes:['居姜水·姓姜','居姬水·姓姬','各居一方']},
 'evolution':{kind:'timeline',nodes:['石头','骨头','青铜','不锈钢']},
 'never-stop':{kind:'timeline',nodes:['在种地','在治病','在做买卖'],tail:'七千年没断过'},
 'behind-row':{kind:'row3',items:['炎部落','黄部落','蚩尤部落']},
 'three-test':{kind:'row3',items:['尝植物','尝矿物','尝动物']},
 'three-doing':{kind:'row3',items:['在种地','在尝百草','在做买卖']},
 'west-q':{kind:'question',word:'崇洋媚外？'},
 'norelation-q':{kind:'question',word:'跟你没关系？'},
 'why-yan':{kind:'question',word:'为什么叫炎？'},
 'war-swap':{kind:'sil',variant:'war'},
 'sil-hunt':{kind:'sil',variant:'hunt'},
 'sil-village':{kind:'sil',variant:'village'},
 'sil-clinic':{kind:'sil',variant:'clinic'},
 'sil-clinic2':{kind:'sil',variant:'clinic2'},
 'sil-birth':{kind:'sil',variant:'birth'},
 'sil-market':{kind:'sil',variant:'market'},
 'sil-boil':{kind:'sil',variant:'boil'},
 'sil-pottery':{kind:'sil',variant:'pottery'},
 'sil-banquan':{kind:'sil',variant:'banquan'},
 'sil-zhuolu':{kind:'sil',variant:'zhuolu'},
 'sil-cave':{kind:'sil',variant:'cave'},
};

// ---- 通用：大字场景 ----
function scBigWord(cfg,sc,t,tl){
  const p=eob(clamp(tl/0.45,0,1));
  const color=COL[cfg.color]||COL.gold;
  bigText(cfg.word,960,cfg.sub?470:520,Math.min(150,1720/Math.max(4,cfg.word.length)*1.35),color,COL.bg,0,p);mv('bw-word');
  const u=clamp((tl-0.4)/0.5,0,1)*820;
  ctx.fillStyle=cfg.color==='red'?COL.gold:COL.red;ctx.fillRect(960-u/2,cfg.sub?610:660,u,12);mv('bw-line');
  if(cfg.sub){const p2=eob(clamp((tl-0.55)/0.4,0,1));
    bigText(cfg.sub,960,730,66,COL.cream,null,0,p2);mv('bw-sub');}
  if(cfg.fire){for(let i=0;i<2;i++){const fx=960+(i?110:-110),f=0.85+0.15*Math.sin(t*7+i*2);
    ctx.save();ctx.translate(fx,830);ctx.fillStyle=i?COL.red:COL.gold;
    ctx.beginPath();ctx.moveTo(0,-52*f);ctx.quadraticCurveTo(30,-10,20,22);ctx.quadraticCurveTo(8,40,0,40);
    ctx.quadraticCurveTo(-8,40,-20,22);ctx.quadraticCurveTo(-30,-10,0,-52*f);ctx.fill();ctx.restore();mv('fire'+i);}}
  if(cfg.icons){for(let i=0;i<cfg.icons.length;i++){const pp=clamp((tl-0.8-i*0.4)/0.35,0,1);if(pp<=0)continue;
    const a=t*1.2+i*2.5,r=470;ctx.save();ctx.globalAlpha=pp;
    ctx.translate(960+Math.cos(a)*r,540+Math.sin(a)*r*0.42);
    ctx.fillStyle=COL.gold;ctx.beginPath();ctx.arc(0,0,10,0,7);ctx.fill();ctx.restore();mv('bw-ic'+i);}}
  if(cfg.book){const bp=clamp((tl-0.7)/0.5,0,1);
    if(bp>0){ctx.save();ctx.translate(1560,830);ctx.scale(0.7,0.7);ctx.globalAlpha=bp;
      ctx.fillStyle=COL.cream;ctx.beginPath();ctx.roundRect(-90,-70,180,140,10);ctx.fill();
      ctx.fillStyle=COL.gold;for(let i=0;i<3;i++)ctx.fillRect(-64,-44+i*34,128*(0.5+0.5*Math.sin(t*2+i)),10);
      ctx.restore();mv('bw-book');}}
}
// ---- 通用：三卡 ----
function scRow3(cfg,sc,t,tl){
  const xs=[420,960,1500];
  for(let i=0;i<3;i++){
    const p=eob(clamp((tl-0.15-i*0.45)/0.4,0,1));if(p<=0)continue;
    const bob=Math.sin(t*1.6+i*1.7)*7;
    card(xs[i],540,440,400,{stroke:i%2?COL.jade:COL.gold,scale:p,fill:'rgba(255,255,255,0.06)'});
    bigText(cfg.items[i],xs[i],600+bob,84,COL.white,null,0,p);
    ctx.save();ctx.globalAlpha=0.5*p;ctx.strokeStyle=COL.gold;ctx.lineWidth=4;
    ctx.beginPath();ctx.arc(xs[i],480,34+Math.sin(t*2+i)*3,0,7);ctx.stroke();ctx.restore();mv('r3-ring'+i);
    mv('r3-card'+i);
  }
  mv('row3');
}
// ---- 通用：时间线 ----
function scTimeline(cfg,sc,t,tl){
  const n=cfg.nodes.length,x0=960-((n-1)*260)/2,y=540;
  ctx.strokeStyle='rgba(232,184,75,0.55)';ctx.lineWidth=6;ctx.lineCap='round';
  const lg=clamp((tl-0.3)/1.4,0,1)*(n-1)*260;
  ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x0+lg,y);ctx.stroke();mv('tl-line');
  for(let i=0;i<n;i++){
    const p=eob(clamp((tl-0.15-i*0.4)/0.35,0,1));if(p<=0)continue;
    const bob=Math.sin(t*1.5+i*1.6)*6;
    ctx.save();ctx.translate(x0+i*260,y+bob);
    ctx.fillStyle=COL.bg;ctx.strokeStyle=i%2?COL.jade:COL.gold;ctx.lineWidth=6;
    ctx.beginPath();ctx.arc(0,0,46,0,7);ctx.fill();ctx.stroke();
    ctx.fillStyle=i%2?COL.jade:COL.gold;ctx.beginPath();ctx.arc(0,0,18+Math.sin(t*3+i)*2,0,7);ctx.fill();
    ctx.restore();mv('tl-node'+i);
    bigText(cfg.nodes[i],x0+i*260,y+120,68,COL.cream,null,0,p);
  }
  if(cfg.tail){const p=eob(clamp((tl-1.6)/0.4,0,1));
    if(p>0){card(960,830,700,140,{stroke:COL.gold,scale:p,fill:'rgba(232,184,75,0.12)'});
      bigText(cfg.tail,960,830,72,COL.gold,null,0,p);mv('tl-tail');}}
  mv('timeline');
}
// ---- 通用：双卡对峙 ----
function scDuo(cfg,sc,t,tl){
  const ac=cfg.accent?COL[cfg.accent]:COL.jade;
  const defs=[[cfg.a,480,COL.gold],[cfg.b,1440,ac]];
  for(let i=0;i<2;i++){
    const d=defs[i][0],x=defs[i][1];
    const p=eob(clamp((tl-0.1-i*0.5)/0.4,0,1));if(p<=0)continue;
    const bob=Math.sin(t*1.5+i*2)*8;
    card(x,540,520,560,{stroke:defs[i][2],scale:p,fill:'rgba(255,255,255,0.055)'});
    if(d.sp)sprite(d.sp,x,440+bob,300,{alpha:0.98});
    bigText(d.lb,x,740,68,i?ac:COL.gold,null,0,p);
    mv('duo-card'+i);
  }
  const q=cfg.q||'VS';
  const vs=1+0.06*Math.sin(t*4);
  ctx.save();ctx.translate(960,470);ctx.rotate(Math.sin(t*1.2)*0.07);ctx.scale(vs,vs);
  ctx.fillStyle=COL.redD;ctx.beginPath();ctx.roundRect(-105,-64,210,128,20);ctx.fill();ctx.restore();
  bigText(q,960,470,84,COL.white,null,Math.sin(t*1.2)*0.07,vs);mv('duo-vs');
  mv('duo');
}
// ---- 通用：居中人物 ----
function scCenter(cfg,sc,t,tl){
  glow(960,520,360,'rgba(232,184,75,A)',0.24);
  sprite(cfg.sp,960,500+Math.sin(t*1.3)*7,450,{alpha:0.97});mv('ct-hero');
  const p=eob(clamp((tl-0.35)/0.4,0,1));
  if(cfg.word)bigText(cfg.word,960,cfg.sub?860:880,Math.min(110,1500/Math.max(4,cfg.word.length)*1.3),COL.gold,COL.bg,0,p);mv('ct-word');
  if(cfg.sub){const p2=eob(clamp((tl-0.7)/0.4,0,1));
    bigText(cfg.sub,960,965,64,COL.cream,null,0,p2);mv('ct-sub');}
  if(cfg.sats){const xs=cfg.sats.length===2?[380,1540]:[380,960,1540];
    for(let i=0;i<cfg.sats.length;i++){
      const pp=eob(clamp((tl-0.5-i*0.4)/0.35,0,1));if(pp<=0)continue;
      chip(xs[i],280,cfg.sats[i],COL.jade,tl-0.5-i*0.4,t,60);mv('ct-sat'+i);}}
  const ring=clamp(tl/1.0,0,1);
  ctx.save();ctx.strokeStyle='rgba(232,184,75,'+(0.4*(1-ring)).toFixed(3)+')';ctx.lineWidth=7;
  ctx.beginPath();ctx.arc(960,500,150+ring*380,0,7);ctx.stroke();ctx.restore();mv('ct-ring');
  mv('center');
}
// ---- 通用：问号场景 ----
function scQuestion2(cfg,sc,t,tl){
  const wob=Math.sin(t*3)*0.05;
  bigText('?',960,400,300,COL.red,COL.gold,wob,eob(clamp(tl/0.4,0,1)));mv('q2-mark');
  if(cfg.word){const p=eob(clamp((tl-0.3)/0.4,0,1));
    bigText(cfg.word,960,720,100,COL.cream,null,0,p);mv('q2-word');}
  for(let i=0;i<5;i++){const a=t*0.9+i*1.26,r=430+Math.sin(t*1.2+i)*24;
    ctx.save();ctx.globalAlpha=0.85;
    ctx.translate(960+Math.cos(a)*r,400+Math.sin(a)*r*0.6);
    ctx.rotate(Math.sin(t*1.5+i)*0.2);
    ctx.fillStyle=i%2?COL.gold:COL.jade;
    ctx.beginPath();ctx.arc(0,0,9,0,7);ctx.fill();ctx.restore();mv('q2-orb'+i);}
  mv('question2');
}
// ---- 通用：章节卡 ----
function scChapterFull(sc,t,tl){
  const p=eoe(clamp(tl/0.5,0,1));
  card(960,470,980,400,{stroke:COL.gold,scale:p,fill:'rgba(232,184,75,0.10)'});
  bigText(sc.tag,960,360,64,COL.gold,null,0,p);
  bigText(sc.title,960,490,110,COL.white,null,0,p);
  mv('chap-card');
  for(let i=0;i<3;i++){const a=t*0.8+i*2.1,r=620+Math.sin(t*1.3+i)*20;
    ctx.fillStyle='rgba(232,184,75,'+(0.3+0.15*Math.sin(t*2.5+i)).toFixed(2)+')';
    ctx.beginPath();ctx.arc(960+Math.cos(a)*r,470+Math.sin(a)*r*0.5,7,0,7);ctx.fill();mv('chap-orb'+i);}
}
// ---- 通用：片尾卡 ----
function scEndcard(sc,t,tl){
  const p=eoe(clamp(tl/0.5,0,1));
  glow(960,480,420,'rgba(232,184,75,A)',0.2);
  sprite('yandi-front',960,430,380,{alpha:0.97*p,rot:Math.sin(t*1.1)*0.02});mv('ec-hero');
  bigText('炎帝',960,720,140,COL.gold,COL.bg,0,p);mv('ec-title');
  const p2=eob(clamp((tl-0.5)/0.4,0,1));
  bigText('七千年前的四件事',960,830,68,COL.cream,null,0,p2);mv('ec-sub');
  for(let i=0;i<6;i++){const a=t*1.1+i*1.05,r=480;
    ctx.fillStyle='rgba(232,184,75,'+(0.25+0.2*Math.sin(t*2.6+i)).toFixed(2)+')';
    ctx.beginPath();ctx.arc(960+Math.cos(a)*r,540+Math.sin(a)*r*0.55,6,0,7);ctx.fill();mv('ec-orb'+i);}
  ctx.save();ctx.font='500 40px "Microsoft YaHei"';ctx.fillStyle='rgba(243,234,211,'+(0.7*p2).toFixed(2)+')';
  ctx.textAlign='center';ctx.fillText('我是艾伦，遛狗去了，白了个白',960,950);ctx.restore();mv('ec-outro');
  mv('endcard');
}
// ---- 通用分发 ----
function renderGeneric(cfg,sc,t,tl){
  if(cfg.kind==='bigword')scBigWord(cfg,sc,t,tl);
  else if(cfg.kind==='row3')scRow3(cfg,sc,t,tl);
  else if(cfg.kind==='timeline')scTimeline(cfg,sc,t,tl);
  else if(cfg.kind==='duo')scDuo(cfg,sc,t,tl);
  else if(cfg.kind==='center')scCenter(cfg,sc,t,tl);
  else if(cfg.kind==='question')scQuestion2(cfg,sc,t,tl);
  else if(cfg.kind==='sil')scSilVariant(cfg.variant,sc,t,tl);
}
// ---- 剪影变体 ----
function silEnvShape(x,y,w,h,t,i){ // 暗色环境形+金边
  ctx.save();ctx.fillStyle='rgba(10,15,17,0.92)';ctx.strokeStyle='rgba(232,184,75,0.25)';ctx.lineWidth=3;
  ctx.beginPath();ctx.roundRect(x-w/2,y-h,w,h,8);ctx.fill();ctx.stroke();ctx.restore();mv('env'+i);
}
function scSilVariant(v,sc,t,tl){
  const mid=tl*0.5;
  if(v==='hunt'){
    silSprite('farmer',700,610,420,t,1);
    // 兔子剪影
    ctx.save();ctx.translate(1150+Math.sin(t*2.2)*60,760+Math.sin(t*5)*8);ctx.scale(1.4,1.4);
    ctx.fillStyle='rgba(200,190,170,0.85)';ctx.beginPath();ctx.arc(0,0,20,0,7);ctx.fill();
    ctx.beginPath();ctx.arc(-14,-22,10,0,7);ctx.fill();
    ctx.beginPath();ctx.ellipse(-18,-40,5,14,-0.2,0,7);ctx.fill();ctx.beginPath();ctx.ellipse(-8,-40,5,14,0.15,0,7);ctx.fill();ctx.restore();mv('rabbit');
    // 老虎剪影
    ctx.save();ctx.translate(1480+Math.sin(t*1.3)*30,700);ctx.scale(2.2,2.2);
    ctx.fillStyle='rgba(142,47,44,0.75)';ctx.beginPath();ctx.ellipse(0,0,52,26,0,0,7);ctx.fill();
    ctx.beginPath();ctx.arc(58,-16,20,0,7);ctx.fill();
    for(let i=0;i<3;i++){ctx.fillStyle='rgba(10,15,17,0.8)';ctx.fillRect(-30+i*22,-24,7,22);}
    ctx.restore();mv('tiger');
    for(let i=0;i<4;i++){ctx.strokeStyle='rgba(255,255,255,0.25)';ctx.lineWidth=4;
      ctx.beginPath();ctx.moveTo(900+i*90+Math.sin(t*6+i)*10,560);ctx.lineTo(860+i*90,640);ctx.stroke();mv('hspeed'+i);}
  }else if(v==='village'){
    for(let i=0;i<3;i++)silEnvShape(420+i*400,820-((i%2)*60),240,190,t,i);
    for(let i=0;i<3;i++){const smk=(t*40+i*37)%130;
      ctx.fillStyle='rgba(255,255,255,'+(0.25-smk*0.0015).toFixed(2)+')';
      ctx.beginPath();ctx.arc(420+i*400+Math.sin(t*2+i)*10,650-smk,10+smk*0.1,0,7);ctx.fill();mv('smoke'+i);}
    silSprite('farmer',960,830,330,t,2);
    sprout(1500,H-165,1.2,clamp((tl-0.8)/1.2,0,1),t);
  }else if(v==='clinic'||v==='clinic2'){
    silSprite('yandi-side',760,600,440,t,1);
    for(let i=0;i<3;i++){const pp=clamp((tl-0.4-i*0.5)/0.4,0,1);if(pp<=0)continue;
      sprite('herb',1080+i*190,560+Math.sin(t*2+i)*14,150,{alpha:0.9,rot:Math.sin(t*2.4+i)*0.1});mv('cl-herb'+i);}
    if(v==='clinic2'){
      for(let i=0;i<3;i++){const ph=(t*1.2+i*0.6)%1;
        ctx.fillStyle='rgba(217,83,79,'+(0.7*(1-ph)).toFixed(2)+')';
        ctx.beginPath();ctx.arc(880+ph*130,560-ph*90,8,0,7);ctx.fill();mv('toxic'+i);}
      for(let i=0;i<3;i++){const ph=(t*1.2+i*0.6+0.5)%1;
        ctx.fillStyle='rgba(232,184,75,'+(0.7*(1-ph)).toFixed(2)+')';
        ctx.beginPath();ctx.arc(940+ph*150,540-ph*70,7,0,7);ctx.fill();mv('good'+i);}
    }else{
      for(let i=0;i<4;i++){const ph=(t*1.4+i*0.4)%1;
        ctx.fillStyle='rgba(243,234,211,'+(0.6*(1-ph)).toFixed(2)+')';
        ctx.beginPath();ctx.arc(900+ph*40,560-ph*120,6,0,7);ctx.fill();mv('chew'+i);}
    }
  }else if(v==='birth'){
    silSprite('herbw',820,620,440,t,1);
    const pu=1+0.06*Math.sin(t*4.5);
    ctx.save();ctx.translate(1200,680);ctx.scale(pu,pu);
    ctx.strokeStyle=COL.gold;ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,60,0,7);ctx.stroke();
    ctx.fillStyle='rgba(243,234,211,0.9)';ctx.beginPath();ctx.ellipse(0,0,34,22,0,0,7);ctx.fill();
    ctx.beginPath();ctx.arc(0,-20,14,0,7);ctx.fill();ctx.restore();mv('baby');
    for(let i=0;i<3;i++){const ph=(t*4.5+i*0.33)%1;
      ctx.strokeStyle='rgba(232,184,75,'+(0.5*(1-ph)).toFixed(2)+')';ctx.lineWidth=4;
      ctx.beginPath();ctx.arc(1200,680,60+ph*80,0,7);ctx.stroke();mv('pulse'+i);}
  }else if(v==='market'){
    sprite('booth',960,640,440,{alpha:0.9,rot:Math.sin(t*1.2)*0.015});mv('booth2');
    silSprite('farmer',520,760,340,t,1);silSprite('farmer',1400,760,340,t,2);
    for(let i=0;i<3;i++){const ph=(t*0.9+i*0.33)%1;
      ctx.strokeStyle='rgba(232,184,75,'+(0.6*Math.sin(ph*Math.PI)).toFixed(2)+')';ctx.lineWidth=5;
      ctx.beginPath();ctx.arc(960,700,180+ph*60,-0.6+ph*1.2,0.2+ph*1.2);ctx.stroke();mv('swap-arc'+i);}
  }else if(v==='boil'){
    silEnvShape(960,760,320,120,t,1); // 石台
    ctx.save();ctx.translate(960,560);
    ctx.fillStyle='rgba(120,80,80,0.85)';ctx.beginPath();ctx.arc(0,0,54,0,7);ctx.fill();
    ctx.fillStyle='rgba(217,83,79,0.7)';ctx.beginPath();ctx.arc(-8,-8,40,0,7);ctx.fill();ctx.restore();mv('hotstone');
    for(let i=0;i<3;i++){const f=0.8+0.2*Math.sin(t*8+i*2);
      ctx.save();ctx.translate(820+i*140,840);ctx.fillStyle=i?COL.red:COL.gold;
      ctx.beginPath();ctx.moveTo(0,-60*f);ctx.quadraticCurveTo(32,-10,22,26);ctx.quadraticCurveTo(0,46,-22,26);ctx.quadraticCurveTo(-32,-10,0,-60*f);ctx.fill();ctx.restore();mv('boilfire'+i);}
    for(let i=0;i<5;i++){const ph=(t*0.8+i*0.2)%1;
      ctx.fillStyle='rgba(255,255,255,'+(0.4*(1-ph)).toFixed(2)+')';
      ctx.beginPath();ctx.arc(960+Math.sin(t*2+i)*60,480-ph*160,8+ph*8,0,7);ctx.fill();mv('steam'+i);}
  }else if(v==='pottery'){
    silSprite('yandi-side',700,600,430,t,1);
    const gp=clamp((tl-0.6)/1.6,0,1);
    ctx.save();ctx.translate(1250,700);ctx.scale(gp,gp);
    ctx.fillStyle='rgba(138,90,59,0.9)';ctx.beginPath();
    ctx.moveTo(-70,-90);ctx.quadraticCurveTo(-95,30,-60,80);ctx.lineTo(60,80);ctx.quadraticCurveTo(95,30,70,-90);ctx.closePath();ctx.fill();
    ctx.strokeStyle=COL.gold;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-70,-70);ctx.quadraticCurveTo(0,-92,70,-70);ctx.stroke();ctx.restore();mv('claypot');
    for(let i=0;i<2;i++){const f=0.8+0.2*Math.sin(t*9+i*2.4);
      ctx.save();ctx.translate(1160+i*180,860);ctx.fillStyle=i?COL.gold:COL.red;
      ctx.beginPath();ctx.moveTo(0,-52*f);ctx.quadraticCurveTo(28,-8,20,24);ctx.quadraticCurveTo(0,42,-20,24);ctx.quadraticCurveTo(-28,-8,0,-52*f);ctx.fill();ctx.restore();mv('potfire'+i);}
  }else if(v==='banquan'){
    silSprite('yandi-front',560,590,420,t,1);
    silSprite('huangdi',1360,590,420,t,2);
    const vs=1+0.06*Math.sin(t*4);
    ctx.save();ctx.translate(960,450);ctx.rotate(Math.sin(t*1.2)*0.07);ctx.scale(vs,vs);
    ctx.fillStyle=COL.redD;ctx.beginPath();ctx.roundRect(-105,-64,210,128,20);ctx.fill();ctx.restore();
    bigText('三仗',960,450,84,COL.white,null,Math.sin(t*1.2)*0.07,vs);mv('bq-vs');
    for(let i=0;i<3;i++){const ph=clamp((tl-0.5-i*0.7)/0.5,0,1);if(ph<=0)continue;
      ctx.save();ctx.globalAlpha=0.6*Math.sin(ph*Math.PI);
      ctx.strokeStyle=COL.gold;ctx.lineWidth=6;
      ctx.beginPath();ctx.arc(960,560,140+i*60,0,7);ctx.stroke();ctx.restore();mv('bq-wave'+i);}
  }else if(v==='zhuolu'){
    silSprite('yandi-front',420,600,400,t,1);
    silSprite('huangdi',760,620,380,t,2);
    silSprite('chiyou',1400,600,480,t,3);
    for(let i=0;i<4;i++){const ph=(t*1.1+i*0.25)%1;
      ctx.fillStyle='rgba(217,83,79,'+(0.7*(1-ph)).toFixed(2)+')';
      const ax=860+ph*420;
      ctx.save();ctx.translate(ax,520+Math.sin(i*2)*60-ph*40);ctx.rotate(0.5);
      ctx.fillRect(-16,-3,32,6);ctx.restore();mv('arrow'+i);}
    ctx.save();ctx.fillStyle='rgba(10,15,17,0.9)';ctx.strokeStyle='rgba(232,184,75,0.25)';ctx.lineWidth=3;
    ctx.beginPath();ctx.roundRect(880,830,320,10,4);ctx.fill();ctx.stroke();ctx.restore();mv('z-ground');
  }else if(v==='cave'){
    ctx.save();ctx.fillStyle='rgba(10,15,17,0.92)';ctx.strokeStyle='rgba(232,184,75,0.25)';ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(480,820,300,Math.PI,0);ctx.lineTo(780,1080);ctx.lineTo(180,1080);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();mv('cave');
    for(let i=0;i<4;i++){const px=340+i*90,py=700+((i%2)*50);
      ctx.save();ctx.translate(px,py+Math.sin(t*1.5+i)*4);
      ctx.strokeStyle='rgba(217,120,79,0.8)';ctx.lineWidth=6;ctx.lineCap='round';
      ctx.beginPath();ctx.arc(0,-22,10,0,7);ctx.stroke();
      ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(0,16);ctx.moveTo(-12,0);ctx.lineTo(12,0);ctx.stroke();ctx.restore();mv('paint'+i);}
    silSprite('farmer',1280,620,420,t,2);
    sprite('rice',1560,700,190,{alpha:0.92,rot:Math.sin(t*1.2)*0.08});mv('cave-rice');
    sprout(1520,H-165,1.1,clamp((tl-1.0)/1.0,0,1),t);
  }else if(v==='war'){
    silSprite('farmer',620,620,400,t,1);
    silSprite('farmer',1300,620,400,t,2);
    for(let i=0;i<5;i++){const ph=(t*1.2+i*0.2)%1;
      ctx.fillStyle='rgba(217,83,79,'+(0.6*(1-ph)).toFixed(2)+')';
      ctx.save();ctx.translate(760+ph*400,540+Math.sin(i*2.4)*80-ph*60);ctx.rotate(0.4);
      ctx.fillRect(-14,-3,28,6);ctx.restore();mv('war-arrow'+i);}
    bigText('抢',960,330,130,COL.red,COL.bg,Math.sin(t*3)*0.04,clamp((tl-0.3)/0.4,0,1));mv('war-word');
  }
  mv('silv-'+v);
}
