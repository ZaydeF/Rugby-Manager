'use client';
import {useEffect,useRef,useState,type MutableRefObject} from 'react';
import {Box,RotateCcw,Plus,Minus,Monitor,Move,Info} from 'lucide-react';
import type {GameMatch} from '@/lib/sim/types';
import type {PlaybackScene,CameraView} from '@/lib/sim/scene3d';
import type {RugbyRenderer3D,CameraSettings} from '@/lib/sim/renderer3d';
import {kit,clash} from './team-kit';
import {usePreference} from './use-preference';
import './match3d.css';

export default function Match3D({match,playback,onPlayer,onFallback,onError}:{match:GameMatch;playback:MutableRefObject<PlaybackScene>;onPlayer:(id:string)=>void;onFallback:()=>void;onError:()=>void}){
  const canvas=useRef<HTMLCanvasElement>(null),labels=useRef<HTMLCanvasElement>(null),surface=useRef<HTMLDivElement>(null),renderer=useRef<RugbyRenderer3D|null>(null);
  const [view,setView]=usePreference<CameraView>('match3d-camera','Broadcast'),[quality,setQuality]=usePreference<'Balanced'|'Low'>('match3d-quality','Balanced');
  const [numbers,setNumbers]=useState(true),[zoom,setZoom]=useState(1),[status,setStatus]=useState('loading'),[error,setError]=useState(''),[attempt,setAttempt]=useState(0),[compatibility,setCompatibility]=useState(false);
  const camera=useRef<CameraSettings>({view,quality,labels:numbers,zoom,azimuth:0,elevation:0});
  camera.current={...camera.current,view,quality,labels:numbers,zoom};
  const playerCallback=useRef(onPlayer);playerCallback.current=onPlayer;
  const errorCallback=useRef(onError);errorCallback.current=onError;
  const drag=useRef<{x:number;y:number;lastX:number;lastY:number;moving:boolean}|null>(null);
  const home=match.teams[0].id,away=match.teams[1].id;
  useEffect(()=>{
    let active=true,frame=0,last=0,signature='',instance:RugbyRenderer3D|null=null;
    const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
    const lost=(e:Event)=>{e.preventDefault();cancelAnimationFrame(frame);if(active){errorCallback.current();setError('The graphics connection was interrupted. Switch to the 2D view to continue this match.');setStatus('error');}};
    const restored=()=>{if(active)setAttempt(n=>n+1);};
    const element=canvas.current!;element.addEventListener('webglcontextlost',lost);element.addEventListener('webglcontextrestored',restored);
    const observer=new ResizeObserver(()=>{if(instance&&surface.current){const r=surface.current.getBoundingClientRect();instance.resize(r.width,r.height,camera.current.quality);}});
    if(surface.current)observer.observe(surface.current);
    setStatus('loading');setError('');
    import('@/lib/sim/renderer3d').then(({RugbyRenderer3D})=>{
      if(!active||!canvas.current||!labels.current||!surface.current)return;
      const instanceColours:[ReturnType<typeof kit>,ReturnType<typeof kit>]=[kit(home),kit(away,clash(home,away))];
      instance=new RugbyRenderer3D(canvas.current,labels.current,instanceColours);renderer.current=instance;
      const box=surface.current.getBoundingClientRect();instance.resize(box.width,box.height,camera.current.quality);
      instance.render(playback.current,camera.current,motion.matches);setCompatibility(instance.softwareRendering);setStatus('ready');
      const draw=(now:number)=>{if(!active||!instance)return;frame=requestAnimationFrame(draw);const fps=instance.softwareRendering?18:camera.current.quality==='Low'?20:30;if(document.hidden||now-last<1000/fps)return;last=now;
        try{const r=surface.current!.getBoundingClientRect(),b=playback.current,c=camera.current,key=`${b.from.rng}:${b.to.rng}:${b.from.nextEventId}:${b.to.nextEventId}:${b.progress}:${b.running}:${c.view}:${c.zoom}:${c.azimuth}:${c.elevation}:${c.labels}:${c.quality}:${r.width}:${r.height}:${motion.matches}`;if(!b.running&&signature===key)return;signature=key;instance.resize(r.width,r.height,c.quality);instance.render(b,c,motion.matches);}catch(e){cancelAnimationFrame(frame);errorCallback.current();setError((e as Error).message);setStatus('error');}
      };frame=requestAnimationFrame(draw);
    }).catch(e=>{if(active){errorCallback.current();setError((e as Error).message);setStatus('error');}});
    return()=>{active=false;cancelAnimationFrame(frame);observer.disconnect();element.removeEventListener('webglcontextlost',lost);element.removeEventListener('webglcontextrestored',restored);instance?.destroy();renderer.current=null;};
  },[home,away,match.id,attempt,playback]);
  const reset=()=>{camera.current.azimuth=0;camera.current.elevation=0;setZoom(1);};
  const lastEvent=match.events.at(-1);
  return <section className="match3d-panel" aria-label="3D match centre"><header className="match3d-toolbar"><div className="match3d-title"><Box size={16}/><strong>3D match centre</strong><span>{match.teams[match.possession].name} in possession</span></div><div className="match3d-camera-tools"><label>Camera<select aria-label="3D camera" value={view} onChange={e=>{setView(e.target.value as CameraView);reset();}}>{['Broadcast','Tactical','End-on'].map(x=><option key={x}>{x}</option>)}</select></label><button aria-label="Zoom out" title="Zoom out" disabled={zoom<=.7} onClick={()=>setZoom(z=>Math.max(.7,z-.15))}><Minus size={15}/></button><button aria-label="Zoom in" title="Zoom in" disabled={zoom>=1.8} onClick={()=>setZoom(z=>Math.min(1.8,z+.15))}><Plus size={15}/></button><button aria-label="Reset 3D camera" title="Reset camera" onClick={reset}><RotateCcw size={14}/></button><label className="match3d-number-toggle"><input type="checkbox" checked={numbers} onChange={e=>setNumbers(e.target.checked)}/> Numbers</label><select aria-label="3D graphics quality" value={quality} onChange={e=>setQuality(e.target.value as 'Balanced'|'Low')}><option>Balanced</option><option>Low</option></select></div></header>
    <div className="match3d-surface" ref={surface}>
      <canvas ref={canvas} className="match3d-canvas" tabIndex={0} aria-label="Interactive 3D rugby pitch. Drag to rotate. Arrow keys rotate, plus and minus zoom. Click a player to open their profile." onPointerDown={e=>{if(e.button!==0)return;e.currentTarget.setPointerCapture(e.pointerId);drag.current={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moving:false};}} onPointerMove={e=>{const d=drag.current;if(!d)return;if(Math.hypot(e.clientX-d.x,e.clientY-d.y)>5)d.moving=true;if(d.moving){camera.current.azimuth-=(e.clientX-d.lastX)*.008;camera.current.elevation=Math.max(-.4,Math.min(.4,camera.current.elevation+(e.clientY-d.lastY)*.005));}d.lastX=e.clientX;d.lastY=e.clientY;}} onPointerUp={e=>{const d=drag.current;drag.current=null;if(d&&!d.moving&&renderer.current){const rect=e.currentTarget.getBoundingClientRect();const id=renderer.current.pick(e.clientX-rect.left,e.clientY-rect.top);if(id)playerCallback.current(id);}}} onPointerCancel={()=>{drag.current=null;}} onKeyDown={e=>{if(e.key.startsWith('Arrow')){e.preventDefault();if(e.key==='ArrowLeft')camera.current.azimuth-=.12;if(e.key==='ArrowRight')camera.current.azimuth+=.12;if(e.key==='ArrowUp')camera.current.elevation=Math.min(.4,camera.current.elevation+.08);if(e.key==='ArrowDown')camera.current.elevation=Math.max(-.4,camera.current.elevation-.08);}if(e.key==='+'||e.key==='='){e.preventDefault();setZoom(z=>Math.min(1.8,z+.1));}if(e.key==='-'){e.preventDefault();setZoom(z=>Math.max(.7,z-.1));}if(e.key==='0')reset();}}/>
      <canvas ref={labels} className="match3d-labels" aria-hidden="true"/>
      <div className="match3d-broadcast-tag"><i className={playback.current.running?'live':''}/>{match.finished?'FULL TIME':playback.current.running?'LIVE':'PAUSED'}<span>{view.toUpperCase()}</span></div>
      <div className="match3d-territory"><span>PHASE {match.phase+1}</span><strong>{Math.round(100-match.field)}<small>m to the line</small></strong></div>
      {status==='loading'&&<div className="match3d-loading" role="status"><Box size={28}/><strong>Preparing the pitch</strong><span>Loading the 3D match view…</span></div>}
      {status==='error'&&<div className="match3d-loading match3d-error" role="alert"><Monitor size={26}/><strong>3D view unavailable</strong><p>{error}</p><button className="primary" onClick={onFallback}>Use 2D match view</button></div>}
    </div>
    <div className="match3d-commentary" aria-live={playback.current.running?'off':'polite'}><time>{lastEvent?.minute??0}′</time><p>{lastEvent?.text??'The teams are ready for kick-off.'}</p></div>
    <footer className="match3d-footer"><span><Move size={12}/> Drag to orbit · click a player to inspect</span><span title="Player movement illustrates the phase simulation. Decisions, availability and match outcomes come from the existing game engine."><Info size={12}/> {compatibility?'3D compatibility renderer':'3D match view'}</span></footer>
  </section>;
}
