import {archivedRepSchema} from '../sim/archive.ts';
import {z} from 'zod';
import type {Season,SimUniverse,GameMatch} from '../sim/types.ts';
import {eligibility,provinceRegion,eligibleReason} from './eligibility.ts';
const id=z.string().min(1).max(80),text=z.string().max(800),year=z.number().int().min(2027).max(9999);
const e=z.object({status:z.enum(['eligible','ineligible','unverified']),union:text,province:text.nullable(),region:z.enum(['NORTH','SOUTH','UNKNOWN']),basis:text,source:text.nullable(),regionSource:text.nullable()});
const shape=z.object({version:z.literal(1),fallbacks:z.record(z.string()).optional(),backgrounds:z.record(e),overrides:z.record(e),portraits:z.record(z.number().int().min(1).max(12)),watch:z.record(text),years:z.array(z.object({archivedMatches:z.array(archivedRepSchema).max(3).optional(),year,stage:z.enum(['watch','series','selected','skipped']),matches:z.array(z.unknown()).max(3),active:z.unknown().nullable(),allBlacks:z.array(id).max(34),north:z.array(id).max(23),south:z.array(id).max(23),omissions:z.array(id).max(8),reason:text.nullable(),recoveryWeeks:z.number().int().min(0).max(6)})).max(8000)});
export function validRepresentative(s:Season,data:SimUniverse,validMatch:(m:GameMatch)=>boolean){
 if(!shape.safeParse(s.representative).success)return false;const r=s.representative!,ids=new Set(data.players.map(p=>p.player_id));
 if(Object.entries(r.fallbacks??{}).some(([id,club])=>!ids.has(id)||!!s.future?.generated[id]||!data.teams.some(t=>t.id===club)))return false;
 if(r.years.filter(y=>y.active).length>1||r.years.some(y=>y.active&&(y.year!==s.year||!!s.activeMatch||!s.champion||s.management?.phase==='offseason')))return false;
 if(r.years.filter(y=>y.year===s.year).length!==1||new Set(r.years.map(y=>y.year)).size!==r.years.length||r.years.some(y=>y.year>s.year))return false;
 for(const [id,e] of Object.entries({...r.backgrounds,...r.overrides})){if(!ids.has(id)||e.region!==provinceRegion(e.province)||e.status==='eligible'&&e.union!=='New Zealand')return false;}
 for(const [id,e] of Object.entries(r.backgrounds)){const g=s.future?.generated[id];if(!g||g.nationality!==e.union||g.nationality!=='New Zealand'&&e.status==='eligible')return false;}
 if(Object.keys(s.future?.generated??{}).some(id=>!r.backgrounds[id]))return false;
 if(new Set(Object.values(r.portraits)).size!==Object.keys(r.portraits).length||Object.keys(r.portraits).some(id=>!s.future?.generated[id]||s.year-Number(s.future.generated[id].birthDate.slice(0,4))<18))return false;
 const nz=(id:string)=>ids.has(id)&&eligibility(s,id).status==='eligible'&&eligibility(s,id).union==='New Zealand';
 for(const y of r.years){
  const archived=y.archivedMatches??[];if(archived.length&&(y.year>=s.year-1||y.active||y.matches.length))return false;for(let i=0;i<archived.length;i++){const m=archived[i];if(m.id!==`rep-${y.year}-${i+1}`||new Set(m.rows.map(p=>p.id)).size!==m.rows.length||m.rows.some(p=>!nz(p.id)||eligibility(s,p.id).region!==p.team||!Number.isFinite(p.stats.minutes)||p.stats.minutes>100||!Number.isFinite(p.stats.rating)||p.stats.rating>10))return false;}
  if(y.stage==='watch'&&(y.matches.length||archived.length||y.north.length||y.south.length))return false;
  if(y.stage==='selected'&&(y.matches.length+archived.length!==3||y.allBlacks.length!==34)||y.stage!=='selected'&&y.allBlacks.length||y.stage!=='series'&&y.active||y.active&&y.matches.length>=3)return false;
  for(const list of [y.allBlacks,y.north,y.south,y.omissions])if(new Set(list).size!==list.length||list.some(id=>!nz(id)))return false;
  if(y.north.some(id=>eligibility(s,id).region!=='NORTH')||y.south.some(id=>eligibility(s,id).region!=='SOUTH'))return false;
  const matches=[...y.matches,...(y.active?[y.active]:[])];
  for(let i=0;i<matches.length;i++){const m=matches[i];if(!validMatch(m)||m.id!==`rep-${y.year}-${i+1}`||m.teams[0].id!=='NORTH'||m.teams[1].id!=='SOUTH'||i<y.matches.length&&!m.finished)return false;
   for(const t of m.teams){const all=[...t.lineup,...t.bench,...t.used];if(all.length!==23||new Set(all).size!==23||Object.keys(t.players).length!==23||t.stats.score!==t.stats.tries*5+t.stats.conversions*2+t.stats.penaltyGoals*3+(t.stats.dropGoals??0)*3)return false;
    for(const id of all){const p=t.players[id];if(!nz(id)||!p||p.id!==id||eligibility(s,id).region!==t.id||p.position!==data.players.find(x=>x.player_id===id)?.position||p.stats.minutes>m.minute+.001)return false;if(m===y.active&&eligibleReason(s,id,t.id as 'NORTH'|'SOUTH'))return false;}
   }
  }
 }
 return true;
}
