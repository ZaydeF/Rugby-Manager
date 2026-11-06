import {matchScene,clamp,type PlaybackScene,type Vec3,type CameraView,type ScenePlayer} from './scene3d.ts';

type Mat=Float32Array;
type Colour=[number,number,number,number];
type Mesh={position:WebGLBuffer;normal:WebGLBuffer;index:WebGLBuffer;count:number};
type Object3D={position:Vec3;scale:Vec3;colour:Colour;mesh?:'box'|'sphere'|'disc';rotation?:Vec3};
export type TeamColours={primary:string;secondary:string;ink:string};
export type CameraSettings={view:CameraView;zoom:number;azimuth:number;elevation:number;labels:boolean;quality:'Balanced'|'Low'};
export const defaultCamera=():CameraSettings=>({view:'Broadcast',zoom:1,azimuth:0,elevation:0,labels:true,quality:'Balanced'});
const identity=():Mat=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
export function multiply(a:Mat,b:Mat):Mat {const m=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)m[c*4+r]+=a[k*4+r]*b[c*4+k];return m;}
function model(p:Vec3,s:Vec3=[1,1,1],r:Vec3=[0,0,0]):Mat {
  const [x,y,z]=r,cx=Math.cos(x),sx=Math.sin(x),cy=Math.cos(y),sy=Math.sin(y),cz=Math.cos(z),sz=Math.sin(z);
  const rx=new Float32Array([1,0,0,0,0,cx,sx,0,0,-sx,cx,0,0,0,0,1]);
  const ry=new Float32Array([cy,0,-sy,0,0,1,0,0,sy,0,cy,0,0,0,0,1]);
  const rz=new Float32Array([cz,sz,0,0,-sz,cz,0,0,0,0,1,0,0,0,0,1]);
  const m=multiply(multiply(ry,rx),rz);for(let col=0;col<3;col++)for(let row=0;row<3;row++)m[col*4+row]*=s[col];
  m[12]=p[0];m[13]=p[1];m[14]=p[2];return m;
}
function perspective(aspect:number):Mat {const f=1/Math.tan(Math.PI/7.7),near=.3,far=650;return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]);}
const subtract=(a:Vec3,b:Vec3):Vec3=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const dot=(a:Vec3,b:Vec3)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a:Vec3,b:Vec3):Vec3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const normal=(v:Vec3):Vec3=>{const n=Math.hypot(...v)||1;return [v[0]/n,v[1]/n,v[2]/n];};
function lookAt(eye:Vec3,target:Vec3):Mat {
  const z=normal(subtract(eye,target)),x=normal(cross([0,1,0],z)),y=cross(z,x);
  return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);
}
export function projectPoint(matrix:Mat,p:Vec3,width:number,height:number):{x:number;y:number;visible:boolean;depth:number}{
  const x=matrix[0]*p[0]+matrix[4]*p[1]+matrix[8]*p[2]+matrix[12],y=matrix[1]*p[0]+matrix[5]*p[1]+matrix[9]*p[2]+matrix[13],z=matrix[2]*p[0]+matrix[6]*p[1]+matrix[10]*p[2]+matrix[14],w=matrix[3]*p[0]+matrix[7]*p[1]+matrix[11]*p[2]+matrix[15];
  return {x:(x/w*.5+.5)*width,y:(.5-y/w*.5)*height,visible:w>0&&z/w>=-1&&z/w<=1&&Math.abs(x/w)<1.1&&Math.abs(y/w)<1.1,depth:w};
}
export function parseColour(hex:string,alpha=1):Colour {const n=Number.parseInt(hex.replace('#',''),16);return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255,alpha];}
const vertex=`attribute vec3 aPosition;attribute vec3 aNormal;uniform mat4 uModel;uniform mat4 uViewProjection;varying vec3 vNormal;varying float vDepth;void main(){vec4 world=uModel*vec4(aPosition,1.0);vNormal=normalize(mat3(uModel)*aNormal);vec4 clip=uViewProjection*world;vDepth=clip.w;gl_Position=clip;}`;
const fragment=`precision mediump float;uniform vec4 uColour;varying vec3 vNormal;varying float vDepth;void main(){float light=0.64+0.36*max(dot(normalize(vNormal),normalize(vec3(-0.4,0.9,0.5))),0.0);vec3 colour=uColour.rgb*light;float fog=smoothstep(145.0,360.0,vDepth)*0.62;gl_FragColor=vec4(mix(colour,vec3(0.063,0.09,0.135),fog),uColour.a);}`;

