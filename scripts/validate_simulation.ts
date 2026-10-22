import fs from 'node:fs';
import {createMatch,instantResult} from '../lib/sim/engine.ts';
import {autoSelect,makeSide} from '../lib/sim/selection.ts';
import {DEFAULT_TACTICS} from '../lib/sim/config.ts';
import type {SimUniverse,Tactics} from '../lib/sim/types.ts';
const data=JSON.parse(fs.readFileSync('data/generated/universe.json','utf8')) as SimUniverse;
const count=Number(process.argv[2]||4000);
const totals:Record<string,number>={points:0,tries:0,penaltyGoals:0,penalties:0,tackles:0,missedTackles:0,metres:0,linebreaks:0,turnovers:0,yellow:0,red:0,lineouts:0,scrums:0,margin:0,homeWins:0,draws:0};
const scores:number[]=[];
function side(i:number,tactics:Tactics={...DEFAULT_TACTICS}){const t=data.teams[i],s=data.players.filter(p=>p.squad_id===t.id);return makeSide(t.id,t.name,s,autoSelect(s),{},tactics,true)}
for(let i=0;i<count;i++){
 const h=i%11,a=(h+1+Math.floor(i/11)%10)%11;const m=instantResult(createMatch('test',7919*(i+1),side(h),side(a)));
 for(const key of ['tries','penaltyGoals','penalties','tackles','missedTackles','metres','linebreaks','turnovers','yellow','red','lineouts','scrums'])totals[key]+=(m.teams[0].stats[key as keyof typeof m.teams[0]['stats']]??0)+(m.teams[1].stats[key as keyof typeof m.teams[0]['stats']]??0);
 const x=m.teams[0].stats.score,y=m.teams[1].stats.score;totals.points+=x+y;totals.margin+=Math.abs(x-y);totals.homeWins+=x>y?1:0;totals.draws+=x===y?1:0;scores.push(x+y);
 for(const t of m.teams){if(t.stats.score!==5*t.stats.tries+2*t.stats.conversions+3*t.stats.penaltyGoals+3*(t.stats.dropGoals??0))throw Error('Score inconsistency');for(const key of ['tries','penaltyGoals','tackles','metres','linebreaks','turnovers','penalties'])if(Math.abs(Object.values(t.players).reduce((s,p)=>s+(p.stats[key as keyof typeof p.stats]??0),0)-(t.stats[key as keyof typeof t.stats]??0))>.01)throw Error('Player/team total mismatch: '+key);}
}
const result={matches:count,means:Object.fromEntries(Object.entries(totals).map(([k,v])=>[k,Number((v/count).toFixed(3))])),minTotal:Math.min(...scores),maxTotal:Math.max(...scores)};
console.log(JSON.stringify(result,null,2));
fs.mkdirSync('data/generated',{recursive:true});fs.writeFileSync('data/generated/simulation-validation.json',JSON.stringify(result,null,2));
