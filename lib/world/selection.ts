import {slotSuitability,type BenchSplit} from '../sim/positions.ts';
import type {Season,Condition} from '../sim/types.ts';
import type {Player} from '../types.ts';
import type {Competition} from './types.ts';
import {autoSelect,fits,selectionScore} from '../sim/selection.ts';
import {worldPlayers,worldAge,ledger} from './catalog.ts';
import {roll} from './development.ts';
// Small, bounded opportunities. Coaches use the scouting estimate, never save PA.
export function worldAISelection(s:Season,squad:Player[],conditions:Record<string,Condition>,comp:Competition,round:number,split:BenchSplit=aiBenchSplit(squad,conditions)){const ids=autoSelect(squad,conditions,split),all=new Map(worldPlayers(s).map(p=>[p.id,p]));if(round>(comp==='NPC'?10:16))return ids;const prospects=squad.filter(p=>{const a=all.get(p.player_id);return a&&(worldAge(s,a)??99)<=23&&a.paCentre>=80&&!p.unavailable&&!conditions[p.player_id].injuryWeeks;});let opportunities=0;for(let slot=15;slot<23&&opportunities<2;slot++){const current=squad.find(p=>p.player_id===ids[slot]);if(!current)continue;const candidates=prospects.filter(p=>!ids.includes(p.player_id)&&fits(p,slot,split)&&slotSuitability(p.position,slot,split).factor===1&&(ledger(s,comp,p.player_id)?.minutes??0)<round*35&&selectionScore(current,conditions[current.player_id])-selectionScore(p,conditions[p.player_id])<=(comp==='NPC'?6:3)).sort((a,b)=>selectionScore(b,conditions[b.player_id])-selectionScore(a,conditions[a.player_id]));if(candidates[0]){ids[slot]=candidates[0].player_id;opportunities++;}}
 if(comp==='NPC')for(const id of ids.slice(15)){const p=prospects.find(p=>p.player_id===id);if(!p||(ledger(s,comp,id)?.starts??0)>=Math.ceil(round/3)||roll(s.seed,`${s.year}-${round}-${id}-start`)>.3)continue;const slot=ids.slice(0,15).findIndex((starter,i)=>fits(p,i,split)&&slotSuitability(p.position,i,split).factor===1&&selectionScore(squad.find(p=>p.player_id===starter)!,conditions[starter])-selectionScore(p,conditions[id])<=8);if(slot>=0){const bench=ids.indexOf(id);if(fits(squad.find(p=>p.player_id===ids[slot])!,bench,split)){[ids[slot],ids[bench]]=[id,ids[slot]];break;}}}
 return ids;
}

export function aiBenchSplit(squad:Player[],conditions:Record<string,Condition>):BenchSplit{const six=autoSelect(squad,conditions,'6-2');if(six.some(id=>!id))return '5-3';const score=(ids:string[])=>ids.reduce((n,id)=>{const p=squad.find(p=>p.player_id===id)!;return n+selectionScore(p,conditions[id])},0)/ids.length;return score(six.slice(18,21))>score(six.slice(21))+5?'6-2':'5-3';}
