import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {newSeason,startFixture,validSave} from '../lib/sim/career.ts';
import {migrateCareer} from '../lib/management/migrate.ts';
import {placePlayer,autoSelect,makeSide,selectionErrors} from '../lib/sim/selection.ts';
import {DEFAULT_TACTICS} from '../lib/sim/config.ts';
import {DEFAULT_RUGBY,initRugby} from '../lib/sim/rugby.ts';
import {createMatch,advancePhase,instantResult,updateRugby} from '../lib/sim/engine.ts';
import {canonicalTactics,eventSkill,phaseContext,identity} from '../lib/sim/tactics25.ts';
import {initBenchmark,assessedStars} from '../lib/scouting.ts';
import type {SimUniverse,GameMatch} from '../lib/sim/types.ts';
const data=JSON.parse(fs.readFileSync('data/generated/universe.json','utf8')) as SimUniverse;
const s=newSeason(data,'1',731),squad=data.players.filter(p=>p.squad_id==='1'),ids=autoSelect(squad,s.condition),original=[...ids];
assert.throws(()=>placePlayer(ids,squad,s.condition,ids[0],9));assert.deepEqual(ids,original);
const swapped=placePlayer(ids,squad,s.condition,ids[0],2);assert.equal(swapped[2],ids[0]);assert.equal(swapped[0],ids[2]);assert.deepEqual(selectionErrors(swapped,squad,s.condition),[]);
const inj=structuredClone(s.condition);inj[ids[0]].injuryWeeks=2;assert.throws(()=>placePlayer(ids,squad,inj,ids[0],2));
const old=structuredClone(s);delete old.starBenchmark;delete old.rugbyPlan!.jobs;const before=JSON.stringify(old.management);const migrated=migrateCareer(old,data)!;assert.ok(migrated);assert.equal(JSON.stringify(migrated.management),before);assert.ok(validSave(migrated,data));
const savedAbility=s.management!.players[ids[0]].ability;const benchmark=s.starBenchmark!.value;s.management!.players[ids[0]].ability=99;initBenchmark(s);assert.equal(s.starBenchmark!.value,benchmark);assert.equal(assessedStars(s,benchmark),3);s.management!.players[ids[0]].ability=savedAbility;
s.primaryRugby=identity({...DEFAULT_RUGBY,jobs:{'11':'Carrier'}},'Forward power');s.rugbyPlan=structuredClone(s.primaryRugby);initRugby(s);s.savedRugby=identity(DEFAULT_RUGBY,'Wide shape');startFixture(s,data);const m=s.activeMatch!;assert.equal(m.tacticalVersion,25);for(let i=0;i<60;i++)advancePhase(m);const own=m.teams.findIndex(t=>t.id==='1');updateRugby(m,own,{...m.teams[own].rugby!,ruck:'Heavy'});assert.deepEqual(m.teams[own].tactics,canonicalTactics(m.teams[own].rugby!));assert.ok(validSave(s,data));const resume=migrateCareer(JSON.parse(JSON.stringify(s)),data)!;instantResult(m);instantResult(resume.activeMatch!);assert.deepEqual(m,resume.activeMatch);assert.ok(validSave(s,data));
// Existing Phase 2 matches must resume exactly, not be upgraded mid-match.
const path=new URL('../lib/sim/_phase25_legacy_check.ts',import.meta.url);
function side(index:number){const c=data.teams[index],ps=data.players.filter(p=>p.squad_id===c.id);const t=makeSide(c.id,c.name,ps,autoSelect(ps),{},DEFAULT_TACTICS,true);t.rugby=structuredClone(DEFAULT_RUGBY);return t;}
try{fs.writeFileSync(path,execFileSync('git',['show','17519298ab93538bd0f9b714c8d10d54ca92c609:lib/sim/engine.ts']));const oldEngine=await import(path.href);for(let i=0;i<8;i++){const legacy:GameMatch=oldEngine.createMatch('old',100+i,side(0),side(1));for(let j=0;j<80;j++)oldEngine.advancePhase(legacy);const resumed=structuredClone(legacy);oldEngine.instantResult(legacy);instantResult(resumed);assert.deepEqual(resumed,legacy);}}finally{fs.rmSync(path,{force:true})}
// Controlled matched-ability squads: only carrier impact differs.
const results:Record<string,{metres:number;quick:number;retained:number;points:number}[]>={strong:[],weak:[]};
for(const name of ['strong','weak'])for(let seed=1;seed<=100;seed++){const a=side(0),b=side(1);for(const t of [a,b]){t.autoHalfTime=false;for(const p of Object.values(t.players)){p.overall=75;for(const k of Object.keys(p.attributes) as (keyof typeof p.attributes)[])p.attributes[k]=75;}}
 a.rugby={...DEFAULT_RUGBY,attack:'Forward power',carriers:'Centres',jobs:{'11':'Carrier','12':'Carrier'},plays:[]};for(const id of a.lineup.slice(11,13))a.players[id].attributes.impact=name==='strong'?95:45;
 const match=createMatch('duel',seed*7919,a,b);while(!match.finished)advancePhase(match);const l=a.tacticalLog!;results[name].push({metres:a.stats.metres,quick:(l.quick_ball??0)/(l.retained_carries||1),retained:l.retained_carries??0,points:a.stats.score});assert.ok((l.quick_ball??0)+(l.slow_ball??0)+(l.ordinary_ball??0)===(l.retained_carries??0));}
const mean=(name:string,k:'metres'|'quick')=>results[name].reduce((n,x)=>n+x[k],0)/results[name].length;
assert.ok(mean('strong','metres')>mean('weak','metres'),'Carrier impact changes outcome with equal CA');assert.ok(mean('strong','quick')>mean('weak','quick'),'Carrier quality changes follow-up ball');
const t=side(0),ps=t.lineup.map(id=>t.players[id]),c=ps[11];t.rugby={...DEFAULT_RUGBY,attack:'Wide shape'};t.ballQuality=1;const quick=phaseContext(t,ps,ps,c);t.ballQuality=-1;const slow=phaseContext(t,ps,ps,c);assert.ok(quick.ball>slow.ball);
t.rugby.jobs={'5':'Support','6':'Support'};const supported=phaseContext(t,ps,ps,c);assert.ok(supported.support>slow.support);assert.ok(supported.receivers>slow.receivers);
const report={checks:'passed',controlledMatches:200,strong:{metres:mean('strong','metres'),quickBallRate:mean('strong','quick')},weak:{metres:mean('weak','metres'),quickBallRate:mean('weak','quick')},scope:'Atomic selection, stable stars, migration, live save resume, eight exact legacy Phase 2 continuations, matched-CA carrier contrasts and support tradeoffs. Sensitivity evidence, not empirical calibration.'};fs.writeFileSync('public/reports/phase25-validation.json',JSON.stringify(report,null,2));console.log(report);
