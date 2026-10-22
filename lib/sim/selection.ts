import {matchSlots,slotSuitability,suitability,type BenchSplit} from './positions.ts';
import {KEY,average} from '../world/catalog.ts';
import type {Player} from '../types.ts';
import type {Condition,Tactics,Side,TeamStats,MatchStats,SimPlayer} from './types.ts';
import {SLOTS,DEFAULT_TACTICS,FORWARDS} from './config.ts';
export function freshCondition():Condition{return {fitness:100,fatigue:0,form:0,morale:70,sharpness:80,injuryWeeks:0,injuryName:null};}
export function fits(player:Player,slot:number,split:BenchSplit='5-3'){return slotSuitability(player.position,slot,split).allowed;}
export function selectionScore(p:Player,c:Condition){return (p.rich?p.overall*.65+average(p.rich,KEY[p.position]??['work_rate'])*.35:p.overall)+c.form-.22*c.fatigue-.08*(100-c.fitness);}
export function autoSelect(squad:Player[],conditions:Record<string,Condition>={},split:BenchSplit='5-3'):string[]{
 const used=new Set<string>();return matchSlots(split).map((_,i)=>{const candidates=squad.filter(p=>!used.has(p.player_id)&&fits(p,i,split)&&slotSuitability(p.position,i,split).factor===1&&!p.unavailable&&!(conditions[p.player_id]?.injuryWeeks));candidates.sort((a,b)=>(slotSuitability(b.position,i,split).factor-slotSuitability(a.position,i,split).factor)||selectionScore(b,conditions[b.player_id]??freshCondition())-selectionScore(a,conditions[a.player_id]??freshCondition())||a.player_id.localeCompare(b.player_id));const id=candidates[0]?.player_id??'';used.add(id);return id;});
}
export function selectionErrors(ids:string[],squad:Player[],conditions:Record<string,Condition>={},split:BenchSplit='5-3'):string[]{
 const errors:string[]=[];if(ids.length!==23)errors.push('Name all 23 matchday players.');
 if(new Set(ids.filter(Boolean)).size!==ids.filter(Boolean).length)errors.push('A player is named more than once.');
 matchSlots(split).forEach(([label],i)=>{const p=squad.find(p=>p.player_id===ids[i]);if(!p)errors.push(`Choose a player for ${i+1}: ${label}.`);else if(!fits(p,i,split))errors.push(`${p.name} is not suited to ${label}.`);else if(p.unavailable)errors.push(`${p.name} is unavailable for this round.`);else if(conditions[p.player_id]?.injuryWeeks)errors.push(`${p.name} is injured.`);});return errors;
}
export function kickers(squad:Player[]){return [...squad].sort((a,b)=>(b.attributes.kicking??25)-(a.attributes.kicking??25)||b.overall-a.overall);}
export function blankPlayerStats():MatchStats{return {minutes:0,tries:0,assists:0,conversions:0,penaltyGoals:0,missedKicks:0,tackles:0,missedTackles:0,metres:0,linebreaks:0,turnovers:0,penalties:0,errors:0,yellow:0,red:0,offloads:0,lineouts:0,scrums:0,rating:6.5};}
export function blankTeamStats():TeamStats{return {score:0,assists:0,tries:0,conversions:0,penaltyGoals:0,missedKicks:0,metres:0,linebreaks:0,turnovers:0,penalties:0,tackles:0,missedTackles:0,errors:0,yellow:0,red:0,offloads:0,lineouts:0,lineoutsLost:0,scrums:0,scrumsLost:0,possessionSeconds:0,territorySeconds:0,territorySum:0,phases:0,possessions:1};}
export function makeSide(id:string,name:string,squad:Player[],ids:string[],conditions:Record<string,Condition>={},tactics:Tactics={...DEFAULT_TACTICS},autoManage=true,split:BenchSplit='5-3'):Side{
 const errors=selectionErrors(ids,squad,conditions,split);if(errors.length)throw Error(errors.join(' '));
 const players:Record<string,SimPlayer>={};for(const p of squad.filter(p=>ids.includes(p.player_id)))players[p.player_id]={id:p.player_id,name:p.name,shirtNumber:ids.indexOf(p.player_id)+1,position:p.position,...(ids.indexOf(p.player_id)<15?{playingPosition:SLOTS[ids.indexOf(p.player_id)][1]}:{}),overall:p.overall,...(p.rich?{rich:{...p.rich},injuryResistance:p.injuryResistance}:{}),attributes:{...p.attributes},condition:{...(conditions[p.player_id]??freshCondition())},stats:blankPlayerStats(),cardUntil:0,sentOff:false,injured:false,injuryName:null,injuryWeeks:0,entered:ids.indexOf(p.player_id)<15,left:false};
 const k=kickers(squad.filter(p=>ids.slice(0,15).includes(p.player_id)));
 return {id,name,players,lineup:ids.slice(0,15),bench:ids.slice(15),used:[],tactics:{...tactics},kicker:k[0].player_id,secondaryKicker:k[1]?.player_id??k[0].player_id,tacticalKicker:ids[9],stats:blankTeamStats(),autoManage,matchMood:0};
}
export function canCover(incoming:SimPlayer,outgoing:SimPlayer){return suitability(incoming.position,outgoing.playingPosition??outgoing.position).allowed;}

