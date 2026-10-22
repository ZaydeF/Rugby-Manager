import researched from '../../data/packs/phase1/birthdates.json' with {type:'json'};
import roster from '../../data/packs/phase1/roster.json' with {type:'json'};
import type {Season,SimUniverse} from '../sim/types.ts';
import {POSITION_MIN} from '../management/config.ts';
import {autoSelect,kickers} from '../sim/selection.ts';
export const BIOGRAPHIES=researched as Record<string,{date:string;source:string;evidence:string;quality:string;status:string;acceptedAt:string}>;
export const EXCLUDED_IDS=new Set(roster.excludedPlayers.map(p=>p.player_id));
export function applyBiographies(s:Season,data:SimUniverse){
 if(!s.management||!s.future)return;
 // Fill missing dates only. Preserve editor corrections and never replay past development.
 for(const [id,b] of Object.entries(BIOGRAPHIES)){const c=s.management.players[id];if(c&&!c.birthDate){c.birthDate=b.date;c.birthSource=b.source;}}
 if(s.activeMatch||s.representative?.years.some(y=>y.active))return;
 for(const id of EXCLUDED_IDS){
  const c=s.management.players[id];if(!c||s.future.retired[id])continue;
  const club=c.clubId,position=data.players.find(p=>p.player_id===id)?.position,freed=c.salary;
  c.clubId=null;c.salary=0;c.listed=false;s.future.retired[id]=s.year;
  if(s.market){s.market.shortlist=s.market.shortlist.filter(p=>p!==id);for(const t of s.market.threads)if(t.playerId===id&&!['completed','rejected','withdrawn','expired'].includes(t.stage)){t.stage='expired';}}
  // Removed placeholders must not leave an illegal squad. Use an existing academy player.
  if(club&&position){
   const count=data.players.filter(p=>p.position===position&&s.management!.players[p.player_id]?.clubId===club).length+Object.values(s.future.generated).filter(g=>g.position===position&&s.management!.players[g.id].clubId===club&&!data.players.some(p=>p.player_id===g.id)).length;
   if(count<(POSITION_MIN[position]??0)){
    const g=Object.values(s.future.generated).filter(g=>g.academyId===club&&g.position===position&&g.level==='academy'&&!s.future!.retired[g.id]).sort((a,b)=>s.management!.players[b.id].ability-s.management!.players[a.id].ability)[0];
    if(g){const q=s.management.players[g.id];g.level='senior';q.clubId=club;q.salary=Math.min(freed,45000);q.contractEnd=Math.max(q.contractEnd,s.year+1);q.role='Development';}
   }
  }
 }
 if(s.selection.some(id=>EXCLUDED_IDS.has(id))){
  const pool=[...data.players.filter(p=>!EXCLUDED_IDS.has(p.player_id)&&s.management!.players[p.player_id]?.clubId===s.teamId),...Object.values(s.future.generated).filter(g=>s.management!.players[g.id].clubId===s.teamId&&!data.players.some(p=>p.player_id===g.id)).map(g=>({player_id:g.id,name:g.name,position:g.position,overall:s.management!.players[g.id].ability,attributes:s.management!.players[g.id].attributes}))] as SimUniverse['players'];
  s.selection=autoSelect(pool,s.condition);
  const starters=pool.filter(p=>s.selection.slice(0,15).includes(p.player_id)),sorted=kickers(starters);
  if(sorted.length)for(const key of ['kicker','secondaryKicker','tacticalKicker'] as const)if(!s.selection.slice(0,15).includes(s[key]))s[key]=key==='tacticalKicker'?(starters.find(p=>p.position==='fly_half')?.player_id??sorted[0].player_id):sorted[key==='secondaryKicker'?Math.min(1,sorted.length-1):0].player_id;
 }
}
