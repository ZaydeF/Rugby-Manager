import {compactCareer} from './archive.ts';
import {initDynamics,recordDressingRoom,reviewSeason} from '../management/dynamics.ts';
import {developmentReviews} from '../future/pathway.ts';
import {initCoaching,recordTraining} from '../management/coaching.ts';
import {initRugby} from './rugby.ts';
import {initScouting,advanceScouting,initBenchmark} from '../scouting.ts';
import {applyBiographies} from '../packs/biography.ts';
import {assertPack,initFoundation} from '../packs/foundation.ts';
import {matchEvidence} from '../management/advice.ts';
import {prepareWeek} from '../management/preparation.ts';
import {matchInstructions,instructionExceptions} from '../management/advice.ts';
import {plans,plannedSelection} from '../management/plans.ts';
import {drawOrder,seasonDraw} from './draw.ts';
import {initRepresentative} from '../representative/state.ts';
import {updateWatch} from '../representative/engine.ts';
import {marketDay} from '../market/engine.ts';
import {initFuture,runYouthRound} from '../future/engine.ts';
import {fullUniverse} from '../future/catalog.ts';
import {initMarket,bulletin} from '../market/state.ts';
import {formSummary,initManagement,careerUniverse} from '../management/state.ts';
import {updateConcerns,carryPromises} from '../management/concerns.ts';
import {finishOffseason} from '../management/offseason.ts';
import {autoSelect,freshCondition,makeSide,kickers,selectionErrors} from './selection.ts';
import {CONFIG,DEFAULT_TACTICS,ENGINE_VERSION} from './config.ts';
import {createMatch,instantResult,clamp} from './engine.ts';
import type {Season,SimUniverse,Standing,Fixture,GameMatch} from './types.ts';
const formMinutes=(s:Season,id:string)=>formSummary(s,id).minutes;

