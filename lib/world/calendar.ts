import {careerDay} from '../career-setup/state.ts';
import {pulseDay,ensurePulse} from './pulse.ts';
import {schoolDeadline} from './intake.ts';
import {representativeDay} from './representative.ts';
import type {Season} from '../sim/types.ts';
import {advanceWorld,syncContracts} from './engine.ts';
import {marketDay} from '../market/engine.ts';
import {projected} from './catalog.ts';
import {readinessDay} from './readiness.ts';
const day=(date:string)=>date.slice(0,10);
export function calendarDate(s:Season){if(s.world!.date)return s.world!.date;const w=s.world!;if(w.phase==='preseason'){const fixtures=w.primary==='SR'?s.fixtures:w.background.fixtures;return day(new Date(Math.min(...fixtures.map(f=>Date.parse(f.date)))-7*86400000).toISOString());}if(w.phase==='offseason')return `${s.year}-11-01`;if(w.phase==='international')return `${s.year}-06-20`;const c=w.phase===w.primary?{fixtures:s.fixtures,round:s.round}:w.background;const f=c.fixtures.find(f=>f.round===c.round);return f?day(f.date):`${s.year}-01-30`;}
export function nextWorldFixture(s:Season){const w=s.world!;const c=w.phase===w.primary?{fixtures:s.fixtures,round:s.round}:w.background;return c.fixtures.find(f=>f.round===c.round&&!f.result);}
export function matchDue(s:Season){if(s.world!.phase!==s.world!.primary)return undefined;return s.fixtures.find(f=>f.round===s.round&&!f.result&&[f.home,f.away].includes(s.teamId)&&day(f.date)<=calendarDate(s));}
export function advanceDay(s:Season){
 const w=s.world!,date=calendarDate(s);w.date=date;
 if(matchDue(s)&&!s.activeMatch?.finished)throw Error('Matchday: review the squads and choose Play match or Quick sim.');
 if(s.activeMatch&&!s.activeMatch.finished)throw Error('Finish your current match first.');
 if(['preseason','international','offseason'].includes(w.phase)){
 const year=s.year;advanceWorld(s);w.date=s.year!==year?`${s.year}-01-30`:day(new Date(Date.parse(date)+86400000).toISOString());representativeDay(s);schoolDeadline(s);dailyRecovery(s);syncContracts(s);pulseDay(s);careerDay(s);return;
 }
 const f=nextWorldFixture(s);
 if(f&&day(f.date)<=date)advanceWorld(s);else marketDay(s,projected(s));
 w.date=day(new Date(Date.parse(date)+86400000).toISOString());representativeDay(s);schoolDeadline(s);dailyRecovery(s);syncContracts(s);pulseDay(s);careerDay(s);
}
// Convenience stops at matchday or a reply; never simulates the user's match.
export function nextCalendarEvent(s:Season){for(let n=0;n<90;n++){if(matchDue(s)||s.activeMatch||s.world!.announcement!==null||s.world!.representative?.xvAnnouncement!=null)return;const before=s.market?.threads.reduce((n,t)=>n+t.messages.length,0)??0,phase=s.world!.phase,stories=ensurePulse(s).stories.length;advanceDay(s);if((s.market?.threads.reduce((n,t)=>n+t.messages.length,0)??0)!==before||s.world!.phase!==phase&&phase!=='preseason'||ensurePulse(s).stories.slice(0,Math.max(0,ensurePulse(s).stories.length-stories)).some(x=>x.important))return;}}

function dailyRecovery(s:Season){const date=s.world!.date!;const key=`recovery-${date}`;if(s.world!.processed.includes(key))return;s.world!.processed=s.world!.processed.filter(k=>!k.startsWith('recovery-'));s.world!.processed.push(key);const weekBoundary=Math.floor(Date.parse(date)/86400000)%7===0;readinessDay(s,date,weekBoundary);}
