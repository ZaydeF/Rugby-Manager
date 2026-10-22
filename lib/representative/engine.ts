import type {Season,SimUniverse} from '../sim/types.ts';
import {eligibleReason,eligibility,type Region,type Eligibility,provinceRegion,NON_NZ} from './eligibility.ts';
import {initRepresentative,repYear,repStats} from './state.ts';
import {careerUniverse,formSummary} from '../management/state.ts';
import {stable,bound} from '../management/config.ts';
import {autoSelect,makeSide,selectionErrors} from '../sim/selection.ts';
import {DEFAULT_TACTICS,CONFIG} from '../sim/config.ts';
import {createMatch,instantResult} from '../sim/engine.ts';
import {bulletin} from '../market/state.ts';

export const REP_WEIGHTS={allBlacks:{ability:.5,form:.3,experience:.1,fit:.1},islands:{ability:.4,form:.45,experience:0,fit:.15}};
export function watchList(s:Season,data:SimUniverse,region?:Region){
 const live=careerUniverse(s,data),summaries=new Map(live.players.map(p=>[p.player_id,formSummary(s,p.player_id)]));
 const peers:Record<string,number[]>={};for(const p of live.players){const f=summaries.get(p.player_id)!;if(f.minutes>=160&&f.season!==null)(peers[p.position]??=[]).push(f.season);}
 return live.players.filter(p=>eligibleReason(s,p.player_id,region)===null).map(p=>{
  const f=summaries.get(p.player_id)!,rs=repStats(s,p.player_id),c=s.condition[p.player_id],ps=peers[p.position]??[],mean=ps.length?ps.reduce((a,b)=>a+b,0)/ps.length:6.7;
  const sample=f.minutes/(f.minutes+500),form=bound(65+((f.season??mean)-mean)*sample*35,25,95);
  const history=s.representative?.years.filter(y=>y.year<s.year&&y.allBlacks.includes(p.player_id)).length??0;
  const experience=bound(45+Math.min(f.minutes/20,30)+(p.reputation?12:0)+Math.min(history*3,12),0,95);
  const fit=bound(((p.attributes.engine??65)+(p.attributes.discipline??65)+(p.attributes.work_rate??65))/3-.18*c.fatigue-.15*(100-c.fitness),0,100);
  const w=region?REP_WEIGHTS.islands:REP_WEIGHTS.allBlacks,seriesBonus=region?0:bound(((rs.rating??6.7)-6.7)*rs.minutes/(rs.minutes+240)*3,-1.5,1.5);
  const score=p.overall*w.ability+form*w.form+experience*w.experience+fit*w.fit+seriesBonus;
  return {p,score,form:f,region:eligibility(s,p.player_id).region,available:!c.injuryWeeks&&c.fitness>=55,status:c.injuryWeeks?'Injured':c.fitness<55?'Not match fit':f.minutes<160?'Limited evidence':form>=72?'Rising':form<60?'Under pressure':'In contention'};
 }).sort((a,b)=>b.score-a.score||a.p.player_id.localeCompare(b.p.player_id));
}
function selection(s:Season,data:SimUniverse,region:Region){const rows=watchList(s,data,region).filter(r=>r.available);const ranked=rows.map(r=>({...r.p,overall:r.score}));const ids=autoSelect(ranked,{});return {ids,players:rows.map(r=>r.p),errors:selectionErrors(ids,ranked,{})};}
export function seriesIssues(s:Season,data:SimUniverse){return (['NORTH','SOUTH'] as const).flatMap(region=>selection(s,data,region).errors.map(e=>`${region}: ${e}`));}
function recover(s:Season){for(const c of Object.values(s.condition)){c.fatigue=Math.max(0,c.fatigue-CONFIG.weeklyRecovery);c.fitness=Math.min(100,c.fitness+10);c.injuryWeeks=Math.max(0,c.injuryWeeks-1);if(!c.injuryWeeks)c.injuryName=null;}}
export function openSeries(s:Season,data:SimUniverse){initRepresentative(s);const y=repYear(s)!;if(y.stage!=='watch')return;if(!s.champion||s.activeMatch)throw Error('Complete the Super Rugby final first.');const errors=seriesIssues(s,data);if(errors.length)throw Error('Eligible, fit NZ pool cannot field both teams. '+errors.join(' '));
 y.stage='series';y.north=selection(s,data,'NORTH').ids;y.south=selection(s,data,'SOUTH').ids;
 bulletin(s,`rep-squads-${s.year}`,'North–South squads named','Three matches follow the Super Rugby final. Known records take priority; labelled franchise fallbacks cover missing eligibility or island information. Open Representative rugby for squads and matches.','development');
 for(const id of [...y.north,...y.south])if(s.management!.players[id].clubId===s.teamId)bulletin(s,`rep-call-${s.year}-${id}`,`${data.players.find(p=>p.player_id===id)?.name??s.future?.generated[id]?.name} earns an island call-up`,'Your player will represent their first provincial island. Match exposure and injuries carry into the offseason.','development',id);
}
export function recoveryWeek(s:Season){const y=repYear(s);if(!s.champion||!y||!['watch','series'].includes(y.stage)||y.active)throw Error('Recovery is only available between representative matches.');if(y.recoveryWeeks>=6)throw Error('Six recovery weeks used. Resolve the eligible pool or explicitly cancel the remaining series.');recover(s);y.recoveryWeeks++;}
export function startRepresentativeMatch(s:Season,data:SimUniverse){const y=repYear(s)!;if(y.stage==='watch')openSeries(s,data);if(y.active)return;if(y.stage!=='series'||y.matches.length>=3)throw Error('No representative match is due.');const errors=seriesIssues(s,data);if(errors.length)throw Error(errors.join(' '));
 const sides=(['NORTH','SOUTH'] as const).map(region=>{const pick=selection(s,data,region);if(region==='NORTH')y.north=pick.ids;else y.south=pick.ids;return makeSide(region,region==='NORTH'?'North Island':'South Island',pick.players,pick.ids,s.condition,DEFAULT_TACTICS,true);});
 const id=`rep-${s.year}-${y.matches.length+1}`;y.active=createMatch(id,Math.floor(stable(s.seed,id)*2147483647),sides[0],sides[1],false);
}
export function finishRepresentativeMatch(s:Season){const y=repYear(s)!,m=y.active;if(!m?.finished)throw Error('Finish the representative match first.');if(y.matches.some(x=>x.id===m.id)){y.active=null;return;}
 for(const t of m.teams)for(const p of Object.values(t.players))if(p.stats.minutes){const c=s.condition[p.id];c.fatigue=p.condition.fatigue;c.fitness=p.condition.fitness;c.sharpness=bound(c.sharpness+p.stats.minutes*.08,20,100);c.morale=bound(c.morale+(t.stats.score>=m.teams.find(o=>o.id!==t.id)!.stats.score?2:-1),30,95);if(p.injured){c.injuryWeeks=p.injuryWeeks;c.injuryName=p.injuryName;}}
 y.matches.push(m);y.active=null;bulletin(s,`rep-result-${m.id}`,`Game ${y.matches.length}: North ${m.teams[0].stats.score}–${m.teams[1].stats.score} South`,'Full report and individual statistics are available in Representative rugby.','development');
 // Exactly one week passes between games; newly sustained injuries lose a week normally.
 if(y.matches.length<3)recover(s);
}
export function simulateRepresentativeMatch(s:Season,data:SimUniverse){startRepresentativeMatch(s,data);repYear(s)!.active=instantResult(repYear(s)!.active!);finishRepresentativeMatch(s);}
export function selectAllBlacks(s:Season,data:SimUniverse){const y=repYear(s)!;if(y.stage==='selected')return;if(y.matches.length!==3||y.active)throw Error('Play all three North–South games before the All Blacks announcement.');
 const rows=watchList(s,data).filter(r=>r.available),quota:Record<string,number>={prop:6,hooker:3,lock:4,loose_forward:6,scrum_half:3,fly_half:3,center:4,outside_back:5};
 const selected=Object.entries(quota).flatMap(([pos,n])=>rows.filter(r=>r.p.position===pos).slice(0,n).map(r=>r.p.player_id));
 const missing=Object.entries(quota).filter(([pos,n])=>rows.filter(r=>r.p.position===pos).length<n);
 if(missing.length)throw Error('Not enough eligible fit players for the All Blacks squad: '+missing.map(([p])=>p.replaceAll('_',' ')).join(', ')+'. Eligibility will not be guessed.');
 y.allBlacks=selected;y.omissions=rows.filter(r=>!selected.includes(r.p.player_id)).slice(0,8).map(r=>r.p.player_id);y.stage='selected';
 const previous=s.representative!.years.filter(h=>h.year<s.year),last=previous.at(-1)?.allBlacks??[];
 for(const id of selected){s.condition[id].morale=bound(s.condition[id].morale+3,0,95);if(s.management!.players[id].clubId===s.teamId){const p=rows.find(r=>r.p.player_id===id)!.p,ever=previous.some(h=>h.allBlacks.includes(id));bulletin(s,`ab-${s.year}-${id}`,`${p.name}: ${!ever?'first career All Blacks selection':last.includes(id)?'retains All Blacks place':'All Blacks recall'}`,'Selected for the national squad. Selection is not a Test appearance and does not award a cap.','development',id);}}
 for(const id of last.filter(id=>!selected.includes(id)))if(s.management!.players[id]?.clubId===s.teamId)bulletin(s,`ab-omit-${s.year}-${id}`,'All Blacks omission',`${data.players.find(p=>p.player_id===id)?.name??'Your player'} misses this squad. Fitness, form and positional competition are considered.`,'development',id);
 bulletin(s,`ab-squad-${s.year}`,'All Blacks squad announced',`${selected.length} NZ-eligible players selected after the three-match series. Review the squad, omissions and series honours. Annual development and recruitment can now begin.`,'development');
}
export function cancelSeries(s:Season,data:SimUniverse){const y=repYear(s)!;if(y.active||!s.champion||!['watch','series'].includes(y.stage))throw Error('Cannot cancel this series.');const issues=seriesIssues(s,data);if(!issues.length&&y.matches.length<3)throw Error('Both teams can play; complete the three-match series.');if(y.matches.length===3){try{selectAllBlacks(s,data);throw Error('Selection succeeded; cancellation not needed.');}catch(e){if(y.stage==='selected')throw e;}}
 y.stage='skipped';y.reason='Representative programme could not complete: eligible, fit positional cover was insufficient. No ineligible replacements or invented caps were used.';bulletin(s,`rep-cancel-${s.year}`,'Representative programme curtailed',y.reason,'development');
}
export function correctEligibility(s:Season,id:string,e:Eligibility){if(s.representative?.years.some(y=>y.active||[...y.north,...y.south,...y.allBlacks,...y.omissions].includes(id)||y.matches.some(m=>m.teams.some(t=>!!t.players[id]))))throw Error('Corrections must be made before this year’s representative matches.');if(!s.management?.players[id])throw Error('Unknown player.');if(NON_NZ[id]&&e.status==='eligible')throw Error('This is a confirmed other-union player. Automatic nationality switches are not supported.');if(e.status==='eligible'&&(e.union!=='New Zealand'||e.basis.trim().length<12))throw Error('Supply a specific NZ eligibility basis.');if(e.region!==provinceRegion(e.province))throw Error('Island must match the first province.');s.representative!.overrides[id]=e;}
export function updateWatch(s:Season,data:SimUniverse){if(!s.representative||s.round%4!==0||s.champion)return;for(const r of watchList(s,data).filter(r=>r.p.squad_id===s.teamId)){const old=s.representative.watch[r.p.player_id];if(old&&old!==r.status&&['Rising','Under pressure'].includes(r.status))bulletin(s,`watch-${s.year}-${s.round}-${r.p.player_id}`,`${r.p.name}: ${r.status.toLowerCase()}`,'The selection watch reflects season form relative to the position, with limited minutes given less weight.','development',r.p.player_id);s.representative.watch[r.p.player_id]=r.status;}}
