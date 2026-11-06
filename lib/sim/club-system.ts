import {z} from 'zod';
import type {Side,SimPlayer} from './types.ts';
import {richSkill} from './skill.ts';

export const shapes=['Carry first','Two distributors'] as const;
export const systemRoles=['first','second','runner','chase','cover'] as const;
export const roleNames={first:'First distributor',second:'Second distributor',runner:'Hard-line runner',chase:'Chase leader',cover:'Backfield cover'} as const;
const id=z.string().max(100);
export const systemSchema=z.object({shape:z.enum(shapes),first:id,second:id,runner:id,chase:id,cover:id}).strict();
export type ClubSystem=z.infer<typeof systemSchema>;
export type SystemRole=typeof systemRoles[number];
export const matchSystemSchema=z.object({plan:systemSchema,rehearsal:z.number().min(0).max(1),reads:z.number().int().min(0).max(300)}).strict();
export type MatchSystem=z.infer<typeof matchSystemSchema>;
export const roleSkills={first:['passing','decision_making'],second:['passing','decision_making'],runner:['carrying','power'],chase:['pace','work_rate'],cover:['aerial','defensive_positioning']} as const;
const mean=(ps:SimPlayer[],keys:readonly string[])=>ps.reduce((n,p)=>n+richSkill(p,[...keys],'attack'),0)/Math.max(1,ps.length);
export const systemSkill=(p:SimPlayer,role:SystemRole)=>mean([p],roleSkills[role]);

export function systemLaunch(side:Side,attack:SimPlayer[],defence:SimPlayer[],wide:boolean){
 const system=side.clubSystem;if(!system)return null;
 const {plan,rehearsal,reads}=system,find=(id:string)=>attack.find(p=>p.id===id);
 const first=find(plan.first),runner=find(plan.runner),second=find(plan.second);
 if(!first||!runner||first===runner)return null;
 const split=plan.shape==='Two distributors'&&!!second&&second!==first&&second!==runner;
 const threat=systemSkill(runner,'runner'),read=mean(defence,['defensive_positioning','decision_making']);
 // A defence can fold after seeing the same picture. A hard runner still holds
 // the inside shoulder; width and experienced readers make the pullback harder.
 const stretched=split?(wide?-.8:.75)+Math.max(-.8,Math.min(.8,(threat-read)*.045))-Math.min(1.25,reads*.28):0;
 const passer=split?second!:first;
 const receivers=attack.filter(p=>p!==first&&p!==second&&p!==runner&&['center','outside_back'].includes(p.playingPosition??p.position));
 const carrier=split&&receivers.length?[...receivers].sort((a,b)=>systemSkill(b,'chase')-systemSkill(a,'chase'))[0]:runner;
 const quality=split?(systemSkill(first,'first')+systemSkill(passer,'second'))/2:systemSkill(first,'first');
 return {first,passer,runner,carrier,split,stretched,
  gain:split?stretched:Math.max(-.5,Math.min(1.2,(threat-read)*.025+.45)),
  breaks:split?stretched*.013:0,
  error:Math.max(.4,Math.min(3,(split?1.45:1.04)+(69-quality)*.045-rehearsal*.52)),
  fallback:plan.shape==='Two distributors'&&!split};
}
