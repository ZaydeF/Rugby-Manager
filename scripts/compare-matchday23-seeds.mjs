// Matched on starting save, not on later RNG after a decision changes play.
import assert from 'node:assert/strict';
import {newWorld,quickSim} from '../lib/world/engine.ts';
import {matchDue,advanceDay} from '../lib/world/calendar.ts';
import {setClubSystem} from '../lib/club/identity.ts';
import {throwReasons} from '../lib/sim/club-system.ts';
import {validSave} from '../lib/sim/validation.ts';
const seed=Number(process.argv[2]??173),team='5',base=newWorld(team,seed),rows=[];
for(const policy of ['standard','fixed','adaptive']){
 const s=structuredClone(base),row={seed,policy,matches:0,wins:0,margin:0,throws:0,launches:0,lostOnLaunch:0,missingRoles:0,exitZone:0,retainedMetres:0};
 for(let day=0;day<160&&!s.champion;day++){
  const f=matchDue(s);if(f){
   if(policy==='adaptive'||policy==='fixed'&&!s.clubIdentity?.system){const x=s.selection;setClubSystem(s,{shape:'Two distributors',first:x[9],second:x[11],runner:x[12],chase:x[10],cover:x[14],succession:Object.fromEntries(['first','runner','second','chase','cover'].map(r=>[r,policy==='adaptive'?'position':'vacant']))});}
   quickSim(s);const m=s.activeMatch,t=m.teams.find(t=>t.id===team),d=m.teams.find(v=>v!==t),l=t.tacticalLog,throws=t.stats.lineouts+t.stats.lineoutsLost;
   assert.equal(Object.keys(throwReasons).reduce((n,k)=>n+(l['reason_'+k]??0),0),throws);
   if(f.round<=16){row.matches++;row.throws+=throws;row.wins+=Number(t.stats.score>d.stats.score);row.margin+=t.stats.score-d.stats.score;row.launches+=l.reason_called??0;row.missingRoles+=(l.reason_first??0)+(l.reason_runner??0);row.exitZone+=l.reason_zone??0;row.retainedMetres+=l.system_metres??0;row.lostOnLaunch+=l.system_lost??0;}
  }
  advanceDay(s);
 }
 assert(s.champion&&validSave(s,{})&&row.matches===14);rows.push(row);
}
console.log(JSON.stringify(rows,null,2));
