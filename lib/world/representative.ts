import {announceXV} from './xv-announcement.ts';
import type {Season} from '../sim/types.ts';
import type {DutyPeriod,RepresentativeFixture} from './types.ts';
import {catalog,worldPlayers,ledger,KEY,average} from './catalog.ts';
import {roll,news,clamp} from './development.ts';
import {SLOTS} from '../sim/config.ts';

import {recordExposure} from './readiness.ts';
// These are deliberately compact game calendars. 2026 NZ tour dates follow the
// published itinerary; later seasons repeat a game template, not an official draw.
export function representativeDate(s:Season){const w=s.world!;if(w.date)return w.date;if(w.phase==='preseason'||w.phase==='SR')return `${s.year}-02-01`;if(w.phase==='international')return `${s.year}-06-20`;if(w.phase==='offseason')return `${s.year}-11-01`;const c=w.primary==='NPC'?s:w.background;return c.fixtures.find(f=>f.round===c.round)?.date.slice(0,10)??`${s.year}-08-01`;}
function itinerary(year:number,nation:string):RepresentativeFixture[]{
 const nz:[string,string,RepresentativeFixture['kind']][]=[['07-04','July Test I','Test'],['07-11','July Test II','Test'],['07-18','July Test III','Test'],['08-08','Stormers','Tour'],['08-12','Sharks','Tour'],['08-16','Bulls','Tour'],['08-23','South Africa','Test'],['08-26','Lions','Tour'],['08-30','South Africa','Test'],['09-06','South Africa','Test'],['09-13','South Africa','Test'],['10-10','Australia','Test'],['10-17','Australia','Test'],['11-07','Scotland','Test'],['11-14','Wales','Test'],['11-21','England','Test']];
 const other:[string,string,RepresentativeFixture['kind']][]=[['07-11','July Test','Test'],['08-29','Pacific campaign I','Test'],['09-12','Pacific campaign II','Test'],['11-07','November Test I','Test'],['11-14','November Test II','Test']];
 return (nation==='New Zealand'?nz:other).map(([day,opponent,kind])=>({id:`rep-${year}-${nation}-${day}`,date:`${year}-${day}`,nation,kind,opponent}));
}
export function ensureRepresentative(s:Season){const w=s.world!;const migration=!w.representative;const r=w.representative??={version:1,duty:[],fixtures:[],xvSquads:[]};
 for(const q of w.squads.filter(q=>q.year===s.year)){
  for(const id of q.ids)if(!r.duty.some(d=>d.playerId===id&&d.start.startsWith(String(s.year))&&d.kind==='senior')){
   // Full NZ campaign stays together through NPC, with only explicit releases.
   const windows=q.nation==='New Zealand'?[['07-01','11-23']]:q.nation==='Australia'?[['07-01','10-19'],['10-26','11-16']]:[['07-01','07-20'],['08-17','09-21'],['10-26','11-16']];
   for(const [start,end] of windows)r.duty.push({playerId:id,nation:q.nation,kind:'senior',start:`${s.year}-${start}`,end:`${s.year}-${end}`});
  }
  for(const f of itinerary(s.year,q.nation))if(!r.fixtures.some(x=>x.id===f.id)){
   // Old saves retain previously awarded caps. Do not replay the past on import.
   if(migration&&f.date<representativeDate(s)){f.played=true;f.legacy=true;}
   r.fixtures.push(f);
  }
 }
 return r;
}
export function dutyOn(s:Season,id:string,date=representativeDate(s)):DutyPeriod|undefined{
 const r=s.world!.representative;
 if(r)return r.duty.find(d=>d.playerId===id&&d.start<=date&&d.end>=date&&!(d.release&&d.release.start<=date&&d.release.end>=date));
 // Read-only fallback for an old save before its migration is written.
 const q=s.world!.squads.find(q=>q.year===s.year&&q.ids.includes(id));
 if(q&&date>=`${s.year}-07-01`&&date<=`${s.year}-${q.nation==='New Zealand'?'11-23':'09-21'}`)return {playerId:id,nation:q.nation,kind:'senior',start:`${s.year}-07-01`,end:`${s.year}-${q.nation==='New Zealand'?'11-23':'09-21'}`};
}
export function dutyDescription(s:Season,id:string){const d=dutyOn(s,id);if(d)return `${d.kind==='xv'?'All Blacks XV':d.nation==='New Zealand'?'All Blacks':d.nation} · away through ${d.end}`;const date=representativeDate(s),release=s.world!.representative?.duty.find(d=>d.playerId===id&&d.release&&d.release.start<=date&&d.release.end>=date)?.release;return release?`Provincial release through ${release.end}`:null;}
function choose23(s:Season,ids:string[],key:string){const players=new Map(worldPlayers(s).map(p=>[p.id,p])),chosen:string[]=[];for(const [,positions] of SLOTS){const options=ids.filter(id=>!chosen.includes(id)&&!s.condition[id].injuryWeeks&&positions.split('|').includes(players.get(id)!.position));options.sort((a,b)=>{const score=(id:string)=>s.management!.players[id].ability*.7+average(s.world!.players[id].rich,KEY[players.get(id)!.position]??['work_rate'])*.3-s.condition[id].fatigue*.14+roll(s.seed,key+id)*7;return score(b)-score(a)});if(options[0])chosen.push(options[0]);else chosen.push('');}return chosen;}
export function selectXV(s:Season){const r=ensureRepresentative(s);if(r.xvSquads.some(q=>q.year===s.year))return;const senior=new Set(s.world!.squads.filter(q=>q.year===s.year&&q.nation==='New Zealand').flatMap(q=>q.ids));const candidates=worldPlayers(s).filter(p=>p.nation==='New Zealand'&&!senior.has(p.id)&&!s.world!.players[p.id].retired&&!s.condition[p.id].injuryWeeks);const quotas:Record<string,number>={prop:5,hooker:3,lock:4,loose_forward:5,scrum_half:2,fly_half:3,center:3,outside_back:5};const ids=Object.entries(quotas).flatMap(([pos,n])=>candidates.filter(p=>p.position===pos).sort((a,b)=>{const score=(id:string)=>{const f=ledger(s,'NPC',id);return s.management!.players[id].ability*.65+(f?.apps?f.ratings/f.apps:6.5)*4+Math.min(f?.minutes??0,600)/120};return score(b.id)-score(a.id)}).slice(0,n).map(p=>p.id));r.xvSquads.push({year:s.year,ids});announceXV(s);for(const id of ids){r.duty.push({playerId:id,nation:'New Zealand',kind:'xv',start:`${s.year}-10-26`,end:`${s.year}-11-16`});s.world!.players[id].milestones.push(`${s.year}: All Blacks XV selection`);}for(const [i,opponent] of ['Invitational XV','England A','Development international'].entries())r.fixtures.push({id:`xv-${s.year}-${i}`,date:`${s.year}-11-${String(1+i*7).padStart(2,'0')}`,nation:'New Zealand',kind:'XV',opponent});news(s,`xv-${s.year}`,'All Blacks XV: a provincial season opens the next door',`${ids.filter(id=>s.world!.memberships.some(m=>m.playerId===id&&m.teamId===s.teamId&&m.active)).length} of your players selected. Camp runs 26 October–16 November. These appearances are separate from Test caps.`);}
export function representativeDay(s:Season){const r=ensureRepresentative(s),date=representativeDate(s);if(date>=`${s.year}-10-26`)selectXV(s);
 for(const f of r.fixtures.filter(f=>!f.played&&f.date<=date).sort((a,b)=>a.date.localeCompare(b.date))){const ids=f.kind==='XV'?r.xvSquads.find(q=>q.year===Number(f.date.slice(0,4)))?.ids:s.world!.squads.find(q=>q.year===Number(f.date.slice(0,4))&&q.nation===f.nation)?.ids;if(!ids)continue;const selected=choose23(s,ids,f.id),rows=s.world!.stats[`${s.year}-${f.kind}`]??={};f.appearances=[];for(let i=0;i<selected.length;i++){const id=selected[i];if(!id)continue;const start=i<15;const benchSlot=i===0?16:i===1?15:i===2?17:i===3?18:i===5?19:i===8?20:i===9?21:i===14?22:-1;const minutes=start?(benchSlot>=0&&selected[benchSlot]?55:80):25;const rating=clamp(6.2+roll(s.seed,f.id+id+'rating')*1.8,1,10);const row=rows[id]??={apps:0,starts:0,minutes:0,tries:0,tackles:0,metres:0,turnovers:0,ratings:0,recent:[],injuryWeeks:0};row.apps++;row.starts+=+start;row.minutes+=minutes;row.ratings+=rating;row.recent=[...row.recent,rating].slice(-5);f.appearances.push({id,minutes,start,rating});recordExposure(s,id,f.id,f.date,minutes,f.kind);if(f.kind==='Test'){const p=s.world!.players[id];p.caps++;if(p.debut===null){p.debut=s.year;const baseline=worldPlayers(s).find(p=>p.id===id)!;const established=baseline.eligibilityEvidence.some(e=>(e as {evidence_class?:string}).evidence_class==='TEST');p.milestones.push(`${s.year}: ${established?'first Test appearance in this save':'Test debut'} against ${f.opponent}`);if(!established)news(s,`debut-${s.year}-${id}`,`${baseline.name} makes a Test debut`,`${f.date} · ${f.nation} v ${f.opponent}. A first cap earned on the field.`);}}s.condition[id].fatigue=clamp(s.condition[id].fatigue+minutes*.22,0,95);}
 f.played=true;const strength=f.appearances.reduce((n,p)=>n+s.management!.players[p.id].ability,0)/Math.max(1,f.appearances.length);f.score=[Math.round(18+(strength-75)*.6+roll(s.seed,f.id+'score')*14),Math.round(12+roll(s.seed,f.id+'opposition')*22)];}
 const releaseKey=`rep-release-${s.year}`;if(date>=`${s.year}-09-14`&&!s.world!.processed.includes(releaseKey)){s.world!.processed.push(releaseKey);const ids=s.world!.squads.find(q=>q.year===s.year&&q.nation==='New Zealand')?.ids??[];const releases=ids.filter(id=>(ledger(s,'Test',id)?.minutes??0)<=160&&!s.condition[id].injuryWeeks).sort((a,b)=>s.management!.players[a].ability-s.management!.players[b].ability).slice(0,3);for(const id of releases){const d=r.duty.find(d=>d.playerId===id&&d.kind==='senior'&&d.start.startsWith(String(s.year)));if(d){d.release={start:`${s.year}-09-14`,end:`${s.year}-09-28`,reason:'Limited Test minutes; provincial match-fitness release'};news(s,`release-${s.year}-${id}`,`${worldPlayers(s).find(p=>p.id===id)!.name} released for provincial minutes`,'Available 14–28 September, subject to injury and fitness. Returns to the All Blacks campaign afterwards.');}}}
}
