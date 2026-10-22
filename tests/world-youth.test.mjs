import test from 'node:test';import assert from 'node:assert/strict';
import {newWorld,advanceWorld,primaryState} from '../lib/world/engine.ts';
import {runWorldYouth,setYouthPlan} from '../lib/world/youth.ts';
import {worldPlayers,worldAge} from '../lib/world/catalog.ts';
import {develop} from '../lib/world/development.ts';
import {validSave} from '../lib/sim/validation.ts';
for(const team of ['4','npc-1'])test(`U21 games respect senior minutes, rest, age and save/load for ${team}`,()=>{
 const s=newWorld(team,87);s.world.phase=s.world.primary;const comp=s.world.primary;
 const young=worldPlayers(s).filter(p=>(worldAge(s,p)??99)<21&&s.world.memberships.some(m=>m.active&&m.teamId===team&&m.playerId===p.id));assert.ok(young.length);setYouthPlan(s,young[0].id,'Rest');
 const before=Object.keys(s.world.players).length,round=s.round;advanceWorld(s);
 const youth=s.world.youth.matches;assert.ok(youth.length);assert.ok(!youth.flatMap(m=>m.rows).some(p=>p.id===young[0].id));
 const senior=new Set(s.fixtures.filter(f=>f.round===round).flatMap(f=>f.result?.teams.flatMap(t=>Object.values(t.players).filter(p=>p.stats.minutes>0).map(p=>p.id))??[]));
 for(const m of youth)for(const p of m.rows){assert.ok(!senior.has(p.id));if(s.world.players[p.id])assert.ok(worldAge(s,worldPlayers(s).find(q=>q.id===p.id))<21);else assert.ok(p.id.startsWith('guest-'));}
 assert.ok(validSave(s,{}));const copy=JSON.parse(JSON.stringify(s));assert.deepEqual(copy.world.youth,s.world.youth);const length=youth.length;runWorldYouth(s,{...primaryState(s),round});assert.equal(s.world.youth.matches.length,length);assert.equal(Object.keys(s.world.players).length,before);
 advanceWorld(copy);advanceWorld(s);assert.deepEqual(s,copy);
});
test('U21 exposure supports growth below equivalent senior exposure and is not reapplied',()=>{
 const base=newWorld('1',4),p=worldPlayers(base).find(p=>worldAge(base,p)<21&&p.ca<65&&p.paCentre>75);assert.ok(p);
 const no=structuredClone(base),youth=structuredClone(base),senior=structuredClone(base),row={apps:10,starts:10,minutes:700,tries:0,tackles:0,metres:0,turnovers:0,ratings:65,recent:[6.5],injuryWeeks:0};
 youth.world.stats[`${base.year}-NPC-U21`]={[p.id]:row};senior.world.stats[`${base.year}-NPC`]={[p.id]:row};
 for(const s of [no,youth,senior])develop(s,'NPC');const ca=s=>s.management.players[p.id].ability;assert.ok(ca(youth)>ca(no));assert.ok(ca(senior)>ca(youth));const before=ca(youth);develop(youth,'NPC');assert.equal(ca(youth),before);
});
