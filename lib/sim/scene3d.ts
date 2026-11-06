import type {GameMatch,MatchEvent,SimPlayer} from './types.ts';

// Presentation only. These positions visualise phase events; the renderer never
// advances the simulation, consumes its RNG, or writes to the career/save.
export type Vec3=[number,number,number];
export type SceneAction='carry'|'kick'|'goal'|'try'|'scrum'|'lineout'|'turnover'|'stoppage';
export type ScenePlayer={id:string;name:string;side:number;shirt:number;position:Vec3;heading:number;stride:number;lean:number;carrier:boolean};
export type MatchScene={players:ScenePlayer[];ball:Vec3;ballSpin:number;possession:number;action:SceneAction;carrier:string|null;direction:number;progress:number};
export type PlaybackScene={from:GameMatch;to:GameMatch;progress:number;running:boolean};
export type CameraView='Broadcast'|'Tactical'|'End-on';
export const clamp=(x:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,x));
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const smooth=(t:number)=>{const n=clamp(t,0,1);return n*n*(3-2*n);};
const hash=(s:string)=>{let n=2166136261;for(let i=0;i<s.length;i++)n=Math.imul(n^s.charCodeAt(i),16777619);return (n>>>0)/4294967295;};
export const attackDirection=(m:GameMatch,side:number)=>(side===0?1:-1)*(m.halftime?-1:1);
export function fieldPosition(m:GameMatch,side=m.possession,field=m.field){return attackDirection(m,side)*(clamp(field,0,100)-50);}
const onField=(p:SimPlayer|undefined,m:GameMatch):p is SimPlayer=>!!p&&!p.left&&!p.sentOff&&!p.injured&&p.cardUntil<=m.minute;
function anchor(m:GameMatch):Vec3 {
  const zone=m.teams[m.possession].rugby?.zone??'';
  const offset=zone.toLowerCase().includes('left')?-17:zone.toLowerCase().includes('right')?17:0;
  return [fieldPosition(m),.95,clamp(offset+(hash(`${m.id}:${m.phase}:${m.rng}`)-.5)*28,-26,26)];
}
function formation(m:GameMatch,ball:Vec3):Map<string,Vec3>{
  const positions=new Map<string,Vec3>(),dir=attackDirection(m,m.possession);
  for(let side=0;side<2;side++)m.teams[side].lineup.forEach((id,i)=>{
    const p=m.teams[side].players[id];if(!onField(p,m))return;
    const attack=side===m.possession;
    const depth=attack?(i<8?-4-Math.floor(i/3)*2:i===8?-2:-9-(i-9)*.75):(i<8?6+(i%2)*1.5:i<14?10:23);
    const lane=i<8?(i%4-1.5)*4.2:i===8?-1:i===9?5:(i-12)*10;
    positions.set(id,[clamp(ball[0]+dir*depth,-53,53),0,clamp(attack?ball[2]*.35+lane:lane*.9,-31,31)]);
  });
  return positions;
}
export function passageAction(from:GameMatch,to:GameMatch):{action:SceneAction;event:MatchEvent|undefined}{
  const events=to.events.filter(e=>e.id>=from.nextEventId);
  const priorities:[SceneAction,string[]][]=[['try',['try']],['goal',['conversion','penalty_goal','drop_goal','missed_kick','drop_missed']],['kick',['territory_kick','rugby_kick','kick','box_kick','cross_kick','return_kick','kick_touch','kick_regain']],['lineout',['lineouts','lineout_plan']],['scrum',['scrums','scrum_plan','uncontested_scrum']],['turnover',['turnover','set_piece_turnover','error','strike_error']],['stoppage',['halftime','fulltime','yellow','red','injury','penalty_decision','penalty_wait']]];
  for(const [action,kinds] of priorities){const event=events.find(e=>kinds.includes(e.kind));if(event)return {action,event};}
  return {action:'carry',event:events.find(e=>e.kind==='carry'||e.kind==='linebreak')??events.find(e=>e.playerId&&to.teams[e.side]?.players[e.playerId])};
}
export function matchScene(bridge:PlaybackScene,reducedMotion=false):MatchScene {
  const {from,to}=bridge,progress=clamp(bridge.progress,0,1),t=smooth(progress);
  const {action,event}=passageAction(from,to),moving=bridge.running&&!reducedMotion;
  const start=anchor(from),end=anchor(to),side=event?.side??from.possession,dir=attackDirection(from,side);
  const startPositions=formation(from,start),endPositions=formation(to,end);
  const attack=from.teams[side],eligible=attack.lineup.filter(id=>onField(attack.players[id],from));
  const eventPlayer=event?.playerId&&eligible.includes(event.playerId)?event.playerId:null;
  const carrier=eventPlayer??eligible.find(id=>attack.players[id].playingPosition==='center')??eligible[11]??eligible[0]??null;
  const runnerZ=clamp(end[2],-28,28),runStart=startPositions.get(carrier??'')??start;
  let ball:Vec3=[mix(start[0],end[0],t),.95,mix(start[2],end[2],t)];
  if(action==='try')ball=[mix(start[0],dir*52,smooth(clamp(progress/.87,0,1))),.95*(1-smooth((progress-.72)/.2)),mix(start[2],runnerZ,t)];
  else if(action==='kick'||action==='goal'){
    const goal=action==='goal',flight=smooth((progress-.12)/.8);
    ball=[mix(start[0],goal?dir*58:end[0],flight),.8+Math.sin(Math.PI*flight)*(goal?16:13),mix(start[2],goal?(event?.kind==='missed_kick'?12:0):end[2],flight)];
  }else if(action==='lineout'){
    const z=30,throwT=smooth((progress-.12)/.65);
    ball=[mix(start[0],end[0],t),1+Math.sin(Math.PI*throwT)*5.5,z-throwT*9];
  }else if(action==='scrum')ball=[mix(start[0],end[0],t),.28,mix(start[2],end[2],t)];
  else if(action==='carry'||action==='turnover'){
    const pass=clamp(progress/.28,0,1),run=smooth((progress-.24)/.67);
    const origin=startPositions.get(attack.lineup[8])??start;
    const runner:Vec3=[mix(runStart[0],end[0],run),0,mix(runStart[2],runnerZ,run)];
    ball=[mix(origin[0],runner[0]+dir*.45,smooth(pass)),1.2+Math.sin(Math.PI*pass)*.4,mix(origin[2],runner[2],smooth(pass))];
    if(progress>.83)ball[1]=mix(1.2,.35,smooth((progress-.83)/.17));
  }
  const roster=progress>=.97?to:from,players:ScenePlayer[]=[];
  for(let ts=0;ts<2;ts++)roster.teams[ts].lineup.forEach((id,i)=>{
    const p=roster.teams[ts].players[id];if(!onField(p,roster))return;
    const a=startPositions.get(id)??endPositions.get(id)??start,b=endPositions.get(id)??a;
    let position:Vec3=[mix(a[0],b[0],t),0,mix(a[2],b[2],t)],lean=0;
    const isCarrier=id===carrier,teamDir=attackDirection(from,ts);
    if(isCarrier&&(action==='carry'||action==='turnover'||action==='try')){
      const run=smooth((progress-.24)/.67);
      position=action==='try'?[ball[0]-dir*.3,0,ball[2]]:[mix(runStart[0],end[0],run),0,mix(runStart[2],runnerZ,run)];
      if(progress>.8)lean=(action==='try'?1.25:.85)*smooth((progress-.8)/.2)*-dir;
    }else if(ts!==side&&i===5&&(action==='carry'||action==='turnover'||action==='try')){
      const tackle=smooth((progress-.55)/.42);
      position=[mix(position[0],ball[0]+dir*.75,tackle),0,mix(position[2],ball[2]+.7,tackle)];lean=progress>.85?teamDir*.7*smooth((progress-.85)/.15):0;
    }
    if(action==='scrum'&&i<8)position=[mix(start[0],end[0],t)+(ts===side?-1:1)*dir*(1.5+Math.floor(i/3)*1.2),0,start[2]+(i%3-1)*1.4];
    if(action==='scrum'&&i<8)lean=ts===side?-.65*dir:.65*dir;
    if(action==='lineout'&&i<8){position=[end[0]+(ts===side?-1.3:1.3),0,22+(i%4)*2];if(i===3||i===4)position[1]=Math.sin(Math.PI*t)*1.5;}
    const distance=Math.hypot(b[0]-a[0],b[2]-a[2]);
    const stride=moving?Math.sin(progress*Math.PI*(isCarrier?8:5)+hash(id)*6.28)*clamp(distance/8+.3,.2,1):0;
    players.push({id,name:p.name,side:ts,shirt:p.shirtNumber??i+1,position,heading:teamDir===1?0:Math.PI,stride,lean,carrier:id===eventPlayer});
  });
  return {players,ball,ballSpin:(action==='kick'||action==='goal')?progress*28:progress*5,possession:progress<.85?from.possession:to.possession,action,carrier:eventPlayer,direction:dir,progress};
}
