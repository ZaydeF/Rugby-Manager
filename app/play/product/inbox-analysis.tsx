import type {Season,Fixture,GameMatch} from '@/lib/sim/types';
import {matchNumbers,priorMatches} from '@/lib/club/analysis';

export function InboxAnalysis({s,fixture,match,navigate,onReport}:{s:Season;fixture:Fixture;match:GameMatch;navigate:(tab:string)=>void;onReport?:()=>void}){
 const n=matchNumbers(match,s.teamId);if(!n)return null;
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
 {n.launches?<p>{n.split} two-distributor calls · {n.fallbacks} carry fallbacks · {n.reads} repeat calls against a defence that had already seen the shape · {n.launchBreaks} launch breaks.</p>:<p>No named launch was recorded. Check the lineout exit instruction and whether the named players were on the field.</p>}
 {n.incidents.length>0&&<details><summary>Review {n.incidents.length} launch incidents</summary><ol>{n.incidents.map(e=><li key={e.id}><time>{e.minute}′</time> {e.text}</li>)}</ol></details>}
 <div className="inline-actions">{onReport&&<button className="secondary" onClick={onReport}>Open full match report</button>}<button className="secondary" onClick={()=>navigate('tactics')}>Review tactical assignments</button></div>
 </article>;
}
