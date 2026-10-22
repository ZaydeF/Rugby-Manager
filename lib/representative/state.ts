import type {Season} from '../sim/types.ts';
import {generatedBackground} from './eligibility.ts';
import {stable} from '../management/config.ts';
export function initRepresentative(s:Season){
 if(!s.representative)s.representative={version:1,backgrounds:{},overrides:{},portraits:{},years:[],watch:{}};
 const r=s.representative;if(!r.fallbacks)r.fallbacks={};for(const [id,c] of Object.entries(s.management?.players??{}))if(!s.future?.generated[id]&&!r.fallbacks[id]&&c.clubId)r.fallbacks[id]=c.clubId;
 for(const g of Object.values(s.future?.generated??{}))if(!r.backgrounds[g.id])r.backgrounds[g.id]=generatedBackground(s,g.id);
 if(!r.years.some(y=>y.year===s.year))r.years.push({year:s.year,stage:s.management?.phase==='offseason'?'skipped':'watch',reason:s.management?.phase==='offseason'?'This offseason was already underway before representative rugby was added. The first series starts next season.':null,matches:[],active:null,allBlacks:[],north:[],south:[],omissions:[],recoveryWeeks:0});
 // Pilot: twelve permanent identities, assigned to adult user-club prospects independently of CA/PA.
 const used=new Set(Object.values(r.portraits));
 const candidates=Object.values(s.future?.generated??{}).filter(g=>g.academyId===s.teamId&&['academy','senior','trialist'].includes(g.level)&&s.year-Number(g.birthDate.slice(0,4))>=18&&!r.portraits[g.id]).sort((a,b)=>stable(s.seed,`${a.id}-portrait`)-stable(s.seed,`${b.id}-portrait`));
 for(const g of candidates){const slot=Array.from({length:12},(_,i)=>i+1).find(i=>!used.has(i));if(!slot)break;r.portraits[g.id]=slot;used.add(slot);}
 return r;
}
export function repYear(s:Season){return s.representative?.years.find(y=>y.year===s.year);}
export function repStats(s:Season,id:string,year=s.year){const record=s.representative?.years.find(y=>y.year===year);if(record?.archivedMatches){const rows=record.archivedMatches.flatMap(m=>m.rows).filter(p=>p.id===id&&p.stats.minutes>0);return {apps:rows.length,minutes:rows.reduce((n,p)=>n+p.stats.minutes,0),rating:rows.length?rows.reduce((n,p)=>n+p.stats.rating,0)/rows.length:null,tries:rows.reduce((n,p)=>n+p.stats.tries,0),tackles:rows.reduce((n,p)=>n+p.stats.tackles,0),injuryWeeks:rows.reduce((n,p)=>n+p.injuryWeeks,0)};}const matches=record?.matches??[];const ps=matches.flatMap(m=>m.teams.flatMap(t=>Object.values(t.players))).filter(p=>p.id===id&&p.stats.minutes>0);return {apps:ps.length,minutes:ps.reduce((n,p)=>n+p.stats.minutes,0),rating:ps.length?ps.reduce((n,p)=>n+p.stats.rating,0)/ps.length:null,tries:ps.reduce((n,p)=>n+p.stats.tries,0),tackles:ps.reduce((n,p)=>n+p.stats.tackles,0),injuryWeeks:ps.reduce((n,p)=>n+(p.injured?p.injuryWeeks:0),0)};}
