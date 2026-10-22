import {z} from 'zod';
import {PACK} from './foundation.ts';
const id=z.string().min(1).max(80),n=z.number().finite(),attrs=['attack','defence','work_rate','set_piece','kicking','discipline','engine','impact'];
const databaseSchema=z.object({
 config:z.object({version:z.literal(PACK.modelVersion),weights:z.record(z.array(n.min(0)).length(8))}).passthrough(),
 players:z.array(z.object({player_id:id,name:z.string().min(1).max(200),squad_id:id,position:z.enum(['prop','hooker','lock','loose_forward','scrum_half','fly_half','center','outside_back']),overall:n.min(25).max(99),attributes:z.object(Object.fromEntries(attrs.map(k=>[k,n.min(0).max(100).nullable()])))}).passthrough()).min(1).max(10000),
 teams:z.array(z.object({id,name:z.string().min(1).max(200),abbr:z.string().min(1).max(20)}).passthrough()).length(11),
 fixtures:z.array(z.object({id,home:id,away:id,date:z.string().refine(d=>Number.isFinite(Date.parse(d))),round:n.int().min(1).max(16),venue:z.string()} ).passthrough()).length(77)
}).passthrough();
// Read-only preflight. Success does not install a pack or claim other competition adapters work.
export function validateDatabaseImport(value:unknown):string[]{
 const parsed=databaseSchema.safeParse(value);if(!parsed.success)return parsed.error.issues.slice(0,30).map(i=>i.path.join('.')+': '+i.message);
 const d=parsed.data,issues:string[]=[],clubs=new Set(d.teams.map(t=>t.id));
 if(clubs.size!==11)issues.push('Duplicate club IDs');
 for(const [name,ids] of [['player',d.players.map(p=>p.player_id)],['fixture',d.fixtures.map(f=>f.id)]] as const)if(new Set(ids).size!==ids.length)issues.push('Duplicate '+name+' IDs');
 for(const p of d.players){if(!clubs.has(p.squad_id))issues.push('Unknown club: '+p.player_id);if(!d.config.weights[p.position]?.some(w=>w>0))issues.push('Missing positive position weights: '+p.position);if(Object.values(p.attributes).every(v=>v===null))issues.push('No attributes: '+p.player_id);}
 for(const f of d.fixtures)if(!clubs.has(f.home)||!clubs.has(f.away)||f.home===f.away)issues.push('Invalid fixture clubs: '+f.id);
 for(let round=1;round<=16;round++){const games=d.fixtures.filter(f=>f.round===round),ids=games.flatMap(f=>[f.home,f.away]);if(!games.length||new Set(ids).size!==ids.length)issues.push('Missing round or double booking: '+round);}
 return issues.slice(0,100);
}