export function blankStandings(data:SimUniverse):Standing[]{return data.teams.map(t=>({id:t.id,name:t.name,played:0,wins:0,draws:0,losses:0,for:0,against:0,triesFor:0,triesAgainst:0,points:0,bonus:0,form:[]}));}
export function table(rows:Standing[]){return [...rows].sort((a,b)=>b.points-a.points||b.wins-a.wins||(b.for-b.against)-(a.for-a.against)||b.triesFor-a.triesFor||(b.triesFor-b.triesAgainst)-(a.triesFor-a.triesAgainst)||a.id.localeCompare(b.id));}
export function newSeason(data:SimUniverse,teamId:string,seed:number,year=2027,history:Season['history']=[]):Season{
 assertPack(data);
 if(!data.teams.some(t=>t.id===teamId))throw Error('Unknown franchise');
 const condition=Object.fromEntries(data.players.map(p=>[p.player_id,freshCondition()]));const squad=data.players.filter(p=>p.squad_id===teamId),selection=autoSelect(squad,condition);const k=kickers(squad.filter(p=>selection.slice(0,15).includes(p.player_id)));
 const order=drawOrder(seed+year),fixtures=seasonDraw(data,year,order);
 const season:Season={drawOrder:order,version:3,modelVersion:data.config.version,year,teamId,seed,round:1,fixtures,condition,standings:blankStandings(data),tactics:{...DEFAULT_TACTICS},selection,kicker:k[0].player_id,secondaryKicker:k[1]?.player_id??k[0].player_id,tacticalKicker:selection[9],activeMatch:null,activeFixtureId:null,champion:null,finalSeeds:[],news:[{id:`start-${year}`,title:`Your ${year} campaign begins`,text:'A simulated season using the 2026 squads and a shuffled draw. All players start healthy; historical injuries are not carried forward as invented current injuries.'}],history};initManagement(season,data);initMarket(season);initFuture(season,data);season.version=5;season.ratingReview=2;initRepresentative(season);plans(season);initFoundation(season);applyBiographies(season,data);initScouting(season);initRugby(season);normalizeKickers(season,data);initCoaching(season);initDynamics(season,data);compactCareer(season);return season;
}
export function currentFixture(s:Season){return s.fixtures.find(f=>f.round===s.round&&(f.home===s.teamId||f.away===s.teamId));}
export function remainingRound(s:Season){return s.fixtures.filter(f=>f.round===s.round&&!f.result);}
export function aiTactics(id:string){const n=Number(id);return {...DEFAULT_TACTICS,tempo:n%3,width:Math.floor(n/2)%3,territory:(n+1)%3,phaseStyle:n%3,breakdown:Math.floor(n/3)%3};}
export function prepareFixture(s:Season,data:SimUniverse,f:Fixture,interactive=false){
 recordTraining(s,data);prepareWeek(s);data=careerUniverse(s,data);
 const sides=[f.home,f.away].map(id=>{const squad=data.players.filter(p=>p.squad_id===id);const user=id===s.teamId;let selection=user?(!interactive&&plans(s).assistantSelection?plannedSelection(s,data,id===f.home?f.away:f.home):s.selection):autoSelect(squad,s.condition);
  if(selectionErrors(selection,squad,s.condition).length){if(user&&interactive)throw Error('Resolve the matchday selection warnings before kick-off.');selection=autoSelect(squad,s.condition);}
  if(user&&Object.keys(matchInstructions(s)).length)selection=plannedSelection(s,data,id===f.home?f.away:f.home,selection);
  if(user){s.selection=[...selection];const exceptions=instructionExceptions(s,selection,data);if(exceptions.length)bulletin(s,`instructions-${f.id}`,'Selection instructions adjusted',exceptions.join(' ').slice(0,790),'development');}
  const side=makeSide(id,data.teams.find(t=>t.id===id)!.name,squad,selection,s.condition,user?s.tactics:aiTactics(id),!user||!interactive||plans(s).assistantSubs);
  side.autoHalfTime=!user||!interactive;if(user&&plans(s).training){const t=plans(s).training!;side.preparation={focus:t.focus,bonus:t.load==='Recovery'?0:t.load==='Intensive'?2:1};}
  if(user){side.rugby=structuredClone(s.rugbyPlan);side.familiarity={...s.rugbyPreparation?.familiarity};side.approach=plans(s).approach;side.developmentIds=Object.keys(plans(s).players).filter(pid=>plans(s).players[pid].minutes>formMinutes(s,pid));}
  if(user){if(selection.includes(s.kicker))side.kicker=s.kicker;if(selection.includes(s.secondaryKicker))side.secondaryKicker=s.secondaryKicker;if(selection.includes(s.tacticalKicker))side.tacticalKicker=s.tacticalKicker;}return side;
 });
 const fixtureSeed=Array.from(f.id).reduce((a,c)=>Math.imul(a,31)+c.charCodeAt(0),s.seed)>>>0;
 return createMatch(f.id,fixtureSeed,sides[0],sides[1],f.round>16);
}
export function startFixture(s:Season,data:SimUniverse){if(s.activeMatch&&!s.activeMatch.finished)return s;const f=currentFixture(s);if(!f||f.result)throw Error('No unplayed fixture in this round.');s.activeMatch=prepareFixture(s,data,f,true);s.activeFixtureId=f.id;return s;}
export function recordMatch(s:Season,m:GameMatch){const f=s.fixtures.find(f=>f.id===m.id);if(!f)throw Error('Fixture not found');if(f.result)return;if(!m.finished)throw Error('Cannot record an unfinished match');f.result=m;
 for(let side=0;side<2;side++){const t=m.teams[side],op=m.teams[1-side];if(f.round<=16){const row=s.standings.find(r=>r.id===t.id)!;row.played++;row.for+=t.stats.score;row.against+=op.stats.score;row.triesFor+=t.stats.tries;row.triesAgainst+=op.stats.tries;
  if(t.stats.score>op.stats.score){row.wins++;row.points+=CONFIG.scoreWin;row.form.push('W');}else if(t.stats.score===op.stats.score){row.draws++;row.points+=CONFIG.scoreDraw;row.form.push('D');}else{row.losses++;row.form.push('L');}
  const bonus=Number(t.stats.tries-op.stats.tries>=CONFIG.tryBonusDifference)+Number(op.stats.score>t.stats.score&&op.stats.score-t.stats.score<=CONFIG.losingBonusMargin);row.bonus+=bonus;row.points+=bonus;
 }
 for(const p of Object.values(t.players)){if(!p.stats.minutes)continue;const c=s.condition[p.id];c.fatigue=p.condition.fatigue;c.fitness=p.condition.fitness;c.sharpness=clamp(c.sharpness+p.stats.minutes*.08,20,100);const performance=clamp((p.stats.rating-6.6)*1.6,-CONFIG.formCap,CONFIG.formCap);c.form=clamp(c.form*(1-CONFIG.statFormWeight)+performance*CONFIG.statFormWeight,-CONFIG.formCap,CONFIG.formCap);c.morale=clamp(c.morale+(t.stats.score>op.stats.score?4:-3),30,95);
  if(p.injured){c.injuryWeeks=p.injuryWeeks;c.injuryName=p.injuryName;if(t.id===s.teamId)s.news.unshift({id:`inj-${m.id}-${p.id}`,title:`${p.name} sidelined`,text:`${p.injuryName}: estimated ${p.injuryWeeks} weeks in this simulation.`});}
 }
 }
 if(m.teams.some(t=>t.id===s.teamId))s.news.unshift({id:`result-${m.id}`,title:`${m.teams[0].name} ${m.teams[0].stats.score}–${m.teams[1].stats.score} ${m.teams[1].name}`,text:`${f.stage}. ${m.decider??'Match report available in the schedule.'}`});
 if(m.teams.some(t=>t.id===s.teamId)){const own=m.teams.find(t=>t.id===s.teamId)!,e=matchEvidence(m).find(t=>t.id===s.teamId)!,injuries=Object.values(own.players).filter(p=>p.injured),targets=Object.entries(s.managerPlans?.players??{}).filter(([id])=>own.players[id]?.stats.minutes>0).slice(0,3).map(([id,plan])=>`${own.players[id].name}: ${Math.round(s.fixtures.reduce((n,f)=>n+(f.result?.teams.flatMap(t=>Object.values(t.players)).find(p=>p.id===id)?.stats.minutes??0),0))}/${plan.minutes} season minutes`);bulletin(s,`match-review-${m.id}`,`Match review: ${m.teams[0].name} ${m.teams[0].stats.score}–${m.teams[1].stats.score} ${m.teams[1].name}`,`${e.penalties} penalties conceded; ${e.missedTackles} missed tackles. Bench: ${e.bench.players} used, ${e.bench.minutes} minutes, ${e.bench.tries} tries, ${e.bench.tackles} tackles. ${injuries.length?'Injuries: '+injuries.map(p=>`${p.name} (${p.injuryWeeks} weeks)`).join(', '):'No new injuries.'} ${targets.length?'Playing plans: '+targets.join('; ')+'.':''}` .slice(0,790),'development');}
 s.news=s.news.slice(0,30);
}
function nextDate(s:Season){const latest=s.fixtures.filter(f=>f.round===s.round).map(f=>new Date(f.date).getTime());return new Date(Math.max(...latest)+7*86400000).toISOString();}
function finalsFixture(s:Season,round:number,index:number,home:string,away:string,stage:string,date:string):Fixture{return {id:`${s.year}-f${round}-${index}`,round,home,away,date,stage,venue:`${s.standings.find(t=>t.id===home)?.name} home venue`};}
function advanceFinals(s:Season){
 const date=nextDate(s);
 if(s.round===16){s.finalSeeds=table(s.standings).slice(0,6).map(t=>t.id);for(let i=0;i<3;i++)s.fixtures.push(finalsFixture(s,17,i,s.finalSeeds[i],s.finalSeeds[5-i],'Qualifying final',date));s.news.unshift({id:'qf',title:'The top six are confirmed',text:'Qualifying finals: 1 v 6, 2 v 5, 3 v 4. Three winners advance; the highest-ranked loser becomes fourth seed.'});}
 else if(s.round===17){const results=s.fixtures.filter(f=>f.round===17).map(f=>f.result!);const wins=results.map(m=>m.teams[m.winner!].id).sort((a,b)=>s.finalSeeds.indexOf(a)-s.finalSeeds.indexOf(b));const losers=results.map(m=>m.teams[1-m.winner!].id).sort((a,b)=>s.finalSeeds.indexOf(a)-s.finalSeeds.indexOf(b));s.finalSeeds=[...wins,losers[0]];s.fixtures.push(finalsFixture(s,18,0,wins[0],losers[0],'Semi-final',date),finalsFixture(s,18,1,wins[1],wins[2],'Semi-final',date));}
 else if(s.round===18){const winners=s.fixtures.filter(f=>f.round===18).map(f=>f.result!.teams[f.result!.winner!].id).sort((a,b)=>s.finalSeeds.indexOf(a)-s.finalSeeds.indexOf(b));s.fixtures.push(finalsFixture(s,19,0,winners[0],winners[1],'Final',date));}
 else if(s.round===19){const m=s.fixtures.find(f=>f.round===19)!.result!;s.champion=m.teams[m.winner!].id;s.history.push({year:s.year,champion:s.champion,runnerUp:m.teams[1-m.winner!].id,standings:structuredClone(table(s.standings)),results:s.fixtures.map(f=>({home:f.home,away:f.away,homeScore:f.result!.teams[0].stats.score,awayScore:f.result!.teams[1].stats.score,round:f.round,stage:f.stage??'Regular season'})),players:seasonStats(s)});s.news.unshift({id:'champion',title:`${m.teams[m.winner!].name} are champions`,text:`The ${s.year} title is decided. Review the season or begin the next campaign.`});}
}
export function completeRound(s:Season,data:SimUniverse,includeUser=false){
 initManagement(s,data);initDynamics(s,data);recordTraining(s,data);prepareWeek(s);data=fullUniverse(s,data);
 if(s.champion)return s;if(s.activeMatch){if(!s.activeMatch.finished)throw Error('Finish the active match first.');recordMatch(s,s.activeMatch);s.activeMatch=null;s.activeFixtureId=null;}
 applyBiographies(s,data);
 const user=currentFixture(s);if(user&&!user.result&&!includeUser)throw Error('Play or simulate your match first.');
 for(const f of remainingRound(s))recordMatch(s,instantResult(prepareFixture(s,data,f)));
 runYouthRound(s,data,s.round);if([12,16].includes(s.round))bulletin(s,`pathway-review-${s.year}-${s.round}`,'Youth pathway review',developmentReviews(s,data).slice(0,4).map(r=>`${r.name}: ${r.action}. ${r.reason}`).join(' ').slice(0,790),'development');updateWatch(s,data);advanceFinals(s);updateConcerns(s,data);recordDressingRoom(s);reviewSeason(s,data);
 for(const c of s.management!.concerns.filter(c=>c.clubId===s.teamId&&c.status==='open'))bulletin(s,c.id,'Playing-time concern',c.message,'concern',c.playerId);
 if(!s.champion){s.round++;for(const c of Object.values(s.condition)){c.fatigue=Math.max(0,c.fatigue-CONFIG.weeklyRecovery);c.fitness=Math.min(100,c.fitness+10);c.injuryWeeks=Math.max(0,c.injuryWeeks-1);if(!c.injuryWeeks)c.injuryName=null;c.sharpness=Math.max(45,c.sharpness-2);}
  const squad=careerUniverse(s,data).players.filter(p=>p.squad_id===s.teamId);if(selectionErrors(s.selection,squad,s.condition).length)s.selection=autoSelect(squad,s.condition);
 }
 if(s.market&&s.management!.phase==='inSeason')marketDay(s,data);applyBiographies(s,data);advanceScouting(s);normalizeKickers(s,data);return s;
}
export {validSave} from './validation.ts';
export function seasonStats(s:Season){const rows=new Map<string,{id:string;name:string;team:string;apps:number;tries:number;tackles:number;metres:number;ratings:number;minutes:number}>();for(const f of s.fixtures)if(f.result)for(const t of f.result.teams)for(const p of Object.values(t.players)){if(!p.stats.minutes)continue;const r=rows.get(p.id)??{id:p.id,name:p.name,team:t.name,apps:0,tries:0,tackles:0,metres:0,ratings:0,minutes:0};r.apps++;r.tries+=p.stats.tries;r.tackles+=p.stats.tackles;r.metres+=p.stats.metres;r.ratings+=p.stats.rating;r.minutes+=p.stats.minutes;rows.set(p.id,r);}return [...rows.values()];}

