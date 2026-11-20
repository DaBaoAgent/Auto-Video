(() => {
  const { W,H,shape,rect,circle,line,text,layer,rng,silk,progress,mix,register }=Paper;
  const { ellipse,polygon,limb,joint }=Hand;
  const pigments={
    bay:["#562b32","#874337","#b36140","#d08854","#e4ab6e","#332c31"],
    cream:["#5d4d51","#91706a","#b79376","#d5ae8d","#f2ce9c","#655359"],
    foal:["#573138","#834845","#a76553","#c58a66","#deb18a","#472d34"],
  };
  let sky,land,stones;

  function knife(c,x,y,w,h,a,dark,color,light){
    c.save();c.translate(x,y);c.rotate(a);
    polygon(c,[[0,0],[w*.76,-h*.34],[w,-h*.05],[w*.86,h*.57],[w*.21,h*.89],[-w*.04,h*.38]],dark);
    polygon(c,[[1,0],[w*.76,-h*.35],[w,-h*.10],[w*.78,h*.40],[w*.18,h*.62],[-w*.02,h*.24]],color);
    line(c,[[.05*w,h*.16],[w*.40,-h*.045],[w*.85,-h*.24]],light,Math.max(.48,.13*h));
    c.restore();
  }

  function impasto(c,d,base,colors,bounds,seed,count,slope){
    c.save();c.clip(Paper.path(d));
    const [x,y,w,h]=bounds, rand=rng(seed);
    rect(c,x,y,w,h,base);
    for(let i=0;i<count;i++){
      const x0=x+rand()*w,y0=y+rand()*h,l=4+rand()*33,thick=1.5+rand()*9;
      knife(c,x0,y0,l,thick,slope+(rand()-.5)*.64,colors[0],colors[1+i%3],colors[4]);
    }
    c.restore();
  }

  function hill(c,d,base,cols,bounds,seed,count){
    impasto(c,d,base,cols,bounds,seed,count,.09);
  }

  function build(){
    const reds=["#61424b","#a67161","#b47760","#bc7d56","#e5aa6b70"];
    const greens=["#4d554f","#85806a","#9c916c","#7a7c63","#c5b38376"];
    sky=layer(c=>{
      rect(c,0,0,W,H,"#e7af77");
      const r=rng(781);
      const colors=["#a57f82","#b18a86","#bf8e87","#e1a58c","#d69b86","#e7b183","#edb37a","#edb880","#e7a880"];
      for(let y=0;y<331;y+=8)for(let x=-65;x<W+20;x+=63){
        const h=5+r()*13,w=43+r()*87,x0=x+r()*41;
        knife(c,x0,y+r()*9,w,h,-.12+r()*.19,"#b7816d89",colors[Math.min(8,Math.floor(y/40)+(r()>.7?1:0))],"#f2c5917a");
      }
      const sun=c.createRadialGradient(999,235,20,999,235,143);
      sun.addColorStop(0,"#ffe4abcc");sun.addColorStop(1,"#ffc79100");
      circle(c,999,235,143,sun);
      ellipse(c,1012,232,60,58,.06,"#f6d198");
      for(let i=0;i<17;i++)knife(c,920+r()*141,193+r()*76,24+r()*99,3+r()*4,-.12,
        "#b28b8360",i%2?"#dd9f8da0":"#e4a5818f","#f5ba8970");
      hill(c,"M0 305L136 204 196 208 255 198 336 225 403 222 510 275 570 235 667 245 773 307 860 282 915 301 1030 269 1169 220 1280 246V545H0Z",
        "#85838b",["#807479","#939296","#a3908c","#918689","#dbc1a37f"],[0,193,W,356],735,1350);
      hill(c,"M-10 404L176 303 260 302 353 320 393 310 557 344 665 300 730 349 836 320 957 332 1093 292 1280 304V595H-10Z",
        "#9a8177",["#82676b","#ad9382","#9a807b","#b49683","#d8ba9376"],[0,292,W,304],776,1070);
    });
    land=layer(c=>{
      hill(c,"M-30 436Q208 319 389 388Q660 421 823 371Q1094 326 1300 349V735H-30Z",
        "#777761",greens,[0,349,W,370],924,1580);
      hill(c,"M-10 569Q189 472 459 463Q673 411 826 438Q1122 389 1298 471V737H-10Z",
        "#977654",["#6a654e","#a08d65","#a37a56","#b09165","#d6aa757b"],[0,396,W,325],3116,1150);
      hill(c,"M-21 627Q167 562 349 548Q628 552 846 496Q1087 490 1303 531V690Q1067 659 909 676Q633 723 289 709H-21Z",
        "#b57654",reds,[0,489,W,244],332,1140);
      hill(c,"M-13 673Q183 616 432 629Q695 649 926 605Q1140 604 1300 665V731H-13Z",
        "#7c6649",["#605247","#847156","#96805c","#a08058","#dbb27c7f"],[0,600,W,133],182,640);
      const r=rng(9308);
      for(let i=0;i<340;i++){
        const x=r()*W,y=367+r()*324;
        knife(c,x,y,5+r()*17,1.7+r()*4,-1.28+(r()-.5)*.65,"#62584975",
          i%4?"#c6a37085":"#d5b17e9e","#e6bc808d");
      }
      for(const [x,y,s] of [[112,423,.56],[215,441,.74],[1015,403,.44],[1082,411,.62],[1153,440,.64],[1221,443,.65]]){
        const r=rng(x);
        for(let i=0;i<24;i++){
          const a=r()*Math.PI*2,dist=r()*58*s;
          knife(c,x+Math.cos(a)*dist,y+Math.sin(a)*dist*.52,6+r()*29*s,4+r()*6*s,a,
            "#575c4d","#7e7b59","#a3a3738c");
        }
      }
    });
    stones=layer(c=>{
      const r=rng(81456);
      for(let i=0;i<70;i++){
        const s=.2+r()*.9,x=r()*W,y=662+r()*64;
        knife(c,x,y,12+24*s,3+s*7,(r()-.5)*.66,"#513e3a",
          i%3?"#8c7058":"#ba8966",i%4?"#c49d738c":"#dcb486bd");
      }
      for(const [x,y] of [[61,646],[185,697],[238,673],[901,718],[1130,653],[1226,708]]){
        for(let j=0;j<24;j++) {
          const dx=(r()-.5)*95,dy=r()*20,tipX=dx+(r()-.42)*31,tipY=dy-11-r()*65;
          knife(c,x+dx,y+dy,Math.hypot(tipX-dx,tipY-dy),1.2+r()*4,Math.atan2(tipY-dy,tipX-dx),
            "#4c5146",["#7a7953","#a29159","#a98b5b","#908756"][j%4],"#e6ba7c8b");
          if(j%6===0)ellipse(c,x+tipX,y+tipY,3.8,2.29,-.35,j%3?"#c59877":"#9e706e");
        }
      }
    });
  }

  function hoof(c,p,groundAngle,color){
    c.save();c.translate(...p);c.rotate(groundAngle);
    shape(c,"M-10-7L5-7 13 2 10 11-9 10-14 5Z",color,"#3c2c32",1.7);
    shape(c,"M-11-7L5-7 12 1 0-1-9-1Z","#bf8b6899");
    c.restore();
  }

  function leg(c,x,y,phase,hind,far,col){
    const stand=phase<.61,p=stand?phase/.61:(phase-.61)/.39;
    const lift=stand?0:Math.sin(p*Math.PI)*(hind?56:67);
    const foot=[x+(stand?mix(52,-42,p):mix(-42,52,p)),156-lift];
    const roots=[x,y];
    const knee=joint(roots,foot,hind?71:63,hind?83:90,hind?-1:1);
    const core=far?col[0]:col[2],edge=col[0];
    limb(c,roots,knee,hind?23:17,11,core,edge,2.7);
    const hock=[mix(knee[0],foot[0],.37)+(hind?9:-3),mix(knee[1],foot[1],.48)];
    limb(c,knee,hock,10.3,7.9,far?col[0]:col[1],edge,2.25);
    limb(c,hock,foot,7.2,5.4,far?col[0]:col[2],edge,1.8);
    line(c,[[knee[0]+4,knee[1]],[hock[0]+3,hock[1]],[foot[0]+2,foot[1]-4]],
      far?col[1]:col[3],1.7);
    hoof(c,foot,stand?.05:.88*Math.sin(p*Math.PI),col[5]);
  }

  function horse(c,x,y,s,t,code,offset){
    const col=pigments[code],p=t*1.56+offset,phase=d=>((p+d)%1+1)%1;
    const spring=4.6*Math.sin(Math.PI*2*p),neckRise=7.8*Math.sin(p*Math.PI*2-.6);
    c.save();c.translate(x,y+spring);c.scale(s,s);
    ellipse(c,-10,154-spring,200,21,0,"#5f4d4060");
    const tail=14*Math.sin(t*7.4+offset);
    c.beginPath();c.moveTo(-125,-24);
    c.bezierCurveTo(-175,-54,-159,21+tail,-225,48+tail);
    c.bezierCurveTo(-189,54+tail,-155,21+tail,-146,-1);c.lineTo(-125,-5);c.closePath();
    c.fillStyle=col[5];c.fill();c.strokeStyle=col[0];c.lineWidth=2;c.stroke();
    for(let i=0;i<9;i++){
      c.beginPath();c.moveTo(-137,-17-i*.5);c.bezierCurveTo(-164,-49-i,-156,20+tail,-220+i*3,46+tail);
      c.strokeStyle=i%4?"#81564d":"#be8b65";c.lineWidth=1.1;c.stroke();
    }
    leg(c,-95,6,phase(.39),true,true,col);
    leg(c,74,16,phase(.06),false,true,col);
    const d="M-132-6Q-146-27-121-55Q-92-79-45-67Q-7-57 31-64Q63-69 79-53Q101-40 100-6Q97 21 72 39Q36 53-9 44Q-61 25-90 45Q-123 35-132-6Z";
    impasto(c,d,col[2],[col[0],col[2],col[3],col[1],col[4]+"86"],[-151,-81,260,141],71,185,-.05);
    shape(c,d,null,col[0],3.0);
    shape(c,"M-126 3Q-99 12-84-5Q-69-14-45-5Q-62 13-90 25Q-109 31-126 3Z",col[1]);
    shape(c,"M-84-61Q-35-40 7-49L46-60Q85-61 91-30Q75-43 50-35Q16-25-31-33Z",col[3]);
    shape(c,"M-33 28Q8 31 41 13Q67 10 85-2Q79 27 58 36Q25 47-33 28Z",col[1]);
    leg(c,-101,4,phase(.69),true,false,col);
    leg(c,72,18,phase(.23),false,false,col);
    c.save();c.translate(63,-28);c.rotate(neckRise*.009);
    const neck="M-18 70Q-2 34 11 5Q21-46 52-89Q54-107 72-118Q102-134 122-117L137-94 129-69 105-52Q80-52 75-23Q63 18 40 52Q16 79-18 70Z";
    impasto(c,neck,col[2],[col[0],col[3],col[2],col[1],col[4]+"8f"],[-27,-138,168,227],133,194,-.84);
    shape(c,neck,null,col[0],2.75);
    const fly=10*Math.sin(t*7.8);
    c.beginPath();c.moveTo(101,-124);
    c.bezierCurveTo(56,-147,31,-91,9,-47);
    c.bezierCurveTo(-5,-10,-3,0,-23-fly,19);
    c.bezierCurveTo(21,7,30,-44,53,-70);
    c.bezierCurveTo(72,-90,88,-110,101,-124);
    c.fillStyle=col[5];c.fill();
    const head="M74-119Q95-131 110-118Q124-111 131-95L154-69Q165-53 152-45L132-41 119-46 108-65Q94-63 80-80Q63-98 74-119Z";
    shape(c,head,col[3],col[0],2.4);
    shape(c,"M101-124Q114-146 124-148L123-128 116-117ZM88-122Q84-147 73-153L74-128 81-115Z",col[2],col[0],1.9);
    shape(c,"M130-77L157-64Q164-51 151-45L135-42 120-51Z",col[1]);
    shape(c,"M101-115Q113-118 126-102L137-91 119-92Z",col[4]);
    ellipse(c,116,-98,6.2,4.4,.14,col[0]);
    circle(c,118,-99,1.5,col[4]);ellipse(c,149,-60,4.5,2.8,.28,col[0]);
    line(c,[[131,-47],[145,-46],[152,-49]],col[0],1.65);
    for(let i=0;i<8;i++)knife(c,21+i*7,15-i*13,24,4,-.89,col[0]+"70",col[3]+"98",col[4]+"80");
    c.restore();
    c.restore();
  }

  function dust(c,t){
    const r=rng(57);
    for(let i=0;i<51;i++){
      const a=(t*.60+i/51)%1,x=300+t*49-(120+r()*202)*a+r()*115,y=610-44*a+r()*30;
      c.save();c.globalAlpha=(1-a)*.44;
      knife(c,x,y,5+25*a,2.2+a*7,-.19,"#b7835e88",i%3?"#c998718e":"#dbaf837b","#e9ba8575");
      c.restore();
    }
  }

  function draw(c,t){
    c.drawImage(sky,0,0);
    c.drawImage(land,0,0);
    const reveal=progress(t,.25,3.8);
    c.save();c.globalAlpha=(1-reveal)*.22;
    c.fillStyle="#d3a373";
    c.fillRect(0,418,W,269);
    c.restore();
    const r=rng(703);
    for(let i=0;i<62;i++){
      const y=431+r()*223,w=8+r()*36,x=r()*W;
      if(progress(t,(i%13)*.22,1.1)>0){
        const p=progress(t,(i%13)*.22,1.1);
        knife(c,x,y,w*p,1.5+r()*6,-.07,"#9f765a","#c89564","#e4b589b8");
      }
    }
    horse(c,422+55*t,413,.49,t,"foal",.44);
    horse(c,152+64*t,444,.67,t,"cream",.68);
    dust(c,t);
    horse(c,383+66*t,483,.88,t,"bay",.12);
    c.drawImage(stones,0,0);
    const g=c.createRadialGradient(150,62,35,204,94,313);
    g.addColorStop(0,"#684e637a");g.addColorStop(1,"#875f6900");
    rect(c,0,0,W,420,g);
    text(c,"赤土牧归",79,117,73,"#f5d5a2","Brush");
    line(c,[[87,135],[263,135],[318,130]],"#f1c38aa6",1.8);
    silk(c,1.20);
  }
  register("youhua",draw,build);
})();
