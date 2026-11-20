(() => {
  const { W,H,shape,rect,circle,line,text,layer,rng,silk,mix,progress,register }=Paper;
  const { ellipse,stroke,water }=Hand;
  let valley,brushes;
  const stamps=new Map();
  const hues=["#568f90","#629a97","#737c9d","#98a172","#ad888f","#698781"];

  // Each stain shares its paper grain and soft body with darker pigment deposited at its rim.
  function stain(c,x,y,rx,ry,color,seed,alpha,angle=0) {
    const key=color+(seed%8);
    if(!stamps.has(key)) {
      const stamp=document.createElement("canvas");
      stamp.width=216;stamp.height=128;
      const g=stamp.getContext("2d"), pixels=g.createImageData(stamp.width,stamp.height);
      const [r,green,b]=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
      const random=rng(seed);
      for(let j=0;j<stamp.height;j++)for(let i=0;i<stamp.width;i++){
        const u=i/(stamp.width-1)*2-1,v=j/(stamp.height-1)*2-1;
        const a=Math.atan2(v,u),l=Math.hypot(u,v);
        const rim=.84+.079*Math.sin(a*3+seed)+.046*Math.sin(a*7+seed*.7)+.026*Math.sin(a*15);
        const age=(rim-l)*14.5;
        const edge=progress(age,0,1.55);
        const tooth=.78+.21*random()+.09*Math.sin(u*13.7+v*21)+.09*Math.sin(u*22-v*7.3);
        const pigment=(.22+.22*Math.max(0,1-l)+.18*Math.exp(-1.8*(age-1.24)**2))*edge*tooth;
        pixels.data.set([r,green,b,Math.max(0,Math.min(255,pigment*260))],(i+j*stamp.width)*4);
      }
      g.putImageData(pixels,0,0);stamps.set(key,stamp);
    }
    c.save();c.translate(x,y);c.rotate(angle);
    c.globalAlpha*=alpha;
    c.drawImage(stamps.get(key),-rx,-ry,2*rx,2*ry);
    c.restore();
  }

  function build(){
    valley=layer(c=>{
      rect(c,0,0,W,H,"#eee7d0");
      const r=rng(760);
      for(let i=0;i<17;i++){
        const x=r()*W,y=181+r()*115;
        stain(c,x,y,178+r()*218,57+r()*69,i%3?"#8fa7a1":"#ab8ca3",i+62,.80,(r()-.45)*.16);
      }
      for(let i=0;i<23;i++){
        const x=r()*W,y=343+r()*354;
        stain(c,x,y,146+r()*285,15+r()*33,hues[i%6],i+26,.78,-.03+(r()-.5)*.09);
      }
      for(let i=0;i<8;i++){
        stain(c,105+i*165,570-28*Math.sin(i*.6),320,36,i%3?"#668e8d":"#aa8297",12+i,.54,-.06);
      }
      for(const [x,y,radius] of [[119,430,55],[260,442,35],[1033,411,44],[1095,448,72],[1179,470,50],[1245,467,48]])rock(c,x,y,radius);
    });
    brushes=[
      {from:.48,count:6,x:110,y:432,rx:138,ry:32,dx:91,dy:8,col:"#508e95"},
      {from:1.21,count:6,x:935,y:407,rx:132,ry:24,dx:-124,dy:17,col:"#8b84a9"},
      {from:3.12,count:5,x:362,y:519,rx:91,ry:30,dx:129,dy:12,col:"#519b94"},
      {from:5.38,count:6,x:551,y:481,rx:69,ry:14,dx:112,dy:21,col:"#719cb1"},
      {from:7.19,count:5,x:784,y:563,rx:86,ry:21,dx:73,dy:12,col:"#b695a5"},
    ];
  }

  function rock(c,x,y,size){
    c.save();c.translate(x,y);c.scale(size/57,size/57);
    stain(c,0,12,68,23,"#638c8c",20,.69);
    const d="M-54 6Q-45-20-18-29Q4-34 41-17L54 10Q24 27-18 22Z";
    const g=c.createLinearGradient(-15,-30,16,26);
    g.addColorStop(0,"#bab8a6");g.addColorStop(.61,"#879f9b");g.addColorStop(1,"#686e86");
    shape(c,d,g,"#6a778670",1.6);
    shape(c,"M-43-2Q-18-29 16-23Q-1-12 34-14L14-5Q-11-15-43-2Z","#e1d9bbca");
    shape(c,"M-24 15Q7 1 38 11Q26 23-18 21Z","#676c8a79");
    c.restore();
  }

  function spill(c,t){
    c.save();c.globalCompositeOperation="multiply";
    for(const [n,b] of brushes.entries())for(let i=0;i<b.count;i++){
      const at=b.from+i*.21,a=progress(t,at,2.45);
      if(a<=0)continue;
      const spread=.25+a*.77;
      c.globalAlpha=(1-Math.exp(-(t-at)*2.6))*(.52+(i%3)*.12);
      stain(c,b.x+i*b.dx,b.y+i*b.dy,b.rx*spread,b.ry*spread,b.col,n*337+i*31,.64,.025*Math.sin(i));
    }
    c.restore();
  }

  function reeds(c,x,y,s,t,seed){
    c.save();c.translate(x,y);c.scale(s,s);
    const rand=rng(seed);
    for(let i=0;i<13;i++){
      const base=(rand()-.5)*98,h=64+rand()*159,d=(rand()-.44)*85;
      const bend=7.4*Math.sin(t*2.3+i*.67);
      c.beginPath();c.moveTo(base,2);
      c.bezierCurveTo(base+d*.21,-h*.43,base+d+bend,-h*.77,base+d+bend,-h);
      c.bezierCurveTo(base+d+bend-13,-h*.86,base+d/3-6,-h*.34,base-2,2);
      c.fillStyle=i%3?"#7e905b99":"#687c5b9c";c.fill();
      c.strokeStyle=i%2?"#6b805b80":"#73978c8c";c.lineWidth=.70+rand()*1.4;c.stroke();
      if(i%4===0)ellipse(c,base+d+bend,-h,8,h*.075,.23,"#9e836d9c");
    }
    c.restore();
  }

  function fish(c,x,y,s,t){
    c.save();c.translate(x,y+3*Math.sin(t*7+x));c.scale(s,s*.72);
    c.rotate(.1*Math.sin(t*3.9));
    shape(c,"M-26 2Q-3-12 12-8Q30-7 34 1Q26 11 11 10Q-8 9-26 2Z","#597d80a3");
    const sw=3*Math.sin(t*12);
    shape(c,`M-25 2L${-46+sw} -12Q-40 1-48 14Z`,"#66858b8f");
    line(c,[[-19,-.8],[11,-4],[26,-2]],"#d6bc9eb0",1.2);
    circle(c,24,-2,1.65,"#526969aa");
    c.restore();
  }

  function wing(c,t,side,open){
    const lift=open*Math.sin((t-5.15)*5.85+side*.18);
    const raise=1.07*lift-.21,stretch=.24+.76*open;
    c.save();c.translate(-23,-2+side*7);c.rotate(raise);c.scale(stretch,side===-1?.86:1);
    const fill=c.createLinearGradient(2,-14,-151,92);
    fill.addColorStop(0,"#f4edd8");fill.addColorStop(.49,"#e9e6d5");fill.addColorStop(1,side===-1?"#a1b5b2":"#b6bcc1");
    c.beginPath();c.moveTo(13,12);c.bezierCurveTo(8,-35,-31,-61,-75,-56);
    c.bezierCurveTo(-120,-43,-151,-26,-216,-27);
    for(let i=0;i<9;i++){
      const x=-216+i*14,y=-29+i*8.4;
      c.quadraticCurveTo(x-20+i*.7,y+27,x-4,y+34);
      c.lineTo(x+10,y+21);
    }
    c.quadraticCurveTo(-40,53,-23,39);c.quadraticCurveTo(4,29,13,12);c.closePath();
    c.fillStyle=fill;c.fill();c.strokeStyle="#677d867d";c.lineWidth=1.6;c.stroke();
    for(let i=0;i<7;i++){
      const x=-194+i*19,y=-10+i*9;
      stroke(c,[[x,y+27],[x+33,y+4],[x+70,y-20]],1,"#8eacb18f",1,1.0,13+i);
    }
    c.restore();
  }

  function bird(c,t,mirror=false) {
    const take=progress(t,5.35,3.95),up=progress(t,5.13,2.05);
    const stride=progress(t,.46,3.89), dip=progress(t,3.75,.57)*(1-progress(t,4.55,.48));
    const x=594+89*stride+407*take,y=414-176*up-39*take+.9*Math.sin(t*4);
    const bodyTilt=.09*up-.09*dip;
    c.save();c.translate(x,mirror?2*497-y:y);c.rotate(bodyTilt);
    if(mirror){c.scale(1,-.48);c.globalAlpha=.20*(1-up*.84);}
    const walk=Math.sin(t*3.3)*(1-up);
    for(const [i,d] of [-1,1].entries()){
      const liftFoot=Math.max(0,walk*d)*21;
      const a=[-43+d*12,15],b=[-37+walk*d*13-44*up,51-14*up],p=[-54+17*walk*d-98*up,80-43*up-liftFoot];
      line(c,[a,b,p],"#8c7666",3.4-i*.5);
      line(c,[p,[p[0]+14*(1-2*up),p[1]+4]],"#a79063",2.7);
    }
    if(up>.012)wing(c,t,-1,up);
    const washBody=c.createLinearGradient(-40,-43,0,45);
    washBody.addColorStop(0,"#fbf0d9");washBody.addColorStop(.46,"#f7eed9");washBody.addColorStop(1,"#adbdc3");
    shape(c,"M-8-30Q-47-39-91-27L-117-9-162-1Q-145 14-111 17Q-65 34-19 29Q13 25 23 7Q24-21-8-30Z",washBody,"#73929c84",1.65);
    shape(c,"M-123-8Q-82-19-57-12Q-63 1-30 6Q-68 17-116 11Q-132 7-143 4Z","#bac7c291");
    const hx=30+28*dip+11*up, hy=-111+94*dip+48*up;
    c.beginPath();c.moveTo(-18,-19);
    c.bezierCurveTo(25,-32-dip*8,17,-86+45*dip,hx-29,hy-4);
    c.bezierCurveTo(hx-26,hy-25,hx+4,hy-28,hx+26,hy-16);
    c.quadraticCurveTo(hx+42,hy-5,hx+17,hy+2);
    c.bezierCurveTo(hx-4,hy+11,hx-10,hy+19,19,13);
    c.quadraticCurveTo(8,36,-23,26);c.closePath();
    c.fillStyle=washBody;c.fill();c.strokeStyle="#79939c91";c.lineWidth=1.65;c.stroke();
    shape(c,`M${hx+21} ${hy-13}l66 9 -58 6 -9-3Z`,"#b78a61","#8b7066",1.3);
    line(c,[[hx+29,hy-4],[hx+78,hy-4]],"#75695c",1);
    circle(c,hx+13,hy-11,3.45,"#706955");
    circle(c,hx+14,hy-11.5,1,"#ebe1b6");
    if(up>.012)wing(c,t,1,up);
    c.restore();
  }

  function draw(c,t){
    c.drawImage(valley,0,0);
    spill(c,t);
    c.save();c.globalCompositeOperation="multiply";
    bird(c,t,true);
    c.restore();
    for(const [x,y,s,seed] of [[62,649,1.24,70],[186,655,.81,27],[1124,599,1,31],[1229,644,1.2,56],[934,387,.43,93]])reeds(c,x,y,s,t,seed);
    for(let i=0;i<6;i++){
      const treble=progress(t,4.54,.47);
      fish(c,415+i*81+(t*6)%31+(i%3-1)*154*treble,491+i%3*28,.60+i%2*.13,t);
    }
    for(const [x,y,s] of [[254,495,1],[575,507,.85],[705,505,.91],[877,557,1.29],[1077,464,.82]]) {
      water(c,x,y,82*s,12*s,t+x*.034,"#e5ead0",.52);
      shape(c,`M${x-46} ${y+24}q46-10 96-2`,null,"#5e879296",1.38);
    }
    bird(c,t);
    const t0=progress(t,4.56,.23)*(1-progress(t,5.21,1.0));
    if(t0>0){
      c.save();c.globalAlpha=t0;
      water(c,750,480,45,10,t+.3,"#f7edda",.9);
      for(let i=0;i<8;i++){
        const q=(t-4.50)*.8,dx=(i-3)*15,dy=-.22*dx*dx/15-57*q*(1-q);
        ellipse(c,750+dx*q,481+dy,2.15,3.1,.3,"#edf0daaa");
      }
      c.restore();
    }
    const titleShade=c.createLinearGradient(0,12,0,182);
    titleShade.addColorStop(0,"#efe6ce");titleShade.addColorStop(1,"#efe6ce00");
    rect(c,0,0,590,182,titleShade);
    text(c,"白鹭掠溪",82,116,71,"#426f72","Brush");
    text(c,"湿接湿 · 溪边写生",88,151,25,"#718878","Kai");
    silk(c,1.18);
  }

  register("shuicai",draw,build);
})();
