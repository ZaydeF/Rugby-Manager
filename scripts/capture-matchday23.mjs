// Replays the shipped software renderer into two canvases. Optional capture-only dependency: @napi-rs/canvas.
import {createRequire} from 'node:module';import fs from 'node:fs';import path from 'node:path';
import {createServer} from 'vite';
import {newWorld,prepare} from '../lib/world/engine.ts';import {nextClubFixture} from '../lib/management/advice.ts';import {setClubSystem} from '../lib/club/identity.ts';import {advancePhase} from '../lib/sim/engine.ts';import {passageAction} from '../lib/sim/scene3d.ts';import {RugbyRenderer3D,defaultCamera} from '../lib/sim/renderer3d.ts';
const require=createRequire(import.meta.url),{createCanvas}=require(require.resolve('@napi-rs/canvas',{paths:[process.cwd(),...(process.env.NODE_PATH??'').split(':')]}));
const vite=await createServer({configFile:false,server:{middlewareMode:true,hmr:false}}),{kit,clash}=await vite.ssrLoadModule('/app/play/team-kit.tsx');
globalThis.window={devicePixelRatio:1};const s=newWorld('1',173),f=nextClubFixture(s);s.world.phase=s.world.primary;s.world.date=f.date.slice(0,10);s.round=f.round;
const x=s.selection;setClubSystem(s,{shape:'Two distributors',first:x[9],runner:x[12],second:x[11],cover:x[14],chase:x[10],succession:{first:'position'}});
const m=prepare(s,f,s.world.primary,true);delete m.live;delete m.penaltyControl;
const dir=process.argv[2]??'docs/matchday23-media';fs.mkdirSync(dir,{recursive:true});const seen=new Set();
while(!m.finished&&seen.size<2){const from=structuredClone(m);advancePhase(m);const {action,event}=passageAction(from,m);if(!['launch','try'].includes(action)||seen.has(action))continue;
 const width=1100,height=580,c=createCanvas(width,height),l=createCanvas(width,height);
 const wrap=canvas=>({getContext:t=>t==='webgl'?null:canvas.getContext('2d'),get width(){return canvas.width;},get height(){return canvas.height;},set width(w){canvas.width=w;},set height(h){canvas.height=h;}});
 const r=new RugbyRenderer3D(wrap(c),wrap(l),[kit(m.teams[0].id),kit(m.teams[1].id,clash(...m.teams.map(t=>t.id)))]);
 r.resize(width,height,'Balanced');r.render({from,to:m,progress:action==='launch'?.63:.83,running:true},{...defaultCamera(),view:'Director',analysis:true,zoom:action==='try'?1.35:1.12},true);
 c.getContext('2d').drawImage(l,0,0);fs.writeFileSync(path.join(dir,action+'.png'),c.toBuffer('image/png'));console.log(action,event.minute,event.text);seen.add(action);
}await vite.close();if(seen.size!==2)throw Error('Expected both highlights');
