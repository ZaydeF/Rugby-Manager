import {z} from 'zod';
import type {Season,Side} from '../sim/types.ts';
import {catalog,registration,worldPlayers,availability} from '../world/catalog.ts';
import {calendarDate} from '../world/calendar.ts';
import {addStory,ensurePulse,selectionDilemmas} from '../world/pulse.ts';
import {oppositionReport} from '../sim/intelligence.ts';
export const EMPHASES=['Balanced','Recovery','Conditioning','Attack','Defence','Set piece','Breakdown','Kicking / territory','Skills','Match preparation'] as const;
export type Emphasis=typeof EMPHASES[number];
const familiarity=z.object({attack:z.number().min(0).max(100),defence:z.number().min(0).max(100),kicking:z.number().min(0).max(100),setPiece:z.number().min(0).max(100)});
export const weeklySchema=z.object({version:z.literal(1),clubs:z.record(z.object({emphasis:z.enum(EMPHASES),trained:z.enum(EMPHASES).optional(),familiarity,applied:z.string().max(30),signature:z.string().max(1000)})),reports:z.array(z.string().max(180)).max(300),lastResult:z.string().max(180)});
export type Weekly=z.infer<typeof weeklySchema>;
const clamp=(n:number,a=0,b=100)=>Math.max(a,Math.min(b,n));
export function weekKey(date:string){const days=Math.floor(Date.parse(date)/86400000);return String(Math.floor((days+3)/7));}
export function ensureWeekly(s:Season):Weekly{return s.weekly??={version:1,clubs:Object.fromEntries(catalog.teams.map(t=>[t.id,{emphasis:'Balanced' as Emphasis,familiarity:{attack:65,defence:65,kicking:65,setPiece:65},applied:'',signature:''}])),reports:[],lastResult:''};}
export function validWeekly(s:Season){return !s.weekly||weeklySchema.safeParse(s.weekly).success&&Object.keys(s.weekly.clubs).length===catalog.teams.length&&Object.keys(s.weekly.clubs).every(id=>catalog.teams.some(t=>t.id===id));}
export function setEmphasis(s:Season,focus:Emphasis){if(!EMPHASES.includes(focus))throw Error('Choose a weekly emphasis.');if(s.activeMatch)throw Error('Finish the current match before changing preparation.');ensureWeekly(s).clubs[s.teamId].emphasis=focus;}
const focusDimension=(f:Emphasis)=>f==='Defence'||f==='Breakdown'?'defence':f==='Kicking / territory'?'kicking':f==='Set piece'?'setPiece':'attack';
export function applyWeeklyMatch(s:Season,side:Side){const c=s.weekly?.clubs[side.id];if(!c)return;const f=c.familiarity;
 side.familiarity=Object.fromEntries(side.rugby!.plays.map(play=>[play,play==='cross'||play==='exit'?f.kicking:play==='power'?f.setPiece:f.attack]));
 const trained=c.trained??'Balanced',focus=trained==='Defence'||trained==='Breakdown'?'Defence':trained==='Set piece'?'Set piece':'Balanced';
 side.preparation={focus,bonus:focus==='Balanced'?0:clamp((focus==='Defence'?f.defence:f.setPiece)-60,0,30)/50};
}
export function weeklyDay(s:Season){const w=ensureWeekly(s),date=calendarDate(s),key=weekKey(date),weekday=new Date(date+'T12:00:00Z').getUTCDay(),all=worldPlayers(s),phase=s.world!.phase,competition=phase==='NPC'?'NPC':'SR';
 // Apply one bounded session per week to every club. A player has one training
 // owner for this phase even when he has both an SR and NPC registration.
 if(weekday>=2&&weekday<=5)for(const team of catalog.teams){const c=w.clubs[team.id];if(c.applied===key)continue;c.applied=key;c.trained=c.emphasis;
 const f=c.familiarity,dimension=focusDimension(c.emphasis),signature=team.id===s.teamId?JSON.stringify(s.rugbyPlan):'AI';if(c.signature&&signature!==c.signature){f.attack=Math.max(45,f.attack-2);f.kicking=Math.max(45,f.kicking-2);}c.signature=signature;
 for(const d of Object.keys(f) as (keyof typeof f)[])f[d]=clamp(f[d]+(c.emphasis==='Recovery'||c.emphasis==='Conditioning'?.25:c.emphasis==='Balanced'||c.emphasis==='Match preparation'?1:d===dimension?2:.25),45,90);
 for(const p of all){if(s.world!.players[p.id].retired)continue;const owner=registration(s,p.id,competition)?.teamId??registration(s,p.id,competition==='SR'?'NPC':'SR')?.teamId;if(owner!==team.id)continue;const q=s.condition[p.id];if(!q||q.injuryWeeks)continue;if(c.emphasis==='Recovery')q.fatigue=clamp(q.fatigue-2);else if(c.emphasis==='Conditioning'){q.fatigue=clamp(q.fatigue+1.5);q.fitness=clamp(q.fitness+1);}else if(c.emphasis==='Match preparation')q.sharpness=q.sharpness<70?Math.min(70,q.sharpness+.5):q.sharpness;}
 }
 const pulse=ensurePulse(s),own=all.filter(p=>s.world!.memberships.some(m=>m.active&&m.playerId===p.id&&m.teamId===s.teamId)),next=s.fixtures.filter(f=>!f.result&&[f.home,f.away].includes(s.teamId)&&f.date.slice(0,10)>=date).sort((a,b)=>a.date.localeCompare(b.date))[0],last=pulse.matches.filter(m=>[m.home,m.away].includes(s.teamId)).at(-1);
 const report=(kind:string,title:string,text:string,players:string[]=[],important=false)=>{const id=`weekly-${s.year}-${key}-${kind}`;if(w.reports.includes(id))return;w.reports=[...w.reports,id].slice(-300);addStory(s,{id,category:kind==='opposition'||kind==='selection'?'Selection':kind==='review'?'Results':'Development',title,text,players,clubs:[s.teamId],important});};
 if(last&&last.id!==w.lastResult){w.lastResult=last.id;const risks=own.filter(p=>s.condition[p.id].fatigue>=25||s.condition[p.id].injuryWeeks>0).sort((a,b)=>s.condition[b.id].fatigue-s.condition[a.id].fatigue).slice(0,4);report('recovery','Performance: recovery report',risks.length?risks.map(p=>`${p.name}: ${s.condition[p.id].injuryWeeks?`${s.condition[p.id].injuryWeeks} weeks injured`:`${Math.round(s.condition[p.id].fatigue)} fatigue`}`).join('. '):'No significant fatigue or medical concerns after the last match.',risks.map(p=>p.id),risks.length>0);}
 if(weekday===2&&last){const index=last.home===s.teamId?0:1,stats=last.players.filter(p=>p.team===s.teamId).map(p=>p.stats),sum=(k:'penalties'|'errors'|'turnovers')=>stats.reduce((n,p)=>n+p[k],0),focus=sum('penalties')>=10?'Defence':sum('errors')>=8?'Skills':'Balanced';report('review','Assistant coach: weekly review',`${last.score[index]}–${last.score[1-index]}. ${sum('penalties')} penalties conceded; ${sum('errors')} handling errors; ${sum('turnovers')} turnovers won. Recommended emphasis: ${focus}. Review detailed evidence in the match report.`);}
 if(weekday===3&&next){const opponent=next.home===s.teamId?next.away:next.home,r=oppositionReport(s,opponent),name=catalog.teams.find(t=>t.id===opponent)?.name;report('opposition',`Opposition: ${name}`,r.matches.length?`${r.matches.length} recorded matches. ${r.attack}; ${r.defence}. ${r.breaks.toFixed(1)} breaks and ${r.kicks.toFixed(1)} tactical kicks per match. ${r.confidence}.`:'No recorded opponent evidence yet. Squad-based projections remain provisional.');}
 if(weekday===4&&next){const decisions=selectionDilemmas(s);if(decisions.length)report('pressure','Assistant coach: selection pressure',decisions.slice(0,3).map(x=>x.text).join(' '),decisions.slice(0,3).map(x=>x.id),true);}
 if(next&&Math.ceil((Date.parse(next.date.slice(0,10))-Date.parse(date))/86400000)===1){const available=own.filter(p=>availability(s,p.id)==='AVAILABLE').length;report('selection','Team naming: confirm your matchday 23',`${available} players available. Confirm the XV, bench, leadership and kickers before tomorrow’s match. Opponent selection is a projection until confirmed.`,[],true);}
}
