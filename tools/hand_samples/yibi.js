(() => {
  const { W,H,shape,rect,circle,line,text,layer,rng,silk,progress,mix,register }=Paper;
  const { ellipse,stroke }=Hand;
  let garden;
  const ink="#42374e";
  const bounces=[0,1.44,3.68,5.58,7.60,9.50];

  function build(){
    garden=layer(c=>{
      rect(c,0,0,W,H,"#eae1c0");
      shape(c,"M68 368Q161 248 266 291Q339 323 417 266Q533 182 674 251Q775 311 879 237Q1000 178 1183 226L1210 492Q1054 536 852 469Q756 458 662 489Q473 512 318 470Q187 477 68 486Z",
        "#a8b38a");
      shape(c,"M67 439Q182 351 332 400Q462 438 593 415Q829 380 1062 400Q1132 419 1212 369V627Q1048 630 923 599Q799 578 639 613Q420 660 270 594Q142 587 56 607Z",
        "#c1b786");
      shape(c,"M53 542Q187 495 304 544Q459 589 599 536Q788 470 948 508Q1082 526 1210 458L1211 623Q1065 683 888 633Q767 612 612 645Q469 682 263 625Q143 595 56 643Z",
        "#d7a984");
      shape(c,"M74 551Q328 497 442 547Q603 614 823 556Q1024 489 1214 521L1212 588Q1005 548 870 604Q652 687 424 604Q293 560 78 605Z",
        "#e8c79b");
      shape(c,"M698 603Q741 556 829 571Q916 568 949 590Q958 621 882 645Q794 676 721 640Z","#87a8a0");
      shape(c,"M741 620Q786 581 863 591Q915 590 920 612Q877 636 818 643Q758 638 741 620Z","#a2bfb2");
      const random=rng(688);
      for(let i=0;i<137;i++){
        const x=69+random()*1139,y=275+random()*372,r=1.6+random()*8;
        ellipse(c,x,y,r,r*.32,(random()-.5)*.77,["#6e997775","#e9c28e91","#b889807d","#d6d0a789"][i%4]);
      }
      // Staggered solids act like coloured paper rubbed behind the continuous ink line.
      for(const [x,y,s,col] of [[139,342,1.08,"#849e83"],[215,310,.78,"#b88c83"],[382,271,.66,"#87a79a"],
        [840,296,.81,"#77999a"],[1053,279,.92,"#84a196"],[1136,294,1.12,"#ceaa75"]]){
        ellipse(c,x,y,68*s,85*s,-.3,col);
        ellipse(c,x-23*s,y+26*s,45*s,56*s,.43,col);
        ellipse(c,x+33*s,y+22*s,45*s,57*s,-.18,col);
      }
    });
  }

  function path(start) {
    const pts=[start];
    return {
      pts,
      L(x,y){pts.push([x,y]);return this;},
      C(x1,y1,x2,y2,x3,y3){
        const [x0,y0]=pts.at(-1),n=18;
        for(let j=1;j<=n;j++){
          const a=j/n,b=1-a;
          pts.push([b**3*x0+3*b*b*a*x1+3*b*a*a*x2+a**3*x3,
            b**3*y0+3*b*b*a*y1+3*b*a*a*y2+a**3*y3]);
        }
        return this;
      },
    };
  }

  function height(t) {
    const i=bounces.findLastIndex(x=>x<=t);
    if(i===bounces.length-1)return 599;
    const p=(t-bounces[i])/(bounces[i+1]-bounces[i]);
    return 599-4*p*(1-p)*[194,153,132,102,63][i];
  }

  function dog(t) {
    const hop=progress(t,6.60,1.20),leap=Math.sin(hop*Math.PI);
    const travel=progress(t,.35,8.45);
    const settle=progress(t,8.56,.75);
    return {x:540+342*travel,y:494+2.8*Math.sin(t*8.7)*(1-settle)-109*leap+6*settle,
      phase:Math.PI*2*(t*1.64),stretch:leap,tail:Math.sin(t*8.5),settle,
      bow:progress(t,8.74,.87)};
  }

  function linework(d,t,ball) {
    const p=path([69,558]);
    // Park foliage, bench, the running dog and the ball all belong to the same stroke.
    p.C(107,562,140,541,153,511).C(151,460,141,409,155,375)
      .C(99,406,72,370,114,340).C(76,311,107,276,141,292)
      .C(159,245,216,258,202,306).C(255,288,262,360,226,374)
      .C(202,393,187,383,155,375).C(158,434,168,500,169,540)
      .C(176,575,194,574,201,542).L(200,492).L(218,492).L(221,546)
      .L(325,546).L(332,494).L(326,461).L(195,461).L(200,492).L(332,492)
      .L(340,537).L(347,549);
    const {x,y,phase,stretch,tail,bow,settle}=d;
    const bx=x-117,by=y+88+13*Math.sin(phase)*(1-settle);
    p.C(371,561,bx-77,by-16,bx,by);
    const p0=Math.sin(phase)*(1-settle),p1=Math.cos(phase)*(1-settle);
    const L=(dx,dy)=>p.L(x+dx,y+dy);
    const C=(a,b,c,d,e,f)=>p.C(x+a,y+b,x+c,y+d,x+e,y+f);
    const tilt=bow*1.04,cos=Math.cos(tilt),sin=Math.sin(tilt);
    const head=(xx,yy)=>{
      const dx=xx-67,dy=yy+75;
      return [x+67+32*bow+dx*cos-dy*sin,y-75+87*bow+dx*sin+dy*cos];
    };
    const headC=(a,b,c,d,e,f)=>p.C(...head(a,b),...head(c,d),...head(e,f));
    L(-117,88+13*p0);C(-94,97,-90,79,-101,66+18*p0);
    C(-100,42,-89,38,-91,11);
    C(-115,7,-141,6,-167,-17+tail*15);
    C(-180,-33+tail*14,-159,-37+tail*8,-154,-16+tail*9);
    C(-134,-4+tail*6,-115,-18,-100,-21);
    C(-82,-44,-51,-52,-21,-45);
    C(19,-47,51+24*bow,-57+36*bow,67+32*bow,-75+87*bow);
    headC(69,-100,80,-117,96,-113);
    headC(104,-123,120,-115,117,-99);
    headC(101,-97,100,-88,91,-88);
    headC(92,-101,112,-106,124,-96);
    headC(130,-93,138,-81,159,-77);
    headC(169,-72,163,-63,148,-57);
    headC(129,-58,116,-58,107,-53);
    p.C(...head(94,-37),x+86,y-14+19*bow,x+82,y+7);
    L(113+50*p0+56*stretch,42+19*p1-21*stretch);
    C(104+49*p0+52*stretch,50+17*p1-20*stretch,153+42*p0+49*stretch,81+9*p1-39*stretch,
      150+39*p0+49*stretch,84+10*p1-41*stretch);
    C(143+39*p0+49*stretch,90+10*p1-41*stretch,126+30*p0+49*stretch,86+8*p1-41*stretch,
      114+30*p0+48*stretch,72+12*p1-39*stretch);
    L(61+22*p0,37+17*p1);
    C(46,19,28,25,17,31);
    C(-1,39,-30,33,-40,31);
    C(-54,37,-55,54,-54+25*p1,67);
    L(-82+51*p1,96-21*Math.max(0,p0));
    C(-89+51*p1,101-21*Math.max(0,p0),-58+52*p1,98-20*Math.max(0,p0),-62+49*p1,88-21*Math.max(0,p0));
    C(-22,62,-27,51,-37,45);
    C(-28,51,48,53,82,114);
    p.C(x+140,y+128,ball[0]-62,635,ball[0]-42,ball[1]+17);
    p.C(ball[0]-49,ball[1]-24,ball[0]-14,ball[1]-43,ball[0]+18,ball[1]-30)
      .C(ball[0]+47,ball[1]-18,ball[0]+33,ball[1]+21,ball[0]+17,ball[1]+28)
      .C(ball[0]-7,ball[1]+42,ball[0]-50,ball[1]+14,ball[0]-36,ball[1]-9)
      .C(ball[0]-24,ball[1]-33,ball[0]+9,ball[1]-25,ball[0]+33,ball[1]-14)
      .C(ball[0]+48,ball[1]-17,1169,454,1197,469);
    return p.pts;
  }

  function draw(c,t){
    c.drawImage(garden,0,0);
    const d=dog(t),ball=[843+253*progress(t,.33,8.1)-21*progress(t,8.38,1.03),height(t)];
    const young=progress(t,1.03,1.6);
    c.save();c.globalAlpha=.42+.58*young;
    ellipse(c,ball[0],ball[1],33,30,.13,"#d67b60");
    ellipse(c,ball[0]-8,ball[1]-6,15,12,-.23,"#e99775");
    c.restore();
    const pathPts=linework(d,t,ball);
    const draw=.70+.30*progress(t,.02,3.94);
    const tip=stroke(c,pathPts,draw,ink,4.4,1.07,31);
    if(draw<.998){
      circle(c,tip[0],tip[1],3.8,"#523d53");
      const dry=c.createRadialGradient(tip[0],tip[1],1,tip[0],tip[1],24);
      dry.addColorStop(0,"#ab735247");dry.addColorStop(1,"#ab735200");
      circle(c,tip[0],tip[1],24,dry);
    }
    const h=progress(t,7.13,1.65);
    if(h>0) {
      for(let i=0;i<8;i++){
        const f=((t-.75)*1.24+i/8)%1;
        const dx=(i-3.5)*19,dy=-4*f*(1-f)*(19+i*5);
        ellipse(c,847+dx*f,616+dy,3.4*(1-f)+.7,5.2*(1-f)+.6,.47,"#cce0c7c4");
      }
    }
    text(c,"一线追球",81,124,74,ink,"Brush");
    text(c,"一笔连起公园里的一场追逐",88,162,27,"#736753","Kai");
    silk(c,1.30);
  }
  register("yibi",draw,build);
})();
