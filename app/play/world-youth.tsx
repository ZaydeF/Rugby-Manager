'use client';
import {positionLabel} from '@/lib/product/display';

import {useState} from 'react';
import type {Season} from '@/lib/sim/types';
import {worldPlayers,worldAge,ledger,projected} from '@/lib/world/catalog';
import {youthPlan,setYouthPlan,type YouthChoice} from '@/lib/world/youth';
import PlayerStars from './stars';
import {YouthReport} from './development';
export default function WorldYouth({s,mutate,onPlayer}:{s:Season;mutate:(fn:(s:Season)=>void)=>void;onPlayer:(id:string)=>void}){
 const [report,setReport]=useState<string|null>(null),w=s.world!,own=worldPlayers(s).filter(p=>w.memberships.some(m=>m.active&&m.teamId===s.teamId&&m.playerId===p.id)),young=own.filter(p=>(worldAge(s,p)??99)<21),comp=w.primary,matches=(w.youth?.matches??[]).filter(m=>m.competition===comp&&(m.home===s.teamId||m.away===s.teamId)),match=matches.find(m=>m.id===report);
 return <section className="panel"><h2>U21 pathway</h2><p>Development fixtures run automatically alongside regular senior rounds. Under 21 means younger than 21 in this season’s age calculation. Senior appearances, injuries and workload take priority. Local guests cover vacant positions and do not join your squad.</p>
 <div className="world-table-wrap"><table className="world-table"><thead><tr>{['Prospect','Age / position','Ability','U21 exposure','Senior minutes','Next step','Your plan'].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{young.map(p=>{const r=ledger(s,`${comp}-U21`,p.id),senior=ledger(s,comp,p.id),ability=s.management!.players[p.id].ability,peers=own.filter(q=>q.position===p.position&&q.id!==p.id).map(q=>s.management!.players[q.id].ability).sort((a,b)=>b-a),gap=(peers[0]??ability)-ability;return <tr key={p.id}><td><button onClick={()=>onPlayer(p.id)}>{p.name}</button></td><td>{worldAge(s,p)}<small>{positionLabel(p.position)}</small></td><td><PlayerStars s={s} id={p.id}/></td><td>{Math.round(r?.minutes??0)} min<small>{r?.apps??0} apps · {r?.apps?(r.ratings/r.apps).toFixed(2):'—'} rating</small></td><td>{Math.round(senior?.minutes??0)}</td><td>{gap<=4?'Competing for senior starts':gap<=10?'Consider a bench opportunity':'Build development minutes'}</td><td><select aria-label={`Development plan for ${p.name}`} value={youthPlan(s,p.id)} onChange={e=>mutate(n=>setYouthPlan(n,p.id,e.target.value as YouthChoice))}>{['Balanced','Priority minutes','Senior only','Rest'].map(x=><option key={x}>{x}</option>)}</select></td></tr>})}</tbody></table></div>
 {!young.length&&<p>No players with a verified age under 21 are currently registered to your team.</p>}<p><strong>Priority minutes</strong> boosts U21 selection preference. <strong>Senior only</strong> keeps a player out of U21 games. <strong>Rest</strong> pauses U21 appearances until you change it; senior selection remains under your control. Plans never guarantee a place.</p>
 <h3>Development results · {s.year}</h3><div className="inline-actions">{matches.slice().reverse().map(m=><button className="secondary" key={m.id} onClick={()=>setReport(report===m.id?null:m.id)}>R{m.round} · {m.homeScore}–{m.awayScore} · {m.home===s.teamId?'Home':'Away'}</button>)}</div>{!matches.length&&<p>Results will appear after your competition’s next regular-season round.</p>}{match&&<><button className="text-link" onClick={()=>setReport(null)}>Close report</button><YouthReport m={match} data={projected(s)}/></>}
 </section>;
}
