import {slotSuitability} from '../sim/positions.ts';
import {getPathway,youthMember} from './coaching.ts';
import type {Season,SimUniverse} from '../sim/types.ts';
import {careerUniverse,payroll,formSummary} from './state.ts';
import {reserved} from '../market/engine.ts';
import {matchInstructions} from './advice.ts';
import {autoSelect,fits,selectionScore,freshCondition} from '../sim/selection.ts';
export type PlayingPlan={role:'Key starter'|'Rotation'|'Developing prospect'|'Depth';position:string;minutes:number;usage:'Balanced'|'Start easier fixtures'|'Regular bench'};
export type ManagerPlans={training?:import('./preparation.ts').Training;savedTactics?:import('../sim/types.ts').Tactics;nextMatch?:{fixtureId:string;players:Record<string,'start'|'bench'|'rest'>};approach:'Strongest result'|'Balanced'|'Development';assistantSelection:boolean;assistantSubs:boolean;players:Record<string,PlayingPlan>;preferred:Record<string,{starter:string;backup:string}>;releaseAtExpiry:string[]};
export function plans(s:Season):ManagerPlans{return s.managerPlans??={approach:'Balanced',assistantSelection:true,assistantSubs:true,players:{},preferred:{},releaseAtExpiry:[]};}
export function budgetLimits(s:Season){const f=s.management!.finances[s.teamId],r=reserved(s,s.teamId);return {min:Math.ceil(payroll(s,s.teamId)+r.salary),max:Math.floor(f.payrollCap+f.cash-r.fee)};}
export function adjustBudget(s:Season,wages:number){const f=s.management!.finances[s.teamId],{min,max}=budgetLimits(s);if(!Number.isFinite(wages)||wages<min||wages>max)throw Error('Keep enough money for contracted salaries and live offers.');const delta=Math.round(wages)-f.payrollCap;f.cash-=delta;f.payrollCap+=delta;}
export function plannedSelection(s:Season,data:SimUniverse,opponent?:string,base?:string[]){
 const squad=careerUniverse(s,data).players.filter(p=>p.squad_id===s.teamId),cfg=plans(s),minutes=Object.fromEntries(squad.map(p=>[p.player_id,formSummary(s,p.player_id).minutes]));
 const played=s.fixtures.filter(f=>f.result&&(f.home===s.teamId||f.away===s.teamId)).length;
 const opp=opponent?careerUniverse(s,data).players.filter(p=>p.squad_id===opponent).sort((a,b)=>b.overall-a.overall).slice(0,15):[];
 const own=[...squad].sort((a,b)=>b.overall-a.overall).slice(0,15);const easy=opp.length>0&&own.reduce((n,p)=>n+p.overall,0)/15-opp.reduce((n,p)=>n+p.overall,0)/15>=4;
 const instructions=matchInstructions(s);const used=new Set<string>();return autoSelect(squad,s.condition,s.benchSplit).map((fallback,slot)=>{
  const candidates=squad.filter(p=>!used.has(p.player_id)&&fits(p,slot,s.benchSplit)&&!p.unavailable&&!s.condition[p.player_id]?.injuryWeeks);
  candidates.sort((a,b)=>score(b,slot)-score(a,slot)||a.player_id.localeCompare(b.player_id));const id=candidates[0]?.player_id??fallback;used.add(id);return id;
 });
 function score(p:typeof squad[number],slot:number){const c=s.condition[p.player_id]??freshCondition(),plan=cfg.players[p.player_id];let n=selectionScore(p,c)-c.fatigue*.15-(1-slotSuitability(p.position,slot,s.benchSplit).factor)*100;if(base?.[slot]===p.player_id)n+=30;const instruction=instructions[p.player_id];if(instruction==='rest')n-=10000;if(instruction==='bench')n+=slot<15?-1000:1000;if(instruction==='start')n+=slot<15?2000:-500;if(slot===18&&p.position==='lock'||slot===19&&p.position==='loose_forward')n+=100;
  const pref=cfg.preferred[String(slot)];if(pref?.starter===p.player_id)n+=7;if(pref?.backup===p.player_id)n+=2;
  if(!instruction){const path=getPathway(s,p.player_id).pathway;if(path==='Rest')n-=10000;else if(path==='U21 priority'&&youthMember(s,p.player_id,s.teamId))n-=500;else if(path==='Managed transition')n+=slot>=15?5:-2;}
  if(slot>=15&&Object.values(cfg.preferred).some(x=>x.backup===p.player_id))n+=4;
  if(plan){const behind=Math.max(0,plan.minutes*Math.min(1,(played+1)/14)-(minutes[p.player_id]??0));n+=Math.min(cfg.approach==='Development'?13:cfg.approach==='Balanced'?8:3,behind/25);if(plan.role==='Key starter'&&slot<15)n+=4;if(plan.usage==='Regular bench')n+=slot>=15?5:-3;if(plan.usage==='Start easier fixtures'&&easy&&slot<15)n+=8;}
  return n;
 }
}
export function selectionReason(s:Season,id:string){const c=s.condition[id],p=s.managerPlans?.players[id];if(c?.injuryWeeks)return `Unavailable: injured for ${c.injuryWeeks} weeks.`;const slot=s.selection.indexOf(id);if(slot>=0)return `${slot<15?'Starting XV':'Replacement'} · ${p?.role??'selected on ability, form and freshness'}.`;if(c?.fatigue>25)return 'Rested: accumulated fatigue makes fresher cover preferable.';return p?`${p.role}: ${Math.round(formSummary(s,id).minutes)} / ${p.minutes} target minutes. Positional competition and match priority affect selection.`:'Not in the 23: positional competition, ability and current form. Set a playing plan to guide the assistant.';}