function geometry(kind:'box'|'sphere'|'disc',low=false){
  const positions:number[]=[],normals:number[]=[],indices:number[]=[];
  if(kind==='box'){
    const faces:[Vec3,Vec3[]][]=[[[1,0,0],[[.5,-.5,-.5],[.5,.5,-.5],[.5,.5,.5],[.5,-.5,.5]]],[[-1,0,0],[[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5],[-.5,-.5,-.5]]],[[0,1,0],[[-.5,.5,-.5],[-.5,.5,.5],[.5,.5,.5],[.5,.5,-.5]]],[[0,-1,0],[[-.5,-.5,.5],[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5]]],[[0,0,1],[[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5],[-.5,-.5,.5]]],[[0,0,-1],[[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5],[.5,-.5,-.5]]]];
    faces.forEach(([n,ps],face)=>{for(const p of ps){positions.push(...p);normals.push(...n);}const i=face*4;indices.push(i,i+1,i+2,i,i+2,i+3);});
  }else if(kind==='disc'){
    positions.push(0,0,0);normals.push(0,1,0);for(let i=0;i<=20;i++){positions.push(Math.cos(i/20*Math.PI*2),0,Math.sin(i/20*Math.PI*2));normals.push(0,1,0);if(i>0)indices.push(0,i,i+1);}
  }else{
    const rings=low?4:8,segments=low?8:12;
    for(let r=0;r<=rings;r++)for(let i=0;i<=segments;i++){const y=Math.cos(r/rings*Math.PI),sin=Math.sin(r/rings*Math.PI),x=Math.cos(i/segments*Math.PI*2)*sin,z=Math.sin(i/segments*Math.PI*2)*sin;positions.push(x,y,z);normals.push(x,y,z);if(r<rings&&i<segments){const k=r*(segments+1)+i;indices.push(k,k+1,k+segments+1,k+1,k+segments+2,k+segments+1);}}
  }
  return {positions,normals,indices};
}
function shader(gl:WebGLRenderingContext,kind:number,source:string){const s=gl.createShader(kind);if(!s)throw Error('Could not create 3D shader.');gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error(error??'3D shader compilation failed.');}return s;}

