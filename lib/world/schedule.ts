import type {Competition,CompetitionState} from './types.ts';
import type {Fixture,Standing} from '../sim/types.ts';
import {catalog} from './catalog.ts';
import {roll} from './development.ts';
import legacy from '../../data/generated/simulation-catalog.json' with {type:'json'};
export const ranked=(rows:Standing[])=>[...rows].sort((a,b)=>b.points-a.points||b.wins-a.wins||(b.for-b.against)-(a.for-a.against)||b.triesFor-a.triesFor);
export function schedule(comp:Competition,year:number,seed:number):CompetitionState{const teams=catalog.teams.filter(t=>t.competition===comp);let fixtures:Fixture[]=[];
 if(comp==='SR'){const order=Array.from({length:16},(_,i)=>i+1).sort((a,b)=>roll(seed,'draw'+a)-roll(seed,'draw'+b));fixtures=legacy.fixtures.map(f=>({...f,id:`${year}-SR-${f.id}`,round:order.indexOf(f.round)+1,date:new Date(Date.UTC(year,1,6+(order.indexOf(f.round))*7)).toISOString(),stage:'Super Rugby'}));}
 else{
 // Two seven-team pools: six pool games + four crossovers, exactly five home and five away.
 const ids=teams.map(t=>t.id).sort((a,b)=>roll(seed,a)-roll(seed,b));const a=ids.slice(0,7),b=ids.slice(7);const games:{home:string;away:string}[][]=[];
 // Seven rounds with one cross-pool fixture joining the two pool byes.
 let ring=[0,1,2,3,4,5,6,7];for(let r=0;r<7;r++){const batch:{home:string;away:string}[]=[];let byeA='',byeB='';for(let i=0;i<4;i++){let x=ring[i],y=ring[7-i];if(x===7||y===7){const k=x===7?y:x;byeA=a[k];byeB=b[k];continue;}const dist=(y-x+7)%7;const home=dist<=3?x:y,away=dist<=3?y:x;batch.push({home:a[home],away:a[away]},{home:b[home],away:b[away]});}batch.push({home:byeA,away:byeB});games.push(batch);ring=[ring[0],ring[7],...ring.slice(1,7)];}
 for(let shift=1;shift<=3;shift++)games.push(a.map((id,i)=>shift===1?{home:id,away:b[(i+shift)%7]}:{home:b[(i+shift)%7],away:id}));
 fixtures=games.flatMap((batch,r)=>batch.map((g,i)=>({...g,id:`${year}-NPC-${r+1}-${i}`,round:r+1,date:new Date(Date.UTC(year,7,1+r*7)).toISOString(),stage:'NPC',venue:catalog.teams.find(t=>t.id===g.home)!.name+' home ground'})));
 }
 return {competition:comp,round:1,fixtures,standings:teams.map(t=>({id:t.id,name:t.name,played:0,wins:0,draws:0,losses:0,for:0,against:0,triesFor:0,triesAgainst:0,points:0,bonus:0,form:[]})),seeds:[],champion:null,done:false};
}
export function finals(c:CompetitionState,year:number){const regular=c.competition==='NPC'?10:16,round=c.round;function add(home:string,away:string,stage:string,i:number){c.fixtures.push({id:`${year}-${c.competition}-final-${round+1}-${i}`,round:round+1,date:new Date(Date.parse(c.fixtures.find(f=>f.round===round)!.date)+7*86400000).toISOString(),home,away,stage,venue:catalog.teams.find(t=>t.id===home)!.name+' home ground'});}
 if(round===regular){c.seeds=ranked(c.standings).slice(0,c.competition==='NPC'?8:6).map(t=>t.id);for(let i=0;i<c.seeds.length/2;i++)add(c.seeds[i],c.seeds[c.seeds.length-1-i],c.competition==='NPC'?'Quarter-final':'Qualifying final',i);}
 else if(round>regular){const ms=c.fixtures.filter(f=>f.round===round).map(f=>f.result!);let winners=ms.map(m=>m.teams[m.winner!].id).sort((a,b)=>c.seeds.indexOf(a)-c.seeds.indexOf(b));if(round===regular+1&&c.competition==='SR'){const losers=ms.map(m=>m.teams[1-m.winner!].id).sort((a,b)=>c.seeds.indexOf(a)-c.seeds.indexOf(b));winners.push(losers[0]);}if(winners.length===1){c.champion=winners[0];c.done=true;}else for(let i=0;i<winners.length/2;i++)add(winners[i],winners[winners.length-1-i],winners.length===2?'Final':'Semi-final',i);}
 if(!c.done)c.round++;
}