// Atomic placement validates both ends before changing selection.
export function placePlayer(ids:string[],squad:Player[],conditions:Record<string,Condition>,id:string,slot:number,split:BenchSplit='5-3'){
 if(!Number.isInteger(slot)||slot<0||slot>=23)throw Error('Choose a matchday position.');
 const p=squad.find(p=>p.player_id===id);if(!p||!fits(p,slot,split))throw Error('That player cannot cover this position.');
 if(p.unavailable)throw Error('That player is unavailable for this round.');if(conditions[id]?.injuryWeeks)throw Error('That player is injured.');
 const source=ids.indexOf(id),displaced=squad.find(p=>p.player_id===ids[slot]);
 if(source>=0&&displaced&&(!fits(displaced,source,split)||displaced.unavailable||conditions[displaced.player_id]?.injuryWeeks))throw Error('Both players must cover their new positions. Choose another replacement.');
 const next=[...ids];if(source>=0)next[source]=ids[slot];next[slot]=id;return next;
}

export type SelectionTarget={slot:number}|{playerId:string}|{remove:true};
// A row represents a player: dragging a starter onto a reserve replaces the
// starter with that reserve. Selected-to-selected is the same atomic swap.
export function selectionDrop(ids:string[],squad:Player[],conditions:Record<string,Condition>,id:string,target:SelectionTarget,split:BenchSplit='5-3'){
 const source=ids.indexOf(id);
 if('remove' in target){if(source<0)throw Error('This player is already outside the 23.');const next=[...ids];next[source]='';return next;}
 if('slot' in target)return placePlayer(ids,squad,conditions,id,target.slot,split);
 if(target.playerId===id)return [...ids];
 const destination=ids.indexOf(target.playerId);
 if(destination>=0)return placePlayer(ids,squad,conditions,id,destination,split);
 if(source<0)throw Error('Choose a position on the pitch or bench first.');
 return placePlayer(ids,squad,conditions,target.playerId,source,split);
}

export function changeBenchSplit(s:import('./types.ts').Season,squad:Player[],split:BenchSplit){
 if(s.activeMatch)throw Error('Choose your bench split before kick-off.');
 s.benchSplit=split;const selected=s.selection.slice(0,15),used=new Set(selected);const previous=s.selection.slice(15);
 for(let slot=15;slot<23;slot++){const candidates=squad.filter(p=>!used.has(p.player_id)&&fits(p,slot,split)&&!p.unavailable&&!s.condition[p.player_id]?.injuryWeeks).sort((a,b)=>Number(previous.includes(b.player_id))-Number(previous.includes(a.player_id))||selectionScore(b,s.condition[b.player_id]??freshCondition())-selectionScore(a,s.condition[a.player_id]??freshCondition()));const id=candidates[0]?.player_id??'';selected.push(id);used.add(id);}s.selection=selected;
}
