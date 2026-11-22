// One replication per run: node scripts/compare-matchday23-careers.mjs 1 173 position 3
import assert from 'node:assert/strict';
import {newWorld,quickSim} from '../lib/world/engine.ts';
import {advanceDay,matchDue} from '../lib/world/calendar.ts';
import {setClubSystem,eligibleProjects,addProject,allocateSession,renewProject,releaseProject} from '../lib/club/identity.ts';
import {ledger,worldAge} from '../lib/world/catalog.ts';
import {throwReasons} from '../lib/sim/club-system.ts';
import {validSave} from '../lib/sim/validation.ts';
const [team='1',seed='173',policy='position',years='3']=process.argv.slice(2);
assert(['position','vacant'].includes(policy));
const s=newWorld(team,+seed),rows=[];
for(let run=0;run<Number(years);run++){
 const year=s.year,row={year,matches:0,throws:0,launches:0,uncovered:0,pointsFor:0,pointsAgainst:0,days:0};
 let project=s.clubIdentity?.projects[0];
 if(project){if(eligibleProjects(s).some(p=>p.id===project.id))renewProject(s,project.id);else{releaseProject(s,project.id);project=null;}}
 if(!project){const p=eligibleProjects(s).find(p=>worldAge(s,p)<21&&!s.selection.slice(0,15).includes(p.id));if(p)addProject(s,p.id,'Distribution','Development XV');}
 const prospect=s.clubIdentity?.projects[0]?.id;row.prospect=prospect??null;row.coachingSessions=0;
 while(s.year===year&&row.days<520){
  if(s.world.announcement)s.world.announcement=null;
  if(s.world.representative?.xvAnnouncement)s.world.representative.xvAnnouncement=null;
  if(matchDue(s)){
   const [first,second,runner,chase,cover]=[9,11,12,10,14].map(i=>s.selection[i]);
   setClubSystem(s,{shape:'Two distributors',first,second,runner,chase,cover,succession:Object.fromEntries(['first','second','runner','chase','cover'].map(r=>[r,policy]))});
   if(prospect)try{allocateSession(s,prospect);row.coachingSessions++;}catch(e){if(!/unavailable|no funded/.test(e.message))throw e;}
   quickSim(s);const m=s.activeMatch,side=m.teams.find(t=>t.id===team),other=m.teams.find(t=>t!==side);
   const log=side.tacticalLog,throws=side.stats.lineouts+side.stats.lineoutsLost;
   assert.equal(Object.keys(throwReasons).reduce((n,k)=>n+(log['reason_'+k]??0),0),throws);
   row.matches++;row.throws+=throws;row.launches+=log.reason_called??0;row.uncovered+=(log.reason_first??0)+(log.reason_runner??0);row.pointsFor+=side.stats.score;row.pointsAgainst+=other.stats.score;
  }
  if(prospect){row.seniorMinutes=ledger(s,s.world.primary,prospect)?.minutes??0;row.developmentMinutes=ledger(s,s.world.primary+'-U21',prospect)?.minutes??0;}
  row.cash=s.management.finances[team].cash;
  advanceDay(s);row.days++;
 }
 assert(s.year>year&&row.matches);assert(validSave(s,{}));rows.push(row);
 console.error(team,policy,year,row.matches);
}
console.log(JSON.stringify({team,seed:+seed,policy,rows},null,2));
