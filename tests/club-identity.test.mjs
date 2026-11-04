import test from 'node:test';
import assert from 'node:assert/strict';
import {newWorld,prepare,quickSim,pick,advanceCompetition,primaryState} from '../lib/world/engine.ts';
import {nextClubFixture} from '../lib/management/advice.ts';
import {identity,setClubSystem,allocateSession,nextBlock,eligibleProjects,addProject,projectCost,projectGrowth,reviewProjects} from '../lib/club/identity.ts';
import {matchNumbers,roleEstimate} from '../lib/club/analysis.ts';
import {advancePhase} from '../lib/sim/engine.ts';
import {systemLaunch} from '../lib/sim/club-system.ts';
import {validSave} from '../lib/sim/validation.ts';
import {migrateWorld} from '../lib/world/migrate.ts';
const setup=(club='1',seed=173)=>{const s=newWorld(club,seed);s.world.phase=s.world.primary;const f=nextClubFixture(s);s.round=f.round;s.world.date=f.date.slice(0,10);return s;};
const config=(s,shape='Two distributors')=>({shape,first:s.selection[9],second:s.selection[11],runner:s.selection[12],chase:s.selection[10],cover:s.selection[14]});
test('named launch changes who carries; repetition and unavailable second distributor alter execution',()=>{
 const s=setup(),f=nextClubFixture(s);setClubSystem(s,config(s));const m=prepare(s,f,s.world.primary,true),side=m.teams.find(t=>t.id===s.teamId),ps=side.lineup.map(id=>side.players[id]),d=m.teams.find(t=>t!==side),ds=d.lineup.map(id=>d.players[id]);
 const launch=systemLaunch(side,ps,ds,false);assert.equal(launch.passer.id,s.selection[11]);assert.notEqual(launch.carrier.id,s.selection[12]);side.clubSystem.reads=5;assert.ok(systemLaunch(side,ps,ds,false).breaks<launch.breaks);
 const fallback=systemLaunch(side,ps.filter(p=>p.id!==s.selection[11]),ds,false);assert.ok(fallback.fallback);assert.equal(fallback.carrier.id,s.selection[12]);
 assert.equal(systemLaunch(side,ps.filter(p=>p.id!==s.selection[9]),ds,false),null);
});
test('coaching slots cannot be farmed; exact personnel and shape carry rehearsal into a saved fixture',()=>{
 const s=setup();setClubSystem(s,config(s));const p=eligibleProjects(s).find(p=>!s.selection.includes(p.id));assert.ok(p);const cash=s.management.finances[s.teamId].cash;
 addProject(s,p.id,'Distribution','Senior opportunity');assert.equal(s.management.finances[s.teamId].cash,cash-projectCost(s));
 allocateSession(s,p.id);assert.throws(()=>allocateSession(s,p.id));const fatigue=s.condition[s.selection[9]].fatigue;
 allocateSession(s,'senior');assert.equal(s.condition[s.selection[9]].fatigue,fatigue+2);
 const f=nextClubFixture(s),m=prepare(s,f,s.world.primary,true),own=m.teams.find(t=>t.id===s.teamId);assert.ok(own.clubSystem.rehearsal>0);
 setClubSystem(s,config(s,'Carry first'));assert.equal(prepare(s,f,s.world.primary,true).teams.find(t=>t.id===s.teamId).clubSystem.rehearsal,0);
 while(nextBlock(s).used<nextBlock(s).capacity)allocateSession(s,'recovery');assert.throws(()=>allocateSession(s,'recovery'));
 s.activeMatch=m;s.activeFixtureId=f.id;assert.ok(validSave(s,{}));const loaded=migrateWorld(JSON.parse(JSON.stringify(s)),{});assert.ok(loaded);
 advancePhase(m);advancePhase(loaded.activeMatch);assert.deepEqual(loaded.activeMatch,m);
});
test('untested foreign players and malformed projects are rejected; recruitment needs completed observation',()=>{
 const s=setup(),other=Object.keys(s.world.players).find(id=>!s.selection.includes(id)&&s.management.players[id].clubId!==s.teamId);
 assert.throws(()=>setClubSystem(s,{...config(s),first:other}));assert.throws(()=>addProject(s,other,'Distribution','Senior opportunity'));
 assert.equal(roleEstimate(s,other,'Distribution'),null);identity(s).projects.push({id:other});assert.equal(validSave(s,{}),false);
});
test('academy experience is credited only once from the agreed match level',()=>{
 const s=setup('5'),p=eligibleProjects(s).find(p=>p.age<21&&!s.selection.includes(p.id));assert.ok(p);
 addProject(s,p.id,'Distribution','Development XV');allocateSession(s,p.id);
 const f=nextClubFixture(s);quickSim(s);advanceCompetition(s,primaryState(s));
 const project=s.clubIdentity.projects[0],youth=s.world.stats[`${s.year}-SR-U21`]?.[p.id]?.minutes??0;
 assert.equal(project.minutes,youth);assert.ok(youth>0,'the academy fixture actually gave this prospect minutes');
 assert.ok(projectGrowth(s,p.id,'SR')>0);const before=structuredClone(project);reviewProjects(s,f.id);assert.deepEqual(project,before);assert.ok(validSave(s,{}));
});
test('the match engine executes and counts a named launch; an explicit live change stays in that match',()=>{
 const s=setup(),f=nextClubFixture(s),saved=config(s);setClubSystem(s,saved);
 const m=prepare(s,f,s.world.primary,true),own=m.teams.find(t=>t.id===s.teamId),i=m.teams.indexOf(own);
 s.activeMatch=m;s.activeFixtureId=f.id;
 setClubSystem(s,{...saved,shape:'Carry first'});
 assert.equal(s.clubIdentity.system.shape,'Two distributors');assert.equal(m.events.at(-1).kind,'club_system_change');
 let evidence;
 for(let iSeed=1;iSeed<100&&!evidence;iSeed++){
  const trial=structuredClone(m),t=trial.teams[i];trial.rng=iSeed;trial.field=70;trial.possession=i;t.launch='lineout';
  advancePhase(trial);const n=matchNumbers(trial,s.teamId);
  if(n.launches)evidence={trial,n};
 }
 assert.ok(evidence);assert.equal(evidence.n.incidents[0].playerId,saved.runner);
 assert.equal(evidence.n.retained+evidence.n.errors,evidence.n.launches);
});
