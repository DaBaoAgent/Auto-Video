(() => {
  const { W,H,line,shape,circle,text,rect,mix,progress,rng,silk,caption,register }=Paper;
  let T,renderer,gbuffer,camera,scene,quad,screen,post,body,head,eyes,tail,bug,wings,tongue,tip,leaves;
  const palette=["#247a67","#59974f","#aeca64","#e3aa4e","#2a777f"];
  const V=(x,y,z=0)=>new T.Vector3(x,y,z);
  const glVS=`
uniform mat4 bindPose;
out vec3 n, localPos, anchored, colour;
out float depth;
void main(){
  vec4 q=modelViewMatrix*vec4(position,1.0);
  anchored=(bindPose*vec4(position,1.0)).xyz;
  n=normalize(normalMatrix*normal);
  localPos=position;
  colour=color;
  depth=-q.z;
  gl_Position=projectionMatrix*q;
}`;

  const glFS=`
uniform float objectId, spread, angle, grainMode;
uniform vec3 pigment;
in vec3 n, localPos, anchored, colour;
in float depth;
layout(location=0) out vec4 albedo;
layout(location=1) out vec4 lighting;
layout(location=2) out vec4 direction;
layout(location=3) out vec4 anchor;
float hash(vec3 a){a=fract(a*vec3(0.1031,0.103,0.0973));a+=dot(a,a.yzx+19.19);return fract((a.x+a.y)*a.z);}
void main(){
  vec3 norm=normalize(n);
  if(!gl_FrontFacing) norm=-norm;
  float lamp=0.32+0.68*smoothstep(-0.22,0.98,dot(norm,normalize(vec3(-.54,.66,.6))));
  vec3 b=floor(localPos*101.0);
  float ch=hash(b);
  float dots=smoothstep(.15,.44,length(fract(localPos.xy*35.0+vec2(floor(localPos.y*35.0)*.51,0.0))-.5));
  float stipple=mix(0.77+0.32*ch,1.06-0.16*dots,grainMode);
  albedo=vec4(pigment*colour*stipple,objectId/255.0);
  lighting=vec4(lamp,depth,norm.xy*.5+.5);
  float dir=angle+norm.x*.7+norm.y*.30;
  direction=vec4(cos(dir),sin(dir),grainMode,1.);
  anchor=vec4(anchored.x*100.0,anchored.y*100.0,spread+max(0.0,localPos.x)*.33,1.);
}`;

  const postFS=`
uniform sampler2D aTex,lTex,dTex,rTex;
uniform vec2 size;
uniform float time,boil;
varying vec2 uvOut;
float rnd(vec2 a){a=fract(a*vec2(.1031,.11369));a+=dot(a,a.yx+19.19);return fract((a.x+a.y)*a.x);}
float hatch(vec2 p, vec2 d, float s, float seed, float amount) {
  vec2 q=vec2(dot(p,d),dot(p,vec2(-d.y,d.x)));
  vec2 grid=floor(vec2(q.x/33.,q.y/s));
  float noise=rnd(grid+seed);
  float lineDist=abs(fract(q.y/s+(noise-.5)*.2)-.5);
  float tapered=smoothstep(0.,.17,fract(q.x/33.))*(1.-smoothstep(.75,.99,fract(q.x/33.)));
  return (1.-smoothstep(.17,.39,lineDist))*mix(.43,1.,noise)*(0.45+0.55*tapered)*smoothstep(noise-.19,noise+.05,amount);
}
void main(){
  vec4 a=texture2D(aTex,uvOut), l=texture2D(lTex,uvOut), d=texture2D(dTex,uvOut), r=texture2D(rTex,uvOut);
  float id=a.a;
  vec2 pp=uvOut*size;
  float grain=rnd(floor(pp));
  vec3 paper=vec3(.976,.955,.897)*(1.+.039*(grain-.5));
  float sun=max(0.,1.-length((uvOut-vec2(.39,.60))*vec2(1.,.58)));
  vec3 air=mix(paper*vec3(.76,.86,.83),paper,smoothstep(.36,.96,sun));
  if(id<.002){gl_FragColor=vec4(air,1.);return;}
  float age=time-r.b;
  float coat=smoothstep(-.17,.65,age);
  float lead=smoothstep(.07,1.22,age);
  float crossLead=smoothstep(.38,1.45,age);
  float glaze=smoothstep(.72,2.0,age);
  vec2 p=r.xy;
  float tooth=rnd(floor(p*1.3))*.48+rnd(floor(p*.28))*.32+.13;
  vec2 dir=normalize(d.xy);
  vec2 d2=vec2(dir.x*.66-dir.y*.75,dir.x*.75+dir.y*.66);
  vec2 d3=vec2(dir.x*.82+dir.y*.57,dir.y*.82-dir.x*.57);
  float fog=smoothstep(12.7,19.,l.g);
  vec3 pig=mix(a.rgb,air,fog*.64);
  float dark=1.-l.r;
  vec3 col=mix(paper,pig,(.42+dark*.28)*coat*(.72+.35*tooth));
  col=mix(col,pig,hatch(p,dir,3.8,7.,lead)*(.75-.17*fog));
  vec3 shade=pig*mix(vec3(.46,.58,.68),vec3(.78,.83,.86),l.r);
  col=mix(col,shade,hatch(p,d2,3.15,13.,crossLead)*(.15+.65*dark));
  col=mix(col,shade*.75,hatch(p,d3,5.9,17.,glaze)*dark*.46);
  vec2 wiggle=vec2(rnd(floor(p*.17)+boil),rnd(floor(p*.19)-boil))-.5;
  vec2 at=uvOut+wiggle*1.7/size;
  float edge=0.;
  for(int i=0;i<4;i++){
    vec2 off=i==0?vec2(1.1,0.):i==1?vec2(-1.1,0.):i==2?vec2(0.,1.1):vec2(0.,-1.1);
    vec2 q=at+off/size;
    vec4 aa=texture2D(aTex,q),ll=texture2D(lTex,q);
    edge=max(edge,max(smoothstep(.003,.007,abs(aa.a-id)),smoothstep(.25,.54,length(ll.ba-l.ba))));
  }
  col=mix(col,mix(vec3(.21,.21,.16),pig*.47,.6),edge*(.28+.34*lead)*(.5+.5*tooth)*(1.-fog*.65));
  col=mix(vec3(dot(col,vec3(.299,.587,.114))),col,1.14);
  gl_FragColor=vec4(col,1.);
}`;

  function rgb(hex) {
    return new T.Color(hex).convertLinearToSRGB();
  }

  function paint(geometry, parent, id, color, arrive=-2, angle=.72, scaleMark=0) {
    if(!geometry.hasAttribute("color")){
      const colors=new Float32Array(geometry.attributes.position.count*3).fill(1);
      geometry.setAttribute("color",new T.BufferAttribute(colors,3));
    }
    const material=new T.ShaderMaterial({glslVersion:T.GLSL3,vertexColors:true,side:T.DoubleSide,
      vertexShader:glVS,fragmentShader:glFS,uniforms:{
        bindPose:{value:new T.Matrix4()},objectId:{value:id},spread:{value:arrive},angle:{value:angle},
        grainMode:{value:scaleMark},pigment:{value:rgb(color)}
      }});
    const out=new T.Mesh(geometry,material);
    parent.add(out);
    return out;
  }

  function oval(parent,id,color,xyz,sc,arrive=-2,angle=.72,scaled=0) {
    const m=paint(new T.SphereGeometry(1,24,17),parent,id,color,arrive,angle,scaled);
    m.position.set(...xyz);m.scale.set(...sc);
    return m;
  }

  function tube(parent,points,radius,color,id,arrive=-2,angle=.72,rings=29) {
    const curve=new T.CatmullRomCurve3(points.map(p=>V(...p)));
    const frames=curve.computeFrenetFrames(rings,false), pos=[], ix=[];
    const sides=8;
    for(let i=0;i<=rings;i++){
      const pos3=curve.getPointAt(i/rings),r=typeof radius==="function"?radius(i/rings):radius;
      for(let j=0;j<sides;j++){
        const a=j/sides*Math.PI*2;
        pos.push(...pos3.clone().addScaledVector(frames.normals[i],r*Math.sin(a)).addScaledVector(frames.binormals[i],r*Math.cos(a)).toArray());
        if(i<rings){const k=i*sides+j,n=i*sides+(j+1)%sides;ix.push(k,n,k+sides,n,n+sides,k+sides);}
      }
    }
    const g=new T.BufferGeometry();g.setIndex(ix);
    g.setAttribute("position",new T.Float32BufferAttribute(pos,3));g.computeVertexNormals();
    return paint(g,parent,id,color,arrive,angle);
  }

  function trunk() {
    tube(scene,[[-7,-1.8,.1],[-3.6,-.80,.18],[-1.5,-.46,.12],[1.1,-.55,.05],[3.4,-1,-.6],[6.8,-1.14,-1.6]],
      a=>.6-.29*a,"#765742",60,-2,.11,35);
    const r=rng(66);
    for(let i=0;i<23;i++){
      const x=-6.5+r()*12,z=-.21+r()*.54,y=-.21-.06*(x+1)**2/2.4+.13*r();
      oval(scene,61+i%3,i%3?"#5f824c":"#a19455",[x,y,z],[.16+r()*.43,.04+r()*.07,.10+r()*.26],-1.75,.2);
    }
    for(const [x,y,z,s] of [[-5,-.94,.25,.74],[-3.8,-.41,.45,.61],[3.6,-.8,.35,.67],[4.4,-1.06,-.22,.55]]){
      tube(scene,[[x,y,z],[x+.14,y+.19,z],[x+.22,y+.31,z]],.029*s,"#d3b97c",72,-.6);
      oval(scene,73,"#bd6f4c",[x+.22,y+.34,z],[.24*s,.09*s,.15*s],.8,.4);
      oval(scene,73,"#dd9b5d",[x+.26,y+.385,z],[.12*s,.023*s,.075*s],.8,.4);
    }
  }

  function leaf(parent,x,y,z,len,width,rotation,color,id,arrive) {
    const group=new T.Group();group.position.set(x,y,z);group.rotation.z=rotation;parent.add(group);
    const pts=[], ix=[];
    for(let i=0;i<=16;i++){
      const f=i/16,s=Math.sin(Math.PI*f)**.88;
      pts.push(-width*s,f*len,.10*s,0,f*len,(.28+s*.1)*s,width*s,f*len,.094*s);
      if(i<16){const j=i*3;ix.push(j,j+1,j+3,j+1,j+4,j+3,j+1,j+2,j+4,j+2,j+5,j+4);}
    }
    const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(pts,3));g.setIndex(ix);g.computeVertexNormals();
    paint(g,group,id,color,arrive,1.38);
    tube(group,[[0,0,.02],[0,len*.5,.405],[0,len,.03]],.013,"#bbbc69",id+1,arrive,.89,9);
    for(let i=1;i<5;i++) for(const side of [-1,1]){
      const f=i/7,by=(f+.125)*len;
      tube(group,[[0,f*len,.36*Math.sin(f*Math.PI)+.026],[side*width*.47,by,.20],
        [side*width*.79*Math.sin(Math.PI*(f+.20)),by+len*.065,.12]],.008,"#859954",id+1,arrive,.75,6);
    }
    return group;
  }

  function ecosystem() {
    leaves=[];
    const colors=["#398476","#8baf64","#60a56e","#687747","#c2a755","#4c8b83"];
    const rand=rng(3385);
    for(let i=0;i<31;i++){
      const side=i%2?1:-1,x=side*(3.7+rand()*2.9),y=-2.9+rand()*5.4,z=-3-rand()*3.3;
      leaves.push(leaf(scene,x,y,z,.64+rand()*1.8,.25+rand()*.47,(rand()-.51)*2.1,colors[i%6],24+i%12,-.6+i*.06));
    }
    for(const [i,[x,y,tilt]] of [[-1.4,3.72,-.82],[-.38,4.05,2.71],[2.45,3.79,-2.5],[.8,-3.72,.66]].entries()){
      leaves.push(leaf(scene,x,y,-7.7,1.15+i*.17,.44,tilt,"#adc7a4",20+i,-1.2+i*.54));
    }
    for(const [x,y,z,s,flip] of [[-5.86,2.55,.8,1,1],[5.87,2.94,.25,.92,-1],[-5.19,-2.86,.53,.62,-1],[5.29,-3.04,.83,.93,1]]){
      tube(scene,[[x,y,z],[x+flip*.85,y-.36,z],[x+flip*1.55,y-.65,z]],.048,"#557a50",39,-2);
      for(let i=0;i<6;i++){
        leaves.push(leaf(scene,x+flip*(i*.27),y-i*.108,z,(.79+i*.035)*s,.35*s,
          i%2?flip*2.12:flip*.91,colors[(i+2)%6],44+i*2,-1+i*.24));
      }
    }
    for(const [x,y,z] of [[4.76,-.19,.38],[4.99,.44,.06],[-4.12,1.60,-.6],[-4.63,1.41,-.6]]) {
      tube(scene,[[x,y-1,z],[x-.18,y-.5,z],[x,y,z]],.024,"#6f9351",78,-.7);
      for(let j=0;j<6;j++){
        const a=j*Math.PI/3;
        const petal=oval(scene,79,j%2?"#c76576":"#df906c",[x+.20*Math.cos(a),y+.20*Math.sin(a),z],
          [.22,.088,.082],.5,.3);
        petal.rotation.z=a;
      }
      oval(scene,80,"#d7aa56",[x,y,z+.085],[.085,.085,.065],.75);
    }
  }

  function bodyGeometry() {
    const g=new T.SphereGeometry(1,55,38), p=g.attributes.position, colors=[];
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
      const width=.77+.23*x;
      p.setXYZ(i,x*1.69,(y*.96+.16*x)*width,z*.47*width);
      const a=Math.sin(x*18+z*6+y*3);
      const band=progress(a,.03,.84);
      let base=rgb(palette[0]).lerp(rgb(palette[4]),Math.max(0,-y)*.79);
      base.lerp(rgb(y>.12?palette[2]:palette[1]),band*.76);
      if(a>.86&&y>.14)base.lerp(rgb(palette[3]),.59);
      colors.push(...base.toArray());
    }
    g.setAttribute("color",new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();
    return g;
  }

  function animal() {
    body=new T.Group();scene.add(body);body.position.set(-1.15,.73,.44);
    paint(bodyGeometry(),body,92,"#ffffff",-1.9,1.15,1);
    // Grasping feet straddle the branch, with toes curving over the bark.
    for(const [x,z,s] of [[-.98,-.20,-1],[.95,-.19,1],[-.85,.37,-1],[.77,.39,1]]){
      const start=[x,-.12,z],elbow=[x+.43*s,-.41,z+.27],foot=[x+.07*s,-1.03,z+.34];
      tube(body,[start,[x+.25*s,-.27,z+.16],elbow,[foot[0]+.21*s,-.78,foot[2]-.06],foot],
        p=>.16-.105*p,"#4e9770",94+(s===1?1:0),-.78,.65);
      for(const side of [-1,1])for(const d of [-1,1]){
        const shift=side*.17+d*.029;
        tube(body,[foot,[foot[0]+shift,-1.06,foot[2]+side*.12],[foot[0]+shift*1.45,-1.20,foot[2]+side*.16]],
          p=>.039-.02*p,"#a3ac6b",98,-.48,.65,8);
      }
    }
    tail=new T.Group();body.add(tail);tail.position.set(-1.44,-.09,-.02);
    const spiral=[[-.03,0,0],[-.44,.0,-.04],[-.91,-.35,-.11],[-1.45,-.11,-.10],[-1.62,.36,.04],
      [-1.36,.73,.09],[-.96,.70,.12],[-.80,.38,.14],[-1.01,.22,.14],[-1.19,.32,.15],[-1.12,.46,.15]];
    tube(tail,spiral,p=>.197*(1-p)**.68+.019,"#51956d",97,-.9,1.17,57);
    for(let i=0;i<22;i++){
      const x=-1.24+i*.116,y=.30+.53*Math.sqrt(Math.max(0,1-(x/1.66)**2));
      const spike=new T.ConeGeometry(.073,.17+(i%5)*.019,4);
      const m=paint(spike,body,99,i%3?"#659e64":"#9eb861",-.65,.85);
      m.position.set(x,y,-.02);m.rotation.z=.26;
    }
    head=new T.Group();body.add(head);head.position.set(1.35,.30,.06);
    oval(head,100,"#56a171",[.39,.13,0],[.75,.51,.35],-1.9,.92,1);
    const crest=new T.Shape();
    crest.moveTo(-.25,-.05);crest.quadraticCurveTo(-.46,.44,-.45,.87);
    crest.quadraticCurveTo(-.26,.79,.01,.62);crest.lineTo(.76,.24);crest.quadraticCurveTo(.10,.15,-.25,-.05);
    const helmet=paint(new T.ExtrudeGeometry(crest,{depth:.14,steps:1,bevelEnabled:true,bevelThickness:.06,bevelSize:.066}),
      head,101,"#397b6f",-1.65,.94,1);
    helmet.position.z=-.055;
    oval(head,102,"#93af6c",[.62,-.16,.008],[.60,.22,.31],-1.62,.45,1);
    tube(head,[[.03,-.136,.27],[.43,-.19,.31],[.78,-.201,.274],[1.075,-.135,.13]],.026,"#294e40",108,-1.3,.71,13);
    oval(head,108,"#35654d",[.99,-.02,.231],[.046,.029,.014],-1.35);
    eyes=[];
    for(const side of [-1,1]){
      oval(head,103,"#6e9d66",[.28,.21,side*.29],[.29,.29,.20],-1.85,1.28,1);
      const eye=new T.Group();head.add(eye);eye.position.set(.28,.21,side*.35);
      oval(eye,104,"#c7ab61",[0,0,side*.125],[.137,.135,.055],-1.8);
      oval(eye,105,"#1d302a",[.029,.015,side*.175],[.064,.068,.026],-1.8);
      oval(eye,106,"#f5e9a2",[.041,.050,side*.194],[.019,.021,.008],-1.8);
      eyes.push(eye);
    }
    const tongueShape=new T.CylinderGeometry(.053,.09,1,16);
    tongueShape.translate(0,.5,0);
    tongue=paint(tongueShape,scene,112,"#b96662",-2,.7);tongue.visible=false;
    tip=oval(scene,113,"#cf8179",[0,0,0],[.135,.090,.078],-2);
    tip.visible=false;
    bug=new T.Group();scene.add(bug);
    oval(bug,114,"#5b4731",[0,0,.01],[.202,.094,.071],-2,.6);
    oval(bug,115,"#b07848",[-.149,.045,.037],[.084,.055,.058],-2);
    for(const side of [-1,1]) for(let j=0;j<3;j++){
      const x=j*.106-.117;
      tube(bug,[[x,-.03,.01],[x+.07,-.11,side*.082],[x-.046,-.18,side*.15]],.012,"#594e3d",116,-2,.7,7);
    }
    wings=[];
    for(const side of [-1,1]) {
      const w=oval(bug,117,side>0?"#bfca9a":"#a9b89e",[.016,.064,side*.14],[.22,.022,.164],-2,.65);
      w.rotation.y=side*.27;wings.push(w);
    }
  }

  async function init(){
    T=await import("./three.module.js");
    renderer=new T.WebGLRenderer({alpha:false,antialias:false,preserveDrawingBuffer:true,powerPreference:"low-power"});
    renderer.setSize(W,H,false);
    renderer.autoClear=false;
    gbuffer=new T.WebGLRenderTarget(W,H,{count:4,type:T.HalfFloatType,depthBuffer:true,
      minFilter:T.NearestFilter,magFilter:T.NearestFilter});
    camera=new T.OrthographicCamera(-6.4,6.4,3.60,-3.60,.01,80);
    scene=new T.Scene();
    screen=new T.Scene();
    post=new T.ShaderMaterial({
      vertexShader:`varying vec2 uvOut; void main(){uvOut=uv;gl_Position=vec4(position.xy,0.,1.);}`,
      fragmentShader:postFS,depthTest:false,depthWrite:false,
      uniforms:{aTex:{value:gbuffer.textures[0]},lTex:{value:gbuffer.textures[1]},dTex:{value:gbuffer.textures[2]},
        rTex:{value:gbuffer.textures[3]},size:{value:new T.Vector2(W,H)},time:{value:0},boil:{value:0}}
    });
    quad=new T.Mesh(new T.PlaneGeometry(2,2),post);quad.frustumCulled=false;screen.add(quad);
    ecosystem();trunk();animal();scene.updateMatrixWorld(true);
    scene.traverse(o=>{
      if(o.isMesh)o.material.uniforms.bindPose.value.copy(o.matrixWorld);
    });
    leaves.forEach(l=>l.userData.rot=l.rotation.z);
  }

  function pose(t){
    const lock=progress(t,3.75,1.10),shoot=progress(t,6.78,.22),get=progress(t,7.23,.54),active=shoot*(1-get);
    const lean=progress(t,4.4,1.7)-.68*progress(t,7.61,1.21);
    body.position.x=-1.15+.17*lean;
    body.scale.y=1+.028*Math.sin(t*3.7)-.02*active;
    tail.rotation.z=.10*Math.sin(t*1.45)+.11*lean;
    head.rotation.z=.028*Math.sin(t*3.2)-.065*lean+.069*active;
    head.rotation.y=.13*(1-lock)*Math.sin(t*2.5)+.078*lock;
    head.position.x=1.35+.065*lock+.087*active;
    eyes.forEach((eye,i)=>{
      eye.rotation.y=(i?1:-1)*(.35*lock+.45*(1-lock)*Math.sin(t*3.3+i*1.3));
      eye.rotation.x=.28*(1-lock)*Math.sin(t*2.75+i*1.59);
    });
    leaves.forEach((o,i)=>o.rotation.z=o.userData.rot+.042*Math.sin(t*1.28+i*.5));
    scene.updateMatrixWorld(true);
    const mouth=head.localToWorld(V(1.03,-.157,.16));
    const target=V(3.15+.22*(1-lock)*Math.sin(t*9.1),1.08+.17*(1-lock)*Math.sin(t*10.2),.67);
    const end=mouth.clone().lerp(target,active);
    bug.position.copy(target.clone().lerp(mouth,get));
    bug.visible=get<.94;
    bug.rotation.z=.11*Math.sin(t*8.1)*(1-lock)+.42*get;
    wings.forEach((w,i)=>w.rotation.x=Math.sin(t*91+i*Math.PI)*(.70-.56*lock));
    tongue.visible=tip.visible=active>.019;
    if(tongue.visible) {
      const ray=end.clone().sub(mouth);
      tongue.quaternion.setFromUnitVectors(V(0,1,0),ray.clone().normalize());
      tongue.position.copy(mouth);tongue.scale.y=ray.length();
      tip.position.copy(end);
    }
  }

  function note(c,x,y,title,sub){
    shape(c,`M${x} ${y-34}l168 2 7 56-177 2Z`,"#f0e9ceea","#526454",1.3);
    text(c,title,x+12,y+5,30,"#354c43","Kai");
    text(c,sub,x+13,y+21,14,"#64725a","Kai");
  }

  function labelTarget(c,world,anchor,via){
    const p=world.project(camera), x=W*(.5+p.x/2),y=H*(.5-p.y/2);
    line(c,[anchor,via,[x,y]],"#52675c",1.45);
    circle(c,x,y,3.0,"#dfd091");
  }

  function draw(c,t) {
    pose(t);
    const pan=progress(t,1.5,4.6)-.64*progress(t,7.8,1.9);
    camera.position.set(.42*pan,1.78,13);
    camera.lookAt(.42*pan,.49,0);
    camera.updateMatrixWorld();
    renderer.setRenderTarget(gbuffer);renderer.setClearColor(0,0);renderer.clear();
    renderer.render(scene,camera);
    renderer.setRenderTarget(null);renderer.setClearColor(0xffffff,1);renderer.clear();
    post.uniforms.time.value=t;post.uniforms.boil.value=Math.floor(t*12)%3;
    renderer.render(screen,camera);
    c.drawImage(renderer.domElement,0,0);
    const fading=c.createLinearGradient(0,560,0,720);
    fading.addColorStop(0,"#f1e8cb00");fading.addColorStop(.62,"#f0e8c9ed");
    rect(c,0,560,W,160,fading);
    text(c,"雨林弹射",78,119,72,"#355749","Brush");
    text(c,"变色龙捕食观察",84,159,27,"#6a754c","Kai");
    if(t<3.25){
      note(c,969,248,"眼球转动","观察 01");
      labelTarget(c,eyes[1].getWorldPosition(V(0,0,0)),[970,252],[833,254]);
    } else if(t<6.45){
      note(c,983,254,"锁定猎物","观察 02");
      labelTarget(c,bug.position.clone(),[1001,277],[974,302]);
    } else if(t<8.15){
      note(c,981,245,"舌尖捕食","动作慢放");
      labelTarget(c,bug.visible?bug.position.clone():head.localToWorld(V(1.06,-.15,.18)),[997,268],[968,296]);
    }
    silk(c,1.05);
    caption(c,"caiqian",t,"clause");
  }

  register("caiqian",draw,init);
})();
