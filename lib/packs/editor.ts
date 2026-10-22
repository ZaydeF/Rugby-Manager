import {z} from 'zod';
import type {Season,SimUniverse} from '../sim/types.ts';
import {PACK,initFoundation} from './foundation.ts';
import {reconcileAttributes} from '../management/curated.ts';
import {validSave} from '../sim/validation.ts';
const ability=z.number().finite().min(40).max(97);
const snapshot=z.object({ability,potential:ability,birthDate:z.string().nullable()}).strict();
export const patchSchema=z.object({
 schemaVersion:z.literal(1),packId:z.literal(PACK.id),packVersion:z.literal(PACK.version),
 reason:z.string().trim().min(3).max(400),
 players:z.array(z.object({id:z.string().min(1).max(80),before:snapshot,
 ability:ability,potential:ability,birthDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
 birthSource:z.string().url().startsWith('https://').max(500).nullable()}).strict()).min(1).max(500)
}).strict();
export type DatabasePatch=z.infer<typeof patchSchema>;
export function validatePatch(value:unknown,s:Season){
 const result=patchSchema.safeParse(value);if(!result.success)throw Error('Invalid patch: '+result.error.issues.slice(0,3).map(i=>i.path.join('.')+' '+i.message).join('; '));
 const patch=result.data,ids=new Set<string>();
 for(const p of patch.players){
  const c=s.management?.players[p.id];if(!c||s.future?.generated[p.id])throw Error('Editor requires a known real-player ID: '+p.id);
  if(ids.has(p.id))throw Error('Duplicate player '+p.id);ids.add(p.id);
  if(p.potential<p.ability)throw Error('Potential must be at least current ability.');
  if(c.ability!==p.before.ability||c.potential!==p.before.potential||c.birthDate!==p.before.birthDate)throw Error('Player '+p.id+' changed since this patch was prepared. Create a fresh preview.');
  if(p.birthDate&&(p.birthDate<'1900-01-01'||p.birthDate>`${s.year}-01-01`||!Number.isFinite(Date.parse(p.birthDate))||new Date(p.birthDate).toISOString().slice(0,10)!==p.birthDate))throw Error('Invalid birth date for '+p.id);
  if(p.birthDate!==c.birthDate&&p.birthDate&&!p.birthSource)throw Error('New birth dates require an HTTPS evidence source.');
 }
 return patch;
}
export function applyDatabasePatch(s:Season,data:SimUniverse,value:unknown){
 if(s.foundation?.mode!=='developer')throw Error('Enable developer mode first.');
 if(s.activeMatch||s.representative?.years?.some(y=>y.active))throw Error('Finish active matches before editing.');
 const patch=validatePatch(value,s),next=structuredClone(s);
 for(const p of patch.players){
  const c=next.management!.players[p.id],position=data.players.find(q=>q.player_id===p.id)!.position;
  c.ability=p.ability;c.potential=p.potential;c.birthDate=p.birthDate;c.birthSource=p.birthSource;
  reconcileAttributes(c.attributes,p.ability,(data.config as {weights?:Record<string,number[]>}).weights?.[position]);
 }
 const foundation=initFoundation(next);foundation.edited=true;foundation.revision++;foundation.lastEdit={year:s.year,reason:patch.reason,ids:patch.players.map(p=>p.id)};
 if(!validSave(next,data))throw Error('Patch would create an incompatible save. Nothing was applied.');
 Object.assign(s,next);
}
