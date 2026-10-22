import fs from 'node:fs';
import {CURATED,reconcileAttributes} from '../lib/management/curated.ts';
for(const path of ['data/generated/universe.json','public/data/universe.json']){
 const d=JSON.parse(fs.readFileSync(path,'utf8'));
 for(const [id,r] of Object.entries(CURATED)){const p=d.players.find((p:any)=>p.player_id===id);if(!p||p.name!==r.name)throw Error('Curated identity mismatch '+id);if(p.curated_rating_revision===2)continue;if(p.curated_base){p.overall=p.curated_base.overall;p.attributes={...p.curated_base.attributes};}const delta=r.ability-p.overall;
 p.curated_base={overall:p.overall,attributes:{...p.attributes}};p.overall=r.ability;p.overall_unrounded=r.ability;for(const a of Object.keys(p.attributes))if(p.attributes[a]!==null)p.attributes[a]=Math.min(99,p.attributes[a]+delta);reconcileAttributes(p.attributes,r.ability,d.config.weights[p.position]);p.curated_rating_revision=2;p.flags=p.flags.filter((f:string)=>!f.startsWith('Curated game-design'));p.flags.push('Curated game-design ability/potential review: '+r.reason);p.curated_review={...r};
 }
 for(const t of d.teams){const ps=d.players.filter((p:any)=>p.squad_id===t.id);t.average_rating=Math.round(ps.reduce((n:number,p:any)=>n+p.overall,0)/ps.length*10)/10;}
 fs.writeFileSync(path,JSON.stringify(d));
}
console.log('Applied documented rating corrections; source observations preserved.');