export class RugbyRenderer3D {
  private gl:WebGLRenderingContext|null;
  private program!:WebGLProgram;
  private meshes!:Record<'box'|'sphere'|'disc',Mesh>;
  private locations!:{model:WebGLUniformLocation;view:WebGLUniformLocation;colour:WebGLUniformLocation;position:number;normal:number};
  private overlay:CanvasRenderingContext2D;
  private stadium:Object3D[]=[];
  private picks:{id:string;x:number;y:number}[]=[];
  private width=1;private height=1;private dpr=1;
  private currentMatrix:Mat=identity();
  private target:Vec3=[0,0,0];
  private meshBound:Mesh|null=null;
  private disposed=false;
  private software:CanvasRenderingContext2D|null=null;
  private cpuGeometry={box:geometry('box',true),sphere:geometry('sphere',true),disc:geometry('disc',true)};
  private polygons:{points:{x:number;y:number}[];depth:number;colour:string}[]=[];
  private eye:Vec3=[0,90,110];
  private canvas:HTMLCanvasElement;
  private labels:HTMLCanvasElement;
  private colours:[TeamColours,TeamColours];
  get softwareRendering(){return this.software!==null;}
  constructor(canvas:HTMLCanvasElement,labels:HTMLCanvasElement,colours:[TeamColours,TeamColours]){
    this.canvas=canvas;this.labels=labels;this.colours=colours;
    const gl=canvas.getContext('webgl',{antialias:true,alpha:false,powerPreference:'low-power',preserveDrawingBuffer:false});
    this.gl=gl;const overlay=labels.getContext('2d');if(!overlay)throw Error('Could not create player labels.');this.overlay=overlay;
    if(!gl){this.software=canvas.getContext('2d',{alpha:false});if(!this.software)throw Error('This device cannot create a 3D canvas. Use the 2D match view to continue.');this.buildStadium();return;}
    const program=gl.createProgram();if(!program)throw Error('Could not create the 3D match view.');
    const v=shader(gl,gl.VERTEX_SHADER,vertex),f=shader(gl,gl.FRAGMENT_SHADER,fragment);
    gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);gl.deleteShader(v);gl.deleteShader(f);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)){gl.deleteProgram(program);throw Error('The 3D view could not start.');}
    this.program=program;
    const uniform=(name:string)=>{const l=gl.getUniformLocation(program,name);if(l===null)throw Error(`Missing 3D uniform ${name}`);return l;};
    this.locations={model:uniform('uModel'),view:uniform('uViewProjection'),colour:uniform('uColour'),position:gl.getAttribLocation(program,'aPosition'),normal:gl.getAttribLocation(program,'aNormal')};
    const mesh=(kind:'box'|'sphere'|'disc'):Mesh=>{const g=geometry(kind);const buffer=(data:Float32Array|Uint16Array,target:number)=>{const b=gl.createBuffer();if(!b)throw Error('3D memory allocation failed.');gl.bindBuffer(target,b);gl.bufferData(target,data,gl.STATIC_DRAW);return b;};return {position:buffer(new Float32Array(g.positions),gl.ARRAY_BUFFER),normal:buffer(new Float32Array(g.normals),gl.ARRAY_BUFFER),index:buffer(new Uint16Array(g.indices),gl.ELEMENT_ARRAY_BUFFER),count:g.indices.length};};
    this.meshes={box:mesh('box'),sphere:mesh('sphere'),disc:mesh('disc')};
    gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(.063,.09,.135,1);
    this.buildStadium();
  }
  resize(width:number,height:number,quality:CameraSettings['quality']){
    const dpr=Math.min(quality==='Low'||this.software?1:1.5,window.devicePixelRatio||1);
    if(this.width===width&&this.height===height&&this.dpr===dpr)return;
    this.width=Math.max(1,width);this.height=Math.max(1,height);this.dpr=dpr;
    this.canvas.width=Math.round(this.width*dpr);this.canvas.height=Math.round(this.height*dpr);this.labels.width=this.canvas.width;this.labels.height=this.canvas.height;
  }
  private buildStadium(){
    const add=(p:Vec3,s:Vec3,c:string,alpha=1)=>this.stadium.push({position:p,scale:s,colour:parseColour(c,alpha)});
    add([0,-.8,0],[190,1.4,150],'#182633');add([0,-.12,0],[122,.2,72],'#205b43');
    for(let i=0;i<20;i++)add([-47.5+i*5,0,0],[5,.05,70],i%2?'#27774f':'#236d49');
    add([-55,0,0],[10,.06,70],'#1c6147');add([55,0,0],[10,.06,70],'#1c6147');
    const line=(x:number,z:number,sx:number,sz:number)=>add([x,.06,z],[sx,.055,sz],'#cfdfcf');
    for(const x of [-50,-28,0,28,50])line(x,0,.13,70);
    for(const z of [-35,35])line(0,z,120,.13);
    for(const x of [-60,60])line(x,0,.13,70);
    for(const x of [-40,-5,5,40])for(let z=-30;z<35;z+=8)line(x,z,.10,4);
    for(const z of [-30,30])for(let x=-45;x<50;x+=10)line(x,z,4,.1);
    for(const x of [-50,50]){
      for(const z of [-2.8,2.8]){add([x,6,z],[.20,12,.20],'#ecf0e7');add([x,1,z],[.6,2,.6],x<0?this.colours[0].primary:this.colours[1].primary);}
      add([x,3,0],[.2,.2,5.8],'#f6f4e8');
    }
    // Tiered stands and seat banks are static geometry, with no downloaded models.
    for(const side of [-1,1]){
      add([0,1,side*39],[126,2,1.2],'#29394c');
      for(let tier=0;tier<4;tier++){
        add([0,1+tier*2,side*(44+tier*4)],[138,1.5,4.5],'#263347');
        for(let block=0;block<14;block++)add([-62+block*9.5,2+tier*2,side*(43.5+tier*4)],[7.6,1.3,2.5],(block+tier)%3===0?'#677789':(block+tier)%2===0?'#3d5470':'#465c6f');
      }
      add([0,12,side*61],[144,.6,5],'#263547');
      for(const x of [-64,-22,22,64])add([x,7,side*62],[.7,12,.7],'#506075');
      for(let block=0;block<12;block++)add([-55+block*10,1.1,side*37],[9,1.7,.5],block%3===0?'#68b5ba':block%3===1?'#d8d8c4':'#4370b4');
      for(let tier=0;tier<3;tier++)add([side*(66+tier*3),1+tier*2,0],[4,1.6,76],'#2b3b50');
    }
    for(const x of [-68,68])for(const z of [-43,43]){
      add([x,12,z],[.7,24,.7],'#536274');add([x,23,z],[6,2.2,1.2],'#a1b4c2');
      for(let i=0;i<4;i++)add([x-2.1+i*1.4,23.1,z>.0?z-.7:z+.7],[.9,1.2,.15],'#faf8d9');
    }
  }
  private draw(kind:'box'|'sphere'|'disc',matrix:Mat,colour:Colour){
    if(this.software){this.softwareObject(kind,matrix,colour);return;}
    const gl=this.gl!,mesh=this.meshes[kind],u=this.locations;
    if(mesh!==this.meshBound){gl.bindBuffer(gl.ARRAY_BUFFER,mesh.position);gl.vertexAttribPointer(u.position,3,gl.FLOAT,false,0,0);gl.enableVertexAttribArray(u.position);gl.bindBuffer(gl.ARRAY_BUFFER,mesh.normal);gl.vertexAttribPointer(u.normal,3,gl.FLOAT,false,0,0);gl.enableVertexAttribArray(u.normal);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh.index);this.meshBound=mesh;}
    gl.uniformMatrix4fv(u.model,false,matrix);gl.uniform4fv(u.colour,colour);gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_SHORT,0);
  }
  private softwareObject(kind:'box'|'sphere'|'disc',matrix:Mat,colour:Colour){
    const g=this.cpuGeometry[kind];
    const world:Vec3[]=[];
    for(let i=0;i<g.positions.length;i+=3){const x=g.positions[i],y=g.positions[i+1],z=g.positions[i+2];world.push([matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12],matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13],matrix[2]*x+matrix[6]*y+matrix[10]*z+matrix[14]]);}
    const projected=world.map(p=>projectPoint(this.currentMatrix,p,this.width,this.height));
    const step=kind==='box'?6:3;
    for(let i=0;i<g.indices.length;i+=step){
      const ids=kind==='box'?[g.indices[i],g.indices[i+1],g.indices[i+2],g.indices[i+5]]:g.indices.slice(i,i+3);
      const first=ids[0],j=first*3,n:Vec3=[g.normals[j],g.normals[j+1],g.normals[j+2]];
      const wn=normal([matrix[0]*n[0]+matrix[4]*n[1]+matrix[8]*n[2],matrix[1]*n[0]+matrix[5]*n[1]+matrix[9]*n[2],matrix[2]*n[0]+matrix[6]*n[1]+matrix[10]*n[2]]);
      if(dot(wn,subtract(this.eye,world[first]))<0)continue;
      const points=ids.map(index=>projected[index]);
      if(points.some(p=>p.depth<=.3)||points.every(p=>p.x<0)||points.every(p=>p.x>this.width)||points.every(p=>p.y<0)||points.every(p=>p.y>this.height))continue;
      const depth=points.reduce((n,p)=>n+p.depth,0)/points.length;
      const light=.64+.36*Math.max(0,dot(wn,normal([-.4,.9,.5]))),fog=clamp((depth-145)/215,0,1)*.62;
      const c=colour.slice(0,3).map((v,k)=>Math.round((v*light*(1-fog)+[.063,.09,.135][k]*fog)*255));
      this.polygons.push({points,depth,colour:`rgba(${c.join(',')},${colour[3]})`});
    }
  }
  private flushSoftware(clear=true,sort=true){
    const ctx=this.software!;ctx.setTransform(this.dpr,0,0,this.dpr,0,0);if(clear){ctx.fillStyle='#101723';ctx.fillRect(0,0,this.width,this.height);}
    if(sort)this.polygons.sort((a,b)=>b.depth-a.depth);
    for(const polygon of this.polygons){ctx.beginPath();polygon.points.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y));ctx.closePath();ctx.fillStyle=polygon.colour;ctx.fill();}
  }
  private player(p:ScenePlayer){
    const c=this.colours[p.side],kit=parseColour(c.primary),trim=parseColour(c.secondary),dark=parseColour('#172634'),neutral=parseColour('#b2a999');
    const y=p.position[1]+.03+Math.abs(p.stride)*.08,base=model([p.position[0],y,p.position[2]],[1.15,1.15,1.15],[0,p.heading,p.lean]);
    const part=(kind:'box'|'sphere',pos:Vec3,scale:Vec3,colour:Colour,rotation:Vec3=[0,0,0])=>this.draw(kind,multiply(base,model(pos,scale,rotation)),colour);
    this.draw('disc',model([p.position[0]+.25,.095,p.position[2]+.15],[.85,1,.52]),[.025,.09,.06,.32]);
    if(p.carrier)this.draw('disc',model([p.position[0],.11,p.position[2]],[1.15,1,.85]),[.94,.77,.3,.28]);
    part('box',[0,1.4,0],[.63,.84,.85],kit);part('box',[0,1.8,0],[.66,.12,.88],trim);
    part('box',[0,.91,0],[.62,.35,.8],dark);part('sphere',[0,2.08,0],[.25,.29,.25],neutral);
    for(const side of [-1,1]){
      part('box',[Math.sin(p.stride*side)*.15,.45,side*.23],[.22,.75,.25],neutral,[0,0,p.stride*side*.45]);
      part('box',[.13+Math.sin(p.stride*side)*.13,.12,side*.23],[.43,.19,.27],dark);
      part('box',[Math.sin(p.stride*side)*-.1,1.35,side*.56],[.23,.77,.24],kit,[0,0,-p.stride*side*.7]);
    }
  }
  render(bridge:PlaybackScene,settings:CameraSettings,reducedMotion:boolean){
    if(this.disposed||this.gl?.isContextLost())return;
    const gl=this.gl,scene=matchScene(bridge,reducedMotion),focus=scene.ball;
    const desired:Vec3=[clamp(focus[0]*(settings.view==='Tactical'?.2:.58),-25,25),0,clamp(focus[2]*.22,-8,8)];
    for(let i=0;i<3;i++)this.target[i]+=(desired[i]-this.target[i])*(reducedMotion||!bridge.running?1:.12);
    const elevation=clamp((settings.view==='Tactical'?1.24:settings.view==='End-on'?.42:.69)+settings.elevation,.22,1.48);
    const azimuth=(settings.view==='End-on'?-Math.PI/2:settings.view==='Tactical'?.12:.24)+settings.azimuth;
    const aspect=this.width/this.height,fit=aspect<1.5?1.15:1,range=(settings.view==='Tactical'?140:settings.view==='End-on'?105:108)*fit/settings.zoom;
    const eye:Vec3=[this.target[0]+Math.sin(azimuth)*Math.cos(elevation)*range,Math.sin(elevation)*range,this.target[2]+Math.cos(azimuth)*Math.cos(elevation)*range];
    this.eye=eye;this.polygons=[];
    this.currentMatrix=multiply(perspective(aspect),lookAt(eye,this.target));
    if(gl){gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(this.program);gl.uniformMatrix4fv(this.locations.view,false,this.currentMatrix);this.meshBound=null;}
    if(this.software){
      // Paint the coplanar pitch in construction order. Depth-sort raised stadium
      // geometry and players together, so the turf cannot cover distant players.
      for(const o of this.stadium.filter(o=>o.position[1]<.2))this.draw(o.mesh??'box',model(o.position,o.scale,o.rotation),o.colour);
      this.flushSoftware(true,false);this.polygons=[];
      for(const o of this.stadium.filter(o=>o.position[1]>=.2))this.draw(o.mesh??'box',model(o.position,o.scale,o.rotation),o.colour);
    }else for(const o of this.stadium)this.draw(o.mesh??'box',model(o.position,o.scale,o.rotation),o.colour);
    for(const p of scene.players)this.player(p);
    this.draw('disc',model([scene.ball[0],.1,scene.ball[2]],[.55,1,.33]),[0,.03,.02,.4]);
    this.draw('sphere',model(scene.ball,[.44,.23,.23],[scene.ballSpin*.3,scene.ballSpin,scene.ballSpin*.65]),parseColour('#f0e6c6'));
    this.draw('box',model([scene.ball[0],scene.ball[1]+.2,scene.ball[2]],[.30,.035,.07],[0,scene.ballSpin,scene.ballSpin*.65]),parseColour('#554d3c'));
    if(this.software)this.flushSoftware(false);
    this.paintLabels(scene.players,scene.carrier,settings.labels);
  }
  private paintLabels(players:ScenePlayer[],carrier:string|null,labels:boolean){
    const ctx=this.overlay;ctx.setTransform(this.dpr,0,0,this.dpr,0,0);ctx.clearRect(0,0,this.width,this.height);this.picks=[];
    for(const p of players){const v=projectPoint(this.currentMatrix,[p.position[0],p.position[1]+2.8,p.position[2]],this.width,this.height);if(!v.visible)continue;this.picks.push({id:p.id,x:v.x,y:v.y+6});
      if(labels){ctx.font='600 10px "Segoe UI", sans-serif';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#101b26';ctx.fillStyle='#f8f9f5';ctx.strokeText(String(p.shirt),v.x,v.y);ctx.fillText(String(p.shirt),v.x,v.y);}
      if(p.id===carrier){const text=p.name,measure=ctx.measureText(text).width;ctx.fillStyle='#111c2cf0';ctx.fillRect(v.x-measure/2-8,v.y-24,measure+16,18);ctx.fillStyle='#edd592';ctx.font='600 10px "Segoe UI", sans-serif';ctx.fillText(text,v.x,v.y-11);}
    }
  }
  pick(x:number,y:number){return this.picks.map(p=>({...p,d:Math.hypot(p.x-x,p.y-y)})).sort((a,b)=>a.d-b.d).find(p=>p.d<20)?.id??null;}
  destroy(){if(this.disposed)return;this.disposed=true;const gl=this.gl;if(gl){for(const m of Object.values(this.meshes)){gl.deleteBuffer(m.position);gl.deleteBuffer(m.normal);gl.deleteBuffer(m.index);}gl.deleteProgram(this.program);}this.polygons=[];this.picks=[];}
}
