import type {Season} from '../sim/types.ts';
import type {Player} from '../types.ts';
import type {Competition,CompetitionState} from './types.ts';
import {projected,worldPlayers,worldAge,ledger,catalog} from './catalog.ts';
import {roll,news,clamp} from './development.ts';
import {autoSelect,makeSide} from '../sim/selection.ts';
import {SLOTS,DEFAULT_TACTICS} from '../sim/config.ts';
import {createMatch,instantResult} from '../sim/engine.ts';
import {recordExposure,recordLayoff} from './readiness.ts';
export type YouthChoice='Balanced'|'Priority minutes'|'Senior only'|'Rest';
export function youthPlan(s:Season,id:string):YouthChoice{return s.world!.youth?.plans[id]??'Balanced';}
export function setYouthPlan(s:Season,id:string,value:YouthChoice){if(!['Balanced','Priority minutes','Senior only','Rest'].includes(value))throw Error('Choose a development plan.');if(!s.world!.memberships.some(m=>m.active&&m.teamId===s.teamId&&m.playerId===id))throw Error('Choose one of your players.');const w=s.world!;w.youth??={plans:{},matches:[]};w.youth.plans[id]=value;}
export function runWorldYouth(s:Season,c:CompetitionState){
 const w=s.world!,key=`youth-${s.year}-${c.competition}-${c.round}`;
 if(c.round>(c.competition==='NPC'?10:16)||w.processed.includes(key))return;
 w.processed.push(key);w.youth??={plans:{},matches:[]};
 const fixtures=c.fixtures.filter(f=>f.round===c.round),played=new Set(fixtures.flatMap(f=>f.result?.teams.flatMap(t=>Object.values(t.players).filter(p=>p.stats.minutes>0).map(p=>p.id))??[]));
 const data=projected(s,c.competition),ages=new Map(worldPlayers(s).map(p=>[p.id,worldAge(s,p)]));
 for(const f of fixtures){if(!data.players.some(p=>[f.home,f.away].includes(p.squad_id)&&(ages.get(p.player_id)??99)<21&&!played.has(p.player_id)&&!p.unavailable&&s.condition[p.player_id].fatigue<55&&!['Senior only','Rest'].includes(youthPlan(s,p.player_id))))continue;const sides=[f.home,f.away].map(club=>{
 const squad=data.players.filter(p=>p.squad_id===club&&ages.get(p.player_id)!==null&&(ages.get(p.player_id)??99)<21&&!played.has(p.player_id)&&!p.unavailable&&s.condition[p.player_id].fatigue<55&&!['Senior only','Rest'].includes(youthPlan(s,p.player_id)));
 const choose=()=>autoSelect(squad.map(p=>({...p,overall:p.overall+(youthPlan(s,p.player_id)==='Priority minutes'?12:0)})),s.condition);
 let ids=choose();for(let n=0;n<23&&ids.some(id=>!id);n++){
 const slot=ids.findIndex(id=>!id),pos=SLOTS[slot][1].split('|')[0],template=data.players.find(p=>p.position===pos)!;
 const id=`guest-${f.id}-${club}-${n}`,rating=43+Math.floor(roll(s.seed,id)*8);
 // Match-only local guests fill genuine positional shortages; never enter the canonical universe.
 squad.push({...template,player_id:id,feed_id:id,name:`Local ${SLOTS[slot][0]} (guest)`,squad_id:club,overall:rating,unavailable:false,rich:Object.fromEntries(Object.keys(template.rich??{}).map(k=>[k,rating])),attributes:Object.fromEntries(Object.keys(template.attributes).map(k=>[k,rating]))} as Player);ids=choose();}
 const side=makeSide(club,`${catalog.teams.find(t=>t.id===club)!.name} U21`,squad,ids,s.condition,DEFAULT_TACTICS,true);side.approach='Development';side.developmentIds=ids.filter(id=>youthPlan(s,id)==='Priority minutes');return side;});
 const id=`development-${f.id}`,m=instantResult(createMatch(id,Math.floor(roll(s.seed,id)*4294967295),sides[0],sides[1],false));
 const rows=m.teams.flatMap(t=>Object.values(t.players).filter(p=>p.stats.minutes>0).map(p=>({id:p.id,name:p.name,team:t.id,stats:{...p.stats},injuryWeeks:p.injured?p.injuryWeeks:0})));
 w.youth.matches.push({id,year:s.year,round:c.round,competition:c.competition,home:f.home,away:f.away,homeScore:m.teams[0].stats.score,awayScore:m.teams[1].stats.score,rows,events:m.events.filter(e=>['try','injury','red','yellow'].includes(e.kind)).slice(0,12).map(e=>`${e.minute}′ ${e.text}`),forfeit:false});
 const stats=w.stats[`${s.year}-${c.competition}-U21`]??={};
 for(const t of m.teams)for(const p of Object.values(t.players)){if(!w.players[p.id]||!p.stats.minutes)continue;const r=stats[p.id]??={teamId:t.id,apps:0,starts:0,minutes:0,tries:0,tackles:0,metres:0,turnovers:0,ratings:0,recent:[],injuryWeeks:0};r.apps++;r.starts+=+sides.find(t=>t.id===r.teamId)!.lineup.includes(p.id);for(const k of ['minutes','tries','tackles','metres','turnovers'] as const)r[k]+=p.stats[k];r.ratings+=p.stats.rating;r.recent=[...r.recent,p.stats.rating].slice(-5);const q=s.condition[p.id];q.fatigue=p.condition.fatigue;q.fitness=p.condition.fitness;recordExposure(s,p.id,id,f.date,p.stats.minutes,'U21');if(p.injured){recordLayoff(s,p.id);q.injuryWeeks=p.injuryWeeks;q.injuryName=p.injuryName;r.injuryWeeks+=p.injuryWeeks;}}
 }
 if(c.round%4===0){const prospects=worldPlayers(s).filter(p=>w.memberships.some(m=>m.active&&m.teamId===s.teamId&&m.playerId===p.id)).filter(p=>(ledger(s,`${c.competition}-U21`,p.id)?.minutes??0)>120).sort((a,b)=>{const r=(id:string)=>{const x=ledger(s,`${c.competition}-U21`,id)!;return x.ratings/x.apps;};return r(b.id)-r(a.id);}).slice(0,3);if(prospects.length)news(s,key+'-report','Your U21 pathway report',prospects.map(p=>{const r=ledger(s,`${c.competition}-U21`,p.id)!;return `${p.name}: ${Math.round(r.minutes)} minutes, ${(r.ratings/r.apps).toFixed(2)} rating. Review his readiness for a senior opportunity.`;}).join(' '));}
}
