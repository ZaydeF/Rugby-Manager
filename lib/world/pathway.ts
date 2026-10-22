import pathways from '../../data/packs/world/pathways.json' with {type:'json'};
import type {Season} from '../sim/types.ts';
import {catalog,ledger,registration,worldAge,worldPlayers} from './catalog.ts';
import {ensureProvincialContracts} from './provincial-contracts.ts';
import type {PathwayDecision,PathwayEvent,PathwayPlan,PathwayState,WorldPlayer} from './types.ts';

export type PathwayLink={seniorTeamId:string;developmentTeamId:string;label:string;seniorName:string;developmentName:string;description:string};
export type PathwayCandidate={player:WorldPlayer;apps:number;minutes:number;rating:number|null;age:number|null;plan:PathwayPlan;decision:PathwayDecision|undefined;readiness:'Ready for a look'|'On the radar'|'Building evidence'|'Protect';reason:string;watched:boolean};

const links=pathways.links as PathwayLink[];
export const pathwayLink=(s:Season)=>links.find(x=>x.seniorTeamId===s.teamId);

function linkFor(s:Season){return links.find(x=>x.seniorTeamId===s.teamId&&s.world?.primary==='SR');}

export function ensurePathway(s:Season):PathwayState|undefined{
 ensureProvincialContracts(s);const link=linkFor(s);if(!link)return undefined;
 const current=s.world!.pathway;
 if(current&&current.seniorTeamId===link.seniorTeamId&&current.developmentTeamId===link.developmentTeamId){current.watchlist??=[];current.plans??={};current.decisions??={};current.events??=[];return current;}
 const state:PathwayState={version:1,seniorTeamId:link.seniorTeamId,developmentTeamId:link.developmentTeamId,watchlist:[],plans:{},decisions:{},events:[]};
 s.world!.pathway=state;return state;
}

function candidateRows(s:Season){
 const state=ensurePathway(s),link=state&&linkFor(s);if(!state||!link)return [] as PathwayCandidate[];
 return worldPlayers(s).filter(p=>{const npc=registration(s,p.id,'NPC');const senior=registration(s,p.id,'SR');return npc?.teamId===link.developmentTeamId&&!p.id.startsWith('academy-')&&senior?.teamId!==link.seniorTeamId&&!s.world!.players[p.id]?.retired;}).map(player=>{
  const r=ledger(s,'NPC',player.id),apps=r?.apps??0,minutes=Math.round(r?.minutes??0),rating=apps?r!.ratings/apps:null,age=worldAge(s,player),injury=s.condition[player.id]?.injuryWeeks??0;
  const plan=state.plans[player.id]??'monitor',decision=state.decisions[player.id],watched=state.watchlist.includes(player.id);
  const readiness=injury>0?'Protect':minutes>=240&&!!rating&&rating>=7.15?'Ready for a look':minutes>=120&&!!rating&&rating>=6.8?'On the radar':'Building evidence';
  const reason=injury>0?`${injury} weeks unavailable`:apps?`${apps} appearances · ${minutes} NPC minutes · ${rating!.toFixed(2)} average`:'No NPC match evidence yet';
  return {player,apps,minutes,rating,age,plan,decision,readiness,reason,watched};
 }).sort((a,b)=>Number(b.watched)-Number(a.watched)||b.minutes-a.minutes||(b.rating??0)-(a.rating??0));
}

export function pathwayCandidates(s:Season){return candidateRows(s);}

export function setPathwayPlan(s:Season,playerId:string,plan:PathwayPlan){const state=ensurePathway(s);if(state)state.plans[playerId]=plan;}

function addEvent(s:Season,event:PathwayEvent){const state=ensurePathway(s);if(!state||state.events.some(x=>x.id===event.id))return;state.events=[event,...state.events].slice(0,40);s.news=[{id:`pathway-${event.id}`,title:event.title,text:event.text},...s.news].slice(0,100);}

export function decidePathway(s:Season,playerId:string,decision:PathwayDecision){
 const state=ensurePathway(s);if(!state)return;state.decisions[playerId]=decision;
 if(decision==='call-up'){
  const contract=s.management?.players[playerId];if(contract){contract.clubId=state.seniorTeamId;contract.role='Development';contract.contractEnd=Math.max(contract.contractEnd,s.year+1);}
 }
 const player=worldPlayers(s).find(p=>p.id===playerId);if(player)addEvent(s,{id:`decision-${s.year}-${playerId}-${decision}`,year:s.year,round:s.round,playerId,kind:'decision',title:`${player.name}: pathway decision recorded`,text:decision==='call-up'?'A Highlanders call-up has been requested. The next selection and contract cycle will show the consequence.':decision==='protect'?'Workload protection is now the priority while Otago build the player back up.':'The player stays with Otago to build a stronger evidence base.',read:false});
}

export function syncPathway(s:Season,round:number){
 const state=ensurePathway(s);if(!state)return;const rows=candidateRows(s).filter(x=>x.apps>0).slice(0,5);
 for(const row of rows){
  const eventId=`${s.year}-${round}-${row.player.id}`;if(state.events.some(x=>x.id===eventId))continue;
  if(row.readiness==='Ready for a look'||(row.watched&&row.rating!==null&&row.rating>=6.8)){
   const kind=row.readiness==='Ready for a look'?'breakthrough':'watch';
   addEvent(s,{id:eventId,year:s.year,round,playerId:row.player.id,kind,title:kind==='breakthrough'?`${row.player.name} is ready for a look`:`${row.player.name} stays on the Otago radar`,text:`${row.reason}. Review the evidence before deciding whether to call the player up, leave them developing or protect their workload.`,read:false});
  }else if(row.watched&&row.readiness==='Protect')addEvent(s,{id:eventId,year:s.year,round,playerId:row.player.id,kind:'concern',title:`${row.player.name} needs protection`,text:`${row.reason}. The pathway plan should reflect availability before ambition.`,read:false});
 }
}

export function pathwayTeamNames(s:Season){const state=ensurePathway(s);return state?{senior:catalog.teams.find(t=>t.id===state.seniorTeamId)?.name??state.seniorTeamId,development:catalog.teams.find(t=>t.id===state.developmentTeamId)?.name??state.developmentTeamId}:null;}
