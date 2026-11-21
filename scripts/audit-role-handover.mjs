import {newWorld,prepare} from '../lib/world/engine.ts';
import {nextClubFixture} from '../lib/management/advice.ts';
import {setClubSystem} from '../lib/club/identity.ts';
import {advancePhase,substitute} from '../lib/sim/engine.ts';
import {canCover} from '../lib/sim/selection.ts';
let results=[];
for(const team of ['1','5','6','4','npc-9'])for(const seed of [173,271,397,557]){
const s=newWorld(team,seed),f=nextClubFixture(s);s.world.phase=s.world.primary;s.round=f.round;s.world.date=f.date.slice(0,10);
const plan={shape:'Two distributors',first:s.selection[9],second:s.selection[11],runner:s.selection[12],chase:s.selection[10],cover:s.selection[14]};setClubSystem(s,plan);
const m=prepare(s,f,s.world.primary,true),side=m.teams.findIndex(t=>t.id===team);delete m.live;delete m.penaltyControl;m.teams[side].autoManage=false;m.teams[side].autoHalfTime=false;
while(!m.halftime&&!m.finished)advancePhase(m);
const t=m.teams[side];let ids;
for(const role of ['first','runner']){const off=plan[role],p=t.players[off],on=t.bench.find(i=>canCover(t.players[i],p)&&!t.players[i].entered);if(on&&!substitute(m,side,off,on)){ids={role,on};break;}}
if(!ids){results.push({team,seed,excluded:true});continue;}
let counts=[];
for(const revise of [false,true]){const copy=structuredClone(m);s.activeMatch=copy;if(revise)setClubSystem(s,{...plan,[ids.role]:ids.on});const initial=copy.teams[side].tacticalLog?.system_launches??0;
while(!copy.finished)advancePhase(copy);
counts.push((copy.teams[side].tacticalLog?.system_launches??0)-initial);}
results.push({team,seed,...ids,counts});
}
console.log(JSON.stringify(results));
