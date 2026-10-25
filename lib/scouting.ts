import {staffQuality} from './club/staff.ts';
import {bulletin} from './market/state.ts';
import {z} from 'zod';
import type {Season} from './sim/types.ts';
import type {Attribute} from './types.ts';
import {stable,bound} from './management/config.ts';
import {EXCLUDED_IDS} from './packs/biography.ts';
const score=z.number().finite().min(25).max(99);
const snapshotSchema=z.object({name:z.string().max(200),due:z.number().int().min(0),completed:z.number().int().min(0).nullable(),current:score,potential:score,depth:z.number().int().min(1).max(3)}).strict();
const reportSchema=snapshotSchema.extend({previous:snapshotSchema.optional()});
export const scoutingSchema=z.object({version:z.literal(1),reports:z.record(reportSchema)}).strict();
export type Scouting=z.infer<typeof scoutingSchema>;
export const developer=(s:Season)=>s.foundation?.mode==='developer';
export const scoutingClock=(s:Season)=>s.year*500+s.round*7+(s.management?.phase==='offseason'?(s.market?.windowDay??0):0);
export function initScouting(s:Season){initBenchmark(s);return s.scouting??={version:1,reports:{}};}
export function validScouting(s:Season){if(!s.scouting)return true;if(!scoutingSchema.safeParse(s.scouting).success)return false;return Object.keys(s.scouting.reports).length<=Object.keys(s.management?.players??{}).length&&Object.keys(s.scouting.reports).every(id=>!!s.management?.players[id]&&!EXCLUDED_IDS.has(id));}
function ownPlayer(s:Season,id:string){if(s.world)return s.world.memberships.some(m=>m.playerId===id&&m.teamId===s.teamId&&m.active);return s.management?.players[id]?.clubId===s.teamId||s.future?.generated[id]?.level==='academy'&&s.future.generated[id].academyId===s.teamId;}
function estimated(s:Season,id:string,depth:number){const c=s.management!.players[id],g=s.future?.generated[id];const club=c.clubId??g?.academyId,head=s.coaching?.clubs[s.teamId]?.staff[2];const young=c.birthDate&&s.year-Number(c.birthDate.slice(0,4))<23;const baseError=depth===3?2:depth===2?5:9;const scoutFactor=bound(1-(staffQuality(s,'Head Scout')-10)*.02,.8,1.2),error=(young&&head?baseError*bound(1-(head.judging-10)*.025,.75,1.15):baseError)*scoutFactor;return {current:bound(c.ability+(stable(s.seed,'scout-current-'+id)-.5)*error*2,25,99),potential:bound(c.potential+(stable(s.seed,'scout-potential-'+id)-.5)*(error+4)*2,25,99)};}
export function assess(s:Season,id:string){
 const c=s.management!.players[id];if(!c)return {current:50,potential:60,confidence:'Unassessed',uncertainty:12,stale:false,depth:1};
 const own=ownPlayer(s,id),latest=s.scouting?.reports[id],report=latest?.completed===null?latest.previous:latest,completed=report?.completed!==null&&report?.completed!==undefined;
 const elapsed=completed?scoutingClock(s)-report!.completed!:0,stale=elapsed>84;
 const trial=s.future?.intakes.some(i=>i.ids.includes(id)&&!!i.trial);
 const depth=own?3:completed?report!.depth:trial?2:1;
 const value=own?estimated(s,id,3):completed?report!:estimated(s,id,trial?2:1);
 return {current:value.current,potential:Math.max(value.current,value.potential),confidence:own?'Daily club observation':completed?(stale?'Report needs refreshing':depth===3?'Extensive observation':'Scout report'):trial?'Trial observation':'Limited knowledge',uncertainty:own?2:completed?(depth===3?3:6)+(stale?4:0):trial?6:10,stale,depth};
}
export function initBenchmark(s:Season){if(s.starBenchmark?.year===s.year)return;const ps=Object.entries(s.management?.players??{}).filter(([id,c])=>c.clubId===s.teamId&&!s.future?.generated[id]);const values=(ps.length?ps:Object.entries(s.management?.players??{}).filter(([,c])=>c.clubId===s.teamId)).map(([,c])=>c.ability).sort((a,b)=>b-a).slice(0,23);s.starBenchmark={year:s.year,value:values.length?values[Math.floor(values.length/2)]:75};}
export function caStars(value:number){return bound(1+Math.floor((value-50)/5)*.5,.5,5);}
export function assessedStars(s:Season,value:number){if(s.world)return caStars(value);return bound(Math.round((3+(value-(s.starBenchmark?.value??75))/10)*2)/2,.5,5);}
export function stars(value:number){return bound(Math.round((value-45)/10*2)/2,.5,5);}
export function abilityText(s:Season,id:string){const c=s.management?.players[id];if(!c)return '—';return assessedStars(s,s.world?c.ability:assess(s,id).current).toFixed(1)+' ★';}
export function potentialText(s:Season,id:string){const c=s.management?.players[id];if(!c)return '—';const a=assess(s,id);const low=assessedStars(s,Math.max(a.current,a.potential-a.uncertainty-3)),high=assessedStars(s,a.potential+a.uncertainty+3);return low.toFixed(1)+'–'+high.toFixed(1)+' ★';}
export function attributeText(s:Season,id:string,attribute:Attribute){const c=s.management?.players[id],v=c?.attributes[attribute];if(v==null)return 'Unassessed';if(developer(s))return Math.round(v).toString();const a=assess(s,id),offset=a.current-c!.ability;return Math.round(bound(v+offset-a.uncertainty,0,99))+'–'+Math.round(bound(v+offset+a.uncertainty,0,99));}
export function developmentText(s:Season,before:number,after:number){return after-before>1?'Improving':after-before< -1?'Declining':'Steady';}
export function startScouting(s:Season,id:string,name:string){
 if(!s.management?.players[id]||s.future?.retired[id]||EXCLUDED_IDS.has(id))throw Error('This player is unavailable for scouting.');
 if(ownPlayer(s,id))throw Error('Your coaches already observe this player daily.');
 const sc=initScouting(s),previous=sc.reports[id];
 if(previous&&previous.completed===null)throw Error('Scouting is already in progress.');
 if(Object.values(sc.reports).filter(r=>r.completed===null).length>=5)throw Error('Five assignments are already active. Finish or cancel one first.');
 const depth=Math.min(3,(previous?.depth??1)+1),value=estimated(s,id,depth);
 sc.reports[id]={name,due:scoutingClock(s)+14,completed:null,depth,...value,...(previous?{previous:{name:previous.name,due:previous.due,completed:previous.completed,current:previous.current,potential:previous.potential,depth:previous.depth}}:{})};
}
export function cancelScouting(s:Season,id:string){const r=s.scouting?.reports[id];if(!r||r.completed!==null)return;if(r.previous)s.scouting!.reports[id]=r.previous;else delete s.scouting!.reports[id];}
export function advanceScouting(s:Season){
 const clock=scoutingClock(s);for(const [id,r] of Object.entries(s.scouting?.reports??{})){
  if(r.completed!==null||r.due>clock)continue;
  if(s.future?.retired[id]){delete s.scouting!.reports[id];continue;}
  Object.assign(r,estimated(s,id,r.depth));r.completed=clock;delete r.previous;
  s.news=[{id:'scout-'+clock+'-'+id,title:'Scout report: '+r.name,text:'Your updated assessment is ready in Scouting. Estimates describe observed ability, not a guaranteed ceiling.'},...s.news].slice(0,50);
  bulletin(s,'scout-'+clock+'-'+id,'Scout report: '+r.name,'Updated assessment available in Scouting.','development',id);
 }
}
