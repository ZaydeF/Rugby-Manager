import type {Season,Fixture,GameMatch} from '@/lib/sim/types';
import {throwReasons} from '@/lib/sim/club-system';
import {matchNumbers,priorMatches} from '@/lib/club/analysis';

export function InboxAnalysis({s,fixture,match,navigate,onReport}:{s:Season;fixture:Fixture;match:GameMatch;navigate:(tab:string)=>void;onReport?:()=>void}){
 const n=matchNumbers(match,s.teamId);if(!n)return null;
 const team=match.teams.find(x=>x.id===s.teamId)!,log=team.tacticalLog,changes=match.events.filter(e=>e.side===match.teams.indexOf(team)&&['club_system_open','role_handover','club_system_change'].includes(e.kind));
 const prior=priorMatches(s,fixture).map(f=>matchNumbers(f.result!,s.teamId)).filter(x=>x!==null);
 const sum=(key:'throws'|'lineouts'|'launches'|'positive'|'errors'|'breaks'|'penalties')=>prior.reduce((acc,x)=>acc+x[key],0);
 const avg=(key:'breaks'|'penalties')=>prior.length?(sum(key)/prior.length).toFixed(1):'—';
 return <article className="inbox-analysis">
 <div className="inbox-score"><strong>{n.team}</strong><b>{n.score} – {n.against}</b><strong>{n.opponent}</strong></div>
 <table><caption>Match evidence · comparison with {prior.length||'no'} previous {prior.length===1?'fixture':'fixtures'}</caption><thead><tr><th scope="col">Measure</th><th scope="col">This match</th><th scope="col">Previous {prior.length||'fixtures'}</th></tr></thead><tbody>
 <tr><th scope="row">Lineouts won</th><td>{n.throws?n.lineouts+' / '+n.throws:'—'}</td><td>{sum('throws')?sum('lineouts')+' / '+sum('throws'):'—'}</td></tr>
 <tr><th scope="row">Named launch · gain line won</th><td>{n.launches?n.positive+' / '+n.launches:'—'}</td><td>{sum('launches')?sum('positive')+' / '+sum('launches'):'—'}</td></tr>
 <tr><th scope="row">Named launch · possession lost</th><td>{n.launches?n.errors+' / '+n.launches:'—'}</td><td>{sum('launches')?sum('errors')+' / '+sum('launches'):'—'}</td></tr>
 <tr><th scope="row">Line breaks</th><td>{n.breaks}</td><td>{avg('breaks')}{prior.length?' / match':''}</td></tr>
 <tr><th scope="row">Penalties conceded</th><td>{n.penalties}</td><td>{avg('penalties')}{prior.length?' / match':''}</td></tr>
 <tr><th scope="row">Territory</th><td>{n.territory===null?'—':n.territory+'%'}</td><td>—</td></tr>
 </tbody></table>
 <h3>What happened to our throws?</h3>{log?.throwLedger===1?<><ul className="throw-counts">{Object.entries(throwReasons).filter(([key])=>log['reason_'+key]).map(([key,label])=><li key={key}>{label}: <b>{log['reason_'+key]}</b></li>)}</ul><p>{log.system_metres??0} metres from named launches · {n.launchBreaks} breaks.</p></>:<p>Throw-by-throw reasons were not recorded for this fixture.</p>}
 {Object.entries(team.minuteLimits??{}).filter(([id])=>team.players[id]?.stats.minutes>0).map(([id,cap])=><p key={id}>{team.players[id].name}: {Math.round(team.players[id].stats.minutes)}′ played / {cap}′ planned · {team.players[id].stats.minutes>cap+1?'limit exceeded — review matchday cover':'within a passage of plan'}.</p>)}
 {changes.length>0&&<details><summary>Plan and changes · {changes.length} recorded</summary><ol>{changes.map(e=><li key={e.id}><time>{e.minute}′</time> {e.text}</li>)}</ol></details>}
 {n.launches?<p>{n.split} two-distributor calls · {n.fallbacks} carry fallbacks · {n.reads} repeat calls against a defence that had already seen the shape · {n.launchBreaks} launch breaks.</p>:<p>No named launch was recorded. Check the lineout exit instruction and whether the named players were on the field.</p>}
 {n.incidents.length>0&&<details><summary>Review {n.incidents.length} launch incidents</summary><ol>{n.incidents.map(e=><li key={e.id}><time>{e.minute}′</time> {e.text}</li>)}</ol></details>}
 <div className="inline-actions">{onReport&&<button className="secondary" onClick={onReport}>Open full match report</button>}<button className="secondary" onClick={()=>{navigate('tactics');requestAnimationFrame(()=>document.getElementById('club-role-'+(log?.reason_runner&&!log?.reason_first?'runner':'first'))?.focus());}}>Review tactical assignments</button></div>
 </article>;
}
