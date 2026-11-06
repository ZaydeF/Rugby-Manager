'use client';
import {useState} from 'react';
import type {Season,SimUniverse} from '@/lib/sim/types';
import {systemRoles,roleNames,shapes,type ClubSystem} from '@/lib/sim/club-system';
import {addProject,allocateSession,eligibleProjects,nextBlock,pathways,projectCost,projectGoals,registered,releaseProject,renewProject,setClubSystem,setProjectRoute,identity,type ProjectGoal,type ProjectRoute} from '@/lib/club/identity';
import {positionLabel} from '@/lib/product/display';
import {worldAge} from '@/lib/world/catalog';
import './club-identity.css';

type Props={s:Season;data:SimUniverse;mutate:(f:(n:Season)=>void)=>void};
export function ClubTactics({s,data,mutate,onRecruit}:Props&{onRecruit:()=>void}){
 const live=s.activeMatch?.teams.find(t=>t.id===s.teamId),saved=live?live.clubSystem?.plan:s.clubIdentity?.system;
 const ids=live?Object.keys(live.players):data.players.filter(p=>registered(s,p.player_id)).map(p=>p.player_id);
 const xi=live?.lineup??s.selection;
 const [draft,setDraft]=useState<ClubSystem>(()=>saved??{shape:'Carry first',first:xi[9]??'',second:xi[11]??'',runner:xi[12]??'',chase:xi[10]??'',cover:xi[14]??''});
 const names=new Map(data.players.map(p=>[p.player_id,p.name]));
 return <section className="panel club-identity"><header><span className="eyebrow">TACTICAL IDENTITY</span><h2>Named combinations</h2><p>On clean lineout ball, your first distributor can send a hard runner or pull the ball back to a second distributor. Use <strong>Launch</strong> as your lineout exit.</p></header>
 <div className="club-fields"><label>Lineout shape<select value={draft.shape} onChange={e=>setDraft({...draft,shape:e.target.value as ClubSystem['shape']})}>{shapes.map(x=><option key={x}>{x}</option>)}</select></label>{systemRoles.map(role=><label key={role}>{roleNames[role]}<select value={draft[role]} onChange={e=>setDraft({...draft,[role]:e.target.value})}><option value="">Unassigned</option>{ids.map(id=><option key={id} value={id}>{names.get(id)??live?.players[id]?.name??id}{xi.slice(0,15).includes(id)?' · XV':''}</option>)}</select></label>)}</div>
 <p className="club-note">{draft.shape==='Two distributors'?'Creates width against a narrow defence, but needs two reliable distributors. Defenders get better at reading repeated calls. A missing second distributor triggers the hard-line fallback.':'A shorter pass to your hard-line runner asks less of your distributors. It gives up the wider attack.'} If the first distributor or runner is unavailable, the existing game plan takes over.</p>
 <div className="inline-actions"><button className="primary" onClick={()=>mutate(n=>setClubSystem(n,draft))}>Save {live?'live':'club'} assignments</button>{saved&&<button className="secondary" onClick={()=>mutate(n=>setClubSystem(n,null))}>Return to standard playbook</button>}{!live&&<button className="secondary" onClick={()=>{mutate(n=>{identity(n).brief=draft.shape==='Two distributors'?'Distribution':'Gain line';});onRecruit();}}>Scout for this shape →</button>}</div>
 <small>{saved?('Active: '+saved.shape+' · '+(names.get(saved.first)??saved.first)+' to '+(names.get(saved.runner)??saved.runner)):'No named system is active.'} {live?'Live changes apply to this match only.':'Coach a rehearsal in Staff to improve execution with this exact group.'}</small>
 </section>
}

export function ClubProgramme({s,data,mutate}:Props){
 const c=s.clubIdentity,{fixture,capacity,used}=nextBlock(s),b=c?.block?.fixture===fixture?.id?c?.block:undefined;
 const names=new Map(data.players.map(p=>[p.player_id,p.name])),staff=s.coaching?.clubs[s.teamId]?.staff??[];
 const blocked=!!s.activeMatch||s.world?.phase!==s.world?.primary||!fixture||used>=capacity;
 return <section className="panel club-identity"><header><span className="eyebrow">COACHING CAPACITY</span><h2>Programme for the next fixture</h2><p>Rehearse the launch, recover the XV, or give a prospect specialist time. Every choice spends a slot this fixture week.</p></header>
 <div className="club-metrics"><div><b>{Math.max(0,capacity-used)} / {capacity}</b><span>Sessions available</span></div><div><b>{fixture?.date.slice(0,10)??'—'}</b><span>Next fixture</span></div></div>
 <ul className="club-list">{staff.map(p=><li key={p.id}><strong>{p.name}</strong><span>{p.role} · {p.style} · capacity {p.capacity}</span></li>)}</ul>
 <div className="inline-actions"><button className="primary" disabled={blocked||!c?.system} onClick={()=>mutate(n=>allocateSession(n,'senior'))}>Rehearse lineout launch</button><button className="secondary" disabled={blocked} onClick={()=>mutate(n=>allocateSession(n,'recovery'))}>Recover starting XV</button>{c?.projects.filter(p=>p.opened===s.year&&registered(s,p.id)).map(p=><button key={p.id} className="secondary" disabled={blocked||b?.assignments.includes(p.id)} onClick={()=>mutate(n=>allocateSession(n,p.id))}>Coach {names.get(p.id)??p.id}</button>)}</div>
 <label className="club-check"><input type="checkbox" disabled={!!s.activeMatch} checked={c?.delegate??false} onChange={e=>mutate(n=>{identity(n).delegate=e.target.checked})}/> Let the assistant use one session if I leave the week empty</label>
 <small>The assistant prioritises recovery when starters are fatigued, then the named system, then a prospect. Capacity is two sessions, or three with a high-capacity coach. An unfunded staff department has no slots.</small>
 {b&&<ul className="club-list" aria-label="Completed sessions">{b.assignments.map((a,i)=><li key={i}><strong>{names.get(a)??a}</strong><span>{b.staff[i]}</span></li>)}</ul>}
 </section>
}

