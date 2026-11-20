(() => {
  const { W,H,shape,rect,line,circle,text,layer,rng,silk,mix,progress,smooth,register } = Paper;
  const { ellipse, polygon, loop, stroke, limb, paper, hatching } = Hand;
  const blue="#6a98bba0", graphite="#353730", soft="#555750";
  let track;

  function hurdle(c,x,y,s,color=soft) {
    c.save();c.translate(x,y);c.scale(s,s);
    shape(c,"M-127-19H-98L-99-158-85-158-84 0H-131ZM67-5H101L101-169H113V11H67Z","#c8c6b8",color,2);
    shape(c,"M-109-173L115-184 125-161-101-149Z","#e4e1d5",color,2);
    for(let i=0;i<6;i++) {
      polygon(c,[[i*38-105,-171-i*1.8],[i*38-90,-172-i*1.8],[i*38-83,-152-i*1.8],[i*38-99,-150-i*1.8]],
        "#626963a5",color,1);
    }
    stroke(c,[[-129,1],[-90,5],[1,13],[111,13]],1,"#5e606253",3,2.2);
    c.restore();
  }

  function build() {
    track=layer(c=>{
      const random=rng(450);
      // Fine graphite stands and perspective guides give the drawings a physical ground plane.
      shape(c,"M-30 322L265 232 523 236 702 285 1109 252 1300 261V473H-30Z","#63666b28");
      for(let i=0;i<10;i++){
        const x=i*143-41,y=294+20*Math.sin(i*.85);
        line(c,[[x,y-34],[x+102,y-46],[x+138,y-27],[x+138,y+36],[x,y+40],[x,y-34]],"#51595e76",1.15);
        for(let j=1;j<5;j++)line(c,[[x+3,y-25+j*11],[x+128,y-32+j*11]],"#5c616759",.85);
        for(let j=0;j<20;j++){
          const px=x+random()*137,py=y-19+random()*53;
          circle(c,px,py,.9+random()*2.2,"#474b50a2");
          line(c,[[px,py+3],[px+random()*3-1.5,py+9]],"#504f5487",1.4+random());
        }
      }
      for(let i=0;i<8;i++){
        const y=383+i*31;
        stroke(c,[[-60,y+65],[441,y+28],[883,y],[1340,y-19]],1,i%2?"#5b6060a1":"#6e9eb798",1.2,1.7,16+i);
      }
      for(let i=0;i<330;i++) {
        const x=random()*W,y=451+random()*182;
        line(c,[[x,y],[x+10+random()*27,y-2-random()*4]],"#68626436",.55+random()*.9);
      }
      hurdle(c,1101,448,.39,"#6d6e65a0");
      hurdle(c,171,461,.42,"#6d6e65a0");
      hurdle(c,459,437,.29,"#6d6e65a0");
      for(const [x,y,s] of [[144,468,.49],[1172,466,.52],[319,438,.30],[1100,432,.39],[55,457,.46],[1211,504,.81]]){
        polygon(c,[[x-24*s,y],[x-12*s,y-60*s],[x+7*s,y-60*s],[x+24*s,y]],"#91908868","#60645c99",1.1);
        line(c,[[x-13*s,y-32*s],[x+13*s,y-32*s]],"#565c5b94",1.3);
      }
    });
  }

  // [hip angle, crouch, lead knee/ankle, trail knee/ankle, near elbow/wrist, far elbow/wrist].
  const keys=[
    [4.76, 488,553, .32, .09, [40,34],[73,86],[-34,56],[-79,86],[22,-30],[91,-53],[-54,-18],[-88,-31]],
    [5.12, 542,552, .41, .20, [69,20],[54,72],[-40,36],[-72,90],[39,-45],[89,-83],[-38,-24],[-71,-60]],
    [5.55, 638,453, .31,-.02, [77,2],[115,19],[-21,51],[-73,52],[58,-41],[108,-67],[-41,-24],[-68,-67]],
    [6.02, 756,429, .48, .01, [81,17],[145,25],[-49,36],[-98,15],[61,-44],[120,-47],[-16,-20],[-56,-47]],
    [6.43, 850,455, .41, .02, [64,25],[99,69],[-53,30],[-81,16],[58,-20],[110,-34],[-17,-21],[-65,-50]],
    [6.89, 938,551, .32, .12, [29,42],[55,81],[-56,38],[-88,49],[19,-20],[65,-56],[-55,-17],[-73,-45]],
    [7.35, 1012,558,.24,.18,[29,44],[15,82],[-23,56],[-68,51],[-29,-28],[18,-65],[36,-21],[67,-53]],
    [7.82, 1062,549,.18,.04,[40,44],[76,69],[-40,47],[-61,89],[33,-31],[66,-74],[-53,-16],[-71,-49]],
  ];

  function run(t,x) {
    const p=t*7.15, swing=Math.sin(p), rise=Math.sin(2*p);
    const y=554-5*rise, a=.21+.06*rise;
    const knee=(sign)=>[34*swing*sign+8,52-23*Math.max(0,-swing*sign)];
    const foot=(sign)=>[72*swing*sign,83-31*Math.max(0,Math.cos(p)*sign)];
    return [t,x,y,a,.07,
      knee(1),foot(1),knee(-1),foot(-1),
      [-31*swing+4,-25],[38-35*swing,-52+16*swing],
      [32*swing-9,-27],[32+38*swing,-57-17*swing]];
  }

  function pose(t) {
    if(t<4.3)return run(t,148+73*t);
    if(t<4.76){
      const first=run(4.3,462), p=smooth((t-4.3)/.46);
      return blend(first,keys[0],p);
    }
    for(let i=1;i<keys.length;i++) if(t<keys[i][0]) {
      const p=(t-keys[i-1][0])/(keys[i][0]-keys[i-1][0]);
      // The center of mass continues across the sheet while the joints ease through the keys.
      const eased=.58*p+.42*smooth(p);
      return blend(keys[i-1],keys[i],eased);
    }
    const end=run(t-7.82,1062+(1-Math.exp(-(t-7.82)*1.3))*128);
    return blend(keys.at(-1),end,progress(t,7.82,.43));
  }

  function blend(a,b,p){return a.map((v,i)=>Array.isArray(v)?[mix(v[0],b[i][0],p),mix(v[1],b[i][1],p)]:mix(v,b[i],p));}

  function athlete(c,p,ghost=false,heat=0,seed=0,clean=1) {
    const [,x,y,ang,crouch,k1,a1,k2,a2,e1,w1,e2,w2]=p;
    const shoulder=[-2+113*Math.sin(ang),-110+38*crouch], hip=[0,0];
    const hx=shoulder[0]+17+seed*.23, hy=shoulder[1]-37;
    c.save();c.translate(x,y);
    const pen=ghost?blue:graphite;
    const paperShade=ghost?null:"#d8d5c9";
    const suit=ghost?null:heat>.04? `rgba(190,106,51,${.38+.53*heat})`:"#85877f";
    const lw=ghost?1.5:2.3, joints=[[k1,a1],[k2,a2],[e1,w1],[e2,w2]];
    for(const [i,[middle,end]] of joints.entries()){
      const begin=i<2?hip:shoulder;
      stroke(c,[begin,middle,end],1,blue,1.25,1.65,17+i+seed);
      ellipse(c,...middle,i<2?11:7,i<2?10:7,.13,null,blue,1);
    }
    ellipse(c,hx,hy,22,28,.33,null,blue,1);
    line(c,[[hx-26,hy+5],[hx+22,hy-6]],blue,1.15);
    ellipse(c,shoulder[0]*.53,shoulder[1]*.55,24,49,ang,null,blue,1);
    if(!ghost) {
      c.globalAlpha*=clean;
      const far=[k2,a2,e2,w2], near=[k1,a1,e1,w1];
      function limbs(k,a,e,w,tone){
        limb(c,hip,k,15,11,tone,pen,lw);
        limb(c,k,a,10,5.7,tone,pen,lw);
        limb(c,a,[a[0]+19,a[1]+5],7,6.5,"#636761",pen,1.7);
        limb(c,shoulder,e,10.1,7,tone,pen,lw);
        limb(c,e,w,7.2,5,tone,pen,lw);
        ellipse(c,w[0]+5,w[1],8,5,.19,tone,pen,1.4);
      }
      limbs(...far,"#b6b6ab");
      c.save();c.rotate(ang);
      const jersey="M-27 10Q-25-30-31-65L-25-103Q-7-115 18-108L30-93Q26-62 25-52L21-5Q-2 14-27 10Z";
      shape(c,jersey,paperShade,pen,lw);
      shape(c,"M-28-48Q-16-84-9-100L17-108 27-99 23-52 18-1Q-4 7-25 8Z",suit);
      shape(c,"M-27 8Q-2-2 22 0L23 16Q5 32-22 27Z","#73766f",pen,1.4);
      hatching(c,Paper.path(jersey),[-33,-109,66,124],"#363c3972",31,5,-.42);
      stroke(c,[[-25,-101],[-31,-64],[-23,-35],[-25,4]],1,pen,1,2.2,seed+6);
      c.restore();
      limb(c,shoulder,[hx-5,hy+14],11,9,paperShade,pen,lw);
      c.save();c.translate(hx,hy);c.rotate(ang*.58);
      shape(c,"M-19 14Q-24 2-22-15Q-18-30 1-28Q16-27 22-11L25 1Q25 13 12 24Q-3 26-19 14Z",paperShade,pen,lw);
      shape(c,"M-22 4Q-33-13-16-26Q2-36 18-19Q12-7-21 4Z","#686c63",pen,1.3);
      c.restore();
      limbs(...near,paperShade);
      stroke(c,[[k1[0]+9,k1[1]],[a1[0]+7,a1[1]-7],[a1[0]+17,a1[1]-2]],1,
        "#3d433f8a",1.05,2.4,seed+6);
    }
    c.restore();
  }

  function draw(c,t) {
    t=Math.floor(t*15)/15;
    const p=pose(t), heat=progress(t,5.07,.55)*(1-progress(t,6.5,1.1));
    paper(c,"#ece9de","#73726e6e");
    const focus=progress(t,1.3,3.1),ease=progress(t,7.63,1.42);
    const zoom=1.13+.20*focus-.11*ease;
    const cx=Math.min(W-W/(2*zoom),Math.max(W/(2*zoom),p[1]+112*(1-ease)));
    const cy=Math.min(H-H/(2*zoom),Math.max(H/(2*zoom),p[2]-124));
    c.save();
    c.translate(640,360);c.scale(zoom,zoom);c.translate(-cx,-cy);
    c.drawImage(track,0,0);
    const light=c.createRadialGradient(p[1],418,45,p[1],429,441);
    light.addColorStop(0,heat>.05?`rgba(213,155,80,${heat*.45})`:"#fff9ea6b");
    light.addColorStop(1,"#efe6d400");
    ellipse(c,p[1],440,431,248,0,light);
    const markers=loop(725,570,302,191,3.95,5.75,30);
    c.setLineDash([7,10]);stroke(c,markers,progress(t,1,3),"#6695b580",1.7,1.5,33);
    c.setLineDash([]);
    for(const [dt,alpha] of [[.48,.43],[.30,.59],[.16,.71]]) {
      c.save();c.globalAlpha=alpha; athlete(c,pose(Math.max(0,t-dt)),true);c.restore();
    }
    if(t<1.26) {
      c.save(); c.globalAlpha=.35;
      athlete(c,pose(1.16),true);
      c.restore();
    }
    ellipse(c,p[1],642,82,11,0,"#434a3b32");
    athlete(c,p,false,heat,Math.floor(t*15)%3,.48+.52*progress(t,0,1.65));
    hurdle(c,782,632,.91);
    c.restore();
    for(const [x,rx] of [[555,20],[640,16],[725,20]]) {
      ellipse(c,x,35,rx+3,10,0,"#a6a399");
      ellipse(c,x,33,rx,7.1,0,"#3b4040");
    }
    text(c,"跃栏试画",84,132,73,graphite,"Brush");
    text(c,"起跑　／　腾空　／　落地",91,175,28,soft,"Kai");
    stroke(c,[[89,186],[261,188],[353,186]],1,blue,1.25,1.6,121);
    const timing=progress(t,.6,8.75);
    stroke(c,[[102,674],[440,674],[831,674],[1185,674]],timing,blue,1.6,1.5,32);
    for(const [i,x] of [102,260,422,585,748,904,1066,1185].entries()){
      if((x-102)/1083>timing)break;
      line(c,[[x,666],[x,680]],i===4&&heat>.05?"#b46935":soft,1.2);
    }
    text(c,`D. ${String(Math.floor(t*15)+1).padStart(3,"0")}`,1122,101,24,graphite,"Kai");
    silk(c,1.4);
  }

  register("pencil",draw,build);
})();
