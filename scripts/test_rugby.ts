import fs from 'node:fs';
import assert from 'node:assert/strict';
import {DEFAULT_RUGBY,STRIKES,rugbySchema,personnel,lineoutOdds,scrumOdds,strikeOdds,tacticalEffects,prepareRugby,penaltyChoice,type RugbyPlan} from '../lib/sim/rugby.ts';
import {createMatch,instantResult,advancePhase,updateRugby,callStrike,substitute} from '../lib/sim/engine.ts';
import {makeSide,autoSelect} from '../lib/sim/selection.ts';
import {DEFAULT_TACTICS} from '../lib/sim/config.ts';
import {newSeason,startFixture,validSave} from '../lib/sim/career.ts';
import {migrateCareer} from '../lib/management/migrate.ts';
import type {SimUniverse,Side} from '../lib/sim/types.ts';
const data=JSON.parse(fs.readFileSync('data/generated/universe.json','utf8')) as SimUniverse;
function side(index:number,p:Partial<RugbyPlan>={}){const club=data.teams[index],squad=data.players.filter(p=>p.squad_id===club.id),t=makeSide(club.id,club.name,squad,autoSelect(squad),{},DEFAULT_TACTICS,true);t.rugby={...structuredClone(DEFAULT_RUGBY),...p};t.familiarity=Object.fromEntries(Object.keys(STRIKES).map(id=>[id,65]));return t;}
const a=side(0),b=side(1),players=a.lineup.map(id=>a.players[id]),u=personnel(players),v=personnel(b.lineup.map(id=>b.players[id]));
const front=structuredClone(players);for(const p of front)if(['prop','hooker'].includes(p.position))p.attributes.set_piece=99;
assert.ok(personnel(front).scrum>u.scrum,'Front-row skill improves scrum');
const locks=structuredClone(players);for(const p of locks)if(p.position==='lock')p.attributes.set_piece=99;
assert.ok(personnel(locks).lineout>u.lineout,'Locks improve lineout');
const mobile=structuredClone(players);for(const p of mobile)if(['prop','hooker','lock'].includes(p.position))p.attributes.engine=99;
assert.ok(tacticalEffects(DEFAULT_RUGBY,DEFAULT_RUGBY,personnel(mobile),v,50,2).fatigue<tacticalEffects(DEFAULT_RUGBY,DEFAULT_RUGBY,u,v,50,2).fatigue,'Mobile pack supports tempo');
assert.ok(lineoutOdds({...DEFAULT_RUGBY,throw:'Short',lineoutTarget:'Front'},DEFAULT_RUGBY,u,v)>lineoutOdds({...DEFAULT_RUGBY,throw:'Long',lineoutTarget:'Back'},DEFAULT_RUGBY,u,v));
assert.ok(lineoutOdds(DEFAULT_RUGBY,{...DEFAULT_RUGBY,lineoutDefence:'Aggressive contest'},u,v)<lineoutOdds(DEFAULT_RUGBY,{...DEFAULT_RUGBY,lineoutDefence:'Defend maul'},u,v));
assert.ok(scrumOdds(DEFAULT_RUGBY,personnel(front),v)>scrumOdds(DEFAULT_RUGBY,u,v));
assert.ok(strikeOdds('screen',85,u)>strikeOdds('screen',25,u));assert.ok(strikeOdds('power',25,u)>strikeOdds('screen',25,u));
assert.equal(penaltyChoice(DEFAULT_RUGBY,75,78,-2),'Posts');assert.equal(penaltyChoice(DEFAULT_RUGBY,75,78,-7),'Corner');
assert.equal(rugbySchema.safeParse({...DEFAULT_RUGBY,plays:['screen','screen']}).success,false);assert.equal(rugbySchema.safeParse({...DEFAULT_RUGBY,plays:Object.keys(STRIKES)}).success,false);
const career=newSeason(data,'1',75),before=JSON.stringify(career.management!.players);prepareRugby(career);const practice=structuredClone(career.rugbyPreparation);prepareRugby(career);assert.deepEqual(career.rugbyPreparation,practice);assert.equal(JSON.stringify(career.management!.players),before);
career.round=career.fixtures.find(f=>f.home==='1'||f.away==='1')!.round;startFixture(career,data);assert.ok(validSave(career,data));
const live=career.activeMatch!,index=live.teams.findIndex(t=>t.id==='1');callStrike(live,index,'midfield');updateRugby(live,index,{...DEFAULT_RUGBY,defence:'Blitz'});
assert.equal(live.teams[index].nextStrike,'midfield');const resumed=migrateCareer(JSON.parse(JSON.stringify(career)),data)!;assert.ok(resumed);instantResult(live);instantResult(resumed.activeMatch!);assert.deepEqual(live,resumed.activeMatch);assert.ok(validSave(career,data));
const legacy=structuredClone(career);delete legacy.rugbyPlan;delete legacy.rugbyPreparation;delete legacy.activeMatch!.rugbyVersion;for(const t of legacy.activeMatch!.teams){delete t.rugby;delete t.familiarity;delete t.tacticalLog;delete t.nextStrike;}
assert.ok(migrateCareer(legacy,data));
const bad=structuredClone(career);bad.rugbyPlan!.plays=['screen','screen'];assert.equal(validSave(bad,data),false);
const bench=side(0),benchMatch=createMatch('bench',34,bench,side(1));const off=bench.lineup[0],on=bench.bench.find(id=>bench.players[id].position==='prop')!;
bench.players[off].attributes.set_piece=30;bench.players[off].condition.fatigue=70;bench.players[on].attributes.set_piece=99;const beforeScrum=personnel(bench.lineup.map(id=>bench.players[id])).scrum;assert.equal(substitute(benchMatch,0,off,on),null);assert.ok(personnel(bench.lineup.map(id=>bench.players[id])).scrum>beforeScrum);
const scenarios:Record<string,Partial<RugbyPlan>>={balanced:{},power:{attack:'Forward power',carriers:'Tight five',ruck:'Heavy',lineoutUse:'Maul',plays:['tip','power','exit']},wide:{attack:'Wide shape',zone:'Edges',carriers:'Back three',plays:['screen','midfield','exit']},outBack:{attack:'Out the back',zone:'Edges',plays:['screen','blindside','exit']},kickPressure:{attack:'Kick pressure',kicking:'Contestable',box:'Frequent',plays:['cross','exit','power']},territory:{kicking:'Territorial',box:'Rare',exit:'Long exits',plays:['exit','power','midfield']},tap:{penalty:'Tap',plays:[]},posts:{penalty:'Posts',plays:[]}};
const results:Record<string,Record<string,number>>={};const count=80;
for(const [name,p] of Object.entries(scenarios)){const sum={points:0,margin:0,errors:0,breaks:0,kicks:0,mauls:0,dropGoals:0,tries:0};for(let i=0;i<count;i++){const h=i%11,o=(h+1+Math.floor(i/11)%10)%11,m=instantResult(createMatch(name,7919*(i+1),side(h,p),side(o))),t=m.teams[0];assert.equal(t.stats.score,t.stats.tries*5+t.stats.conversions*2+t.stats.penaltyGoals*3+(t.stats.dropGoals??0)*3);assert.ok(m.events.length<1500);sum.points+=t.stats.score;sum.margin+=t.stats.score-m.teams[1].stats.score;sum.errors+=t.stats.errors;sum.breaks+=t.stats.linebreaks;sum.kicks+=['Long exit','Cross-kick','Box-kick','Contestable kick','Territorial kick'].reduce((n,k)=>n+(t.tacticalLog?.[k]??0),0);sum.mauls+=t.tacticalLog?.mauls??0;sum.dropGoals+=t.stats.dropGoals??0;sum.tries+=t.stats.tries;}results[name]=Object.fromEntries(Object.entries(sum).map(([k,v])=>[k,Number((v/count).toFixed(3))]));}
console.log(JSON.stringify(results,null,2));assert.ok(results.kickPressure.kicks>results.balanced.kicks,'Kick pressure produces more kicks');assert.ok(results.power.mauls>results.balanced.mauls,'Maul plan produces mauls');assert.ok(results.outBack.errors>results.power.errors,'Complex handling has an error cost');assert.ok(results.tap.tries>results.posts.tries,'Tap plan prioritises tries');
fs.writeFileSync('public/reports/phase2-tactics.json',JSON.stringify({matchesPerScenario:count,checks:'passed',results,limitations:'Simulation sensitivity checks, not empirical real-rugby calibration. Height and dedicated aerial attributes are not yet verified.'},null,2));
console.log('PASS: units, lineout trade-offs, scrum strength, mobility, familiarity, game state, arsenal validation, once-per-round practice, live calls, deterministic resume, legacy migration, replacement front row and 640 scenario matches.');
