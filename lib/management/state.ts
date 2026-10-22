import {provincialExtraPayroll} from '../world/provincial-contracts.ts';
import {projected} from '../world/catalog.ts';
import {CURATED} from './curated.ts';
import {fullUniverse} from '../future/catalog.ts';
import {birthdates} from '../../data/packs/super-rugby/database.ts';
import {MANAGEMENT,ROLE_FACTOR,POSITION_MIN,stable,bound} from './config.ts';
import type {CareerPlayer,SquadRole} from './types.ts';
import type {Season,SimUniverse,GameMatch} from '../sim/types.ts';
import type {Player} from '../types.ts';
export function ageAt(p:Pick<CareerPlayer,'birthDate'>,year:number){if(!p.birthDate)return null;const d=new Date(p.birthDate);return year-d.getUTCFullYear()-Number(d.getUTCMonth()>6||(d.getUTCMonth()===6&&d.getUTCDate()>1));}
export function initManagement(s:Season,data:SimUniverse){if(s.management)return s.management;
 const players:Record<string,CareerPlayer>={};
 for(const p of data.players){const rank=data.players.filter(q=>q.squad_id===p.squad_id).sort((a,b)=>b.overall-a.overall).findIndex(q=>q.player_id===p.player_id);const role:SquadRole=rank<3?'Star':rank<10?'Important':rank<23?'Regular':rank<33?'Rotation':'Development';const bio=(birthdates as Record<string,{date:string;source:string}>)[p.player_id];
  const basic={birthDate:bio?.date??CURATED[p.player_id]?.birthDate??null,birthSource:bio?.source??(CURATED[p.player_id]?.birthDate?(CURATED[p.player_id].birthSource??CURATED[p.player_id].source):null)};const age=ageAt(basic,s.year);const room=age===null?2+stable(s.seed,p.player_id)*4:age<24?5+stable(s.seed,p.player_id)*9:age<29?2+stable(s.seed,p.player_id)*5:stable(s.seed,p.player_id)*2;
  players[p.player_id]={clubId:p.squad_id,ability:p.overall,attributes:{...p.attributes},potential:Math.max(p.overall,CURATED[p.player_id]?.potential??Math.min(MANAGEMENT.maximumAbility,p.overall+room)),...basic,salary:Math.max(MANAGEMENT.salaryFloor,Math.round((MANAGEMENT.salaryFloor+Math.pow(Math.max(0,p.overall-50),2)*MANAGEMENT.salaryQuadratic)*ROLE_FACTOR[role]/1000)*1000),contractEnd:s.year+Math.floor(stable(s.seed,'contract-'+p.player_id)*3),role,focus:'Balanced',development:[],lastConcernYear:0,listed:false};
 }
 s.version=3;s.management={version:1,sequence:0,originYear:s.year,phase:'inSeason',offseasonWeek:0,developedYear:null,players,finances:Object.fromEntries(data.teams.map(t=>{const payroll=Object.values(players).filter(p=>p.clubId===t.id).reduce((n,p)=>n+p.salary,0);return [t.id,{payrollCap:Math.ceil(Math.max(MANAGEMENT.minimumCap,payroll*MANAGEMENT.capMargin)/10000)*10000,cash:MANAGEMENT.annualAllowance,annualAllowance:MANAGEMENT.annualAllowance}]})),negotiations:[],transfers:[],concerns:[]};return s.management;
}
export function careerUniverse(s:Season,data:SimUniverse):SimUniverse {if(s.world)return projected(s);if(!s.management)return data;data=fullUniverse(s,data);return {...data,players:data.players.map(p=>{const c=s.management!.players[p.player_id],team=data.teams.find(t=>t.id===c.clubId);return {...p,overall:Math.round(c.ability),overall_unrounded:c.ability,attributes:{...c.attributes},squad_id:c.clubId??'free',squad_name:team?.name??'Free agent',squad_abbr:team?.abbr??'FA'};})};}
export function payroll(s:Season,teamId:string){return Object.values(s.management!.players).filter(p=>p.clubId===teamId).reduce((n,p)=>n+p.salary,0)+provincialExtraPayroll(s,teamId);}
export function squadIds(s:Season,teamId:string){if(s.world)return s.world.memberships.filter(m=>m.teamId===teamId&&m.active&&m.season===s.year&&!s.world!.players[m.playerId]?.retired).map(m=>m.playerId);return Object.entries(s.management!.players).filter(([,p])=>p.clubId===teamId).map(([id])=>id);}
export function minimumIssues(s:Season,data:SimUniverse,teamId:string,exclude?:string,include?:string){const ids=squadIds(s,teamId).filter(id=>id!==exclude);if(include)ids.push(include);return Object.entries(POSITION_MIN).filter(([pos,min])=>ids.filter(id=>data.players.find(p=>p.player_id===id)?.position===pos).length<min).map(([pos])=>pos);}
export function canLosePlayer(s:Season,data:SimUniverse,id:string){const c=s.management!.players[id];return !c.clubId||minimumIssues(s,data,c.clubId,id).length===0;}
export function playerMatches(s:Season,id:string){const rows:{match:GameMatch;teamId:string;stats:GameMatch['teams'][0]['players'][string]['stats'];started:boolean;injuryWeeks:number}[]=[];for(const f of s.fixtures){if(!f.result)continue;for(const t of f.result.teams){const p=t.players[id];if(p&&p.stats.minutes>0)rows.push({match:f.result,teamId:t.id,stats:p.stats,started:!f.result.events.some(e=>e.kind==='substitution'&&e.playerId===id),injuryWeeks:p.injured?p.injuryWeeks:0});}}return rows;}
export function formSummary(s:Season,id:string){const rows=playerMatches(s,id);const average=(n:number)=>{const group=rows.slice(-n);return group.length?group.reduce((a,r)=>a+r.stats.rating,0)/group.length:null};return {rows,apps:rows.length,starts:rows.filter(r=>r.started).length,minutes:rows.reduce((n,r)=>n+r.stats.minutes,0),last:average(1),last3:average(3),last5:average(5),season:average(rows.length),injuryWeeks:rows.reduce((n,r)=>n+r.injuryWeeks,0)};}
export function potentialLabel(c:CareerPlayer){return c.potential>=93?'Elite international potential':c.potential>=88?'International potential':c.potential>=83?'High Super Rugby potential':c.potential>=76?'Super Rugby starter potential':c.potential>=66?'Super Rugby squad potential':'Limited potential';}
export function estimatedPotential(c:CareerPlayer){return `${Math.max(Math.round(c.ability),Math.floor(c.potential-3))}–${Math.min(97,Math.ceil(c.potential+3))}`;}
export function clubName(data:SimUniverse,id:string|null){return data.teams.find(t=>t.id===id)?.name??'Free agents';}
export function addNews(s:Season,id:string,title:string,text:string){s.news.unshift({id,title,text});s.news=s.news.slice(0,50);}

export function enrichBirthdates(s:Season){for(const [id,b] of Object.entries(birthdates)){const c=s.management?.players[id];if(c&&!c.birthDate){c.birthDate=b.date;c.birthSource=b.source;}}}
