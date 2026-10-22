import {z} from 'zod';
import {blankPlayerStats} from './selection.ts';
import type {Season,GameMatch} from './types.ts';
import type {DevelopmentChange} from '../management/types.ts';
const n=z.number().finite().nonnegative(),id=z.string().min(1).max(80);
export const archivedRepSchema=z.object({id,homeScore:n.int(),awayScore:n.int(),rows:z.array(z.object({id,team:z.enum(['NORTH','SOUTH']),stats:z.object(Object.fromEntries(Object.keys(blankPlayerStats()).map(key=>[key,n]))).extend({dropGoals:n.optional()}),injuryWeeks:n.int().max(30)})).max(46),highlights:z.array(z.string().max(800)).max(20)});
export type ArchivedRep=z.infer<typeof archivedRepSchema>;
export type CareerArchive={version:1;factorLabels:string[]};
export function developmentReasons(s:Season,d:DevelopmentChange){return d.archivedFactors?d.archivedFactors.map(([code,value])=>({label:s.archive?.factorLabels[code]??'Historical development',value})):d.factors;}
export function validArchive(s:Season){if(!s.archive)return !Object.values(s.management?.players??{}).some(p=>p.development.some(d=>d.archivedFactors));if(!z.object({version:z.literal(1),factorLabels:z.array(z.string().max(800)).max(100)}).safeParse(s.archive).success)return false;return Object.values(s.management?.players??{}).every(p=>p.development.every(d=>!d.archivedFactors||(d.factors.length===0&&d.archivedFactors.every(([i])=>i>=0&&i<s.archive!.factorLabels.length))));}
export function archiveRepresentative(m:GameMatch):ArchivedRep{return {id:m.id,homeScore:m.teams[0].stats.score,awayScore:m.teams[1].stats.score,rows:m.teams.flatMap(t=>Object.values(t.players).filter(p=>p.stats.minutes>0).map(p=>({id:p.id,team:t.id as 'NORTH'|'SOUTH',stats:{...p.stats},injuryWeeks:p.injured?p.injuryWeeks:0}))),highlights:m.events.filter(e=>['try','red','drop_goal','injury'].includes(e.kind)).slice(0,20).map(e=>`${e.minute}′ ${e.text}`)};}
// Keep current and previous seasons in full. Older reports retain scores and every player stat.
export function compactCareer(s:Season){s.archive??={version:1,factorLabels:[]};const labels=s.archive.factorLabels;for(const p of Object.values(s.management?.players??{}))for(const d of p.development)if(d.year<s.year-1&&!d.archivedFactors){d.archivedFactors=d.factors.map(f=>{let index=labels.indexOf(f.label);if(index<0){index=labels.length;labels.push(f.label);}return [index,f.value];});d.factors=[];}
 for(const y of s.representative?.years??[])if(y.year<s.year-1&&!y.active&&y.matches.length&&!y.archivedMatches){y.archivedMatches=y.matches.map(archiveRepresentative);y.matches=[];}
}
