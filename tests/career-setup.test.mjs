import test from 'node:test';
import assert from 'node:assert/strict';
import {newWorld,prepare} from '../lib/world/engine.ts';
import {catalog} from '../lib/world/catalog.ts';
import {migrateWorld} from '../lib/world/migrate.ts';
import {validSave} from '../lib/sim/validation.ts';
import {defaults,installSetup,clubAnalysis,careerDay,careerTasks,identityPlan,IDENTITIES} from '../lib/career-setup/state.ts';
import {rugbySchema} from '../lib/sim/rugby.ts';
import {selectionErrors} from '../lib/sim/selection.ts';
import {projected} from '../lib/world/catalog.ts';
import {objective} from '../lib/world/pulse.ts';
const make=(team='1',seed=101)=>{const s=newWorld(team,seed,2027);installSetup(s,defaults(team,seed));return s;};
test('every club starts with valid setup, unique leaders, viable matchday 23 and bounded expectations',()=>{
 for(const t of catalog.teams){const s=make(t.id),a=clubAnalysis(s),p=s.world.pulse;assert.ok(validSave(s,{}),t.name);assert.notEqual(p.captain,p.vice);assert.ok(a.squad.some(x=>x.id===p.captain));assert.equal(s.selection.length,23);assert.equal(selectionErrors(s.selection,projected(s).players.filter(p=>p.squad_id===t.id),s.condition).length,0,t.name);assert.ok(objective(s).target>=1&&objective(s).target<=catalog.teams.filter(x=>x.competition===t.competition).length);}
});
test('setup and recommendations are deterministic and selected tactics are legal',()=>{assert.deepEqual(make(),make());for(const identity of IDENTITIES)assert.ok(rugbySchema.safeParse(identityPlan(identity)).success,identity);});
test('setup consequences persist and invalid leaders cannot be installed',()=>{const s=newWorld('1',5,2027),v=defaults('1',5);v.identity='Power game';v.preseason='Conditioning';v.assistantSubs=false;v.expectation='Ambitious';installSetup(s,v);assert.equal(s.rugbyPlan.attack,'Forward power');assert.equal(s.managerPlans.assistantSubs,false);assert.equal(s.world.readiness[s.world.pulse.captain].plan,'Conditioning');assert.equal(objective(s).target,Math.max(1,objective(s).predicted-1));assert.ok(validSave(JSON.parse(JSON.stringify(s)),{}));const bad=newWorld('1',5,2027);assert.throws(()=>installSetup(bad,{...v,captain:'missing'}));});
test('first-week events and scouting are idempotent; cancelled focuses commission nothing',()=>{const s=make();s.world.date=new Date(Date.parse(s.careerIdentity.started)+4*86400000).toISOString().slice(0,10);s.careerIdentity.focuses[1].status='cancelled';careerDay(s);const bytes=JSON.stringify(s);careerDay(s);assert.equal(JSON.stringify(s),bytes);assert.ok(s.careerIdentity.focuses[0].candidates.length>0);assert.equal(s.careerIdentity.focuses[1].candidates.length,0);assert.ok(Object.values(s.scouting.reports).filter(r=>r.completed===null).length<=5);assert.ok(s.world.pulse.stories.some(x=>x.id==='career-development'));assert.ok(validSave(s,{}));});
test('old active world save receives identity without changing matches, RNG, conditions or finances',()=>{const s=newWorld('1',135),f=s.fixtures.find(f=>[f.home,f.away].includes('1'));s.activeMatch=prepare(s,f,s.world.primary,true);s.activeFixtureId=f.id;delete s.careerIdentity;const before=JSON.stringify({match:s.activeMatch,condition:s.condition,finance:s.management.finances,seed:s.seed});const migrated=migrateWorld(s,{});assert.ok(migrated);assert.equal(migrated.careerIdentity.legacy,true);assert.equal(JSON.stringify({match:migrated.activeMatch,condition:migrated.condition,finance:migrated.management.finances,seed:migrated.seed}),before);assert.equal(s.careerIdentity,undefined);assert.deepEqual(migrateWorld(migrated,{}),migrated);});
test('malformed extension is rejected; task state is derived from actual actions',()=>{const s=make();assert.ok(careerTasks(s).find(t=>t.title==='Appoint the leadership group').done);s.careerIdentity.reputation=101;assert.equal(validSave(s,{}),false);});
