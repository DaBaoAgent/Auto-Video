(() => {
  const { W,H,shape,rect,circle,line,text,layer,rng,silk,progress,mix,register }=Paper;
  const { ellipse,limb,joint,stroke,wash }=Hand;
  const ink="#554262", rust="#c26f50";
  let park, foliage, paint, resist, wet;
  const backdrop="M60 326Q178 239 317 278Q464 306 559 261Q715 219 866 290Q1035 224 1220 299L1208 617Q1044 660 779 625Q511 690 287 639L57 640Z";

  function wax(c,d,color,bounds,seed,outline=ink) {
    c.save();
    c.clip(Paper.path(d));
    const [x,y,w,h]=bounds, r=rng(seed);
    rect(c,x,y,w,h,color);
    for(let i=0;i<Math.round(w*h/160);i++){
      const a=x+r()*w,b=y+r()*h,z=1+r()*9;
      line(c,[[a,b],[a+z,b-z*.7]],i%5?"#f3e1b55e":"#4e3c5b47",.4+r()*1.55);
    }
    c.restore();
    shape(c,d,null,outline,2.8);
    c.save();c.translate(1.28,-.8);
    shape(c,d,null,"#49395757",.75);
    c.restore();
  }

  function tree(c,x,y,s,variant) {
    c.save();c.translate(x,y);c.scale(s,s);
    wax(c,"M-47 8Q-45-112-54-200L-111-248-111-277-42-242-25-330 1-327 1-249 55-295 79-291 29-231 20-159 43 8Z",
      variant?"#b27f64":"#a56556",[-116,-334,214,338],12+variant);
    shape(c,"M-26 1Q-14-59-22-107Q-45-151-32-210M1-34Q-6-120 11-154Q8-185 16-216M-43-226L-86-257",
      null,"#703f51a1",3);
    const r=rng(555+variant);
    for(let i=0;i<20;i++){
      const a=-142+r()*267,b=-320+r()*116,s=15+r()*33;
      ellipse(c,a,b,s,s*.54,.36-r(),"#ab7f5470","#7b525363",1.8);
      for(let j=0;j<4;j++)line(c,[[a-s*.55,b+2*j],[a+s*.54,b-s*.31+2*j]],"#e6b17075",1.4);
    }
    c.restore();
  }

  function oak(c,x,y,scale,color,angle,seed){
    c.save();c.translate(x,y);c.scale(scale,scale);c.rotate(angle);
    wax(c,"M0 0Q-49-9-44-30Q-42-36-27-31Q-60-61-40-69Q-33-71-21-61Q-43-106-15-105Q-8-100-7-94Q-12-126 0-132Q14-123 8-94Q21-112 29-97Q30-82 15-62Q34-77 42-65Q48-50 23-34Q44-41 47-29Q49-14 0 0Z",
      color,[-62,-134,114,137],seed);
    shape(c,"M0 10L0-105M0-29L-26-52M0-40L22-67M0-76L-16-89",null,"#694b589c",2.4);
    c.restore();
  }

  function basket(c,x,y) {
    c.save();c.translate(x,y);
    wax(c,"M-71-2Q-68-55-28-71Q7-89 53-63Q79-47 79-1L70-3Q55-49 25-61Q-40-81-57 0Z",
      "#ce9763",[-83,-88,171,96],82);
    wax(c,"M-98-4Q0-27 100-11L82 61Q0 90-74 61Z","#cc9b68",[-101,-30,206,125],89);
    shape(c,"M-97-7Q-15 9 96-12L94 4Q5 28-94 10Z","#e3b477",ink,2.7);
    for(let i=0;i<22;i++){
      const x=-85+i*8;
      line(c,[[x,14],[x*.92,50],[x*.84,67]],i%3?"#855b58a0":"#f1cf99a8",2.1);
    }
    for(let i=0;i<5;i++) {
      const y=i*11+16;
      shape(c,`M-86 ${y}q86 24 176-8`,null,"#8b5d5588",2.4);
    }
    c.restore();
  }

  function nut(c,x,y,s,rot) {
    c.save();c.translate(x,y);c.rotate(rot);c.scale(s,s);
    shape(c,"M-18 3Q-17-17-3-17Q20-18 18 4Q14 17 4 23Q-14 17-18 3Z","#a9634a",ink,2);
    shape(c,"M-21-1Q-25-9-16-17Q-1-27 17-19Q23-16 22-7Q8 1-21-1ZM-3-20L0-28 5-29 6-21Z","#b6a05f",ink,2);
    shape(c,"M-9 3Q-12 9-2 16",null,"#e5ae78",2);
    c.restore();
  }

  function squirrel(c,x,y,s,rot,t,inAir,flip,working=false){
    const step=Math.floor(t*12),qt=step/12;
    c.save();c.translate(x,y);c.rotate(rot);c.scale(flip?-s:s,s);
    c.save();c.translate(-57,-21);c.rotate(.19*Math.sin(qt*5)+.34*inAir);
    wax(c,"M4 18Q-40 37-72 16Q-108-12-107-65Q-103-119-69-137Q-46-151-27-132Q-11-115-33-91Q-57-64-54-25Q-49 5 4 5Z",
      working?"#c77d55":"#ce8d5f",[-113,-156,125,201],step%3+63);
    shape(c,"M-70 3Q-96-19-92-60Q-90-104-65-123Q-48-135-36-125Q-55-112-68-67Q-80-27-55 4Z","#e5a473");
    for(let i=0;i<10;i++)stroke(c,[[-84+i*4,-69+i*6],[-65+i*3,-48+i*6],[-63+i*5,-32+i*6]],1,"#9f6159a1",1.3,1.4,seed(step,i));
    c.restore();
    const hind=[-8-7*inAir,34+18*inAir],front=[61+26*inAir,26-12*inAir];
    limb(c,[-19,0],hind,14,8,"#b26750",ink,2.3);
    limb(c,hind,[hind[0]+22,hind[1]+4],7,5.7,"#be7759",ink,1.8);
    wax(c,"M-61 13Q-67-8-41-28Q-20-52 16-58Q43-65 52-44Q59-18 32 6Q14 29-25 39Q-46 41-61 13Z",
      working?rust:"#d49261",[-68,-69,131,114],step%3+75);
    shape(c,"M-46 26Q-13 31 11 12Q28-5 40-21Q32 20 8 30Q-16 40-46 31Z","#f1c588");
    const arm=[30,-20],elbow=joint(arm,front,31,31,-1);
    limb(c,arm,elbow,10,8,"#c98358",ink,1.9);limb(c,elbow,front,8,5.5,"#d19768",ink,1.9);
    if(working)line(c,[[front[0],front[1]],[front[0]+8,front[1]+2]],"#875b4d",2.2);
    c.save();c.translate(37,-54);c.rotate(.10*Math.sin(qt*4.2)+inAir*.14);
    shape(c,"M-21-8Q-25-30-13-49Q-4-61 0-48L7-23Q11-43 24-48Q31-49 30-23Z","#bd7152",ink,2.2);
    wax(c,"M-21 8Q-26-12-12-23Q6-33 27-22Q35-19 40-8L51 1Q54 7 48 12L35 13Q27 25 7 25Q-7 21-21 8Z",
      working?"#cc845a":"#d99c6c",[-28,-34,84,66],step%3+99);
    shape(c,"M12 11Q20-4 43-3L52 3Q54 7 48 12L36 13Q30 23 16 22Z","#f5cc94");
    ellipse(c,25,-8,4.7,5.6,0,ink);
    circle(c,26.8,-9.9,1.3,"#f7e2b4");
    ellipse(c,50,4,4.5,3.5,.21,"#55425d");
    line(c,[[40,13],[47,11]],ink,1);
    c.restore();
    c.restore();
  }

  function seed(step,i){return (step%3)*161+i*17+4;}

  function build(){
    park=layer(c=>{
      rect(c,0,0,W,H,"#f1e2ba");
      wax(c,backdrop,"#a6a46b",[52,210,1178,450],313,"#7d754d");
      wax(c,"M47 552Q235 480 415 495Q675 448 849 472Q1028 480 1237 534L1220 664Q835 714 606 669T55 674Z",
        "#c2a262",[40,445,1204,268],378,"#8e6e54");
      wax(c,"M142 671Q333 580 545 582Q730 585 882 508L967 523Q816 621 745 674Q470 712 208 685Z",
        "#e5bc77",[133,505,846,191],431,"#ae835b");
      tree(c,366,529,1.27,0);
      tree(c,1028,442,.86,1);
      wax(c,"M368 283Q504 236 631 240Q675 217 727 224L730 244Q680 255 631 271Q537 266 394 313Z",
        "#aa6c56",[364,207,377,111],73);
      for(const [x,y,s,col,a,i] of [[437,225,.63,"#d89656",.84,1],[548,245,.61,"#c97b57",1.35,13],
        [642,236,.52,"#a9a260",.91,5],[1021,208,.62,"#d9a15d",.39,3],[1097,247,.51,"#ae885f",-.32,7]])oak(c,x,y,s,col,a,53+i);
      const r=rng(490);
      for(let i=0;i<75;i++){
        const x=76+r()*1124,y=379+r()*267;
        if(i%6===0) nut(c,x,y,.35,r()*7);
        else stroke(c,[[x,y],[x-4+r()*13,y-6],[x+5+r()*13,y-5]],1,i%4?"#8870587c":"#e8b76fc2",1.9,1.2,i+12);
      }
    });
    foliage=layer(c=>{
      for(const [x,y,s,col,a,i] of [[94,658,1.47,"#bc765e",.68,1],[191,679,.91,"#dfa663",-.75,4],
        [1139,674,1.28,"#a7a56e",.37,6],[1168,676,.95,"#c27b5b",-.75,3],
        [224,663,.71,"#a49f64",.41,9],[1070,661,.78,"#d69166",.62,7]])oak(c,x,y,s,col,a,51+i);
    });
    paint=layer(c=>{
      wash(c,"M681 172Q735 141 812 156Q863 167 915 145Q955 128 1008 150Q1083 171 1128 169Q1184 170 1214 207Q1219 229 1193 247Q1205 281 1177 300Q1159 340 1131 343Q1123 378 1049 386Q835 350 736 319Q666 288 681 172Z",
        "#b3a3c5",[648,127,589,280],230,.72);
      wash(c,"M755 193Q830 158 911 174Q970 161 1050 195Q1123 194 1187 236Q1143 263 1098 260Q1042 259 994 282Q902 274 849 248Q800 227 755 243Z",
        "#8fb0c28e",[744,151,455,148],431,.72);
      const r=rng(37);
      for(let i=0;i<51;i++){
        const x=728+r()*472,y=179+r()*158;
        ellipse(c,x,y,2+r()*6,1+r()*2,-.21,i%3?"#8d86b13f":"#d1b0cb8b");
      }
    });
    resist=layer(c=>{
      for(const [x,y,a,s] of [[822,233,-.62,.78],[929,257,.76,.92],[1026,218,-.66,.68],[1100,291,.41,.73]]){
        c.save();c.translate(x,y);c.rotate(a);c.scale(s,s);
        shape(c,"M1 46Q-40 28-31-3Q-19-29 0-45Q20-28 31-3Q39 28 1 46ZM1 51Q-4 12 0-32M0 32L-20 4M0 23L19-5M0 8L-14-13",
          null,"#fff",3.8);
        c.restore();
      }
    });
    wet=layer(()=>{}).getContext("2d");
  }

  function reveal(c,t){
    const p=progress(t,5.32,2.55);
    if(p<=0)return;
    wet.clearRect(0,0,W,H);wet.drawImage(paint,0,0);
    wet.save();wet.globalCompositeOperation="destination-in";
    const r=600*p+1, front=wet.createRadialGradient(716,228,Math.max(0,r-95),716,228,r);
    front.addColorStop(0,"#fff");front.addColorStop(.72,"#fffc");front.addColorStop(1,"#fff0");
    rect(wet,0,0,W,H,front);
    wet.globalCompositeOperation="destination-out";wet.drawImage(resist,0,0);wet.restore();
    c.drawImage(wet.canvas,0,0);
  }

  function draw(c,t){
    rect(c,0,0,W,H,"#b7956f");
    const pull=progress(t,8.36,1.22), zoom=1-.075*pull;
    c.save();c.translate(640,363);c.scale(zoom,zoom);c.translate(-640,-363);
    c.shadowColor="#62453572";c.shadowBlur=25;c.shadowOffsetY=11;
    c.drawImage(park,0,0);c.shadowColor="transparent";
    reveal(c,t);
    const jump=progress(t,.59,2.13), arc=Math.sin(jump*Math.PI);
    squirrel(c,270+376*jump,459-202*jump-113*arc,1.02,-.49*arc,t,arc,false);
    const run=progress(t,1.71,2.49),catchup=Math.sin(run*Math.PI)*.45;
    const catchLift=progress(t,3.2,.44)*(1-progress(t,5.28,.67))*.57;
    squirrel(c,1119-163*run,549-18*Math.sin(t*6)*(1-run)-29*catchLift,.86,.15*catchup-.33*catchLift,t,catchup+catchLift,true,true);
    const bx=799,by=531;
    basket(c,bx,by);
    for(const [i,[start,end]] of [[2.84,3.80],[3.52,4.52],[4.13,5.20],[5.91,7.00]].entries()){
      if(t<start){ nut(c,679+i*17,243+(i%2)*10,.58,.29*i);continue;}
      const age=Math.min(1,(t-start)/(end-start)), dx=679+i*17+(bx-679-i*17)*age;
      const dy=246+(by-15-246)*age**1.55;
      const recoil=(t>end&&t<end+.30)?Math.sin((t-end)/.30*Math.PI)*16:0;
      nut(c,dx+(t>=end?(i-1.5)*20:0),dy-recoil,.77,(i+age*1.7)*1.42);
    }
    c.drawImage(foliage,0,0);
    if(t>3.72&&t<5.7){
      for(let i=0;i<6;i++){
        const y=478+13*Math.sin(t*7+i),x=725+(i%3)*42;
        stroke(c,[[x,y],[x+3+(i%2)*9,y-9]],1,"#ffe1a8cc",2.1,1.7,12+i);
      }
    }
    text(c,"松鼠接栗子",74,118,67,"#624764","Brush");
    text(c,"摇一摇，接住秋天",82,153,26,"#8c615b","Kai");
    silk(c,1.48);
    c.restore();
    if(pull>0) {
      c.save();c.globalAlpha=pull;
      for(const [x,col] of [[73,"#89728d"],[299,"#b97958"],[524,"#9d925d"]]){
        shape(c,`M${x} 705l150-11 21 7-21 7-150 11Z`,col,ink,1.45);
      }
      c.restore();
    }
  }
  register("labi",draw,build);
})();
