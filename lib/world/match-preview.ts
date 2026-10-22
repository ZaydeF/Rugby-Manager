import type {Season,Fixture} from '../sim/types.ts';
import {projected,ledger} from './catalog.ts';
import {worldAISelection} from './selection.ts';
export function worldProjected23(s:Season,f:Fixture,team:string){const conditions=Object.fromEntries(Object.entries(s.condition).map(([id,c])=>{const recent=ledger(s,s.world!.primary,id)?.recent??[];return [id,{...c,form:recent.length?Math.max(-4,Math.min(4,(recent.reduce((a,b)=>a+b,0)/recent.length-6.5)*1.4)):0}]}));return worldAISelection(s,projected(s).players.filter(p=>p.squad_id===team),conditions,s.world!.primary,f.round);}