export function AcademyProjects({s,data,mutate}:Props){
 const [picked,setPicked]=useState(''),[goal,setGoal]=useState<ProjectGoal>('Distribution'),[route,setRoute]=useState<ProjectRoute>('Development XV');
 const projects=s.clubIdentity?.projects??[],staff=s.coaching?.clubs[s.teamId]?.staff??[],prospects=eligibleProjects(s).filter(p=>!projects.some(x=>x.id===p.id));
 const id=prospects.some(p=>p.id===picked)?picked:prospects[0]?.id??'',player=prospects.find(p=>p.id===id),year=player?worldAge(s,player):null;
 const chosenRoute=route==='Development XV'&&(year??99)>=21?'Senior opportunity':route;
 return <section className="panel club-identity"><header><span className="eyebrow">ACADEMY PROJECTS</span><h2>Invest in two prospects</h2><p>Fund a place for this season, give the player specialist coaching, and find match minutes at the agreed level. Training by itself does not earn the development bonus.</p></header>
 <div className="club-fields"><label>Prospect<select value={id} onChange={e=>setPicked(e.target.value)}><option value="">No eligible prospect</option>{prospects.map(p=><option key={p.id} value={p.id}>{p.name} · {positionLabel(p.position)} · {worldAge(s,p)}</option>)}</select></label><label>Focus<select value={goal} onChange={e=>setGoal(e.target.value as ProjectGoal)}>{projectGoals.map(g=><option key={g}>{g}</option>)}</select></label><label>Route to minutes<select value={chosenRoute} onChange={e=>setRoute(e.target.value as ProjectRoute)}>{pathways.map(x=><option key={x} disabled={x==='Development XV'&&(year??99)>=21}>{x}</option>)}</select></label></div>
 <button className="primary" disabled={!id||projects.length>=2||!!s.activeMatch} onClick={()=>mutate(n=>addProject(n,id,goal,chosenRoute))}>Fund project · ${projectCost(s).toLocaleString('en-NZ')}</button>
 <small>Development XV gives selection priority within existing eligibility and workload rules. A senior opportunity still needs a place in your matchday 23. Use Staff to allocate coaching.</small>
 <div className="club-projects">{projects.map(p=><article key={p.id}><h3>{data.players.find(x=>x.player_id===p.id)?.name??p.id}</h3><p>{p.goal} · {staff.find(x=>x.id===p.coach)?.name??'Coach to be reassigned'} · {p.opened}</p><div className="club-metrics"><div><b>{Math.round(p.minutes)}′</b><span>Pathway minutes</span></div><div><b>{Math.round(p.lastMinutes)}′</b><span>Latest fixture</span></div><div><b>{p.matched.toFixed(1)}</b><span>Coached match exposure</span></div></div>
 {p.missed>=3&&<p className="caution">Missed {p.missed} available opportunities. Morale is falling.</p>}
 {p.opened!==s.year||!registered(s,p.id)?<p>This project is inactive. Renew eligible prospects or close the project to free a place.</p>:<label>Pathway for {data.players.find(x=>x.player_id===p.id)?.name??p.id}<select disabled={!!s.activeMatch} value={p.route} onChange={e=>mutate(n=>setProjectRoute(n,p.id,e.target.value as ProjectRoute))}>{pathways.map(x=><option key={x} disabled={x==='Development XV'&&!eligibleProjects(s).some(x=>x.id===p.id&&(worldAge(s,x)??99)<21)}>{x}</option>)}</select></label>}
 {p.opened<s.year&&eligibleProjects(s).some(x=>x.id===p.id)&&<button className="primary" disabled={!!s.activeMatch} onClick={()=>mutate(n=>renewProject(n,p.id))}>Renew for this season</button>}
 <button className="secondary" disabled={!!s.activeMatch} onClick={()=>mutate(n=>releaseProject(n,p.id))}>Close project · no refund</button></article>)}</div>
 </section>
}
