(() => {
  const { W,H,shape,rect,circle,text,line,layer,rng,silk,mix,progress,register }=Paper;
  const { ellipse,limb,joint,polygon,stroke,hatching }=Hand;
  const blue="#283b9c", red="#b8233a", gold="#dbad5b", dark="#100f18";
  let hall,wall,neutral,hero;

  function gouache(c,d,color,bounds,seed,shine="#daa27642") {
    shape(c,d,color,dark,2.2);
    hatching(c,Paper.path(d),bounds,shine,seed,12,-.16);
  }

  function bench(c,x,y,s,tone){
    c.save();c.translate(x,y);c.scale(s,s);
    shape(c,"M-43 23L-42-2Q-39-18-25-20H32Q45-20 49-6L50 14 36 34-34 36Z",tone,dark,2.2);
    shape(c,"M-40 0Q-24-15-6-16L31-16Q43-16 46-8L41-3-7-4Z","#c4595677");
    line(c,[[-34,34],[-36,53]],dark,6);line(c,[[34,32],[37,49]],dark,5);
    c.restore();
  }

  function props(c,x,y,s,side=false) {
    c.save();c.translate(x,y);c.scale(side?-s:s,s);
    gouache(c,"M-76-97L5-136 162-123 150-32 141 1-67-4Z","#a16648",[-80,-140,243,150],38);
    shape(c,"M-76-97L-64-4 1 2 3-123Z","#513734",dark,3);
    shape(c,"M-79-98L5-136 163-125 163-108 4-113-77-77Z","#ca8757",dark,2);
    shape(c,"M15-109L152-105 141-10 14-4Z","#8b5340",dark,2);
    for(let i=0;i<6;i++){
      const y=-95+i*15;line(c,[[15,y],[149-i*1.3,y+1]],"#4e3030",1.8);
      line(c,[[16,y+3],[146-i*1.6,y+3]],"#ca946396",1.2);
    }
    for(const x of [27,119]){
      shape(c,`M${x} -116v112l15-1v-114Z`,"#462f35",dark,1.4);
      circle(c,x+7,-95,2.8,"#bf9761");circle(c,x+7,-25,2.8,"#bf9761");
    }
    c.restore();
  }

  function stages(){
    neutral=layer(()=>{}).getContext("2d");
    hero=layer(()=>{}).getContext("2d");
    hall=layer(c=>{
      rect(c,0,0,W,H,"#232447");
      gouache(c,"M61 500L203 133 1085 131 1229 508Z","#3f2f61",[54,125,1190,395],16,"#9a6c733f");
      gouache(c,"M303 408L312 212 899 203 997 407Z","#10142a",[304,199,694,212],17,"#564b6e65");
      for(let i=0;i<14;i++) {
        const x=321+i*42, y=214+(i%3)*3;
        shape(c,`M${x} ${y}l12 195h-29L${x-10} ${y+2}Z`,i%2?"#372747":"#221a35");
      }
      for(const [x,y,s] of [[275,449,.7],[1020,433,.82],[1129,450,.78],[972,400,.51]])props(c,x,y,s,x>900);
      gouache(c,"M265 407L1018 397 1280 691H0Z","#613347",[-2,390,1290,320],54,"#ae748477");
      for(let i=0;i<33;i++){
        const x=224+i*26;line(c,[[x,414],[x+(x-640)*.48,653]],"#321925",1.0+(i%4)*.24);
      }
      for(let i=0;i<4;i++){
        const y=452+i*48;line(c,[[16,y+31],[340,y],[811,y-4],[1280,y+25]],"#854a57a6",1.7);
      }
      for(let i=0;i<12;i++){
        const x=-31+i*125;
        bench(c,x,719,.86+(i%3)*.18,i%2?"#552038":"#654052");
      }
      const f=rng(199);
      for(let i=0;i<59;i++){
        const x=112+f()*1046,y=437+f()*202;
        line(c,[[x,y],[x+6+f()*15,y-1]],i%3?"#b3786d5a":"#2d193c88",1+f()*2);
      }
    });
    wall=layer(c=>{
      rect(c,0,0,W,H,"#141b35");
      gouache(c,"M0 0H1280V583L857 525 468 560 0 628Z","#362846",[0,0,W,646],41,"#7a416183");
      for(let i=0;i<22;i++){
        const x=i*61;line(c,[[x,41],[x+44,550]],"#542e50",3+(i%5));
        line(c,[[x+7,44],[x+51,554]],"#9d466248",2);
      }
      gouache(c,"M-35 618L198 504 979 469 1303 545V748H-35Z","#5e3b47",[0,469,W,251],72,"#a75f5e66");
      for(let i=0;i<16;i++)line(c,[[519+i*37,486],[400+i*61,710]],"#342635",1.08);
      props(c,145,568,1.17);
      props(c,967,511,.72,true);
    });
  }

  function curtain(c,t){
    const drape=2.5*Math.sin(t*3);
    gouache(c,"M-20-16H198Q171 123 105 183Q75 210 116 318Q144 464 81 623H-20Z",
      "#5b2344",[0,0,232,706],71,"#98364c8f");
    shape(c,"M3 0H94Q59 138 52 224Q48 372 76 585L38 639Q13 516 18 363Q19 206 3 0Z","#812442");
    shape(c,"M-20 184Q48 155 118 193L110 216Q57 211-18 224Z","#9c5749",dark,2);
    line(c,[[76,220],[77,247+drape],[95,276+drape]],"#b37c55",2.5);
    c.save();c.translate(W,0);c.scale(-1,1);
    gouache(c,"M-25-14H192Q170 97 132 156Q95 205 113 266Q150 386 109 568L64 629H-25Z",
      "#632040",[0,0,211,642],111,"#ad475d82");
    shape(c,"M11 0H115Q65 150 73 271Q81 381 67 520L33 621Q23 441 27 313Z","#43162e");
    c.restore();
  }

  function clock(c,x,y,s,t) {
    c.save();c.translate(x,y);c.scale(s,s);
    gouache(c,"M-67 107L-55-137-37-160 49-159 69-135 79 111 54 139-49 139Z",
      "#bf7952",[-84,-174,168,326],347,"#e19467a0");
    shape(c,"M-51-136L51-138 62 108-49 112ZM-64 111H76L85 132Q9 153-73 137Z","#482c3b",dark,3);
    shape(c,"M-42 19L49 17 53 103-42 104Z","#2a2742","#9f6752",2.4);
    const j=.66*Math.sin(t*6.8);
    line(c,[[2,26],[2+50*j,91-13*Math.abs(j)]],"#c99854",3.3);
    ellipse(c,2+50*j,94-13*Math.abs(j),10.4,10.1,.06,"#ca944a","#e4bc6c",1.3);
    ellipse(c,1,-71,48,47,.05,"#ce9c60","#dcac62",2.3);
    ellipse(c,1,-71,39,39,.05,"#b57c55","#703744",1.2);
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6;
      line(c,[[1+31*Math.sin(a),-71+31*Math.cos(a)],[1+37*Math.sin(a),-71+37*Math.cos(a)]],"#523746",1.45);
    }
    line(c,[[1,-71],[-15,-83]],dark,3.3);
    line(c,[[1,-71],[17+2.1*t,-92]],"#743745",2);
    circle(c,1,-71,3,dark);
    c.restore();
  }

  function actor(c,x,y,s,t,turn=1,lean=.0) {
    const sw=Math.sin(t*4.8),q=Math.floor(t*12),ink="#1c162b", skin="#d09669";
    c.save();c.translate(x,y+3*sw);c.scale(s*turn,s);
    ellipse(c,1,4,110,18,0,"#1f152faa");
    const hip=[-4,-110],neck=[14+12*lean,-244+(q%3-1)*.8];
    for(const [j,d] of [-1,1].entries()){
      const foot=[d*39+30*sw,3-Math.max(0,sw*d)*14],k=joint(hip,foot,61,57,-1);
      limb(c,hip,k,18,14,j?"#34467e":"#282956",ink,2.1);
      limb(c,k,foot,13,9,j?"#364a83":"#222945",ink,2.25);
      limb(c,[foot[0]-6,foot[1]],[foot[0]+24,foot[1]+4],8,6,"#1b1521","#9c5655",2);
    }
    gouache(c,"M-82-75Q-54-123-51-183Q-47-234-12-244Q7-263 38-243Q62-229 57-181L54-120 68-76Q34-51 2-65Q-32-47-82-75Z",
      "#b72d42",[-95,-265,176,223],98,"#db665b69");
    shape(c,"M-80-73Q-36-120-28-162L-17-212Q-9-145-19-58Z","#6a203d");
    shape(c,"M27-246L53-228 37-194 17-218-7-224 8-244Z","#d35454",ink,2);
    line(c,[[31,-214],[28,-156],[34,-84]],"#7b2442",2.4);
    for(let i=0;i<3;i++)circle(c,33,-177+i*39,2.6,"#e1aa62");
    c.save();c.translate(neck[0],neck[1]);c.rotate(.15*lean);
    shape(c,"M-24 18Q-47-19-27-51Q-21-75 7-67Q32-63 36-41L43-20 34-16 35-6 22 4 24 19Z",skin,ink,3);
    shape(c,"M-38-17Q-56-45-29-69Q-8-93 18-66Q30-64 35-45Q18-47 8-56Q5-31-22-25Q-18-3-12 11L-31 10Z",
      "#231a39","#91354d",1.75);
    shape(c,"M-33-53Q-21-82 5-72Q16-66 23-53L5-58Q-10-60-33-39Z","#56305c");
    line(c,[[19,-38],[33,-40]],ink,1.9);circle(c,29,-34,1.9,ink);
    line(c,[[28,-8],[35,-9]],"#8a3c49",1.25);
    c.restore();
    const shoulder=[neck[0]+20,-228],hand=[76+54*lean,-156-27*lean+11*sw];
    const elbow=joint(shoulder,hand,49,53,1);
    limb(c,shoulder,elbow,19,14,"#a02740",ink,2.7);
    limb(c,elbow,hand,13,8,"#be3a4a",ink,2.4);
    limb(c,hand,[hand[0]+16,hand[1]-2],7,4.9,skin,ink,1.9);
    if(lean<.48) {
      shape(c,`M${hand[0]+16} ${hand[1]-2}l14 56 13-3-16-56Z`,"#b38d62",ink,1.3);
      ellipse(c,hand[0]+36,hand[1]+51,11,8,-.3,gold,ink,1.4);
    }
    stroke(c,[[shoulder[0]+9,shoulder[1]-2],[elbow[0]+7,elbow[1]-6],[hand[0]-6,hand[1]-8]],1,
      "#ea705b8c",2.2,1.75,q%3+71);
    c.restore();
  }

  function cat(c,x,y,s,t) {
    const p=progress(t,.28,.86),spring=Math.sin(p*Math.PI),reach=progress(t,.96,.65);
    c.save();c.translate(x-113+114*p,y-111*spring);c.rotate(-.32*spring);c.scale(s,s);
    const tail=14*Math.sin(t*3.8);
    c.beginPath();c.moveTo(-51,5);c.bezierCurveTo(-117,18,-126,-33,-133,-45+tail);
    c.strokeStyle="#e68c59";c.lineWidth=11;c.stroke();
    c.strokeStyle="#272139";c.lineWidth=8;c.stroke();
    const paws=[[-62+25*spring,44-24*spring],[-25,46-26*spring],[54+23*spring,44-24*spring]];
    for(const [i,a] of paws.entries()){
      limb(c,[-45+i*33,5],a,10.8,6.3,"#292339","#94607b",1.1);ellipse(c,a[0]+7,a[1],11,6,.03,"#2e2541");
    }
    shape(c,"M-73 18Q-71-27-36-31Q25-32 59-13L64 17Q37 43-9 29Q-53 43-73 18Z",
      "#25223c","#c3846d",2.1);
    shape(c,"M-64 9Q-59-27-29-27Q23-29 47-17Q11-13-11-5Q-29-29-64 9Z","#42436a");
    c.save();c.translate(52,-9+4*Math.sin(t*2.7));c.rotate(-.10-.12*reach);
    shape(c,"M-19-4L-25-39-6-26 10-28 32-46 34-10Q52 1 41 14Q32 34 8 24Q-15 26-24 12Z",
      "#26233d","#996c75",2.1);
    shape(c,"M28-36L20-20 29-19Z","#932e4b");
    ellipse(c,6,0,5.4,2.9,-.19,"#dcad52");ellipse(c,29,-2,6,3.1,.10,"#d8a849");
    line(c,[[5,-2],[6,2]],dark,1.6);line(c,[[29,-4],[30,1]],dark,1.5);
    shape(c,"M17 4L24 4 20 8Z","#ba6770");
    for(let i=0;i<3;i++){
      line(c,[[11,8+i*3],[-14,6+i*6]],"#c598819e",.8);
      line(c,[[31,7+i*3],[55,4+i*6]],"#c598819e",.8);
    }
    c.restore();
    c.restore();
  }

  function gels(c,n,t){
    neutral.clearRect(0,0,W,H);neutral.drawImage(c.canvas,0,0,W,H);
    const w=24*Math.sin(t*.9+n),cool=[[-120,103+w],[34,-30],[1090,440],[927,637]];
    const hot=[[1350,152-w],[1271,-51],[253,601],[414,713]];
    c.save();
    c.globalCompositeOperation="multiply";polygon(c,cool,"#4467ffce");polygon(c,hot,"#ffa39ebc");
    c.globalCompositeOperation="screen";polygon(c,cool,"#1435bac2");polygon(c,hot,"#a900235e");
    c.restore();
    const shade=c.createRadialGradient(669,355,253,669,355,755);
    shade.addColorStop(0,"#0b0b0d00");shade.addColorStop(1,"#0b0b0dcb");
    rect(c,0,0,W,H,shade);
    const focus=[
      [[505+35*t,362,117,.59]],
      [[786,369,158,.62]],
      [[537,371,94,.67],[788,337,124,.84]],
    ][n];
    for(const [x,y,r,amount] of focus){
      hero.clearRect(0,0,W,H);hero.drawImage(neutral.canvas,0,0);
      hero.save();hero.globalCompositeOperation="destination-in";
      const pool=hero.createRadialGradient(x,y,17,x,y,r);
      pool.addColorStop(0,"#fff");pool.addColorStop(.58,"#fffb");pool.addColorStop(1,"#fff0");
      rect(hero,0,0,W,H,pool);hero.restore();
      c.save();c.globalAlpha=amount;c.drawImage(hero.canvas,0,0);c.restore();
    }
  }

  function title(c,t){
    const s="剧场里的第三声",cx=77,cy=116;
    c.save();c.font="67px Brush, serif";c.textAlign="left";c.lineJoin="round";c.lineWidth=7;
    c.strokeStyle="#130d18";c.fillStyle="#edba58";
    c.strokeText(s,cx,cy);c.fillText(s,cx,cy);
    c.restore();
    text(c,t<3.33?"远处的响声":t<6.67?"道具箱上的钟":"幕布后面",83,151,24,"#e0ac62","Kai");
  }

  function draw(c,t){
    const n=t<3.33?0:t<6.67?1:2,local=t-[0,3.33,6.67][n];
    c.drawImage(n===0?hall:wall,0,0);
    c.save();c.translate(640,358);c.rotate([-.022,.046,-.023][n]);c.scale(1.045+.024*local,1.045+.024*local);c.translate(-640,-358);
    c.drawImage(n===0?hall:wall,0,0);
    if(n===0){
      clock(c,849,360,.31,local);
      actor(c,463+124*progress(local,0,3.36),586,1.04,local,1,.04);
      curtain(c,local);
    } else if(n===1) {
      props(c,713,586,2.12);
      clock(c,769,347,1.51,local);
      const p=progress(local,.63,1.33),r=[401+202*p,468-96*p];
      limb(c,[55,559],r,65,29,"#a6414b","#25213a",4);
      limb(c,r,[r[0]+147,r[1]+2],26,12,"#b84859","#28203b",3);
      shape(c,`M${r[0]+124} ${r[1]+10}q14-42 38-24l31 12-5 7-20-6 17 12-9 5-35-7Z`,
        "#d29365",dark,2.7);
      const tail=27*Math.sin(local*3.6);
      c.beginPath();c.moveTo(1094,496);c.bezierCurveTo(1003,502,1054+tail,410,1135,405);
      c.strokeStyle="#242239";c.lineWidth=15;c.stroke();
      c.strokeStyle="#837391";c.lineWidth=1;c.stroke();
    } else {
      props(c,837,559,1.45);
      clock(c,932,377,.78,local);
      actor(c,473+37*progress(local,.15,1.3),623,1.12,local,1,.81);
      cat(c,772,354,1.24,local);
    }
    c.restore();
    gels(c,n,local);
    if(n===2) {
      const pool=c.createRadialGradient(819,343,27,819,343,174);
      pool.addColorStop(0,"#ffc6683c");pool.addColorStop(1,"#ffe3a400");
      c.save();c.globalCompositeOperation="screen";circle(c,819,343,174,pool);c.restore();
    }
    title(c,t);
    silk(c,1.4);
  }

  register("qianhuang",draw,stages);
})();
