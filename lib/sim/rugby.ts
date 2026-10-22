import {richSkill} from './skill.ts';
import {z} from 'zod';
import type {Side,SimPlayer,Season} from './types.ts';
import {skill} from './skill.ts';

export const MENUS={
 attack:['Balanced phase play','Forward power','Wide shape','Out the back','Kick pressure','Counterattack'],
 ruck:['Light','Balanced','Heavy'],carriers:['Balanced','Tight five','Loose forwards','Centres','Back three'],zone:['Balanced','Middle','Blindside','Edges'],
 lineoutSize:['Full','Shortened'],lineoutTarget:['Front','Middle','Back'],throw:['Short','Medium','Long'],lineoutUse:['Launch','Maul'],lineoutBall:['Secure','Quick'],
 lineoutDefence:['Selective contest','Aggressive contest','Defend maul','Pressure halfback'],
 scrum:['Stable platform','Attack for penalty','Quick release','Eight-man pressure','Defensive survival'],scrumLaunch:['Phase play','Number eight','Halfback'],
 kicking:['Balanced','Contestable','Territorial'],box:['Rare','Balanced','Frequent'],exit:['Balanced','Long exits'],attackingKick:['Rare','Balanced','Frequent'],receipt:['Balanced','Counterattack','Return kick'],
 penalty:['Game state','Posts','Corner','Scrum','Tap'],dropGoal:['Never','Late close game','When in range'],
 defence:['Drift','Aggressive line speed','Blitz','Protect edges'],contest:['Selective','Compete','Fan out'],backfield:['Balanced','Deep cover','Chase pressure'],goalLine:['Balanced','Pack tight','Spread'],
} as const;
export const STRIKES={
 midfield:{name:'First-phase midfield strike',complexity:.35,unit:'centres',zone:'Middle'},
 blindside:{name:'Blindside launch',complexity:.25,unit:'halves',zone:'Blindside'},
 tip:{name:'Forward tip-on shape',complexity:.40,unit:'packHandling',zone:'Middle'},
 screen:{name:'Screen play',complexity:.85,unit:'handling',zone:'Edges'},
 cross:{name:'Cross-kick',complexity:.75,unit:'aerial',zone:'Edges'},
 exit:{name:'Set-piece exit',complexity:.15,unit:'kicking',zone:'Middle'},
 power:{name:'Goal-line power sequence',complexity:.20,unit:'carrying',zone:'Middle'},
} as const;
export type Strike=keyof typeof STRIKES;
const strike=z.enum(['midfield','blindside','tip','screen','cross','exit','power']);
const fields=Object.fromEntries(Object.entries(MENUS).map(([k,v])=>[k,z.enum(v as unknown as [string,...string[]])])) as {[K in keyof typeof MENUS]:z.ZodEnum<[typeof MENUS[K][number],...typeof MENUS[K][number][]]>};
export const rugbySchema=z.object(fields).extend({tempo:z.number().int().min(0).max(2).optional(),risk:z.number().int().min(0).max(2).optional(),jobs:z.record(z.string().regex(/^(?:[0-9]|1[0-4])$/),z.enum(['Default','Carrier','Link','Support','Contest','Exit','Return'])).optional(),plays:z.array(strike).max(3).refine(v=>new Set(v).size===v.length,'Choose distinct plays')}).strict();
export type RugbyPlan=z.infer<typeof rugbySchema>;
export const familiaritySchema=z.record(strike,z.number().finite().min(0).max(100));
export const preparationSchema=z.object({familiarity:familiaritySchema,appliedKey:z.string().max(40).optional()}).strict();
export const DEFAULT_RUGBY:RugbyPlan={attack:'Balanced phase play',ruck:'Balanced',carriers:'Balanced',zone:'Balanced',lineoutSize:'Full',lineoutTarget:'Middle',throw:'Medium',lineoutUse:'Launch',lineoutBall:'Secure',lineoutDefence:'Selective contest',scrum:'Stable platform',scrumLaunch:'Phase play',kicking:'Balanced',box:'Balanced',exit:'Balanced',attackingKick:'Balanced',receipt:'Balanced',penalty:'Game state',dropGoal:'Late close game',defence:'Drift',contest:'Selective',backfield:'Balanced',goalLine:'Balanced',plays:['midfield','exit','power']};
export const cap=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
export function plan(value?:RugbyPlan):RugbyPlan{return value??DEFAULT_RUGBY;}
export function initRugby(s:Season){if(!s.tacticalVersion){if(s.rugbyPlan)s.news=[{id:"phase25-upgrade",title:"Your tactical workspace has been updated",text:"Rugby instructions now drive one coherent plan. Existing tempo and risk are retained; old width and pressure sliders follow the rugby choices. Existing matches finish on their original rules. Stars compare assessments with your senior squad; abilities are unchanged."},...s.news].slice(0,50);s.tacticalVersion=25;}s.rugbyPlan??=structuredClone(DEFAULT_RUGBY);s.rugbyPreparation??={familiarity:{}};s.rugbyPlan.jobs??={};s.rugbyPlan.tempo??=s.tactics.tempo;s.rugbyPlan.risk??=s.tactics.risk;}
export function prepareRugby(s:Season){initRugby(s);const key=s.year+'-'+s.round,p=s.rugbyPreparation!;if(p.appliedKey===key||s.management?.phase==='offseason')return;const load=s.managerPlans?.training?.load??'Balanced';for(const id of Object.keys(STRIKES) as Strike[]){const current=p.familiarity[id]??25;p.familiarity[id]=cap(current+(s.rugbyPlan!.plays.includes(id)?load==='Intensive'?14:load==='Recovery'?5:10:-3),0,100);}p.appliedKey=key;}
export function personnel(players:SimPlayer[]){
 const mean=(ps:SimPlayer[],a:Parameters<typeof skill>[1])=>ps.length?ps.reduce((n,p)=>n+skill(p,a),0)/ps.length:30;
 const at=(positions:string[])=>players.filter(p=>positions.includes(p.position));
 const pack=at(['prop','hooker','lock','loose_forward']),front=at(['prop','hooker']),locks=at(['lock']),loose=at(['loose_forward']),backs=at(['scrum_half','fly_half','center','outside_back']),halves=at(['scrum_half','fly_half']),wings=at(['outside_back']);
 const richMean=(ps:SimPlayer[],keys:string[],fallback:Parameters<typeof skill>[1])=>ps.length?ps.reduce((n,p)=>n+richSkill(p,keys,fallback),0)/ps.length:30;
 if(players.some(p=>p.rich))return {scrum:richMean(front,['scrum','strength'],'set_piece')*.8+richMean(locks,['scrum','power'],'set_piece')*.2,lineout:richMean(locks,['lineout','aerial'],'set_piece')*.65+richMean(at(['hooker']),['throwing','composure'],'set_piece')*.35,carrying:richMean(pack,['carrying','power'],'impact'),packHandling:richMean(pack,['passing','handling'],'attack'),centres:richMean(at(['center']),['carrying','power'],'impact'),handling:richMean(backs,['passing','handling','offloading'],'attack'),halves:richMean(halves,['passing','decision_making'],'attack'),kicking:richMean(halves,['tactical_kicking','kicking_distance'],'kicking'),aerial:richMean(wings,['aerial','acceleration'],'set_piece'),mobility:richMean(front.concat(locks),['pace','stamina','work_rate'],'engine'),jackal:richMean(loose,['breakdown','strength','work_rate'],'work_rate'),cover:richMean(wings,['defensive_positioning','pace'],'defence'),defence:richMean(players,['tackling','defensive_positioning'],'defence'),discipline:mean(players,'discipline')};
 return {scrum:mean(front,'set_piece')*.7+mean(locks,'set_piece')*.2+mean(loose,'impact')*.1,lineout:mean(locks,'set_piece')*.60+mean(at(['hooker']),'set_piece')*.25+mean(loose,'set_piece')*.15,
 carrying:mean(pack,'impact')*.6+mean(pack,'attack')*.4,packHandling:mean(pack,'attack')*.6+mean(pack,'work_rate')*.4,centres:mean(at(['center']),'impact')*.6+mean(at(['center']),'attack')*.4,
 handling:mean(backs,'attack')*.75+mean(halves,'work_rate')*.25,halves:mean(halves,'attack'),kicking:mean(halves,'kicking'),aerial:mean(wings,'set_piece')*.45+mean(wings,'impact')*.3+mean(wings,'attack')*.25,
 mobility:mean(at(['prop','hooker','lock']),'engine')*.7+mean(pack,'work_rate')*.3,jackal:mean(loose,'work_rate')*.6+mean(loose,'defence')*.4,cover:mean(wings,'defence')*.6+mean(wings,'engine')*.4,defence:mean(players,'defence'),discipline:mean(players,'discipline')};
}
export function aiRugby(players:SimPlayer[]):RugbyPlan{const u=personnel(players),p=structuredClone(DEFAULT_RUGBY);
 if(u.carrying>u.handling+3){p.attack='Forward power';p.carriers='Loose forwards';p.lineoutUse='Maul';p.plays=['tip','power','exit'];}
 else if(u.kicking>u.handling+2&&u.aerial>65){p.attack='Kick pressure';p.kicking='Contestable';p.box='Frequent';p.plays=['cross','exit','power'];}
 else if(u.handling>u.carrying+3){p.attack='Wide shape';p.zone='Edges';p.plays=['screen','midfield','exit'];}
 if(u.scrum>78)p.scrum='Attack for penalty';if(u.lineout>78){p.lineoutTarget='Back';p.throw='Long';p.lineoutBall='Quick';}if(u.jackal>78)p.contest='Compete';if(u.defence>78)p.defence='Aggressive line speed';return p;
}
export type Units=ReturnType<typeof personnel>;
export function tacticalEffects(p:RugbyPlan,d:RugbyPlan,u:Units,v:Units,field:number,tempo:number){
 let gain=0,breaks=0,error=1,turnover=1,fatigue=1;
 if(p.attack==='Forward power'){gain+=(u.carrying-v.defence)*.025+.15;breaks-=.008;error*=.86;fatigue+=.07;}
 if(p.attack==='Wide shape'){breaks+=(u.handling-v.cover)*.0008+.006;error*=1.14;}
 if(p.attack==='Out the back'){breaks+=(u.handling-v.defence)*.001+.009;error*=1.23;gain-=.15;}
 if(p.attack==='Kick pressure')gain-=.10;
 if(p.zone==='Edges'){breaks+=d.defence==='Protect edges'?-.008:.005;error*=1.06;}
 if(p.zone==='Middle')gain+=d.defence==='Protect edges'?.28:-.03;
 if(p.zone==='Blindside'){gain+=.1;breaks+=d.defence==='Drift'?.003:-.002;}
 if(p.ruck==='Heavy'){turnover*=.72;fatigue+=.14;breaks-=.006;}
 if(p.ruck==='Light'){turnover*=1.32;breaks+=.006;}
 if(d.contest==='Compete'){turnover*=1.25+(v.jackal-70)*.006;}
 if(d.contest==='Fan out'){turnover*=.73;breaks-=.004;}
 if(d.defence==='Blitz'){gain-=.4;breaks+=.010+(u.handling-v.defence)*.0005;error*=1.13;}
 if(d.defence==='Aggressive line speed'){gain-=.22;error*=1.06;breaks+=.004;}
 if(d.defence==='Drift'&&p.zone==='Edges'){gain-=.12;breaks-=.002;}
 if(d.defence==='Protect edges'&&p.attack==='Wide shape')breaks-=.009;
 if(field>88){if(d.goalLine==='Pack tight'){gain+=p.zone==='Edges'?.4:-.38;}if(d.goalLine==='Spread'){gain+=p.attack==='Forward power'?.28:-.12;}}
 if(tempo===2){fatigue+=cap((75-u.mobility)*.008,-.1,.2);error*=cap(1+(70-u.mobility)*.005,.90,1.2);}
 return {gain,breaks,error,turnover:cap(turnover,.45,1.9),fatigue};
}
export function lineoutOdds(p:RugbyPlan,d:RugbyPlan,u:Units,v:Units){const ambition=(p.throw==='Long'?.08:p.throw==='Short'?-.025:0)+(p.lineoutTarget==='Back'?.045:p.lineoutTarget==='Front'?-.015:0);return cap(.87+(u.lineout-v.lineout)*.004-ambition+(p.lineoutSize==='Shortened'?-.02:0)+(p.lineoutBall==='Quick'?-.035:.025)+(d.lineoutDefence==='Aggressive contest'?-.065:d.lineoutDefence==='Defend maul'?.05:0),.50,.98);}
export function scrumOdds(p:RugbyPlan,u:Units,v:Units){return cap(.88+(u.scrum-v.scrum)*.004+(p.scrum==='Defensive survival'?.065:p.scrum==='Stable platform'?.04:p.scrum==='Quick release'?.025:p.scrum==='Eight-man pressure'?-.015:p.scrum==='Attack for penalty'?-.035:0),.52,.98);}
export function strikeOdds(id:Strike,familiarity:number,u:Units){const play=STRIKES[id];return cap(.94-play.complexity*.24+(familiarity-50)*.002+(u[play.unit]-72)*.003,.42,.98);}
export function penaltyChoice(p:RugbyPlan,field:number,minute:number,margin:number):RugbyPlan['penalty']{if(p.penalty!=='Game state')return p.penalty==='Posts'&&field<48?'Corner':p.penalty;if(minute>68&&margin< -3)return field>80?'Tap':'Corner';if(field>=60&&(minute>66&&margin>=-3&&margin<=3||margin>=0))return 'Posts';return field>89?'Scrum':'Corner';}
export function changeRugby(side:Side,next:RugbyPlan){side.rugby=rugbySchema.parse(next);if(side.nextStrike&&!side.rugby.plays.includes(side.nextStrike))delete side.nextStrike;}
