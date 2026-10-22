import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createMatch,instantResult} from '../lib/sim/engine.ts';
import {autoSelect,makeSide} from '../lib/sim/selection.ts';
import {DEFAULT_TACTICS} from '../lib/sim/config.ts';
import type {SimUniverse,Tactics} from '../lib/sim/types.ts';
const data=JSON.parse(fs.readFileSync('data/generated/universe.json','utf8')) as SimUniverse;
function side(index:number,tactics:Tactics){const t=data.teams[index],sq=data.players.filter(p=>p.squad_id===t.id);return makeSide(t.id,t.name,sq,autoSelect(sq),{},tactics,true);}
const cases={balanced:{},fast:{tempo:2},slow:{tempo:0},aggressive:{breakdown:2},passive:{breakdown:0},highRisk:{risk:2,offloads:2},lowRisk:{risk:0,offloads:0},stronger:{}};
const count=500;const results:Record<string,Record<string,number>>={};
for(const [label,settings] of Object.entries(cases)){
 const sum={phases:0,fatigue:0,turnovers:0,penalties:0,errors:0,metres:0,wins:0,margin:0};
 for(let i=0;i<count;i++){const h=i%11,a=(h+1+Math.floor(i/11)%10)%11;const home=side(h,{...DEFAULT_TACTICS,...settings}),away=side(a,{...DEFAULT_TACTICS});
  if(label==='stronger')for(const p of Object.values(home.players)){p.overall=Math.min(99,p.overall+12);for(const key of Object.keys(p.attributes) as (keyof typeof p.attributes)[])if(p.attributes[key]!==null)p.attributes[key]=Math.min(99,p.attributes[key]!+12);}
  const m=instantResult(createMatch('tactical',3571*(i+1),home,away));const s=m.teams[0].stats;sum.phases+=s.phases;sum.turnovers+=s.turnovers;sum.penalties+=s.penalties;sum.errors+=s.errors;sum.metres+=s.metres;sum.wins+=s.score>m.teams[1].stats.score?1:0;sum.margin+=s.score-m.teams[1].stats.score;sum.fatigue+=Object.values(m.teams[0].players).reduce((n,p)=>n+p.condition.fatigue,0)/23;
 }
 results[label]=Object.fromEntries(Object.entries(sum).map(([k,v])=>[k,Number((v/count).toFixed(3))]));
}
assert.ok(results.fast.phases>results.slow.phases);assert.ok(results.fast.fatigue>results.slow.fatigue);assert.ok(results.aggressive.turnovers>results.passive.turnovers);assert.ok(results.aggressive.penalties>results.passive.penalties);assert.ok(results.highRisk.errors>results.lowRisk.errors);assert.ok(results.stronger.wins>results.balanced.wins+.07);assert.ok(results.stronger.margin>results.balanced.margin+3);
assert.ok(results.fast.metres>results.slow.metres);assert.ok(results.highRisk.metres>results.lowRisk.metres);assert.ok(Math.abs(results.highRisk.margin-results.lowRisk.margin)<8);assert.ok(Math.abs(results.fast.margin-results.slow.margin)<8);
const report={matchesPerScenario:count,results};fs.writeFileSync('data/generated/tactical-validation.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
