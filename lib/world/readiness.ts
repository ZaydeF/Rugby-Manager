import {z} from 'zod';
import type {Season} from '../sim/types.ts';

export type MatchLevel = 'NPC' | 'SR' | 'Test' | 'Tour' | 'XV' | 'U21';
export type FitnessPlan = 'Balanced' | 'Conditioning' | 'Managed minutes' | 'Recovery';
export type ReadinessRecord = {
  updated: string;
  injuryDays: number;
  returnDays: number;
  returnMinutes: number;
  returning: boolean;
  plan: FitnessPlan;
  matches: {id:string; date:string; minutes:number; level:MatchLevel}[];
};
const n=z.number().finite().nonnegative();
export const readinessSchema=z.record(z.object({
  updated:z.string().regex(/^\d{4}-\d{2}-\d{2}$/), injuryDays:n.max(10000),
  returnDays:n.max(10000), returnMinutes:n.max(100000), returning:z.boolean(),
  plan:z.enum(['Balanced','Conditioning','Managed minutes','Recovery']),
  matches:z.array(z.object({id:z.string().min(1).max(200),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),minutes:n.max(120),level:z.enum(['NPC','SR','Test','Tour','XV','U21'])})).max(24),
}));
const clamp=(n:number,min=0,max=100)=>Math.max(min,Math.min(max,n));
const DAY=86400000;
export const READINESS_RULES={
  benchmark:{NPC:64,SR:74,Test:84},
  exposure:{NPC:.85,SR:1,Test:1.1,Tour:1,XV:1,U21:.55},
  conditionWeight:.15,sharpnessWeight:.11,rehabPerDay:.28,maxRehabPenalty:24,
} as const;

