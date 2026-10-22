import {EXCLUDED_IDS} from './biography.ts';
import {z} from 'zod';
import manifest from '../../data/packs/super-rugby/manifest.json' with {type:'json'};
import type {Season,SimUniverse} from '../sim/types.ts';
export const PACK=manifest;
const dependency=z.object({id:z.literal(PACK.id),version:z.string().refine(v=>['1.0.0','1.1.0','1.2.0'].includes(v)),adapter:z.literal(PACK.adapter),engineVersion:z.string().refine(v=>['0.2.0','0.3.0','0.3.1'].includes(v))}).strict();
export const foundationSchema=z.object({version:z.literal(1),pack:dependency,mode:z.enum(['standard','developer']),edited:z.boolean(),revision:z.number().int().min(0),lastEdit:z.object({year:z.number().int(),reason:z.string().min(1).max(400),ids:z.array(z.string().max(80)).max(500)}).strict().optional()}).strict();
export type Foundation=z.infer<typeof foundationSchema>;
export function initFoundation(s:Season){s.foundation??={version:1,pack:{id:PACK.id,version:PACK.version,adapter:PACK.adapter,engineVersion:PACK.engineVersion},mode:'standard',edited:false,revision:0};s.foundation.pack.version=PACK.version;s.foundation.pack.engineVersion=PACK.engineVersion;return s.foundation;}
export function compatibleFoundation(value:unknown){return value===undefined||foundationSchema.safeParse(value).success;}
export function assertPack(data:SimUniverse){const c=PACK.competition;if(data.config.version!==PACK.modelVersion||data.teams.length!==c.clubs||data.fixtures.length!==c.regularFixtures)throw Error('Unsupported data pack: this release requires the Super Rugby 11-club adapter.');}
export function auditDatabase(data:SimUniverse,s?:Season){
 data={...data,players:data.players.filter(p=>!EXCLUDED_IDS.has(p.player_id))};
 const errors:string[]=[],ids=new Set<string>(),clubs=new Set(data.teams.map(t=>t.id));
 try{assertPack(data);}catch(e){errors.push(String(e));}
 if(clubs.size!==data.teams.length)errors.push('Duplicate club IDs.');
 for(const p of data.players){if(ids.has(p.player_id))errors.push('Duplicate player '+p.player_id);ids.add(p.player_id);if(!clubs.has(p.squad_id))errors.push('Unknown club for '+p.player_id);if(!Number.isFinite(p.overall)||p.overall<25||p.overall>99)errors.push('Invalid ability for '+p.player_id);}
 const fixtures=new Set<string>();for(const f of data.fixtures){if(fixtures.has(f.id))errors.push('Duplicate fixture '+f.id);fixtures.add(f.id);if(!clubs.has(f.home)||!clubs.has(f.away)||f.home===f.away)errors.push('Invalid fixture '+f.id);}
 const missingBirthDates=data.players.filter(p=>!s?.management?.players[p.player_id]?.birthDate).map(p=>({id:p.player_id,name:p.name,club:p.squad_id}));
 return {pack:PACK.id,errors,realPlayers:data.players.length,clubs:clubs.size,knownBirthDates:data.players.length-missingBirthDates.length,missingBirthDates,warnings:[...(missingBirthDates.length?['Missing birth dates limit retirement modelling.']:[]),'Some dates use single secondary sources; five conflicts were accepted by the database owner.','Legacy statistical rating inputs remain; curated ratings are preserved.']};
}
