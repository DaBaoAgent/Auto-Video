(() => {
  const { W,H,shape,rect,line,circle,text,layer,rng,silk,mix,progress,register } = Paper;
  const { ellipse, limb, joint, stroke, loop } = Hand;
  const edge = "#30262b";
  const beats = window.SAMPLE_BEATS.shouhui;
  let court;

  function lantern(c,x,y,s,t) {
    c.save(); c.translate(x,y); c.scale(s,s);
    line(c,[[0,-120],[0,0]],"#463339",2);
    c.rotate(.12*Math.sin(t*2.5+x*.009));
    const glow = c.createRadialGradient(0,19,4,0,19,75);
    glow.addColorStop(0,"#ffbf7194"); glow.addColorStop(1,"#ffb26400");
    circle(c,0,19,75,glow);
    ellipse(c,0,18,29,33,.07,"#cc563b",edge,2);
    ellipse(c,-2,16,22,29,-.12,"#e4824c");
    for (const a of [-.85,-.48,.54,.88]) {
      line(c,loop(-1,18,Math.abs(a)*24,30,-1.4,1.48,12).map(([dx,dy])=>[dx*Math.sign(a),dy]),"#f0b47a",1);
    }
    rect(c,-14,-16,29,6,"#723e36"); rect(c,-13,48,26,6,"#853f32");
    line(c,[[0,52],[2,65],[6,86]],"#dab064",2);
    c.restore();
  }

  function build() {
    court = layer(c=>{
      const sky=c.createLinearGradient(0,0,0,580);
      sky.addColorStop(0,"#233c55");sky.addColorStop(.56,"#4f6779");sky.addColorStop(1,"#d1a585");
      rect(c,0,0,W,H,sky);
      circle(c,1048,138,67,"#f0c78c");
      shape(c,"M-85 326L118 240 254 288 359 212 498 273 739 242 904 311 1158 231 1320 280V512H-85Z","#435b62");
      shape(c,"M-80 284Q21 284 101 246Q163 207 240 198Q346 257 441 245Q394 282 372 299H-80ZM901 268Q1046 261 1111 221Q1167 192 1204 200Q1257 239 1335 239V308H936Z","#273e48",edge,3);
      rect(c,0,296,W,168,"#8a5143");
      for (let i=0;i<14;i++) {
        const x=26+98*i;
        rect(c,x,304,67,101,"#b27555");
        rect(c,x+10,320,47,75,i%3 ? "#433d43":"#da9961");
        for(let j=1;j<5;j++) line(c,[[x+10,j*15+319],[x+57,j*15+319]],"#e4a6767a",1.4);
        line(c,[[x+19,322],[x+19,394]],"#d09062",1.5);
      }
      shape(c,"M-80 469Q329 441 723 454Q1057 473 1351 450V759H-80Z","#c49870",edge,3);
      shape(c,"M-80 582Q130 533 332 524T749 507T1352 525M-78 692Q192 635 456 614T1063 594T1341 591",
        null,"#9461497b",2.2);
      shape(c,"M0 682L187 648 369 651 532 719H0Z","#a7786555");
      shape(c,"M870 742L1028 654 1274 639 1322 698V747Z","#ab6f5675");
      const random=rng(207);
      for(let i=0;i<460;i++) {
        const x=random()*W,y=467+random()*H*.37;
        line(c,[[x,y],[x+4+random()*37,y+random()*4]],i%3?"#e1b9914f":"#714e3835",.6+random()*1.6);
      }
      for (const side of [0,1]) for(let i=0;i<22;i++) {
        const x=(side?941:1)+i*17+random()*10,y=393+random()*38,s=.55+random()*.45;
        const color=["#677568","#aa654e","#464a52","#917975","#ac855e"][i%5];
        c.save(); c.translate(x,y); c.scale(s,s);
        shape(c,"M-13 39Q-13 15-10 5Q0-2 12 5L20 37Z",color,edge,1);
        ellipse(c,0,-4,8,11,-.11,"#c38e69",edge,1); shape(c,"M-9-5Q-10-18 4-17Q14-14 10-3L3-9Z","#38313b");
        c.restore();
      }
    });
  }

  function flag(c,x,y,s,t,color) {
    c.save();c.translate(x,y);c.scale(s,s);
    line(c,[[0,4],[22,-239]],"#503541",5);
    const flutter=11*Math.sin(t*4+x*.025);
    c.beginPath();c.moveTo(21,-232);c.bezierCurveTo(64,-242+flutter,104,-212-flutter,129,-230+flutter);
    c.lineTo(111,-178+flutter);c.bezierCurveTo(78,-168-flutter,51,-203+flutter,17,-184);c.closePath();
    c.fillStyle=color;c.fill();c.strokeStyle=edge;c.lineWidth=1.5;c.stroke();
    line(c,[[21,-222],[61,-218+flutter],[116,-219+flutter]],"#f1bf78",2);
    c.restore();
  }

  function drum(c,x,y,s,t,hit) {
    c.save();c.translate(x,y);c.scale(s,s);
    const flat=1-.075*hit;
    shape(c,"M-94 51L-116 133-99 135-54 61ZM78 47L118 124 104 135 61 64Z","#594341",edge,3);
    shape(c,"M-117-1Q-108 85-72 101Q10 133 87 98Q112 72 119 0Z","#a54238",edge,3);
    shape(c,"M-116 10Q8 43 118 1L114 31Q8 75-110 45Z","#dc694c");
    shape(c,"M-94 70Q10 101 105 62L91 88Q12 126-79 94Z","#623941");
    ellipse(c,0,0,117,39*flat,-.03,"#e4b478",edge,3.4);
    ellipse(c,4,-4,100,28*flat,-.03,"#f2cd93","#a9714e",1.6);
    for(let i=0;i<18;i++){const a=.11+i*Math.PI/18;circle(c,-117*Math.cos(a),39*Math.sin(a)+7,2.8,"#e7ac59");}
    for (let i=-2;i<3;i++){
      const x=i*28,y=78-.0026*x*x;
      shape(c,`M${x} ${y-6}q6-4 12 1q-2 7-8 8q-8-1-4-9Z`,"#d7a36b");
    }
    stroke(c,loop(2,-2,91,24,.12,3.15,25),1,"#c39464",1.5,1.6,Math.floor(t*12)%3+82);
    c.restore();
  }

  function pulse(t,times) {
    return times.reduce((m,b)=>Math.max(m,Math.exp(-Math.max(0,t-b)*10)*progress(t,b-.202,.202)),0);
  }

  function drummer(c,x,y,s,t,times,colors,mirror=false) {
    const hit=pulse(t,times);
    const boil=Math.floor(t*12)%3;
    const snap=Math.sin(Math.floor(t*12)*2.4)*.85;
    c.save();c.translate(x,y);c.scale(s,s);
    if(mirror)c.scale(-1,1);
    ellipse(c,-8,6,106,16,0,"#533f3d55");
    const breath=.27*Math.sin(t*2.8+x);
    const hip=[-8+24*hit+4*breath,-109+18*hit], neck=[-13+48*hit,-222+29*hit+9*breath];
    const skin=colors[2], coat=colors[0], shade=colors[1];
    for (const [foot,bend,wide] of [[[65,-10],-1,17],[[-64,-9],-1,19]]) {
      const knee=joint(hip,foot,61,66,bend);
      limb(c,hip,knee,wide,wide*.77,"#393d49",edge,2.4);
      limb(c,knee,foot,wide*.78,10,"#494756",edge,2.2);
      limb(c,[foot[0]-5,foot[1]+3],[foot[0]+21,foot[1]+4],9,7,"#372c34",edge);
    }
    const lift=1-hit, swing=Math.sin(t*3.8+.9)*lift;
    const reach=[101+43*hit+14*swing,-199+82*hit+17*swing], other=[55+24*lift,-121-112*lift];
    const [wx,wy]=reach;
    for (const [hand,bend,start,hidden] of [[other,1,[neck[0]-17,neck[1]+27],true],[reach,1,[neck[0]+9,neck[1]+29],false]]) {
      if(!hidden)continue;
      const elbow=joint(start,hand,54,64,bend);
      limb(c,start,elbow,18,14,shade,edge);limb(c,elbow,hand,13,7,shade,edge);circle(c,...hand,9,skin);
      line(c,[hand,[hand[0]+50,hand[1]-67*(.35+hit)]],"#e1b17f",5);
    }
    c.save();c.translate(hip[0],hip[1]);c.rotate((neck[0]-hip[0])*.004);
    shape(c,"M-49 17Q-52-32-36-82L-18-114Q16-121 31-102Q50-67 38-20L43 1Q0 31-49 17Z",coat,edge,3);
    shape(c,"M-47 15Q-27-18-29-63L-22-96Q-5-56-9-20L-1 20Z",shade);
    shape(c,"M-22-107Q12-85 30-93M-18-101L12-68 9-26M-41-9Q4 7 39-12",null,"#ebb678",2.8);
    shape(c,"M-39 2Q4 15 42-1L42 9Q3 26-44 13Z","#483d4a",edge,1.4);
    c.restore();
    c.save();c.translate(neck[0]+snap,neck[1]);c.rotate(.12+.19*hit);
    shape(c,"M-16 27L-14 8Q-32-9-27-29Q-23-56 0-54Q20-54 24-33L34-19 25-14 28-7 18-2Q17 13 4 13L6 28Z",skin,edge,2.6);
    shape(c,"M-27-21Q-41-38-21-55Q-2-66 17-49L23-33 4-40-18-31-18-13Z","#263440",edge,2.1);
    shape(c,"M-30-32Q-6-49 23-44L27-35Q-1-36-29-23Z","#d78d50");
    line(c,[[10,-28],[20,-30]],edge,1.6); circle(c,18,-24,1.8,edge);
    shape(c,"M-27-30Q-53-28-67-42Q-55-21-79-11Q-50-15-28-22Z","#c45b42",edge,1.5);
    c.restore();
    const shoulder=[neck[0]+9,neck[1]+28];
    const elbow=joint(shoulder,reach,56,77,1);
    limb(c,shoulder,elbow,18,15,coat,edge,2.5);limb(c,elbow,reach,14,7,"#e08a56",edge,2.3);
    circle(c,wx,wy,9,skin);line(c,[[wx-4,wy+1],[wx+8,wy+5]],edge,1.3);
    const tip=[wx+51-6*hit+16*swing,wy-68+65*hit-11*swing];
    line(c,[[wx-6,wy+4],tip],"#542e34",8);
    line(c,[[wx,wy+1],tip],"#e5b178",4.5);
    if(hit>.55 && hit<.99) line(c,[[tip[0]-11,tip[1]-32],tip],"#efc18483",3);
    stroke(c,[[shoulder[0],shoulder[1]-13],[elbow[0]+6,elbow[1]-9],[wx-5,wy-8]],1,
      "#f2bd7d90",1.25,2.4,16+boil);
    c.restore();
  }

  function sparks(c,x,y,t) {
    const b=beats.findLast(a=>a<=t);
    if(b===undefined||t-b>.46)return;
    const age=(t-b)/.46,random=rng(Math.round(b*1000));
    c.save();c.globalAlpha=1-age;
    for(let i=0;i<15;i++){
      const a=-Math.PI*random(),r=12+age*(62+random()*125),dx=Math.cos(a),dy=Math.sin(a);
      line(c,[[x+dx*r,y+dy*r],[x+dx*(r+7+i*.45),y+dy*(r+7+i*.45)]],
        i%3?"#ffe09a":"#ce5341",1.1+random()*3);
    }
    c.restore();
  }

  function pennants(c,t) {
    const random=rng(801);
    for(let i=0;i<16;i++){
      const x=30+i*83,y=193+20*Math.sin(i*.45);
      const s=7+random()*9,flap=Math.sin(t*5+i)*6;
      line(c,[[x-41,y-8-8*Math.cos(i*.43)],[x,y-9],[x+41,y-8+8*Math.cos(i*.43)]],"#493b42",.85);
      Hand.polygon(c,[[x-7,y-8],[x+11,y-7],[x+flap,y+s]],
        ["#d36f50","#d5b06d","#6d9790","#9e777c"][i%4],edge,1);
    }
  }

  function draw(c,t) {
    const k=1+(.27*progress(t,2.85,.53))*(1-progress(t,5.80,.53))+.07*progress(t,7.3,1);
    c.drawImage(court,0,0);
    const focus=645+78*progress(t,2.85,.60)*(1-progress(t,5.6,.57));
    c.save();c.translate(focus,383);c.scale(k,k);c.translate(-focus,-383);
    c.drawImage(court,0,0);
    shape(c,"M1 134Q206 211 412 173T831 147T1280 119",null,"#2e3b46",2.4);
    for(const [x,y,s] of [[94,156,.77],[271,180,.85],[502,159,.73],[722,144,.86],[1139,136,1.12]])lantern(c,x,y,s,t);
    pennants(c,t);
    flag(c,326,434,.82,t,"#a64c48");flag(c,1114,461,1.03,t,"#456f77");flag(c,250,411,.57,t,"#d09252");
    drummer(c,380,523,.63,t,beats.map(b=>b+.10),["#6f8f87","#526767","#be8a67"]);
    drum(c,492,449,.62,t,pulse(t,beats));
    drummer(c,1085,522,.66,t+.15,beats,["#626a87","#4a536b","#ad765d"],true);
    drum(c,970,447,.62,t,pulse(t,beats));
    drummer(c,584,610,1.17,t,beats,["#b95648","#863e43","#d69a6a"]);
    drum(c,835,470,1.06,t,pulse(t,beats));
    sparks(c,808,461,t);
    const random=rng(18);
    for(let i=0;i<49;i++){
      const x=(random()*1320+t*(7+random()*13))%1320,y=253+random()*330+Math.sin(t*2+i)*11;
      if(i%4===0)stroke(c,[[x,y],[x+9,y-3],[x+13,y+4]],1,i%3?"#f2cc86":"#bc5d50",1.7,1.3,i);
    }
    for(const [x,y,s,col] of [[34,676,1.04,"#52646c"],[104,704,.77,"#9c6452"],[1184,676,.84,"#6a626d"],[1250,672,1.04,"#46585f"]]){
      const w=Math.sin(t*3+x*.08);
      c.save();c.translate(x,y+2.5*w);c.scale(s,s);
      shape(c,"M-44 54Q-54 4-30-19Q-4-40 27-21Q52-7 54 63Z",col,edge,2.4);
      ellipse(c,-3,-37,21,27,.2,"#433841",edge,2);
      limb(c,[22,-14],[34+w*7,-67],9,6.8,col,edge,2);
      circle(c,34+w*7,-69,7,"#af795f");
      c.restore();
    }
    c.restore();
    text(c,"鼓阵开场",71,124,70,"#f9dba9","Brush");
    silk(c,1.12);
  }
  register("shouhui",draw,build);
})();
