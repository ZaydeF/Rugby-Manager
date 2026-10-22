import {positionalPenalty} from './positions.ts';
import type {SimPlayer} from './types.ts';
import type {Attribute} from '../types.ts';
export type SkillInput=Pick<SimPlayer,'overall'|'attributes'|'condition'|'rich'> & Partial<Pick<SimPlayer,'position'|'playingPosition'>>;
// Keep arithmetic order identical to the original engine for deterministic resumes.
export function skill(p:SkillInput,a:Attribute){const fallback=a==='kicking'?45:p.overall;return (p.rich?(p.attributes[a]??fallback):(p.attributes[a]??fallback)*.60+p.overall*.40)+p.condition.form+.025*(p.condition.morale-70)-.07*p.condition.fatigue-.045*(100-p.condition.fitness)+.025*(p.condition.sharpness-80)-positionalPenalty({...p,position:p.position??p.playingPosition??''},a);}
export function skillBreakdown(p:SkillInput,a:Attribute){return {attribute:(p.attributes[a]??(a==='kicking'?45:p.overall))*.6,ability:p.overall*.4,form:p.condition.form,morale:.025*(p.condition.morale-70),fatigue:-.07*p.condition.fatigue,fitness:-.045*(100-p.condition.fitness),sharpness:.025*(p.condition.sharpness-80),total:skill(p,a)};}

export function richSkill(p:SkillInput,keys:string[],fallback:Attribute){if(!p.rich)return skill(p,fallback);return keys.reduce((n,k)=>n+(p.rich![k]??50),0)/keys.length+p.condition.form+.025*(p.condition.morale-70)-.07*p.condition.fatigue-.045*(100-p.condition.fitness)-keys.reduce((n,k)=>n+positionalPenalty({...p,position:p.position??p.playingPosition??''},k),0)/keys.length;}
