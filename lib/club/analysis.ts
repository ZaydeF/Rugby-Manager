import type {Season,GameMatch,Fixture} from '../sim/types.ts';
import {assess} from '../scouting.ts';
import {goalSkills} from './identity.ts';

export type RoleBrief=NonNullable<Season['clubIdentity']>['brief'];
export function roleEstimate(s:Season,id:string,brief:RoleBrief){
 if(brief==='Any')return null;
 const report=s.scouting?.reports[id],skills=s.world?.players[id]?.rich,c=s.management?.players[id];
 if(!report||report.completed===null||!skills||!c)return null;
 const a=assess(s,id),keys=goalSkills[brief];
 const estimate=Math.round(Math.max(0,Math.min(99,keys.reduce((n,k)=>n+(skills[k]??50),0)/keys.length+a.current-c.ability)));
 return {value:estimate,range:`${Math.max(0,estimate-a.uncertainty)}–${Math.min(99,estimate+a.uncertainty)}`,confidence:a.confidence};
}
export function matchNumbers(m:GameMatch,id:string){
 const t=m.teams.find(t=>t.id===id),other=m.teams.find(t=>t.id!==id);if(!t||!other)return null;
 const l=t.tacticalLog??{},total=t.stats.territorySeconds+other.stats.territorySeconds;
 return {team:t.name,opponent:other.name,score:t.stats.score,against:other.stats.score,lineouts:t.stats.lineouts,throws:t.stats.lineouts+t.stats.lineoutsLost,breaks:t.stats.linebreaks,penalties:t.stats.penalties,territory:total?Math.round(t.stats.territorySeconds/total*100):null,launches:l.system_launches??0,retained:l.system_retained??0,positive:l.system_gainline??0,errors:l.system_lost??0,launchBreaks:l.system_breaks??0,reads:l.system_read??0,split:l.system_split??0,fallbacks:l.system_fallbacks??0,chases:l.system_chases??0,cover:l.system_cover_receipts??0,incidents:m.events.filter(e=>e.side===m.teams.indexOf(t)&&e.kind==='club_launch')};
}
export function priorMatches(s:Season,current:Fixture){return s.fixtures.filter(f=>f.result&&f.id!==current.id&&f.date<=current.date&&[f.home,f.away].includes(s.teamId)).sort((a,b)=>b.date.localeCompare(a.date)||b.round-a.round).slice(0,3);}
