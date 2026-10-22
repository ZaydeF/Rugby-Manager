import type {Season} from '../sim/types.ts';
import type {Thread,Bulletin} from './types.ts';
export const active=(t:Thread)=>!['completed','rejected','withdrawn','expired'].includes(t.stage);
export function initMarket(s:Season){if(!s.market)s.market={version:1,day:0,windowDay:s.management!.offseasonWeek*7,threads:[],shortlist:[],bulletins:[],urgentSeen:[],retirementNotices:{}};return s.market;}
export function bulletin(s:Season,id:string,title:string,text:string,kind:Bulletin['kind']='market',playerId?:string){const m=initMarket(s);if(m.bulletins.some(b=>b.id===id))return;m.bulletins.unshift({id,title,text,year:s.year,day:m.day,kind,...(playerId?{playerId}:{}),read:false});m.bulletins=m.bulletins.slice(0,160);}
export function userThread(s:Season,t:Thread){return t.buyer===s.teamId||t.seller===s.teamId;}
export function needsReply(s:Season,t:Thread){return active(t)&&userThread(s,t)&&(['incoming','club_counter','player_counter','agreed','decision'].includes(t.stage));}
export function urgent(s:Season){return s.market?.threads.filter(t=>needsReply(s,t)&&t.expires-s.market!.day<=1&&!s.market!.urgentSeen.includes(t.id))??[];}
export function unreadCount(s:Season){return (s.market?.threads.filter(t=>userThread(s,t)&&!t.read).length??0)+(s.market?.bulletins.filter(b=>!b.read).length??0);}
