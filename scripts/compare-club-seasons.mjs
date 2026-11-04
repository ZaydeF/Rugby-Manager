// Run with Node 24: node scripts/compare-club-seasons.mjs 1 173
import assert from 'node:assert/strict';
import {newWorld,quickSim} from '../lib/world/engine.ts';
import {advanceDay,matchDue,calendarDate} from '../lib/world/calendar.ts';
import {ranked} from '../lib/world/schedule.ts';
import {catalog,worldAge,ledger} from '../lib/world/catalog.ts';
import {setClubSystem,allocateSession,eligibleProjects,addProject,nextBlock} from '../lib/club/identity.ts';
import {matchNumbers} from '../lib/club/analysis.ts';
import {validSave} from '../lib/sim/validation.ts';

const team=process.argv[2]??'1',seed=Number(process.argv[3]??173);
assert(Number.isSafeInteger(seed),'Use an integer seed');
const base=newWorld(team,seed);
assert.equal(base.world.primary,'SR');
const start=calendarDate(base);
const candidates=eligibleProjects(base);
const youth=candidates.find(p=>worldAge(base,p)<21&&!base.selection.slice(0,15).includes(p.id));
const prospect=youth??candidates.find(p=>p.id===base.selection[11])??candidates.find(p=>base.selection.slice(0,15).includes(p.id));
const route=youth?'Development XV':'Senior opportunity';
const results=[];
for(const academy of prospect?[false,true]:[false]){
 for(const shape of ['Carry first','Two distributors']){
  const s=structuredClone(base),{year}=s;
  setClubSystem(s,{shape,first:s.selection[9],second:s.selection[11],runner:s.selection[12],chase:s.selection[10],cover:s.selection[14]});
  if(academy)addProject(s,prospect.id,'Distribution',route);
  const fixtures=[],sessions={rehearsal:0,recovery:0,project:0,unavailableLaunch:0,unavailableProspect:0};
  let days=0,checks=0;
  while(!s.champion&&days<160){
   const f=matchDue(s);
   if(f){
    const block=nextBlock(s);
    if(block.used<block.capacity){
     try{allocateSession(s,'senior');sessions.rehearsal++;}
     catch(e){if(e.message!=='All named launch players must be available to rehearse.')throw e;sessions.unavailableLaunch++;}
    }
    if(nextBlock(s).used<block.capacity){
     if(academy){
      try{allocateSession(s,prospect.id);sessions.project++;}
      catch(e){if(e.message!=='This prospect is unavailable for a funded session.')throw e;sessions.unavailableProspect++;}
     }else{allocateSession(s,'recovery');sessions.recovery++;}
    }
    const date=calendarDate(s);
    quickSim(s);
    const m=s.activeMatch,n=matchNumbers(m,team);
    assert(m.finished&&m.id===f.id);
    fixtures.push({id:f.id,date,round:f.round,stage:f.stage,home:f.home===team,opponent:n.opponent,score:n.score,against:n.against,lineouts:n.lineouts,throws:n.throws,launches:n.launches,split:n.split,positive:n.positive,lost:n.errors,launchBreaks:n.launchBreaks,reads:n.reads,fallbacks:n.fallbacks});
   }
   advanceDay(s);
   days++;
   if(f||days%7===0||s.champion){
    assert(validSave(s,{}),`Invalid save: ${team}/${seed}/${shape}/${academy}/${calendarDate(s)}`);
    checks++;
   }
  }
  assert(s.champion&&s.year===year,'Expected the Super Rugby final to finish before the day limit');
  const table=ranked(s.standings),standing=table.find(t=>t.id===team),regular=fixtures.filter(f=>f.round<=16);
  assert.equal(regular.length,base.fixtures.filter(f=>[f.home,f.away].includes(team)).length);
  assert.equal(regular.length,standing.played);
  assert.equal(regular.reduce((a,f)=>a+f.score-f.against,0),standing.for-standing.against);
  const p=s.clubIdentity.projects[0],career=prospect?s.management.players[prospect.id]:null;
  const development=prospect?{
   id:prospect.id,name:prospect.name,route,
   minutes:ledger(s,route==='Development XV'?'SR-U21':'SR',prospect.id)?.minutes??0,
   projectMinutes:p?.minutes??null,coachedEvidence:p?+p.matched.toFixed(2):null,missedStreak:p?.missed??null,
   abilityChange:career.ability-base.management.players[prospect.id].ability,
   moraleChange:s.condition[prospect.id].morale-base.condition[prospect.id].morale
  }:null;
  results.push({shape,academy,start,end:calendarDate(s),days,checks,standing,rank:table.indexOf(standing)+1,
   qualified:s.finalSeeds.includes(team),champion:s.champion,sessions,cash:s.management.finances[team].cash,development,fixtures});
 }
}
console.log(JSON.stringify({team,club:catalog.teams.find(t=>t.id===team).name,seed,results}));
