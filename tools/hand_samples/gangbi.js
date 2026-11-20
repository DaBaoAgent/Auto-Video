(() => {
  const { W,H,shape,rect,circle,line,text,layer,rng,silk,mix,progress,register }=Paper;
  const { ellipse,polygon,stroke,paper,wash,loop,limb,joint }=Hand;
  const ink="#5b463b",grey="#776553";
  const parts=[
    [4,"M76 431L75 181 198 161 196 122 377 104 394 132 531 165 533 406 340 487Z","#d8aa75",[65,105,474,380],-.92],
    [6,"M80 175L199 153 200 120 383 104 405 134 531 165 493 187 346 161Z","#b56e52",[76,100,457,101],-.86],
    [7,"M100 432L98 265 198 243 198 408Z","#a56f59",[90,240,114,196],-.65],
    [8,"M271 166L341 153 341 428 252 447Z","#c89c72",[249,145,103,309],-.77],
    [9,"M446 193L534 168 535 406 436 440Z","#b47d60",[433,163,103,281],-.62],
    [10,"M532 266L640 230 752 258 757 415 531 453Z","#87a7a0",[531,225,232,230],-.5],
    [11,"M520 254L638 203 762 247 751 270 636 240Z","#6a8b80",[518,201,246,73],-.48],
    [12,"M740 267L814 190 877 207 892 391 753 413Z","#d3b096",[738,189,154,228],-.25],
    [13,"M818 220L867 163 906 179 899 227Z","#a16f66",[809,156,100,75],-.15],
    [14,"M867 389L868 155 1040 108 1081 143 1209 147 1216 453 1152 479Z","#d5a397",[863,105,365,376],0],
    [15,"M845 159L1010 93 1079 118 1100 140 1218 138 1220 163 1067 159 1032 123 865 177Z","#8e685e",[845,87,384,101],.1],
    [16,"M936 169L1020 144 1023 440 937 466Z","#d5b485",[933,142,93,329],.22],
    [17,"M1113 164L1199 166 1212 444 1125 452Z","#ba7e66",[1110,160,105,297],.28],
    [20,"M79 547Q207 462 382 436Q522 407 817 402Q1022 411 1215 481L1204 660Q939 627 682 650Q423 619 175 660Z","#d9c6a3",[73,403,1142,265],.4],
    [21,"M134 509Q364 448 682 423Q971 399 1221 465L1217 481Q1027 436 733 442Q426 460 127 533Z","#a9aaa0",[125,402,1099,139],.55],
    [25,"M213 379Q392 345 575 359L631 426Q442 389 171 445Z","#6d9b92",[164,341,471,106],.75],
    [26,"M172 445Q441 389 631 426L626 446Q415 426 176 467Z","#658a86",[166,391,467,78],.89],
    [30,"M846 363L1104 351 1188 401 818 420Z","#e4a759",[817,347,375,77],1.2],
    [31,"M818 420L1188 401 1185 426 821 444Z","#ca824e",[816,399,374,49],1.34],
    [35,"M748 467L807 464 830 510 723 527 692 503Z","#9fa984",[688,463,145,72],1.54],
  ];
  const markup=new Map();
  let pigment, flourishes, vignettes, wetLayer;

  function drawContour(c,d,p,color=ink,width=1.25) {
    if(p<=0)return;
    if(!markup.has(d)){
      const el=document.createElementNS("http://www.w3.org/2000/svg","path");
      el.setAttribute("d",d); markup.set(d,el.getTotalLength());
    }
    const len=markup.get(d);
    c.save();c.setLineDash(p>.995?[]:[Math.max(0,p*len),len+4]);shape(c,d,null,color,width);c.restore();
  }

  function trim(c,x,y,s,angle,tone) {
    c.save();c.translate(x,y);c.scale(s,s);c.rotate(angle);
    shape(c,"M-18-25L20-23 19 29-17 30ZM-22-26L22-26M-22 32L24 30M1-21L1 26M-17 3L19 3",tone,ink,1.4);
    line(c,[[11,-19],[15,24]],"#f3e2caba",1.4);
    if(s>.93) {
      shape(c,"M-20 28L23 28 19 34-18 34Z",tone,ink,.85);
      for(let i=0;i<6;i++){
        const x=i*5.9-14;
        ellipse(c,x,28-(i%3)*2.5,3.4,2.1,-.61,tone==="#878f85"?"#778764":"#b7b092",ink,.4);
      }
    }
    c.restore();
  }

  function fixedInk(c,t,filled) {
    const p=progress(t,0,5.3), tone=filled?"#878f85":"#eee4cb";
    c.save();c.globalAlpha=.58+.42*p;
    for(const [i,x,y,s,a] of [
      [0,128,221,1.12,-.07],[1,226,215,1.04,-.06],[2,304,215,1.0,-.09],[3,399,195,1.17,-.10],
      [4,478,225,.81,-.09],[5,307,302,.9,-.1],[6,393,292,.88,-.14],[7,461,308,.79,-.16],
      [8,559,306,.83,-.12],[9,680,313,.89,.12],[10,783,300,.79,.19],[11,840,293,.93,.19],
      [12,907,228,.99,.14],[13,981,223,1.16,.09],[14,1057,201,.98,.08],[15,1134,219,1.16,.07],
      [16,1156,313,.99,.05],[17,895,323,.83,.19],[18,985,324,1.11,.09]
    ]){if(i<7+13*p)trim(c,x,y,s,a,tone);}
    const rand=rng(914);
    for(let i=0;i<250;i++){
      const x=72+rand()*1152,y=184+rand()*204,w=4+rand()*25;
      const ok=(x<480&&y>212)||(x>875&&y>166);
      if(ok && i/250<p+.25) line(c,[[x,y],[x+w,y-(x<500?3:-2)]],i%3?"#795d4738":"#8e634b61",.65+rand()*.55);
    }
    for(const [i,d] of [
      [0,"M142 413L153 557M518 395L531 530M598 419L606 539M823 411L840 527M1154 408L1165 548M1039 415L1035 534"],
      [1,"M97 177L126 167 189 159M216 126L351 112 390 122M869 178L971 142 1027 120M1102 145L1208 141"],
      [2,"M312 367L293 408M375 357L365 403M439 356L446 397M499 353L517 403M541 357L574 415M899 362L871 412M951 358L938 412M1002 355L1004 409M1059 353L1077 405M1108 354L1138 404"],
      [3,"M111 421L151 416M669 425L711 422M756 429L790 430M58 637Q248 576 447 548T864 528T1228 574M119 654Q388 593 634 596Q937 598 1191 643"],
      [4,"M174 467L184 542 198 546M624 443L614 529M816 443L808 542M1173 425L1177 544M140 428L139 517"],
    ])drawContour(c,d,progress(t,i*.45-.82,1.8),"#644c3f",i===0?2:1);
    c.restore();
  }

  function awningStripes(c) {
    for(const d of [
      "M233 376L279 369 248 425 201 438Z","M345 360L395 353 376 405 324 411Z",
      "M466 352L514 353 533 406 480 397Z","M551 356L578 360 628 424 591 416Z",
      "M863 361L912 359 887 414 835 417Z","M964 357L1009 353 1031 409 972 414Z",
      "M1062 352L1103 352 1180 401 1110 407Z"
    ])shape(c,d,"#f6e8c79a");
    for(const [x,y] of [[188,460],[236,451],[285,442],[334,433],[384,429],[433,428],[482,431],[531,434],
      [838,437],[886,434],[935,431],[982,429],[1031,426],[1080,423],[1128,420],[1176,417]])
      ellipse(c,x,y,13,4,-.10,"#e0b98045",ink,.5);
  }

  function blossom(c,x,y,s,code,solid,seed) {
    c.save();c.translate(x,y);c.scale(s,s);
    const rand=rng(seed),n=5+code%5,color=["#ca676c","#d89456","#e5b35c","#ab7e98","#eebea2","#b85151"][code%6];
    for(let i=0;i<n;i++){
      c.rotate(2*Math.PI/n);
      ellipse(c,rand()*2-1,-3.6-rand()*3,2.7+rand()*1.7,3.2+rand()*2.7,.17,solid?color:"#e8dbc2",ink,.52);
    }
    circle(c,0,0,2.75,solid?(code%4?"#7a5e45":"#e7ba6e"):"#8c7763");
    c.restore();
  }

  function bucket(c,x,y,s,code,filled,seed) {
    c.save();c.translate(x,y);c.scale(s,s);
    ellipse(c,0,11,30,8,-.04,"#68574632");
    shape(c,"M-23-37Q0-46 20-38L16 14Q0 21-15 11Z",filled?(code%2?"#72928a":"#be9472"):"#e0d4b8",ink,1.3);
    ellipse(c,-1,-37,23,8,0,filled?"#687967":"#a99d83",ink,1.1);
    const rand=rng(seed);
    for(let i=0;i<20;i++){
      const a=rand()*58-29,b=-49-rand()*51,z=.69+rand()*.57;
      stroke(c,[[0,-33],[a*.40,(b-38)*.55],[a,b]],1,filled?(i%3?"#536c4e":"#697849"):"#8b7d66",.7+rand()*.55,1.05,i+10);
      if(i%3===0)ellipse(c,a*.52,(b-35)*.55,6.9,2.6,-.46,filled?"#789479":"#c2b79b",ink,.39);
      blossom(c,a,b,z,code+(i%8===0?1:0),filled,i+seed);
    }
    c.restore();
  }

  function market(c,filled) {
    for(const [x,y,w] of [[182,539,177],[371,543,223],[811,543,173],[1001,536,172]]) {
      const q=`M${x} ${y-16}l${w} -11 12 35 -${w+7} 4Z`;
      shape(c,q,filled?"#a88460":"#ded1b2",ink,1.25);
      for(let i=0;i<8;i++)line(c,[[x+i*w/8,y-16-i],[x+i*w/8+4,y+21-i]],"#7f624d9c",.72);
    }
    const variants=[[184,597,.84,2],[231,585,1.05,0],[287,583,.92,3],[339,586,1.02,1],
      [383,563,.61,4],[424,564,.74,2],[479,567,.82,0],[526,550,.63,5],
      [829,559,.69,3],[878,576,.91,4],[928,583,1.12,1],[981,582,.89,3],
      [1018,566,.78,2],[1069,567,.82,0],[1125,581,.98,5],[1176,591,1.12,4]];
    for(const [i,[x,y,s,n]] of variants.entries())bucket(c,x,y,s,n,filled,i*133+8);
  }

  function init() {
    pigment=layer(c=>{
      shape(c,"M63 191Q83 171 151 158L255 105 402 91Q483 68 598 84T838 87Q1039 55 1198 119L1222 302Q1079 305 943 281Q831 248 711 279Q569 275 452 229Q268 237 72 259Z",
        "#a1bcbc7a");
      for(const [seed,d,color,bounds] of parts)wash(c,d,color,bounds,seed,.82);
      for(const [i,[d,color,bounds]] of [
        ["M95 368Q227 327 267 341T399 299L428 374Q296 423 95 435Z","#bc8b724d",[95,296,333,140]],
        ["M87 191L343 122 429 166Q388 222 211 217Q144 259 86 238Z","#f0a66850",[83,120,349,140]],
        ["M1042 207Q1122 226 1189 208L1204 378Q1148 400 1062 347Q1018 323 1042 207Z","#a96c7751",[1026,205,180,178]],
        ["M816 230Q937 177 1069 151Q1110 154 1103 196Q1031 252 864 279Z","#b887625a",[810,147,296,135]],
        ["M95 552Q401 440 650 483T1203 476Q1188 539 997 581T465 541T89 607Z","#9e95895c",[86,444,1119,165]],
      ].entries())wash(c,d,color,bounds,314+i*27,.83);
      awningStripes(c);
    });
    wetLayer=layer(()=>{}).getContext("2d");
    vignettes=[false,true].map(col=>layer(c=>market(c,col)));
    flourishes=layer(c=>{
      const random=rng(1252);
      for(let i=0;i<190;i++){
        const x=65+random()*1155,y=477+random()*169;
        line(c,[[x,y],[x+3+random()*28,y-3+random()*5]],"#7c695246",.55+random()*.85);
      }
      for(const [x,y] of [[179,652],[360,610],[791,610],[1082,627]]){
        const d=`M${x-46} ${y}q34-27 81-19t43 20q-23 10-67 4t-57-5Z`;
        shape(c,d,null,"#7b766682",1.2);
      }
    });
  }

  function figure(c,x,y,s,t,options){
    const {color="#ca8f6f",kind="walk",dir=1,filled=true,phase=0}=options;
    c.save();c.translate(x,y+1.9*Math.sin(t*9+phase));c.scale(dir*s,s);
    const u=t*6.5+phase,walking=kind==="walk",reach=kind==="water"?progress(t,2.08,1.17)*(1-progress(t,6.86,.86)):.19;
    const coat=filled?color:"#e7dac0",skin=filled?"#c68d6b":"#e9d7bb",trouser=filled?"#677774":"#c8bfaa";
    const k=walking?Math.sin(u):0;
    const hip=[0,-69+3*Math.abs(k)], neck=[9+15*reach,-140+ aTiny(walking,u)];
    ellipse(c,2,3,45,7,0,"#5a50443a");
    for(const [i,d] of [-1,1].entries()){
      const foot=[(walking?k*d*38:22*d),-3-(walking?Math.max(0,Math.cos(u)*d)*11:0)];
      const knee=joint(hip,foot,38,37,-1);
      limb(c,hip,knee,12.7,10,i?trouser:"#8e9083",ink,1.37);
      limb(c,knee,foot,9.5,6.3,trouser,ink,1.37);
      limb(c,[foot[0]-3,foot[1]+1],[foot[0]+12,foot[1]+3],5.7,4.8,"#645248",ink,1.1);
    }
    c.save();c.translate(hip[0],hip[1]);c.rotate(.13+reach*.27);
    shape(c,"M-33 13Q-29-15-24-45Q-27-61-11-74Q3-85 21-65Q32-53 22-29L28 12Q4 34-33 13Z",coat,ink,1.8);
    shape(c,"M-26 15Q-3-36 19-39L27 13Q5 29-26 15Z",filled?"#8c6b5672":"#b6ad9371");
    shape(c,"M-16-59L-11-40-19-11M12-54L5-29 16 0",null,"#e7c7a275",1.3);
    c.restore();
    c.save();c.translate(neck[0],neck[1]);c.rotate(.20+reach*.21);
    shape(c,"M-16 19L-15 6Q-26-5-23-19Q-21-36-4-37Q13-38 18-20L25-8 16-5 17 5 8 9 5 21Z",skin,ink,1.4);
    shape(c,"M-26-14Q-35-16-24-31Q-14-48-2-42Q7-42 17-32L20-24Q8-24-4-31L-17-19-18 1Z",
      filled?"#524940":"#8a7965",ink,1.1);
    line(c,[[5,-15],[14,-16]],ink,.95);circle(c,10,-12,1.18,ink);
    c.restore();
    const elbow=[neck[0]+9+25*reach,-104+8*k],hand=[24+46*reach,-79-28*reach-16*k];
    limb(c,[neck[0]-3,-130],elbow,10,8,coat,ink,1.55);
    limb(c,elbow,hand,8,4.6,skin,ink,1.2);
    circle(c,...hand,5.2,skin);
    if(kind==="water") can(c,hand[0]+13,hand[1]+10,reach,t);
    if(kind==="buyer") {
      for(let j=0;j<8;j++) {
        const dx=hand[0]+(j-3)*5,dy=hand[1]-26-(j%3)*5;
        line(c,[hand,[dx,dy]],"#5d765a",1);blossom(c,dx,dy,.83,j%4,filled,j+19);
      }
    }
    c.restore();
  }

  function aTiny(walking,u){return walking?2*Math.cos(u*2):0;}

  function can(c,x,y,p,t) {
    c.save();c.translate(x,y);c.rotate(p*.72);
    shape(c,"M-15-5L13-6 22 8 18 23-15 23-20 9Z","#809a8b",ink,1.2);
    shape(c,"M-15 4Q-36 1-34 14Q-30 24-16 20M21 10L37 1 49-2 50 4 36 8 19 19",null,ink,2.4);
    c.restore();
    if(p>.7) {
      c.save();c.globalAlpha=(p-.7)*2.5;
      for(let j=0;j<13;j++){
        const a=(t*1.8+j/13)%1,dx=x+36+a*(25+(j%3)*5),dy=y+32+54*a**1.8;
        line(c,[[dx,dy],[dx+1.2,dy+3.8]],j%2?"#619994":"#fcf3db",1.65);
      }
      c.restore();
    }
  }

  function wheel(c,x,y,r,turn) {
    ellipse(c,x,y,r,r,0,null,"#5d5044",2.5);
    ellipse(c,x,y,r-3,r-3,0,null,"#796558",1);
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6+turn;
      line(c,[[x,y],[x+(r-3)*Math.cos(a),y+(r-3)*Math.sin(a)]],"#5d554763",.65);
    }
    circle(c,x,y,2.9,"#645f52");
  }

  function bicycle(c,x,y,scale,t) {
    c.save();c.translate(x,y);c.scale(scale,scale);
    const rear=[-51,0],front=[54,0],crank=[-4,-7],seat=[-19,-58],bar=[40,-63];
    wheel(c,...rear,33,x/34);wheel(c,...front,33,x/34);
    const dark="#426c68";
    for(const pts of [[rear,seat,crank,rear],[crank,[31,-49],seat],[[31,-49],front],[bar,[31,-49]],[[29,-63],[48,-65]],[[seat[0]-12,seat[1]], [seat[0]+13,seat[1]]]])
      line(c,pts,dark,2.85);
    shape(c,"M37-47L75-48 69-28H45Z","#c3a37f",ink,1.4);
    for(let i=0;i<6;i++)line(c,[[42+i*5,-46],[45+i*4,-29]],"#866e55",.65);
    for(let i=0;i<4;i++)blossom(c,40+i*9,-51-i%2*4,.68,i+2,true,421+i);
    const hip=[-19,-65],neck=[5,-114],pedal=(a)=>[-4+15*Math.cos(a),-7+15*Math.sin(a)];
    for(const d of [0,Math.PI]){
      const foot=pedal(-x*.045+d),k=joint(hip,foot,33,33,-1);
      limb(c,hip,k,6.9,5.5,"#777b77",ink,1);limb(c,k,foot,5,3.7,"#636e69",ink,1);
      line(c,[[foot[0]-3,foot[1]],[foot[0]+8,foot[1]]],"#4f493e",3);
    }
    const bob=1.4*Math.sin(t*5.3);
    limb(c,hip,[neck[0],neck[1]+bob],13,10,"#b27566",ink,1.4);
    limb(c,neck,[15,-88],5.5,4.5,"#a5735c",ink,1.0);limb(c,[15,-88],bar,4.8,3.7,"#b9866a",ink,1);
    ellipse(c,13,-126+bob,10,12,-.29,"#c6906d",ink,1.35);
    shape(c,"M1-128Q-2-142 9-142Q24-145 26-131L15-133 4-126Z","#504940",ink,1);
    c.restore();
  }

  function flow(c,t) {
    const spread=progress(t,.6,6.2);
    const g=wetLayer, radius=122+1270*spread;
    g.clearRect(0,0,W,H);
    g.drawImage(pigment,0,0);
    g.save();
    g.globalCompositeOperation="destination-in";
    const mask=g.createRadialGradient(136,455,Math.max(0,radius-140),136,455,radius);
    mask.addColorStop(0,"#fff");
    mask.addColorStop(.64,"#fff8");
    mask.addColorStop(.89,"#fff4");
    mask.addColorStop(1,"#fff0");
    rect(g,0,0,W,H,mask);
    g.restore();
    c.drawImage(g.canvas,0,0);
  }

  function draw(c,t) {
    paper(c,"#eee4c9","#a07c5e65");
    const zoom=1+.105*progress(t,0,2.13)*(1-progress(t,7.54,1.59)), pan=38*progress(t,2.45,4.0);
    c.save();c.translate(639-pan,393);c.scale(zoom,zoom);c.translate(-640,-393);
    c.drawImage(flourishes,0,0);
    flow(c,t);
    const inkT=t+.21;
    for(const [seed,d,,bounds,begin] of parts) drawContour(c,d,progress(inkT,begin-.74,1.72),ink,seed<20?1.45:1.13);
    fixedInk(c,t,t>1.10);
    c.drawImage(vignettes[0],0,0);
    c.save();
    const bloom=progress(t,1.62,3.79);
    c.beginPath();c.ellipse(176,553,1126*bloom+30,113+145*bloom,.04,0,Math.PI*2);c.clip();
    c.globalAlpha=.38+.62*progress(t,1.45,3.10);
    c.drawImage(vignettes[1],0,0);c.restore();
    const crowd=[
      [555,499,.45,"#ab795d",.1,-1],[666,479,.39,"#7b8c87",2,1],[725,485,.5,"#bc8d67",4,1],
      [787,492,.52,"#8a7882",6,-1],[349,492,.46,"#b96f62",1,1],[1077,555,.72,"#6e8986",.3,-1],
    ];
    for(const [x,y,s,color,phase,dir] of crowd)figure(c,x+Math.sin(t*.83+phase)*15,y,s,t,{color,phase,dir,filled:t>.9+x*.0015});
    figure(c,393-6*progress(t,2.1,1.8),624,1.06,t,{color:"#bd7863",kind:"water",filled:t>.78});
    figure(c,954+12*Math.sin(t*.8),621,.98,t,{color:"#628b88",kind:"buyer",dir:-1,filled:t>2.1});
    bicycle(c,90+t*103+14*Math.sin(t*.84),616,.92,t);
    c.restore();
    const note=c.createLinearGradient(0,0,0,166);
    note.addColorStop(0,"#eee4cb");note.addColorStop(.66,"#eee4cbeb");note.addColorStop(1,"#eee4cb00");
    rect(c,0,0,595,167,note);
    text(c,"花市一早",81,105,69,"#604d3f","Brush");
    text(c,"晨光、花摊与来往的车铃",88,140,25,"#806d51","Kai");
    stroke(c,[[81,153],[227,150],[347,153]],1,"#936e5674",1.15,1.8,528);
    silk(c,1.5);
  }
  register("gangbi",draw,init);
})();
