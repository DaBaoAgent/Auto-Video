(() => {
  const { W,H,shape,rect,circle,line,text,mix,progress,rng,silk,register } = Paper;
  const { ellipse,polygon,stroke,loop,paper,water } = Hand;
  const start=[-.88,1.1,2.49,3.74,5.04,6.77];
  const labels=["浮在水面","潜下找贝","挑一块石","胸口当砧","抬贝敲石","撬开贝壳"];
  const pen="#3e5352",warm="#654a40";
  const colors=["#9dc6be","#92b9bb","#bbd0b3","#8eb7aa","#8ab6af","#b3c9a1"];
  const spots=Array.from({length:6},(_,i)=>[60+(i%3)*393,155+Math.floor(i/3)*248]);

  function plant(c,x,y,s,t,seed){
    c.save();c.translate(x,y);c.scale(s,s);
    const random=rng(seed);
    for(let i=0;i<6;i++){
      const r=(i-2.3)*9,a=22+random()*60,sway=5*Math.sin(t*1.75+i);
      c.beginPath();c.moveTo(0,3);
      c.bezierCurveTo(r*.42,-a*.40,r+sway,-a*.76,r+sway,-a);
      c.bezierCurveTo(r*.73-6,-a*.63,r*.48-8,-a*.43,-2,3);
      c.fillStyle=i%2?"#6f8c5c":"#9ca168";c.fill();
      c.strokeStyle="#55775f90";c.lineWidth=.8;c.stroke();
    }
    c.restore();
  }

  function shell(c,x,y,s,angle,opened=0) {
    c.save();c.translate(x,y);c.rotate(angle);c.scale(s,s);
    const lid="M-32 9Q-38-12-22-31Q3-46 25-24Q38-10 33 9Q13 22-10 18Z";
    shape(c,"M-34 8Q-16-21 8-20Q27-13 35 8Q30 25 13 30Q-17 27-34 8Z","#d5a790",warm,1.7);
    if(opened>.01) {
      shape(c,"M-30 8Q-10-4 7-2Q27 2 31 10Q14 21-11 17Z","#eed7b4",warm,1);
      shape(c,"M-12 10Q-6-3 7 1Q18 4 15 12Q4 18-12 10Z","#e1a37c","#ba7f65",1);
    }
    c.translate(0,-opened*7);c.scale(1,1-.29*opened);
    shape(c,lid,"#bc7c67",warm,1.65);
    shape(c,"M-29 7Q-28-12-17-22Q9-34 26-15Q32-9 31 3Q3-25-29 7Z","#dba78a");
    for(let i=0;i<7;i++){
      const a=(i-3)*8.2;
      stroke(c,[[2,14],[a*.42,-4],[a*.77,-15],[a,-20-Math.cos(i*.45)*8]],1,"#714c43a8",1.25,1.45,13+i);
    }
    c.restore();
  }

  function rock(c,x,y,s) {
    const d="M-29 9L-20-15-3-23 19-19 31-5 27 13 2 21-20 16Z";
    c.save();c.translate(x,y);c.scale(s,s);
    shape(c,d,"#879a89","#526566",1.45);
    shape(c,"M-29 9L-20-15-3-23 19-19 27-6 6-3-12-8-17 12Z","#bfbd98");
    shape(c,"M-24 2L-11-11M-7-10L5-12M-21 13L3 17M15 3L21-3",null,"#5d6c6399",1.2);
    c.restore();
  }

  function flipper(c,x,y,k,angle,col) {
    c.save();c.translate(x,y);c.rotate(angle);c.scale(k,k);
    shape(c,"M-21-10Q0-18 20-4Q33 7 30 18Q24 20 20 17Q21 24 14 22Q9 23 6 20Q1 24-4 19Q-18 13-21-10Z",col,warm,1.35);
    shape(c,"M-12-5Q2-4 18 10M-5 1Q7 12 12 15M4 0Q17 10 20 13",null,"#5f4e4595",.85);
    c.restore();
  }

  function otter(c,x,y,s,t,activity) {
    c.save();c.translate(x,y+3*Math.sin(t*2.7));c.rotate(.034*Math.sin(t*2.5));c.scale(s,s);
    const fur="M-92 18Q-81-15-47-22Q1-33 51-24Q92-21 111 7Q121 32 85 43Q26 52-28 43Q-65 44-92 18Z";
    shape(c,"M76 29Q124 49 149 22Q159 10 175 13Q179 20 170 29Q129 73 77 44Z","#7b6555",warm,1.8);
    flipper(c,97,9,.87,Math.sin(t*3)*.17-.08,"#7d6755");
    shape(c,fur,"#8d6b53",warm,1.8);
    shape(c,"M-77 25Q-55-7-3-16Q54-23 85 1Q105 28 71 38Q8 53-51 31Z","#a78461");
    shape(c,"M-53 17Q-6-11 50-8Q70 6 58 18Q23 46-49 27Z","#bd9870");
    c.save();c.clip(Paper.path(fur));
    const random=rng(64);
    for(let i=0;i<91;i++){
      const x=random()*200-88,y=random()*79-31;
      line(c,[[x,y],[x+3+random()*10,y+1]],i%3?"#e5c09355":"#4d473d63",.7+random()*.65);
    }
    c.restore();
    flipper(c,80,30,.79,.44+Math.sin(t*3.7)*.17,"#967658");
    ellipse(c,-79,-18,31,29,.26,"#b8916d",warm,1.9);
    ellipse(c,-100,-35,9,12,-.41,"#887052",warm,1.35);
    ellipse(c,-63,-46,7,9,.19,"#917252",warm,1.1);
    shape(c,"M-106-9Q-112-26-93-31Q-70-30-56-12Q-44 0-58 8Q-89 19-106-9Z","#d8ba91",warm,1.2);
    ellipse(c,-83,-26,3.4,3.8,0,"#3a3930");
    ellipse(c,-97,-18,2.4,3.35,0,"#3d3a30");
    shape(c,"M-110-13Q-103-17-94-10L-99-3Q-106-3-110-13Z","#443833");
    shape(c,"M-100-6Q-92 2-79 0",null,"#62483c",1);
    for(let i=0;i<5;i++){
      line(c,[[-95,-6+i*.7],[-123-i*1.2,2+i*3.1]],"#4c473c9d",.62);
      line(c,[[-85,-5+i*.8],[-65,3+i*2.4]],"#f6dec3d7",.72);
    }
    if(activity){
      rock(c,-14,3,.59);
      const hitting=activity==="tap";
      const phase=hitting?(Math.cos((t-5.45)*Math.PI*2/.385)+1)*.5:0;
      const lift=hitting?(1-phase)**1.15:activity==="open"?.63:.36;
      const grasp=[-14-13*lift,-9-44*lift];
      const other=[grasp[0]+22,grasp[1]+7];
      Hand.limb(c,[-42,15],grasp,11,7,"#a48664",warm,1.2);
      Hand.limb(c,[25,-8],other,11,6,"#967959",warm,1.15);
      shell(c,grasp[0]+6,grasp[1]+1,.50,-.10-.5*lift,activity==="open"?.9:0);
      flipper(c,grasp[0]-4,grasp[1]+5,.27,1.08,"#ab8b6a");
      flipper(c,other[0],other[1],.28,2.84,"#9b7d5b");
    }else{
      flipper(c,-54,7,.55,-.5+Math.sin(t*3.3)*.23,"#a08061");
      flipper(c,-34,-10,.45,-1.1+Math.sin(t*3)*.25,"#937960");
    }
    c.restore();
  }

  function panel(c,i,t) {
    const [x,y]=spots[i],elapsed=t-start[i],p=progress(t,start[i],.91),w=373,h=223;
    c.save();c.translate(x,y);
    rect(c,0,0,w,h,"#e9e6d1");
    c.strokeStyle="#60756e"; c.lineWidth=1.25; c.strokeRect(1,1,w-2,h-2);
    c.beginPath();c.rect(3,3,w-6,h-6);c.clip();
    const prefix=[
      [[24,143],[72,133],[111,133],[132,138],[180,132],[257,133],[301,140],[352,136]],
      [[31,134],[88,122],[144,129],[200,146],[257,146],[291,128],[325,123]],
      [[24,166],[54,144],[122,139],[164,145],[212,139],[275,137],[347,149]],
      [[25,145],[58,129],[111,133],[156,144],[201,135],[239,136],[293,143],[350,131]],
      [[34,145],[75,132],[124,139],[179,145],[229,140],[279,136],[346,142]],
      [[27,139],[66,132],[127,136],[167,145],[224,130],[275,138],[344,141]],
    ][i];
    const seed=900+i*31;
    if(elapsed<0) {
      c.globalAlpha=.32;
      stroke(c,prefix,1,pen,1,1.5,seed);
      for(let j=0;j<3;j++)
        stroke(c,loop(100+j*69,142+j*12,19+j*10,11+j*5,-.56,3.2),1,"#6d918c",.9,1.7,j+seed);
      c.restore();return null;
    }
    c.save();
    c.globalAlpha=progress(t,start[i]+.13,.75);
    const air=c.createLinearGradient(0,67,0,222);
    air.addColorStop(0,i===1?"#a4c7ad":"#c6d6bc");air.addColorStop(.97,colors[i]);
    shape(c,"M-3 95Q49 75 116 93T220 83T378 88V229H-3Z",air);
    shape(c,"M-2 142Q42 121 94 132Q132 150 179 139T275 128T375 135V225H-2Z",colors[i]);
    shape(c,"M-2 181Q66 150 143 168T261 170T375 168V225H-2Z","#6d9e9970");
    if(i===0) {
      shape(c,"M0 110L40 85 50 92 101 89 136 108Z","#78948c",pen,1);
      shape(c,"M306 103L328 84 372 91V112Z","#a3a88a",pen,1);
    }
    for(const [j,s] of [[0,1],[1,.58],[2,.76],[3,.66],[4,.53]]) {
      plant(c,18+j*74,213-(j%2)*19,s,t+i,j+seed);
    }
    if(i===1||i===2) for(let j=0;j<7;j++) rock(c,26+j*54,207+(j%2)*10,.49+(j%3)*.28);
    c.restore();
    const penTip=stroke(c,prefix,p,pen,1.65,2.65,seed);
    const drawing=progress(t,start[i]+.26,.71);
    c.save(); c.translate(2,0); c.globalAlpha=.16+.84*drawing;
    c.beginPath(); c.rect(0,50,74+drawing*303,h-52); c.clip();
    if(i===0) {
      water(c,198,153,125,13,t,"#eeefd3",.74);
      otter(c,172,142,.78,t);
    }
    if(i===1) {
      const dive=progress(t,1.41,.80);
      c.save();c.translate(155+28*dive,131+25*dive);c.rotate(.48-.23*dive);
      otter(c,0,0,.66,t);
      c.restore();
      shell(c,96,188,.51,-.23);
      for(let j=0;j<9;j++)circle(c,188+j*10+(t%1)*8,98-j*6,1.1+j%3,"#e4ece0bc");
    }
    if(i===2){
      rock(c,153,146,1.12);
      rock(c,243,165,.72);
      shell(c,213,135,.70,.28);
      c.save();c.translate(124,102-16*Math.sin(t*1.6));c.rotate(1.05);flipper(c,0,0,1.35,.15,"#917253");c.restore();
    }
    if(i>=3){
      water(c,190,156,132,13,t,"#e3ece0",.8);
      otter(c,157,139,i===5?.80:.86,t,["hold","tap","open"][i-3]);
    }
    if(i===5) {
      ellipse(c,307,115,47,38,-.09,"#ebd9b2","#668b7f",1.4);
      shell(c,307,109,.78,.15,1);
      stroke(c,[[255,123],[235,143],[204,149]],1,"#597568",1.4,1.2,67);
    }
    c.restore();
    const random=rng(seed),details=progress(t,start[i]+.61,.55);
    for(let j=0;j<35;j++){
      const dx=random()*w,dy=91+random()*143;
      if(j/35<details)line(c,[[dx,dy],[dx+5+random()*12,dy+(random()-.5)*5]],
        j%3?"#526e6463":"#f7ebcfad",.65+random());
    }
    c.restore();
    c.save();c.translate(x,y);
    text(c,labels[i],19,39,29,pen,"Kai");
    c.restore();
    return [x+penTip[0],y+penTip[1]];
  }

  function draw(c,t) {
    paper(c,"#eee8cf","#62796d67");
    const beat=start.findLastIndex(v=>v<=t);
    const q=progress(t,start[beat],.65),pull=progress(t,7.09,1.18);
    const prev=spots[Math.max(0,beat-1)],now=spots[beat];
    const cx=mix(prev[0],now[0],q)+190,cy=mix(prev[1],now[1],q)+104;
    const zoom=(2.41+.14*Math.sin(t*.77))*(1-pull)+pull;
    c.save();c.translate(640,373);c.scale(zoom,zoom);
    const mx=Math.min(W-W/(2*zoom),Math.max(W/(2*zoom),cx));
    const my=Math.min(H-H/(2*zoom),Math.max(H/(2*zoom),cy));
    c.translate(-mix(mx,640,pull),-mix(my,373,pull));
    const points=spots.map((_,i)=>panel(c,i,t));
    if(points[beat]&&t-start[beat]<.99){
      const [x,y]=points[beat];
      const a=1-progress(t,start[beat]+.76,.23);
      c.save();c.globalAlpha=a;
      circle(c,x,y,7,"#fcf0bc80");circle(c,x,y,2.8,"#4f6960");
      stroke(c,[[x+2,y],[x+36,y-33],[x+59,y-64]],1,"#c7b88ba0",6,1.4,17);
      c.restore();
    }
    c.restore();
    const header=Math.max(1-progress(t,.33,.50),pull);
    c.save();c.globalAlpha=header;
    if(pull<.99) {
      const top=c.createLinearGradient(0,0,0,152);
      top.addColorStop(0,"#e9e4cb");top.addColorStop(1,"#e9e4cb00");
      rect(c,0,0,W,152,top);
    }
    text(c,"海獭开贝",65,108,67,"#324e4e","Brush");
    text(c,"海面观察手卷",958,106,26,"#556f62","Kai");
    c.restore();
    silk(c,1.35);
  }

  register("pingban",draw);
})();
