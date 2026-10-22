import assert from 'node:assert/strict';
import fs from 'node:fs';
import {newSeason,validSave,startFixture,completeRound} from '../lib/sim/career.ts';
import {advancePhase} from '../lib/sim/engine.ts';
import {migrateCareer} from '../lib/management/migrate.ts';
import {BIOGRAPHIES,EXCLUDED_IDS} from '../lib/packs/biography.ts';
import {auditDatabase} from '../lib/packs/foundation.ts';
import {abilityText,potentialText,attributeText,assess,startScouting,cancelScouting,advanceScouting,scoutingClock} from '../lib/scouting.ts';
import {developmentFactors} from '../lib/management/development.ts';
import {reviewRetirements} from '../lib/future/engine.ts';
import {fullUniverse} from '../lib/future/catalog.ts';
import {minimumIssues,payroll} from '../lib/management/state.ts';
import type {SimUniverse} from '../lib/sim/types.ts';
const data=JSON.parse(fs.readFileSync('data/generated/universe.json','utf8')) as SimUniverse;
const s=newSeason(data,'1',75),audit=auditDatabase(data,s);
assert.equal(audit.realPlayers,450);assert.equal(audit.knownBirthDates,450);
assert.equal(Object.keys(BIOGRAPHIES).length,428);
for(const [id,date] of Object.entries({'3':'1992-11-05','182':'2002-01-02','242':'1997-01-03','313':'2004-06-11','383':'1998-06-28'})){
 assert.equal(s.management!.players[id].birthDate,date);assert.equal(BIOGRAPHIES[id].status,'user_accepted_conflict');
}
for(const id of EXCLUDED_IDS){assert.equal(s.management!.players[id].clubId,null);assert.ok(s.future!.retired[id]);assert.ok(!s.selection.includes(id));}
for(const club of data.teams){assert.deepEqual(minimumIssues(s,fullUniverse(s,data),club.id),[]);assert.ok(payroll(s,club.id)<=s.management!.finances[club.id].payrollCap);}
const legacy=structuredClone(s);delete legacy.scouting;legacy.foundation!.pack.version='1.0.0';
for(const id of Object.keys(BIOGRAPHIES)){legacy.management!.players[id].birthDate=null;legacy.management!.players[id].birthSource=null;}
const custom=Object.keys(BIOGRAPHIES).find(id=>id!=='3')!;legacy.management!.players[custom].birthDate='2000-02-01';legacy.management!.players[custom].birthSource='https://example.com/user-correction';
const before=structuredClone(legacy),migrated=migrateCareer(legacy,data)!;
assert.ok(migrated);assert.ok(validSave(migrated,data));assert.equal(migrated.management!.players[custom].birthDate,'2000-02-01');
assert.equal(migrated.foundation!.pack.version,'1.2.0');assert.deepEqual(migrated.fixtures,before.fixtures);assert.deepEqual(migrated.history,before.history);
for(const [id,c] of Object.entries(before.management!.players)){assert.equal(migrated.management!.players[id].ability,c.ability);assert.equal(migrated.management!.players[id].potential,c.potential);assert.deepEqual(migrated.management!.players[id].development,c.development);}
assert.deepEqual(migrateCareer(migrated,data),migrated);
// A restored legacy placeholder remains during an active match, then leaves safely.
const excluded='395',club=data.players.find(p=>p.player_id===excluded)!.squad_id,active=newSeason(data,club,75);
delete active.future!.retired[excluded];active.management!.players[excluded].clubId=club;
active.round=active.fixtures.find(f=>f.home===club||f.away===club)!.round;startFixture(active,data);
const restored=migrateCareer(active,data)!;assert.deepEqual(restored.activeMatch,active.activeMatch);assert.equal(restored.management!.players[excluded].clubId,club);
while(!restored.activeMatch!.finished)advancePhase(restored.activeMatch!);completeRound(restored,data,true);assert.equal(restored.management!.players[excluded].clubId,null);assert.ok(validSave(restored,data));
const targets=data.players.filter(p=>s.management!.players[p.player_id].clubId!==s.teamId&&!EXCLUDED_IDS.has(p.player_id)).slice(0,6);
const abilityBefore=JSON.stringify(s.management!.players),seed=s.seed,id=targets[0].player_id;
for(const p of targets.slice(0,5))startScouting(s,p.player_id,p.name);
assert.throws(()=>startScouting(s,id,targets[0].name),/already/);
assert.throws(()=>startScouting(s,targets[5].player_id,targets[5].name),/Five/);
advanceScouting(s);assert.equal(s.scouting!.reports[id].completed,null);
s.round++;advanceScouting(s);assert.equal(s.scouting!.reports[id].completed,null);
s.round++;advanceScouting(s);assert.equal(s.scouting!.reports[id].completed,scoutingClock(s));
assert.equal(assess(s,id).depth,2);assert.match(abilityText(s,id),/★/);assert.match(potentialText(s,id),/–.*★/);
assert.match(attributeText(s,id,'attack'),/–|Unassessed/);
const assessed=assess(s,id),news=structuredClone(s.news);
advanceScouting(s);assert.deepEqual(s.news,news);
startScouting(s,id,targets[0].name);assert.deepEqual(assess(s,id),assessed);cancelScouting(s,id);assert.deepEqual(assess(s,id),assessed);
startScouting(s,id,targets[0].name);s.round+=2;advanceScouting(s);assert.equal(assess(s,id).depth,3);
assert.equal(JSON.stringify(s.management!.players),abilityBefore);assert.equal(s.seed,seed);
assert.ok(validSave(s,data));assert.deepEqual(migrateCareer(JSON.parse(JSON.stringify(s)),data),s);
const stale=structuredClone(s);stale.year++;assert.equal(assess(stale,id).stale,true);
s.foundation!.mode='developer';assert.equal(abilityText(s,id),s.management!.players[id].ability.toFixed(1));assert.equal(potentialText(s,id),s.management!.players[id].potential.toFixed(1));
const bad=structuredClone(s);bad.scouting!.reports['unknown']=bad.scouting!.reports[id];assert.equal(validSave(bad,data),false);
const player=structuredClone(s.management!.players[id]);player.birthDate=(s.year-19)+'-01-01';
const young=developmentFactors(player,'outside_back',s.year,s.year,700,7,6.7,0,75);
player.birthDate=(s.year-35)+'-01-01';const old=developmentFactors(player,'outside_back',s.year,s.year,700,7,6.7,0,75);
assert.ok(young.factors[0].value>0);assert.ok(old.factors[0].value<0);
const retirement=structuredClone(s);retirement.management!.players[id].birthDate=(s.year-45)+'-01-01';reviewRetirements(retirement,data);assert.equal(retirement.market!.retirementNotices[id],s.year);
console.log('PASS: 450 recorded DOBs, five accepted conflicts, exclusions and squad cover, legacy/active-match migration, scouting timing/limits/refresh/cancel/resume, hidden ratings, age curves and retirement notices.');