export function normalizeKickers(s:Season,data:SimUniverse){const starters=careerUniverse(s,data).players.filter(p=>s.selection.slice(0,15).includes(p.player_id));const sorted=kickers(starters);if(!sorted.length)return;for(const key of ['kicker','secondaryKicker','tacticalKicker'] as const)if(!starters.some(p=>p.player_id===s[key]))s[key]=key==='tacticalKicker'?(starters.find(p=>p.position==='fly_half')?.player_id??sorted[0].player_id):sorted[key==='secondaryKicker'?Math.min(1,sorted.length-1):0].player_id;}

export function nextCampaign(s:Season,data:SimUniverse){applyBiographies(s,data);finishOffseason(s,data);const live=careerUniverse(s,data);const next={...s,year:s.year+1,seed:s.seed+7919,round:1,champion:null,finalSeeds:[],activeMatch:null,activeFixtureId:null,standings:blankStandings(data),drawOrder:drawOrder(s.seed+7919+s.year+1),fixtures:seasonDraw(data,s.year+1,drawOrder(s.seed+7919+s.year+1)),news:[]} as Season;next.management=s.management;next.market=s.market;next.future=s.future;if(next.future)next.future.u21={year:next.year,matches:[],finishedRounds:[]};if(next.market)next.market.windowDay=0;next.version=5;if(next.managerPlans)delete next.managerPlans.nextMatch;initRepresentative(next);next.condition=structuredClone(s.condition);for(const c of Object.values(next.condition)){c.fatigue=Math.max(0,c.fatigue-38);c.fitness=Math.min(100,c.fitness+20);c.injuryWeeks=Math.max(0,c.injuryWeeks-2);if(!c.injuryWeeks)c.injuryName=null;c.form*=.5;c.morale=65+(c.morale-65)*.6;}next.selection=autoSelect(live.players.filter(p=>p.squad_id===s.teamId),next.condition);normalizeKickers(next,data);initBenchmark(next);carryPromises(s,next);initDynamics(next,data);next.news=[{id:`preseason-${next.year}`,title:`${next.year} preseason begins`,text:'Your signings, contracts and developed players are ready. Star ratings now compare players against this season’s senior squad standard; a changed star does not itself mean ability changed.'},...s.news].slice(0,50);compactCareer(next);return next;}
