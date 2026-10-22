import {dynamicsDevelopment} from './dynamics.ts';
import {coachingContribution,youthWeight} from './coaching.ts';
import {repStats} from '../representative/state.ts';
import {fullUniverse} from '../future/catalog.ts';
import {youthStats} from '../future/engine.ts';
import type {Attribute,Player} from '../types.ts';
import type {Season,SimUniverse} from '../sim/types.ts';
import type {CareerPlayer,DevelopmentChange} from './types.ts';
import {MANAGEMENT,bound,stable} from './config.ts';
import {ageAt,formSummary,addNews} from './state.ts';
export function developmentFactors(c:CareerPlayer,position:string,year:number,originYear:number,minutes:number,average:number|null,peerAverage:number,injuryWeeks:number,morale:number){
 const age=ageAt(c,year),minutesWeight=bound(minutes/700,0,1),headroom=bound((c.potential-c.ability)/12,0,1);const forward=['prop','hooker','lock'].includes(position);const declineAge=forward?32:30;
 const ageEffect=age===null?0:age<21?2.2:age<23?1.55:age<26?.55:age<declineAge?0:-Math.min(2.8,(age-declineAge+1)*.45);
 const performance=average===null?0:bound((average-peerAverage)*minutes/(minutes+500),-.7,.7);
 return {age,factors:[{label:age===null?'Age unverified — neutral':'Age and position curve',value:ageEffect},{label:'Playing time',value:minutesWeight*.6-.35},{label:'Season form relative to position',value:performance},{label:'Potential headroom',value:headroom*minutesWeight*(age!==null&&age<23?2.2:.65)},{label:'Injury burden',value:-Math.min(1.1,injuryWeeks*.075)},{label:'Morale',value:bound((morale-70)*.005,-.15,.15)}]};
}
function changeAttributes(c:CareerPlayer,p:Player,target:number,weights:Record<string,number[]>,exposure?:Partial<Record<string,number>>){
 const attributes=['attack','defence','work_rate','set_piece','kicking','discipline','engine','impact'] as Attribute[];const ws=attributes.map((a,i)=>c.attributes[a]===null?0:(weights[p.position]?.[i]??1));const total=ws.reduce((a,b)=>a+b,0);const mean=()=>attributes.reduce((n,a,i)=>n+(c.attributes[a]??0)*ws[i],0)/total;
 const focus:Record<string,Attribute[]>={Attack:['attack','impact'],Defence:['defence','discipline'],Skills:['attack','work_rate'],Kicking:['kicking'], 'Set piece':['set_piece'],Physical:['engine','work_rate'],Balanced:[]};const totalFocus=Object.values(exposure??{}).reduce<number>((n,v)=>n+(v??0),0);const emphasis=(a:Attribute)=>totalFocus?Object.entries(exposure!).reduce((n,[f,v])=>n+(focus[f]?.includes(a)?v??0:0),0)/totalFocus:0;const delta=target-c.ability;
 for(const a of attributes)if(c.attributes[a]!==null)c.attributes[a]=bound(c.attributes[a]!+delta*(1+emphasis(a)*(delta>=0?.7:-.5)),25,99);
 for(let n=0;n<12;n++){const correction=target-mean();if(Math.abs(correction)<.0001)break;for(const a of attributes)if(c.attributes[a]!==null)c.attributes[a]=bound(c.attributes[a]!+correction,25,99);}
 for(const a of attributes)if(c.attributes[a]!==null)c.attributes[a]=Math.round(c.attributes[a]!*100)/100;
 c.ability=Number(bound(mean(),MANAGEMENT.minimumAbility,MANAGEMENT.maximumAbility).toFixed(2));
}
export function developPlayers(s:Season,data:SimUniverse){data=fullUniverse(s,data);const m=s.management!;if(m.developedYear===s.year)return false;if(!s.champion)throw Error('Finish the season before the annual development review.');
 const summaries=new Map(data.players.map(p=>[p.player_id,formSummary(s,p.player_id)]));const peers:Record<string,{sum:number;n:number}>={};for(const p of data.players){const f=summaries.get(p.player_id)!;if(f.minutes>=160&&f.season!==null){const bucket=peers[p.position]??{sum:0,n:0};bucket.sum+=f.season;bucket.n++;peers[p.position]=bucket;}}
 const weights=(data.config as {version:string;weights?:Record<string,number[]>}).weights??{};
 for(const p of data.players){if(s.future?.retired[p.player_id])continue;const c=m.players[p.player_id],f=summaries.get(p.player_id)!,peer=peers[p.position];const youth=youthStats(s,p.player_id);const seniorMinutes=f.minutes;const yw=youthWeight(s,p.player_id);f.minutes+=youth.minutes*yw;f.injuryWeeks+=youth.injuryWeeks;const rep=repStats(s,p.player_id);const preRepMinutes=f.minutes;f.minutes+=rep.minutes*.75;f.injuryWeeks+=rep.injuryWeeks;if(rep.rating!==null)f.season=((f.season??0)*preRepMinutes+rep.rating*rep.minutes*.75)/(f.minutes||1);const {age,factors}=developmentFactors(c,p.position,s.year,m.originYear,f.minutes,f.season,peer?.n?peer.sum/peer.n:6.7,f.injuryWeeks,s.condition[p.player_id].morale);if(s.future?.generated[p.player_id]){const trait=s.future.generated[p.player_id].trait;factors.push({label:'Academy development approach',value:trait==='Diligent'?.25:trait==='Inconsistent'?-.15:.1});}
 factors.push({label:'Trust and professionalism in training',value:dynamicsDevelopment(s,p.player_id)});
 factors.push({label:'Accumulated specialist coaching',value:coachingContribution(s,p.player_id)});
 const variation=(stable(s.seed,`development-${s.year}-${p.player_id}`)-.5)*.3;factors.push({label:'Individual variation',value:variation});
  const before=c.ability,raw=factors.reduce((n,f)=>n+f.value,0),target=bound(before+bound(raw,-MANAGEMENT.maxLoss,age!==null&&age<21?6:age!==null&&age<23?5:MANAGEMENT.maxGain),MANAGEMENT.minimumAbility,Math.min(c.potential,MANAGEMENT.maximumAbility));changeAttributes(c,p,target,weights,s.coaching?.exposure[p.player_id]?.year===s.year?s.coaching.exposure[p.player_id].focus:undefined);if(age!==null&&factors[0].value<0)c.potential=Math.max(c.ability,c.potential+factors[0].value*.65);
  const entry:DevelopmentChange={year:s.year,before,after:c.ability,age,minutes:Math.round(f.minutes),average:f.season===null?null:Number(f.season.toFixed(2)),injuryWeeks:f.injuryWeeks,factors:factors.map(f=>({...f,value:Number(f.value.toFixed(2))}))};c.development.push(entry);
 }
 m.developedYear=s.year;const own=Object.values(m.players).filter(p=>p.clubId===s.teamId),improved=own.filter(p=>(p.development.at(-1)?.after??0)-(p.development.at(-1)?.before??0)>=.5).length,declined=own.filter(p=>(p.development.at(-1)?.after??0)-(p.development.at(-1)?.before??0)<=-.5).length;
 addNews(s,`development-${s.year}`,'Annual player review is ready',`${improved} players made clear progress; ${declined} declined. Review ability changes and their causes before planning next season.`);return true;
}
