import test from 'node:test';
import assert from 'node:assert/strict';
import {newWorld,prepare} from '../lib/world/engine.ts';
import {nextClubFixture} from '../lib/management/advice.ts';
import {allocateSession,setClubSystem} from '../lib/club/identity.ts';
import {employee,hireOffice,validOffice} from '../lib/club/staff.ts';
import {instantResult,substitute} from '../lib/sim/engine.ts';
import {nextHighlight,advancePlayback} from '../lib/sim/playback.ts';
import {canCover} from '../lib/sim/selection.ts';
import {systemLaunch} from '../lib/sim/club-system.ts';
const setup=()=>{const s=newWorld('1',173),f=nextClubFixture(s);s.world.phase=s.world.primary;s.round=f.round;s.world.date=f.date.slice(0,10);
 const plan={shape:'Two distributors',first:s.selection[9],second:s.selection[11],runner:s.selection[12],chase:s.selection[10],cover:s.selection[14]};
 const make=()=>prepare(s,f,s.world.primary,true),m=make(),i=m.teams.findIndex(t=>t.id===s.teamId),t=m.teams[i];
 const on=t.bench.find(id=>canCover(t.players[id],t.players[plan.first]));
 plan.succession={first:on};setClubSystem(s,plan);return {s,f,plan,make,i,on};};
test('a rehearsed replacement keeps its own practice after a live edit and JSON round trip',()=>{
 const {s,f,plan,make,i,on}=setup();allocateSession(s,'backup');const m=make();s.activeMatch=m;s.activeFixtureId=f.id;
 setClubSystem(s,{...plan,exitUrgency:4});const copy=JSON.parse(JSON.stringify(m));
 for(const g of [m,copy]){assert.equal(substitute(g,i,plan.first,on),null);const c=g.teams[i].clubSystem;assert.equal(c.plan.first,on);assert.ok(c.rehearsal>0);assert.equal(c.rehearsal,c.backupPractice);}
 assert.deepEqual(m,copy);assert.equal(s.clubIdentity.system.first,plan.first);
});
test('manual vacancy overrides a named backup; poor position cover and cards still prohibit a change',()=>{
 const {make,i,plan,on,s}=setup(),m=make(),t=m.teams[i];
 t.players[plan.first].cardUntil=10;assert.match(substitute(m,i,plan.first,on),/carded/);t.players[plan.first].cardUntil=0;
 assert.ok(substitute(m,i,t.lineup[1],on));assert.equal(substitute(m,i,plan.first,on,'vacant'),null);
 const off=t.lineup[0],prop=t.bench.find(id=>canCover(t.players[id],t.players[off]));assert.equal(substitute(m,i,off,prop),null);
 assert.equal(t.clubSystem.plan.first,plan.first);assert.equal(s.clubIdentity.system.succession.first,on);
});
test('funded specialist raises practice and costs actual cash; deeper receivers exchange gain for safer execution',()=>{
 const {s,make,i}=setup(),control=structuredClone(s),role='Set Piece Coach',cash=s.management.finances[s.teamId].cash;
 const candidate=employee(s,s.teamId,role,0);hireOffice(s,role,candidate.id);assert.ok(validOffice(s));assert.equal(cash-s.management.finances[s.teamId].cash,Math.ceil(candidate.salary/12));
 allocateSession(s,'senior');allocateSession(control,'senior');assert.ok(s.clubIdentity.block.rehearsal>control.clubIdentity.block.rehearsal);
 const m=make(),t=m.teams[i],o=m.teams[1-i],ps=t.lineup.map(id=>t.players[id]),ds=o.lineup.map(id=>o.players[id]);
 t.clubSystem.plan.launchDepth=0;const flat=systemLaunch(t,ps,ds,false);t.clubSystem.plan.launchDepth=4;const deep=systemLaunch(t,ps,ds,false);assert.ok(deep.gain<flat.gain&&deep.error<flat.error);
});
test('phase, highlight and immediate delegation agree when the same decisions are delegated',()=>{
 const {make}=setup(),m=make();delete m.live;delete m.penaltyControl;
 for(const t of m.teams){t.autoManage=true;t.autoHalfTime=true;}
 const full=structuredClone(m),keys=structuredClone(m);instantResult(m);
 while(!full.finished)advancePlayback(full);
 while(!keys.finished)nextHighlight(keys);
 assert.deepEqual(full,m);assert.deepEqual(keys,m);
});
test('an actual named highlight shows the recorded carrier without changing the saved match',async()=>{
 const {make,i}=setup(),m=make();delete m.live;delete m.penaltyControl;
 const {matchScene,passageAction}=await import('../lib/sim/scene3d.ts');let found=false;
 while(!m.finished&&!found){const before=structuredClone(m);advancePlayback(m);
  const {action,event}=passageAction(before,m);if(action!=='launch'||event.side!==i)continue;
  const bytes=JSON.stringify(m);for(const progress of [0,.25,.55,.85,1]){const frame=matchScene({from:before,to:m,progress,running:false});assert.equal(frame.carrier,event.playerId);assert.ok(frame.ball.every(Number.isFinite));}
  assert.equal(JSON.stringify(m),bytes);found=true;
 }
 assert.ok(found);
});
