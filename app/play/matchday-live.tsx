'use client';
import {positionLabel} from '@/lib/product/display';

import DelegateMatch from './product/delegate-match';
import {LiveTeam,LiveStatistics} from './product/live-overview';
import MatchReview from './product/match-review';
import {useEffect,useRef,useState} from 'react';
import {Play,Pause,SkipForward,SlidersHorizontal} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Sheet,SheetContent,SheetHeader,SheetTitle,SheetDescription} from '@/components/ui/sheet';
import type {Season,GameMatch,SimPlayer} from '@/lib/sim/types';
import {advancePlayback,playbackSegment,resumePlayback,nextHighlight,liveNeeds,acknowledgeNoReplacement,KEY_EVENTS} from '@/lib/sim/playback';
import {substitute,swapFieldPlayers,instantResult} from '@/lib/sim/engine';
import {canCover} from '@/lib/sim/selection';
import {suitability} from '@/lib/sim/positions';
import {SLOTS} from '@/lib/sim/config';
import {PenaltyPrompt,PenaltySettings,LiveIntelligence} from './match-intelligence';
import {LiveRugby} from './rugby-workbench';
import {MatchReport} from './ui';
import {Jersey,kitStyle,clash} from './team-kit';
import {usePreference} from './use-preference';
import './matchday-live.css';
import Match3D from './match3d';
import type {PlaybackScene} from '@/lib/sim/scene3d';
type Mutate=(f:(s:Season)=>void)=>void;
const time=(minute:number)=>`${Math.floor(minute)}:${String(Math.floor(minute%1*60)).padStart(2,'0')}`;
const fresh=(p:SimPlayer)=>Math.round(100-p.condition.fatigue);
export default function MatchdayLive({s,mutate,onPlayer,onFinish,onTactics}:{s:Season;mutate:Mutate;onPlayer:(id:string)=>void;onFinish:()=>void;onTactics:()=>void}){
 const m=s.activeMatch!,side=m.teams.findIndex(t=>t.id===s.teamId),own=m.teams[side],away=clash(m.teams[0].id,m.teams[1].id);
 const [focus,setFocus]=useState(false),[view,setView]=usePreference('match-view','3D'),[teamSheets,setTeamSheets]=useState(false),[analysisTab,setAnalysisTab]=useState('Teams');
 const scenePlayback=useRef<PlaybackScene>({from:m,to:m,progress:1,running:false});
 const [highlight,setHighlight]=useState(false),[running,setRunning]=useState(false),[clock,setClock]=useState(m.live?.clock??m.minute),[speed,setSpeed]=usePreference('live-speed',2),[mode,setMode]=usePreference('live-mode-v2','Key moments'),[drawer,setDrawer]=useState(false),[picked,setPicked]=useState(''),[proposal,setProposal]=useState<[string,string]|null>(null),[message,setMessage]=useState('');
 const display=useRef(clock),mutateRef=useRef(mutate);mutateRef.current=mutate;const runningRef=useRef(false);runningRef.current=running;
 useEffect(()=>{if(!m.live)mutateRef.current(n=>{n.activeMatch!.live={side,review60:true}})},[m.id,m.live,side]);
 // Preview one phase without mutating the career. Reveal it only when its clock is reached.
 // Changing speed/controls never consumes random numbers from the saved match.
 useEffect(()=>{
  if(!running||!m.live||m.live.pause||m.pendingPenalty||m.finished){display.current=m.live?.clock??m.minute;setClock(display.current);
   if(display.current>m.minute&&!m.live?.pause&&!m.pendingPenalty&&!m.finished){const preview=structuredClone(m);advancePlayback(preview);scenePlayback.current={from:m,to:preview,progress:Math.min(1,(display.current-m.minute)/Math.max(.001,preview.minute-m.minute)),running:false};}else scenePlayback.current={from:m,to:m,progress:1,running:false};return;}
  const segment=playbackSegment(m,mode),next=segment.next;delete next.live!.clock;setHighlight(segment.highlight);
  const noteworthy=next.events.some(e=>e.id>=m.nextEventId&&KEY_EVENTS.has(e.kind));
  const compression=1;
  const sceneStart=segment.highlight?segment.from.minute:m.minute,start=segment.highlight?sceneStart:Math.min(next.minute,Math.max(m.minute,display.current)),duration=mode==='Full match'?Math.max(80,(next.minute-start)*60000/(12*speed)):segment.highlight?Math.max(900,4000/speed):Math.max(90,300/speed);
  scenePlayback.current={from:segment.highlight?segment.from:m,to:next,progress:Math.min(1,(start-sceneStart)/Math.max(.001,next.minute-sceneStart)),running:true};
  const began=performance.now();let frame=0,cancelled=false,lastClock=0;
  const tick=(now:number)=>{if(cancelled)return;const progress=Math.max(0,Math.min(1,(now-began)/duration));display.current=start+(next.minute-start)*progress;scenePlayback.current.progress=Math.min(1,(display.current-sceneStart)/Math.max(.001,next.minute-sceneStart));if(now-lastClock>=80||progress===1){setClock(display.current);lastClock=now;}if(progress<1)frame=requestAnimationFrame(tick);else{mutateRef.current(n=>{if(n.activeMatch?.rng===m.rng&&n.activeMatch.minute===m.minute)n.activeMatch=next});if(next.live?.pause||next.finished)setRunning(false);}};
  frame=requestAnimationFrame(tick);return()=>{cancelled=true;cancelAnimationFrame(frame)};
 },[m,running,speed,mode]);
 function pause(){scenePlayback.current.running=false;setRunning(false);mutateRef.current(n=>{if(n.activeMatch?.live)n.activeMatch.live.clock=display.current});}
 useEffect(()=>{const hidden=()=>{if(document.hidden&&runningRef.current)pause()};document.addEventListener('visibilitychange',hidden);return()=>document.removeEventListener('visibilitychange',hidden)},[]);
 function play(){mutate(n=>resumePlayback(n.activeMatch!));if(!liveNeeds(m).length)setRunning(true);}
 function choose(id:string){pause();if(!picked){setPicked(id);return;}if(id===picked){setPicked('');return;}propose(picked,id);}
 function propose(a:string,b:string){pause();setPicked('');if(a===b)return;const onA=own.lineup.includes(a),onB=own.lineup.includes(b);if(!onA&&!onB){setMessage('Choose a player on the field to replace.');return;}const out=onA?a:b,inc=onA?b:a;
  if(onA&&onB){if(!canCover(own.players[a],own.players[b])||!canCover(own.players[b],own.players[a])){setMessage('Both players must be able to cover their new positions.');return;}}
  else if(!canCover(own.players[inc],own.players[out])){setMessage('This player cannot cover that position. Front-row positions require a specialist.');return;}
  if([a,b].some(id=>own.players[id].sentOff||own.players[id].cardUntil>m.minute)){setMessage('A carded player is unavailable for this change.');return;}
  setMessage('');setProposal([out,inc]);
 }
 function card(p:SimPlayer,slot:number,teamSide:number,bench=false){const t=m.teams[teamSide],editable=teamSide===side&&!m.finished,unavailable=p.injured||p.sentOff||p.cardUntil>m.minute,fit=suitability(p.position,p.playingPosition??p.position);return <article key={p.id} className={`md-player ${picked===p.id?'picked':''} ${unavailable?'unavailable':''}`} draggable={editable} onDragStart={e=>{pause();setPicked(p.id);e.dataTransfer.setData('text/plain',p.id)}} onDragEnd={()=>setPicked('')} onDragOver={e=>{if(editable)e.preventDefault()}} onDrop={e=>{e.preventDefault();if(editable)propose(e.dataTransfer.getData('text/plain'),p.id)}}>
  <button className="md-player-pick" disabled={!editable} onClick={()=>choose(p.id)} aria-label={`${bench?'Bring on':'Change'} ${p.name}`}><Jersey team={t.id} number={p.shirtNumber??slot+1} away={teamSide===1&&away}/></button><div><button className="md-player-name" onClick={()=>{pause();onPlayer(p.id)}}>{p.name}</button><small>{bench?positionLabel(p.position):SLOTS[slot][0]}{fit.factor<1&&!bench?` · ${fit.label}`:''}</small><span className="md-fitness"><i style={{width:`${fresh(p)}%`}}/></span></div><div className="md-player-state"><strong className={p.stats.rating>=7.5?'good':''}>{p.stats.minutes?p.stats.rating.toFixed(1):'—'}</strong><small>{p.sentOff?'RED':p.cardUntil>m.minute?`YC ${Math.ceil(p.cardUntil-m.minute)}′`:p.injured?'INJ':`${fresh(p)}%`}</small></div></article>}
 const total=m.teams.reduce((n,t)=>n+t.stats.possessionSeconds,0)||1,events=m.events.filter(e=>mode==='Key moments'?KEY_EVENTS.has(e.kind)||e.kind==='substitution':true).slice(-10).reverse();
 const needs=liveNeeds(m),out=proposal?own.players[proposal[0]]:null,inc=proposal?own.players[proposal[1]]:null;
 const is3D=view==='3D'&&mode!=='Commentary';
 return <div className={`md-live md-workspace ${focus?'md-focus':''}`}>
  <header className="md-scorebar">{[0,1].map(ts=><div key={ts} className="md-score-team" style={kitStyle(m.teams[ts].id,ts===1&&away)}><Jersey team={m.teams[ts].id} away={ts===1&&away}/><div><small>{ts?'AWAY':'HOME'} · {m.teams[ts].stats.tries} TRIES</small><strong>{m.teams[ts].name}</strong></div><b>{m.teams[ts].stats.score}</b></div>)}<div className="md-clock"><span>{m.finished?'FULL TIME':m.pendingPenalty?'DECISION':m.live?.pause?'PAUSED':running?highlight?'HIGHLIGHT':'SIMULATING':'READY'}</span><strong>{time(clock)}</strong></div></header>
  <div className="md-controls"><button className="primary" disabled={m.finished||!!m.pendingPenalty||needs.length>0} onClick={()=>running?pause():play()}>{running?<Pause size={16}/>:<Play size={16}/>} {running?'Pause':m.minute===40?'Start second half':'Play'}</button><button className="secondary" disabled={m.finished||!!m.pendingPenalty||needs.length>0} onClick={()=>{pause();mutate(n=>{resumePlayback(n.activeMatch!);nextHighlight(n.activeMatch!);delete n.activeMatch!.live?.clock;})}}>Next highlight</button><label>Speed<select aria-label="Playback speed" value={speed} onChange={e=>setSpeed(Number(e.target.value))}>{[1,2,4,8].map(v=><option key={v} value={v}>{v}×</option>)}</select></label><label>Highlights<select aria-label="Highlight detail" value={mode} onChange={e=>{pause();setMode(e.target.value)}}>{['Full match','Extended','Key moments','Commentary'].map(v=><option key={v}>{v}</option>)}</select></label><label>View<select aria-label="Match view" value={view} onChange={e=>{pause();setView(e.target.value)}}><option value="3D">3D highlights</option><option value="2D">Statistics</option></select></label><button className="secondary" onClick={()=>setFocus(!focus)}>{focus?"Exit focus":"Focus"}</button><button className="secondary" onClick={()=>{pause();setDrawer(true)}}>Touchline</button><DelegateMatch label="Assistant takes over" disabled={m.finished} onDelegate={()=>{pause();mutate(n=>instantResult(n.activeMatch!));}}/>{m.finished&&<button className="primary" onClick={onFinish}>Continue to recovery →</button>}</div>
  {m.pendingPenalty&&<div className="md-decision"><PenaltyPrompt m={m} mutate={fn=>{mutate(n=>{fn(n);if(n.activeMatch?.live)delete n.activeMatch.live.clock;});setRunning(true)}}/></div>}
  {m.live?.pause&&!m.pendingPenalty&&<div className="live-pause-strip" role="status"><strong>{m.live.pause}</strong>{needs.map(p=><span key={p.id}>{p.name} · use the Sub menu beside his row. {(!p.injured||!own.bench.some(id=>canCover(own.players[id],p)))&&<button className="secondary" onClick={()=>mutate(n=>acknowledgeNoReplacement(n.activeMatch!,p.id))}>{p.injured?'Continue a player short':'Allow extra minutes'}</button>}</span>)}</div>}
  {message&&<p className="live-feedback" role="status">{message}</p>}
  <div className="live-match-workspace"><LiveTeam m={m} side={side} editable onPlayer={id=>{pause();onPlayer(id)}} onChange={propose}/><section className="live-match-main"><nav className="inbox-filter-tabs" aria-label="Match information">{['Overview','Opposition','Events','Report'].map(t=><button key={t} aria-current={analysisTab===t||analysisTab==='Teams'&&t==='Overview'?'page':undefined} onClick={()=>setAnalysisTab(t)}>{t}</button>)}</nav>
  {['Teams','Overview'].includes(analysisTab)&&<>{(m.finished||m.minute===40)?<MatchReview m={m} side={side} onPlayer={id=>{pause();onPlayer(id)}}/>:null}{is3D&&(mode==='Full match'||highlight&&running)?<Match3D match={m} playback={scenePlayback} onPlayer={id=>{pause();onPlayer(id)}} onError={pause} onFallback={()=>{pause();setView('2D')}}/>:<><div className="live-simulation-state"><span className={running?'is-live':''}/><strong>{m.finished?'Fulltime':running?'Simulating — waiting for the next highlight':'Match paused'}</strong><small>{mode==='Full match'?'Continuous match view':'Statistics update between highlights'}</small></div><LiveStatistics m={m}/><div className="live-event-note"><time>{m.events.at(-1)?.minute??0}′</time><p>{m.events.at(-1)?.text??'Ready for kick-off.'}</p></div></>}</>}
  {analysisTab==='Opposition'&&<LiveTeam m={m} side={1-side} onPlayer={id=>{pause();onPlayer(id)}} onChange={()=>{}}/>}
  {analysisTab==='Events'&&<div className="live-event-list">{m.events.slice(-100).reverse().map(e=><p key={e.id}><time>{e.minute}′</time>{e.text}</p>)}</div>}
  {analysisTab==='Report'&&<div className="live-full-report"><MatchReport m={m}/></div>}
  </section></div>
  <Sheet open={drawer} onOpenChange={value=>{setDrawer(value);if(value)pause()}}><SheetContent side="right" className="md-touchline"><SheetHeader><SheetTitle>Touchline</SheetTitle><SheetDescription>Match paused. Changes apply to the next passage of play.</SheetDescription></SheetHeader><label className="md-review"><input type="checkbox" checked={m.live?.review60??true} onChange={e=>mutate(n=>{if(n.activeMatch!.live)n.activeMatch!.live!.review60=e.target.checked})}/> Pause for a 60-minute review</label><PenaltySettings s={s} mutate={mutate}/><LiveIntelligence m={m} side={side} mutate={mutate}/><LiveRugby m={m} side={side} mutate={mutate} onDetails={()=>{setDrawer(false);onTactics()}}/></SheetContent></Sheet>
  <Dialog open={!!proposal} onOpenChange={value=>{if(!value)setProposal(null)}}><DialogContent className="md-change-dialog"><DialogTitle>{proposal&&own.lineup.includes(proposal[1])?'Swap positions':'Confirm replacement'}</DialogTitle><DialogDescription>Review cover and freshness before making this change.</DialogDescription>{out&&inc&&<><div className="md-change-pair">{[out,inc].map((p,i)=><div key={p.id}><small>{i?'ON / NEW ROLE':'OFF / CURRENT ROLE'}</small><h3>{p.name}</h3><p>{fresh(p)}% fresh · {positionLabel(p.position)}</p><p>Passing {Math.round(p.rich?.passing??p.attributes.attack??0)} · Tackling {Math.round(p.rich?.tackling??p.attributes.defence??0)}</p></div>)}</div><p>{suitability(inc.position,out.playingPosition??out.position).label} at {positionLabel(out.playingPosition??out.position)}.{suitability(inc.position,out.playingPosition??out.position).factor<1?' Unfamiliar positioning reduces execution.':''}</p><button className="primary" onClick={()=>{mutate(n=>{const match=n.activeMatch!,error=own.lineup.includes(inc.id)?swapFieldPlayers(match,side,out.id,inc.id):substitute(match,side,out.id,inc.id);if(error)throw Error(error);setProposal(null);setMessage(`${inc.name} replaces ${out.name}.`);});}}>Confirm change</button></>}</DialogContent></Dialog>
 </div>
}
