'use client';
import {ArrowRight,CheckCircle2,Clock3,HeartPulse,ShieldAlert,Star,TrendingUp} from 'lucide-react';
import type {Season} from '@/lib/sim/types';
import {catalog} from '@/lib/world/catalog';
import {decidePathway,ensurePathway,pathwayCandidates,pathwayTeamNames,setPathwayPlan} from '@/lib/world/pathway';
import type {PathwayDecision,PathwayPlan} from '@/lib/world/types';

const planLabels:Record<PathwayPlan,string>={'regular-minutes':'Regular Otago minutes','protect-workload':'Protect workload','prepare-call-up':'Prepare for Highlanders','monitor':'Monitor only'};
const decisionLabels:Record<PathwayDecision,string>={'call-up':'Call up','stay-developing':'Leave developing','protect':'Protect & monitor'};
import {ReadinessBadge} from './world-fitness';
const readinessTone=(value:string)=>value==='Ready for a look'?'world-good':value==='Protect'?'world-warning':'world-muted';

export default function WorldPathway({s,mutate,onPlayer}:{s:Season;mutate:(fn:(n:Season)=>void)=>void;onPlayer:(id:string)=>void}){
 const state=ensurePathway(s),teams=pathwayTeamNames(s),rows=pathwayCandidates(s);
 if(!state||!teams)return <section className="panel pathway-empty"><ShieldAlert size={24}/><div><h2>Pathway network</h2><p>The first connected pathway is Highlanders → Otago. This career can still use the existing development and provincial systems.</p></div></section>;
 const watch=rows.filter(x=>x.watched),ready=rows.filter(x=>x.readiness==='Ready for a look'),decided=rows.filter(x=>x.decision).length;
 return <>
  <section className="pathway-hero">
   <div><span className="eyebrow">CONNECTED CLUB PATHWAY · {s.year}</span><h2>{teams.senior} <ArrowRight size={20}/> {teams.development}</h2><p>Turn provincial opportunity into senior evidence. Every recommendation below is grounded in Otago appearances, minutes, form and availability from this save.</p><div className="pathway-hero-actions"><button className="primary" onClick={()=>{const first=rows.find(x=>!x.watched);if(first)mutate(n=>{const p=ensurePathway(n);if(p&&!p.watchlist.includes(first.player.id))p.watchlist=[...p.watchlist,first.player.id]})}}>Add next prospect to watchlist</button><span className="pathway-note">{state.watchlist.length}/5 watchlist places used</span></div></div>
   <div className="pathway-hero-mark"><span>OTAGO</span><b>{ready.length}</b><small>ready for review</small></div>
  </section>
  <div className="pathway-metrics"><div><b>{rows.length}</b><span>Otago prospects</span></div><div><b>{watch.length}</b><span>On your watchlist</span></div><div><b>{ready.length}</b><span>Ready for a look</span></div><div><b>{decided}</b><span>Decisions made</span></div></div>
  <section className="panel"><div className="panel-title"><div><span className="eyebrow">EVIDENCE BOARD</span><h2>Otago development squad</h2></div><span className="pathway-note">Plans change the conversation, not the underlying player data.</span></div><div className="pathway-grid">{rows.slice(0,12).map(row=><article className={`pathway-card ${row.watched?'is-watched':''}`} key={row.player.id}>
    <div className="pathway-card-head"><button className="player-link" onClick={()=>onPlayer(row.player.id)}><strong>{row.player.name}</strong><small>{row.player.position.replaceAll('_',' ')} · {row.age??'—'} years</small></button><button className="watch-toggle" aria-label={`${row.watched?'Remove':'Add'} ${row.player.name} ${row.watched?'from':'to'} watchlist`} onClick={()=>mutate(n=>{const p=ensurePathway(n);if(!p)return;if(p.watchlist.includes(row.player.id))p.watchlist=p.watchlist.filter(id=>id!==row.player.id);else if(p.watchlist.length<5)p.watchlist=[...p.watchlist,row.player.id];})}>{row.watched?<Star fill="currentColor" size={16}/>:<Star size={16}/>}</button></div>
    <div className="pathway-status"><ReadinessBadge s={s} id={row.player.id} level="SR"/><span className={readinessTone(row.readiness)}>{row.readiness}</span>{row.decision&&<span className="status-chip">{decisionLabels[row.decision]}</span>}</div>
    <div className="pathway-evidence"><div><b>{row.apps}</b><span>apps</span></div><div><b>{row.minutes}</b><span>minutes</span></div><div><b>{row.rating?.toFixed(2)??'—'}</b><span>rating</span></div></div>
    <p className="pathway-reason">{row.reason}</p>
    <label className="pathway-plan"><span>Current brief</span><select value={row.plan} onChange={e=>mutate(n=>setPathwayPlan(n,row.player.id,e.target.value as PathwayPlan))}>{Object.entries(planLabels).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label>
    <div className="pathway-actions"><button className="secondary" disabled={row.decision==='stay-developing'} onClick={()=>mutate(n=>decidePathway(n,row.player.id,'stay-developing'))}><Clock3 size={14}/>Develop</button><button className="secondary" disabled={row.decision==='protect'} onClick={()=>mutate(n=>decidePathway(n,row.player.id,'protect'))}><HeartPulse size={14}/>Protect</button><button className="primary" disabled={row.decision==='call-up'||row.readiness==='Protect'} onClick={()=>mutate(n=>decidePathway(n,row.player.id,'call-up'))}><TrendingUp size={14}/>Call up</button></div>
   </article>)}</div>{!rows.length&&<div className="world-empty"><CheckCircle2 size={22}/><p>No eligible Otago development players are currently linked to this career. The pathway will populate as shared registrations change.</p></div>}</section>
  <section className="panel"><div className="panel-title"><div><span className="eyebrow">PATHWAY LOG</span><h2>Recent evidence & decisions</h2></div><span className="pathway-note">Persistent in your career save</span></div>{state.events.length?<div className="pathway-events">{state.events.slice(0,8).map(event=><article key={event.id}><div className={`event-dot ${event.kind}`}/><div><b>{event.title}</b><p>{event.text}</p><small>Round {event.round} · {catalog.teams.find(t=>t.id===state.developmentTeamId)?.name??state.developmentTeamId}</small></div></article>)}</div>:<div className="world-empty"><Clock3 size={22}/><p>Pathway notes appear after Otago matchdays or when you make a decision.</p></div>}</section>
 </>;
}
