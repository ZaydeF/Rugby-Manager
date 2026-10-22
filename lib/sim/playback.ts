import type {GameMatch} from './types.ts';
import {advancePhase} from './engine.ts';
import {canCover} from './selection.ts';
export const KEY_EVENTS=new Set(['try','penalty_goal','drop_goal','yellow','red','injury','halftime','fulltime','extra_time','penalty_decision','linebreak','missed_kick']);
export function liveNeeds(m:GameMatch){const live=m.live;if(!live)return [];const t=m.teams[live.side];return t.lineup.map(id=>t.players[id]).filter(p=>!p.left&&!p.sentOff&&p.cardUntil<=m.minute&&!live.acknowledged?.includes(p.id)&&(p.injured||(t.minuteLimits?.[p.id]??1000)<=p.stats.minutes));}
export function resumePlayback(m:GameMatch){if(m.pendingPenalty||m.finished)return;const needs=liveNeeds(m);if(needs.length){m.live!.pause=`Review ${needs.map(p=>p.name).join(', ')} before resuming.`;return;}if(m.live)delete m.live.pause;}
export function acknowledgeNoReplacement(m:GameMatch,id:string){const live=m.live;if(!live)return;const p=liveNeeds(m).find(p=>p.id===id);if(!p)return;const t=m.teams[live.side];if(p.injured&&t.bench.some(id=>canCover(t.players[id],p)))throw Error('Select an available replacement for the injured player.');(live.acknowledged??=[]).push(id);if(!p.injured&&t.minuteLimits)delete t.minuteLimits[id];}
// One deterministic engine phase. Playback speed and highlight preferences never enter the RNG.
export function advancePlayback(m:GameMatch){if(m.finished||m.pendingPenalty||m.live?.pause)return m;if(liveNeeds(m).length){m.live!.pause='Player availability — review your replacement.';return m;}const minute=m.minute,half=m.halftime,start=m.nextEventId;advancePhase(m);if(!m.live)return m;const fresh=m.events.filter(e=>e.id>=start),needs=liveNeeds(m);
 if(m.finished)return m;
 if(m.pendingPenalty)return m;
 if(needs.length)m.live.pause=needs.some(p=>p.injured)?'Injury — choose a replacement.':'Return-to-play limit reached — review your replacement.';
 else if(!half&&m.halftime)m.live.pause='Half-time — review your team and game plan.';
 else if(fresh.some(e=>['yellow','red'].includes(e.kind)))m.live.pause='Card — review your shape and cover.';
 else if(fresh.some(e=>e.kind==='extra_time'))m.live.pause='Extra time — prepare for twenty more minutes.';
 else if(m.live.review60&&!m.live.reviewed60&&minute<60&&m.minute>=60){m.live.reviewed60=true;m.live.pause='60-minute review — check freshness and your bench.';}
 return m;
}
export function nextHighlight(m:GameMatch){for(let i=0;i<1500&&!m.finished&&!m.pendingPenalty&&!m.live?.pause;i++){const start=m.nextEventId;advancePlayback(m);if(m.events.some(e=>e.id>=start&&KEY_EVENTS.has(e.kind)))break;}return m;}
