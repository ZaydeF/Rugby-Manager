// Reproduce the audit with actual saved succession policies rather than an extra manual edit.
import assert from 'node:assert/strict';
import {newWorld,prepare} from '../lib/world/engine.ts';
import {nextClubFixture} from '../lib/management/advice.ts';
import {setClubSystem} from '../lib/club/identity.ts';
import {advancePhase,substitute} from '../lib/sim/engine.ts';
import {throwReasons} from '../lib/sim/club-system.ts';
import {canCover} from '../lib/sim/selection.ts';
const rows=[];
for(const team of ['1','5','6','4','npc-9'])for(const seed of [173,271,397,557]){
 const s=newWorld(team,seed),f=nextClubFixture(s);s.world.phase=s.world.primary;s.round=f.round;s.world.date=f.date.slice(0,10);
 const plan={shape:'Two distributors',first:s.selection[9],second:s.selection[11],runner:s.selection[12],chase:s.selection[10],cover:s.selection[14],succession:{first:'position'}};
 setClubSystem(s,plan);const m=prepare(s,f,s.world.primary,true),side=m.teams.findIndex(t=>t.id===team);
 delete m.live;delete m.penaltyControl;m.teams[side].autoManage=false;m.teams[side].autoHalfTime=false;
 while(!m.halftime&&!m.finished)advancePhase(m);
 const t=m.teams[side],off=plan.first,on=t.bench.find(i=>canCover(t.players[i],t.players[off])&&!t.players[i].entered);
 const row={team,seed,off,on,arms:[]};
 for(const rule of ['vacant','position','named','override-vacant','override-inherit']){
  const match=structuredClone(m),own=match.teams[side];own.clubSystem.plan.succession.first=rule==='named'||rule==='override-vacant'?on:rule==='override-inherit'?'vacant':rule;
  assert.equal(substitute(match,side,off,on,rule==='override-vacant'?'vacant':rule==='override-inherit'?'inherit':undefined),null);const before=own.tacticalLog.system_launches??0;
  while(!match.finished)advancePhase(match);
  for(const x of match.teams){
   const log=x.tacticalLog;
   assert.equal(Object.keys(throwReasons).reduce((sum,k)=>sum+(log['reason_'+k]??0),0),x.stats.lineouts+x.stats.lineoutsLost);
   assert.equal(log.reason_called??0,log.system_launches??0);
  }
  const launches=(own.tacticalLog.system_launches??0)-before;row.arms.push({rule,launches,throws:own.stats.lineouts+own.stats.lineoutsLost});if(rule==='vacant'||rule==='override-vacant')assert.equal(launches,0);
 }
 assert.equal(row.arms[1].launches,row.arms[2].launches);assert.equal(row.arms[1].launches,row.arms[4].launches);rows.push(row);
}
console.log(JSON.stringify(rows,null,2));
