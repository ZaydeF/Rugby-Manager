import test from 'node:test';
import assert from 'node:assert/strict';
import {newWorld,prepare} from '../lib/world/engine.ts';
import {advanceDay,nextCalendarEvent} from '../lib/world/calendar.ts';
import {playerReadiness,ensureReadiness,readinessDay,readinessWeeks,recordExposure,recordLayoff,setFitnessPlan,readinessSchema} from '../lib/world/readiness.ts';
import {catalog,registration,availability} from '../lib/world/catalog.ts';
import {representativeDay} from '../lib/world/representative.ts';
import {selectInternationals} from '../lib/world/international.ts';
import {validSave} from '../lib/sim/validation.ts';
import {migrateWorld} from '../lib/world/migrate.ts';

function setup(){const s=newWorld('1',91);s.world.date='2026-01-30';return s;}
function own(s){return catalog.players.find(p=>registration(s,p.id,'SR')?.teamId===s.teamId).id;}
function day(s,date){s.world.date=date;readinessDay(s,date,false);}

test('elite player needs no NPC appearances to meet NPC demands, but competition levels differ',()=>{
  const s=setup(),id=own(s);s.management.players[id].ability=87;
  s.condition[id].sharpness=70;
  assert.equal(playerReadiness(s,id,'NPC').status,'Ready');
  assert.equal(playerReadiness(s,id,'NPC').weightedMinutes,0);
  s.management.players[id].ability=71;
  assert.equal(playerReadiness(s,id,'NPC').status,'Ready');
  assert.notEqual(playerReadiness(s,id,'SR').status,'Ready');
  assert.ok(playerReadiness(s,id,'NPC').score>playerReadiness(s,id,'SR').score);
  assert.equal(playerReadiness(s,id,'SR').maxMinutes,80,'ability alone must never force a medical substitution');
});
test('injury and severe deconditioning cannot be overridden by elite ability',()=>{
  const s=setup(),id=own(s);s.management.players[id].ability=90;
  s.condition[id].injuryWeeks=8;
  assert.equal(playerReadiness(s,id,'NPC').status,'Injured');
  assert.equal(playerReadiness(s,id,'NPC').maxMinutes,0);
  s.condition[id].injuryWeeks=0;s.condition[id].fitness=60;
  assert.equal(playerReadiness(s,id,'NPC').status,'Rebuild fitness');
  assert.equal(playerReadiness(s,id,'NPC').maxMinutes,0);
});
test('long injury erodes fitness and sharpness, clearance does not instantly restore match readiness',()=>{
  const s=setup(),id=own(s);s.management.players[id].ability=88;
  s.condition[id].injuryWeeks=16;recordLayoff(s,id);
  for(let i=1;i<=80;i++)day(s,new Date(Date.parse('2026-01-30')+i*86400000).toISOString().slice(0,10));
  assert.equal(s.world.readiness[id].injuryDays,80);
  assert.equal(Math.round(s.condition[id].sharpness),20);
  assert.ok(s.condition[id].fitness<80);
  s.condition[id].injuryWeeks=0;
  const cleared=playerReadiness(s,id,'NPC');
  assert.equal(cleared.status,'Managed return');assert.equal(cleared.maxMinutes,25);
  assert.ok(cleared.rehabPenalty>20);
  const before=cleared.sharpness;
  recordExposure(s,id,'return-1',s.world.date,25,'NPC');
  const bench=playerReadiness(s,id,'NPC');assert.ok(bench.sharpness>before);assert.ok(bench.rehabPenalty<cleared.rehabPenalty);
  assert.notEqual(bench.status,'Ready');
});
test('actual minutes, intensity and shared player identity drive exposure; repeat recording is idempotent',()=>{
  const s=setup(),id=own(s),base=structuredClone(s);
  s.condition[id].sharpness=40;base.condition[id].sharpness=40;
  recordExposure(s,id,'npc-match',s.world.date,80,'NPC');
  recordExposure(base,id,'test-match',base.world.date,80,'Test');
  assert.ok(base.condition[id].sharpness>s.condition[id].sharpness);
  const short=setup();short.condition[id].sharpness=40;recordExposure(short,id,'short',short.world.date,10,'NPC');
  assert.ok(s.condition[id].sharpness>short.condition[id].sharpness);
  const before=JSON.stringify(s);recordExposure(s,id,'npc-match',s.world.date,80,'NPC');assert.equal(JSON.stringify(s),before);
  assert.equal(playerReadiness(s,id,'SR').weightedMinutes,68);
  assert.equal(playerReadiness(s,id,'NPC').weightedMinutes,68);
});
test('training cannot replace match sharpness; daily processing cannot double-count recovery',()=>{
  const s=setup(),id=own(s);s.condition[id].sharpness=95;s.condition[id].fatigue=40;
  day(s,'2026-01-31');assert.ok(s.condition[id].sharpness<95);
  const once=JSON.stringify(s);readinessDay(s,'2026-01-31',false);assert.equal(JSON.stringify(s),once);
  s.condition[id].sharpness=40;day(s,'2026-02-01');assert.ok(s.condition[id].sharpness<41);
  const idle=setup();for(let i=1;i<=100;i++)day(idle,new Date(Date.parse('2026-01-30')+i*86400000).toISOString().slice(0,10));
  assert.equal(idle.condition[id].sharpness,70);
});
test('conditioning trades recovery for fitness, managed minutes and recovery plans have real consequences',()=>{
  const s=setup(),id=own(s),balanced=structuredClone(s);s.condition[id].fitness=75;balanced.condition[id].fitness=75;s.condition[id].fatigue=20;balanced.condition[id].fatigue=20;
  s.world.readiness[id].returning=true;balanced.world.readiness[id].returning=true;
  setFitnessPlan(s,id,'Conditioning');day(s,'2026-01-31');day(balanced,'2026-01-31');
  assert.ok(s.condition[id].fitness>balanced.condition[id].fitness);assert.ok(s.condition[id].fatigue>balanced.condition[id].fatigue);
  setFitnessPlan(s,id,'Managed minutes');assert.ok(playerReadiness(s,id).maxMinutes<=40);
  setFitnessPlan(s,id,'Recovery');assert.equal(playerReadiness(s,id).maxMinutes,0);assert.equal(availability(s,id),'RESTED');
  const foreign=catalog.players.find(p=>registration(s,p.id,'SR')?.teamId!==s.teamId).id;
  assert.throws(()=>setFitnessPlan(s,foreign,'Recovery'));
});
test('match preparation applies a temporary sharpness cost and return ceiling without changing permanent ratings',()=>{
  const s=setup(),id=s.selection[0];s.condition[id].sharpness=35;
  const ability=s.management.players[id].ability,rich=structuredClone(s.world.players[id].rich);
  const match=prepare(s,s.fixtures.find(f=>[f.home,f.away].includes(s.teamId)),'SR',true);
  const side=match.teams.find(t=>t.id===s.teamId);
  assert.ok(side.players[id].overall<ability);assert.equal(side.minuteLimits[id],25);
  assert.equal(s.management.players[id].ability,ability);assert.deepEqual(s.world.players[id].rich,rich);
});
test('readiness state migrates old saves without fabricated history and rejects malformed/foreign records',()=>{
  const s=setup(),id=own(s);delete s.world.readiness;
  const q=structuredClone(s.condition[id]),loaded=migrateWorld(JSON.parse(JSON.stringify(s)),{});
  assert.ok(loaded);assert.deepEqual(loaded.condition[id],q);assert.deepEqual(loaded.world.readiness[id].matches,[]);
  recordExposure(loaded,id,'persisted',loaded.world.date,30,'SR');setFitnessPlan(loaded,id,'Managed minutes');
  assert.ok(validSave(loaded,{}));assert.deepEqual(migrateWorld(JSON.parse(JSON.stringify(loaded)),{}).world.readiness,loaded.world.readiness);
  loaded.world.readiness[id].injuryDays=NaN;assert.equal(validSave(loaded,{}),false);
  const foreign=setup();foreign.world.readiness['invented-player']=structuredClone(foreign.world.readiness[id]);assert.equal(validSave(foreign,{}),false);
  assert.equal(readinessSchema.safeParse({[id]:{updated:'bad'}}).success,false);
});
test('calendar skip and ordinary daily advance use the same model and stay valid',()=>{
  const s=setup(),id=own(s);s.condition[id].injuryWeeks=4;
  advanceDay(s);const before=s.world.readiness[id].injuryDays;assert.equal(before,1);
  const twin=structuredClone(s);nextCalendarEvent(s);nextCalendarEvent(twin);
  assert.deepEqual(s.world.readiness,twin.world.readiness);assert.ok(validSave(s,{}));
});
test('representative matches restore shared sharpness and exposure rather than leaving internationals idle',()=>{
  const s=setup();selectInternationals(s);const ids=s.world.squads.find(q=>q.nation==='New Zealand').ids;
  for(const id of ids)s.condition[id].sharpness=50;
  s.world.date='2026-07-04';representativeDay(s);
  const played=ids.filter(id=>s.world.readiness[id].matches.some(m=>m.level==='Test'));
  assert.ok(played.length>15);assert.ok(played.every(id=>s.condition[id].sharpness>50));
  const before=JSON.stringify(s.world.readiness);representativeDay(s);assert.equal(JSON.stringify(s.world.readiness),before);
});
test('short layoffs do not force elite players through an artificial NPC appearance gate',()=>{
  const s=setup(),id=own(s);s.management.players[id].ability=88;s.condition[id].injuryWeeks=2;
  recordLayoff(s,id);readinessWeeks(s,2);
  assert.equal(s.condition[id].injuryWeeks,0);
  assert.equal(s.world.readiness[id].injuryDays,14);
  assert.equal(playerReadiness(s,id,'NPC').status,'Ready');
});
test('offseason and round recovery retain long-layoff deconditioning instead of magically restoring fitness',()=>{
  const s=setup(),id=own(s);s.condition[id].injuryWeeks=16;recordLayoff(s,id);
  readinessWeeks(s,10);
  assert.equal(s.condition[id].injuryWeeks,6);
  assert.equal(s.world.readiness[id].injuryDays,70);
  assert.ok(s.condition[id].fitness<80);assert.equal(s.condition[id].sharpness,20);
});
