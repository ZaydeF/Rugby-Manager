import test from 'node:test';
import assert from 'node:assert/strict';
import {newWorld,prepare} from '../lib/world/engine.ts';
import {advancePhase,substitute} from '../lib/sim/engine.ts';
import {canCover} from '../lib/sim/selection.ts';
import {matchScene,passageAction,fieldPosition,attackDirection} from '../lib/sim/scene3d.ts';
import {multiply,projectPoint,parseColour} from '../lib/sim/renderer3d.ts';
import {validSave} from '../lib/sim/validation.ts';
import {migrateWorld} from '../lib/world/migrate.ts';

function setup(team='1',seed=135){const s=newWorld(team,seed),f=s.fixtures.find(f=>[f.home,f.away].includes(team));s.round=f.round;s.world.phase=s.world.primary;s.world.date=f.date.slice(0,10);s.activeFixtureId=f.id;s.activeMatch=prepare(s,f,s.world.primary,true);return s;}
const scene=(from,to=from,progress=1,running=false)=>matchScene({from,to,progress,running});
function addEvent(m,kind,side=0,playerId=m.teams[side].lineup[11]){m.events.push({id:m.nextEventId++,minute:Math.floor(m.minute),side,kind,playerId,text:'A recorded match event',field:m.field,score:m.teams.map(t=>t.stats.score)});}

test('3D frames are deterministic, finite and never change match or RNG state',()=>{
  const s=setup(),from=s.activeMatch,to=structuredClone(from);advancePhase(to);
  const bytes=JSON.stringify({from,to});
  for(const progress of [-1,0,.2,.5,.8,1,2]){
    const a=scene(from,to,progress,true),b=scene(from,to,progress,true);assert.deepEqual(a,b);
    assert.ok(a.progress>=0&&a.progress<=1);assert.equal(a.players.length,30);assert.equal(new Set(a.players.map(p=>p.id)).size,30);
    for(const p of a.players){assert.ok(p.position.every(Number.isFinite));assert.ok(Math.abs(p.position[0])<=60);assert.ok(Math.abs(p.position[2])<=35);assert.ok(Number.isFinite(p.stride));}
    assert.ok(a.ball.every(Number.isFinite));
  }
  assert.equal(JSON.stringify({from,to}),bytes);
  const paused=scene(from,to,.45,false);assert.ok(paused.players.every(p=>p.stride===0));
  const reduced=matchScene({from,to,progress:.45,running:true},true);assert.ok(reduced.players.every(p=>p.stride===0));
});
test('tries play at the correct in-goal end, even when the engine resets for a restart',()=>{
  for(const half of [false,true])for(const side of [0,1]){
    const m=setup().activeMatch;m.halftime=half;m.possession=side;m.field=94;
    const to=structuredClone(m);addEvent(to,'try',side);addEvent(to,'conversion',side);to.possession=1-side;to.field=28;
    assert.equal(passageAction(m,to).action,'try');const frame=scene(m,to,1,true);
    assert.equal(frame.ball[0],attackDirection(m,side)*52);assert.ok(frame.ball[1]<=.1);
  }
});
test('kicks and goals have aerial trajectories; set pieces use distinct formations',()=>{
  const m=setup().activeMatch;
  for(const [kind,action] of [['rugby_kick','kick'],['kick_regain','kick'],['penalty_goal','goal'],['drop_missed','goal'],['lineout_plan','lineout'],['scrum_plan','scrum'],['turnover','turnover']]){
    const to=structuredClone(m);addEvent(to,kind);to.field=58;
    const frame=scene(m,to,.5,true);assert.equal(frame.action,action);
    if(action==='kick'||action==='goal')assert.ok(frame.ball[1]>8);
    if(action==='lineout')assert.ok(frame.players.filter(p=>p.position[2]>=20).length>=12);
    if(action==='scrum')assert.ok(frame.players.filter(p=>Math.abs(p.lean)>.5).length>=16);
  }
});
test('sent-off, injured and sin-binned players leave the visual lineup; replacements retain canonical identity',()=>{
  const m=setup().activeMatch,t=m.teams[0],out=t.lineup[0],inc=t.bench.find(id=>canCover(t.players[id],t.players[out]));
  const ballBefore=scene(m).ball;
  assert.ok(inc);assert.equal(substitute(m,0,out,inc),null);
  let frame=scene(m);assert.ok(!frame.players.some(p=>p.id===out));assert.ok(frame.players.some(p=>p.id===inc));assert.deepEqual(frame.ball,ballBefore,'A paused substitution cannot move the ball.');
  t.players[t.lineup[1]].sentOff=true;t.players[t.lineup[2]].injured=true;t.players[t.lineup[3]].cardUntil=m.minute+10;
  frame=scene(m);assert.equal(frame.players.length,27);
  t.players[t.lineup[3]].cardUntil=0;assert.equal(scene(m).players.length,28);
});
test('first and second halves use consistent world coordinates for both teams',()=>{
  const m=setup().activeMatch;
  assert.equal(fieldPosition(m,0,75),25);assert.equal(fieldPosition(m,1,25),25);
  m.halftime=true;assert.equal(fieldPosition(m,0,75),-25);assert.equal(fieldPosition(m,1,25),-25);
});
test('rendering every phase leaves the full match result and save compatibility identical',()=>{
  for(const team of ['1','npc-9']){
    const s=setup(team),a=structuredClone(s.activeMatch),b=structuredClone(a);delete a.live;delete b.live;a.penaltyControl.mode='delegate';b.penaltyControl.mode='delegate';
    for(let i=0;!b.finished&&i<1500;i++){const from=structuredClone(b);advancePhase(a);advancePhase(b);for(const p of [0,.35,.7,1])scene(from,b,p,true);}
    assert.ok(b.finished);assert.equal(JSON.stringify(b),JSON.stringify(a),'Rendering must leave every event and RNG value unchanged.');
    s.activeMatch=b;assert.ok(validSave(s,{}));assert.ok(migrateWorld(JSON.parse(JSON.stringify(s)),{}));
  }
});
test('projection math, matrix composition and kit colour parsing do not depend on the browser',()=>{
  const id=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
  assert.deepEqual(multiply(id,id),id);assert.deepEqual(projectPoint(id,[0,0,0],800,400),{x:400,y:200,visible:true,depth:1});
  assert.equal(projectPoint(id,[3,0,0],800,400).visible,false);assert.deepEqual(parseColour('#ff8000'),[1,128/255,0,1]);
});