export function readinessDate(s:Season):string {
  if(s.world?.date)return s.world.date;
  const w=s.world!;
  if(w.phase==='offseason')return `${s.year}-11-01`;
  if(w.phase==='international')return `${s.year}-06-20`;
  const c=w.phase===w.primary?{fixtures:s.fixtures,round:s.round}:w.background;
  if(w.phase==='preseason'){
    const fs=w.primary==='SR'?s.fixtures:w.background.fixtures;
    return new Date(Math.min(...fs.map(f=>Date.parse(f.date)))-7*DAY).toISOString().slice(0,10);
  }
  return c.fixtures.find(f=>f.round===c.round)?.date.slice(0,10)??`${s.year}-01-30`;
}
function blank(date:string):ReadinessRecord {return {updated:date,injuryDays:0,returnDays:0,returnMinutes:0,returning:false,plan:'Balanced',matches:[]};}
// Migration preserves existing fitness/sharpness. No past appearances or injury
// duration are invented: records start when the feature begins tracking a save.
export function ensureReadiness(s:Season){
  const records=s.world!.readiness??={};
  const date=readinessDate(s);
  for(const id of Object.keys(s.condition))records[id]??=blank(date);
  return records;
}
export function setFitnessPlan(s:Season,id:string,plan:FitnessPlan){
  if(!['Balanced','Conditioning','Managed minutes','Recovery'].includes(plan))throw Error('Choose a fitness plan.');
  if(!s.world!.memberships.some(m=>m.active&&m.playerId===id&&m.teamId===s.teamId))throw Error('Choose one of your players.');
  if(s.activeMatch)throw Error('Change fitness plans after the match.');
  ensureReadiness(s)[id].plan=plan;
  if(plan==='Recovery')s.selection=s.selection.map(x=>x===id?'':x);
}
export function recordExposure(s:Season,id:string,key:string,date:string,minutes:number,level:MatchLevel){
  if(!s.condition[id]||minutes<=0)return;
  const r=ensureReadiness(s)[id],q=s.condition[id];
  if(r.matches.some(m=>m.id===key))return;
  const mins=clamp(minutes,0,120),dose=Math.min(1,mins/80)*READINESS_RULES.exposure[level];
  q.sharpness=clamp(q.sharpness+((100-q.sharpness)*.28+2)*dose);
  if(r.returning)r.returnMinutes+=mins;
  r.matches=[...r.matches,{id:key,date:date.slice(0,10),minutes:mins,level}].slice(-24);
}
export function recordLayoff(s:Season,id:string){
  const r=ensureReadiness(s)[id];
  r.injuryDays=0;r.returnDays=0;r.returnMinutes=0;r.returning=true;
}
// All daily paths use the same date-guarded update. Never grant recovery twice
// when reloading or skipping to an event. Injury clearance still uses injuryWeeks.
function recoveryStep(q:Season['condition'][string],r:ReadinessRecord,weekBoundary:boolean){
    const injured=q.injuryWeeks>0,rest=r.plan==='Recovery',conditioning=r.plan==='Conditioning';
    q.fatigue=clamp(q.fatigue-(rest?5:24/7)+(conditioning&&!injured?1.2:0));
    if(injured){
      if(!r.returning){r.returning=true;r.injuryDays=0;r.returnDays=0;r.returnMinutes=0;}
      r.injuryDays++;r.returnDays=0;
      q.fitness=clamp(q.fitness-.32,40,100);
      q.sharpness=clamp(q.sharpness-1,20,100);
    }else{
      if(r.returning)r.returnDays++;
      q.fitness=clamp(q.fitness+(conditioning?1.7:r.returning?.9:12/7));
      // Training maintains a base but cannot manufacture full match sharpness.
      const floor=rest?55:70,decay=rest?.65:.35;
      q.sharpness=q.sharpness>floor?Math.max(floor,q.sharpness-decay):Math.min(floor,q.sharpness+(rest?.08:.2));
      if(r.returning&&(r.returnDays>=35||r.returnMinutes>=240)){r.returning=false;}
    }
    if(weekBoundary){q.injuryWeeks=Math.max(0,q.injuryWeeks-1);if(!q.injuryWeeks)q.injuryName=null;}
}
export function readinessDay(s:Season,date:string,weekBoundary:boolean){
  const records=ensureReadiness(s);
  for(const [id,q] of Object.entries(s.condition)){
    const r=records[id];if(r.updated>=date)continue;
    recoveryStep(q,r,weekBoundary);r.updated=date;
  }
}
// Round-driven tools and the existing ten-week offseason recovery use exactly
// the same rules as calendar-driven play, including long injuries spanning years.
export function readinessWeeks(s:Season,weeks:number){
  const records=ensureReadiness(s);
  for(let d=1;d<=weeks*7;d++)for(const [id,q] of Object.entries(s.condition))recoveryStep(q,records[id],d%7===0);
  for(const r of Object.values(records))r.updated=readinessDate(s);
}
export function playerReadiness(s:Season,id:string,level:'NPC'|'SR'|'Test'=s.world?.primary??'SR'){
  const q=s.condition[id],r=s.world?.readiness?.[id],ability=s.management?.players[id]?.ability??50;
  const condition=clamp(q.fitness-q.fatigue*.45);
  const rehabPenalty=r?.returning?Math.min(24,r.injuryDays*.28)*Math.max(0,1-r.returnDays/35-r.returnMinutes/240):0;
  const effectiveAbility=ability-(100-condition)*.15-(100-q.sharpness)*.11-rehabPenalty;
  const score=clamp(70+(effectiveAbility-READINESS_RULES.benchmark[level])*2);
  const severe=condition<55||q.fitness<65;
  const managed=q.sharpness<45||rehabPenalty>=10;
  const status=q.injuryWeeks?'Injured':severe?'Rebuild fitness':managed?'Managed return':score>=70?'Ready':score>=55?'Limited role':'Below level';
  const recent=r?.matches.filter(m=>{const days=(Date.parse(readinessDate(s))-Date.parse(m.date))/DAY;return days>=0&&days<=28;})??[];
  const weightedMinutes=recent.reduce((n,m)=>n+m.minutes*READINESS_RULES.exposure[m.level],0);
  const load=recent.reduce((n,m)=>{const days=(Date.parse(readinessDate(s))-Date.parse(m.date))/DAY;return n+(days<=7?m.minutes:0);},0);
  const ready=status==='Ready';
  // Playing ability affects the assessment, not a medical minute limit. A fit
  // developing player must not be forcibly substituted just for being weaker.
  const maxMinutes=q.injuryWeeks||severe?0:managed?25:condition<80?55:80;
  const planLimit=r?.plan==='Recovery'?0:r?.plan==='Managed minutes'?40:80;
  const reasons=[
    q.injuryWeeks?`${q.injuryName??'Injury'} · ${q.injuryWeeks} weeks remaining`:null,
    severe?'Physical capacity needs rebuilding before selection':null,
    rehabPenalty>0?`${r!.injuryDays} tracked days injured; return load still restricted`:null,
    q.sharpness<70?'Low match exposure; training alone will not restore full sharpness':null,
    load>110?'High seven-day match load':null,
    effectiveAbility<READINESS_RULES.benchmark[level]?'Current playing level is below this competition’s benchmark':null,
    ready?'Physical condition and playing level meet the competition demand':null,
  ].filter((x):x is string=>!!x);
  return {fitness:Math.round(q.fitness),condition:Math.round(condition),sharpness:Math.round(q.sharpness),fatigue:Math.round(q.fatigue),ability,effectiveAbility,rehabPenalty,score:Math.round(score),status,ready,maxMinutes:Math.min(maxMinutes,planLimit),reasons,weightedMinutes:Math.round(weightedMinutes),load:Math.round(load),plan:r?.plan??'Balanced',tracked:!!r,lastMatch:r?.matches.at(-1)?.date??null};
}
export function applyReadiness(s:Season,side:import('../sim/types.ts').Side,level:'NPC'|'SR'){
  side.minuteLimits??={};
  for(const p of Object.values(side.players)){
    const r=playerReadiness(s,p.id,level);
    // Sharpness and rehab affect execution, not permanent ability or potential.
    const penalty=(100-r.sharpness)*.11+r.rehabPenalty;
    p.overall=Math.max(1,p.overall-penalty);
    for(const k of Object.keys(p.attributes) as (keyof typeof p.attributes)[])if(p.attributes[k]!=null)p.attributes[k]=Math.max(1,p.attributes[k]!-penalty);
    if(p.rich)for(const k of Object.keys(p.rich))p.rich[k]=Math.max(1,p.rich[k]-penalty);
    if(r.maxMinutes<80)side.minuteLimits[p.id]=Math.min(side.minuteLimits[p.id]??80,r.maxMinutes);
  }
}
