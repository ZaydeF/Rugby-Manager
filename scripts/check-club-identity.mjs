// Compare the same save over 28 calendar days. Only the manager's decisions differ.
import {newWorld,quickSim} from '../lib/world/engine.ts';
import {advanceDay,matchDue} from '../lib/world/calendar.ts';
import {nextClubFixture} from '../lib/management/advice.ts';
import {worldAge} from '../lib/world/catalog.ts';
import {setClubSystem,allocateSession,eligibleProjects,addProject,nextBlock} from '../lib/club/identity.ts';
import {matchNumbers} from '../lib/club/analysis.ts';
import {validSave} from '../lib/sim/validation.ts';

const team=process.argv[2]??'1',seed=Number(process.argv[3]??173);
const base=newWorld(team,seed);base.world.phase=base.world.primary;
const opening=nextClubFixture(base);base.round=opening.round;base.world.date=opening.date.slice(0,10);
const candidates=eligibleProjects(base);
const development=candidates.find(p=>(worldAge(base,p)??99)<21&&!base.selection.includes(p.id));
const prospect=development??candidates.find(p=>p.id===base.selection[11])??candidates.find(p=>base.selection.slice(0,15).includes(p.id));
const route=development?'Development XV':'Senior opportunity';
const startingCash=base.management.finances[team].cash;
const results=[];
for(const strategy of ['Adapt to squad','Develop two distributors']){
 const s=structuredClone(base),invest=strategy==='Develop two distributors';
 setClubSystem(s,{shape:invest?'Two distributors':'Carry first',first:s.selection[9],second:s.selection[11],runner:s.selection[12],chase:s.selection[10],cover:s.selection[14]});
 if(invest&&prospect)addProject(s,prospect.id,'Distribution',route);
 const matches=[],allocations=[];
 for(let day=0;day<28;day++){
  const f=matchDue(s);
  if(f){
   const used=[];
   try{allocateSession(s,'senior');used.push('Senior rehearsal');}catch(e){used.push(e.message);}
   if(invest&&prospect){try{allocateSession(s,prospect.id);used.push('Prospect coaching');}catch(e){used.push(e.message);}}
   else if(nextBlock(s).used<nextBlock(s).capacity){allocateSession(s,'recovery');used.push('XV recovery');}
   allocations.push({date:s.world.date,used});
   quickSim(s);const m=s.activeMatch,n=matchNumbers(m,team);
   matches.push({opponent:n.opponent,score:[n.score,n.against],launches:n.launches,split:n.split,positive:n.positive,losses:n.errors,reads:n.reads,fallbacks:n.fallbacks,chases:n.chases,breaks:n.launchBreaks,firstIncident:n.incidents[0]?.text??null});
  }
  advanceDay(s);
  if(!validSave(s,{}))throw Error('Invalid save at '+s.world.date);
 }
 const p=s.clubIdentity.projects[0];
 results.push({strategy,start:base.world.date,end:s.world.date,matches,allocations,project:p?{name:prospect.name,route,minutes:Math.round(p.minutes),coachedEvidence:+p.matched.toFixed(2),missed:p.missed}:null,uncommittedCash:s.management.finances[team].cash,spentSinceStart:startingCash-s.management.finances[team].cash,valid:true});
}
console.log(JSON.stringify({club:team,seed,results},null,2));
