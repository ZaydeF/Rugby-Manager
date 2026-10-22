import {suitability} from './positions.ts';
import {checkpoint,recordChange,aiDecision,group} from './intelligence.ts';
import {richSkill} from './skill.ts';
import {canonicalTactics,jobAt,eventSkill,phaseContext,advice} from './tactics25.ts';
import {DEFAULT_RUGBY,STRIKES,plan,aiRugby,personnel,tacticalEffects,lineoutOdds,scrumOdds,strikeOdds,penaltyChoice,changeRugby,type RugbyPlan,type Strike} from './rugby.ts';
import {skill} from './skill.ts';
import {halfTimeAdvice,MATCH_PLANS} from '../management/preparation.ts';
import {CONFIG,FORWARDS} from './config.ts';
import {canCover} from './selection.ts';
import type {GameMatch,Side,SimPlayer,Tactics,MatchEvent,PenaltyDecision} from './types.ts';
import type {Attribute} from '../types.ts';

export const clamp=(n:number,low:number,high:number)=>Math.max(low,Math.min(high,n));
export function random(m:GameMatch){m.rng=(Math.imul(1664525,m.rng)+1013904223)>>>0;return m.rng/4294967296;}
function event(m:GameMatch,side:number,kind:string,text:string,playerId?:string){m.events.push({id:m.nextEventId++,minute:Math.floor(m.minute),side,kind,text,...(playerId?{playerId}:{}),score:[m.teams[0].stats.score,m.teams[1].stats.score],field:m.field,...(m.intelligence?{context:{attack:plan(m.teams[side].rugby).attack,zone:plan(m.teams[side].rugby).zone,...(playerId&&m.teams[side].players[playerId]?{carrierGroup:group(m.teams[side].players[playerId]),playerRole:jobAt(m.teams[side],m.teams[side].players[playerId])}:{})}}:{})});}
export function active(m:GameMatch,side:number){const t=m.teams[side];return t.lineup.map(id=>t.players[id]).filter(p=>p&&!p.left&&!p.injured&&!p.sentOff&&p.cardUntil<=m.minute);}
function strength(m:GameMatch,side:number,a:Attribute,subset?:'forwards'|'backs'){
 let ps=active(m,side);if(subset)ps=ps.filter(p=>subset==='forwards'?FORWARDS.includes(p.position):!FORWARDS.includes(p.position));
 if(!ps.length)return 35;return ps.reduce((s,p)=>s+skill(p,a),0)/ps.length+(side===0?CONFIG.homeAdvantage:0)+m.teams[side].matchMood+(m.teams[side].preparation?.focus===(a==='defence'?'Defence':a==='set_piece'?'Set piece':'none')?m.teams[side].preparation!.bonus:0);
}
function pick(m:GameMatch,ps:SimPlayer[],weight:(p:SimPlayer)=>number=()=>1):SimPlayer{
 if(!ps.length)throw Error('No active players');const ws=ps.map(p=>Math.max(.05,weight(p)));let r=random(m)*ws.reduce((a,b)=>a+b,0);for(let i=0;i<ps.length;i++){r-=ws[i];if(r<=0)return ps[i];}return ps[ps.length-1];
}
function tackler(m:GameMatch,side:number){return pick(m,active(m,side),p=>(FORWARDS.includes(p.position)?2.5:1)*Math.max(.5,skill(p,'defence')/75)*(m.tacticalVersion===25&&jobAt(m.teams[side],p)==='Contest'?1.8:1));}
function carrier(m:GameMatch,side:number){const r=m.rugbyVersion===2?plan(m.teams[side].rugby):null;const t=m.teams[side].tactics;return pick(m,active(m,side),p=>{const forward=FORWARDS.includes(p.position);let distribution=1;if(r){const wanted=r.carriers==='Tight five'?['prop','hooker','lock']:r.carriers==='Loose forwards'?['loose_forward']:r.carriers==='Centres'?['center']:r.carriers==='Back three'?['outside_back']:[];if(wanted.includes(p.position))distribution=2.4;if(m.teams[side].launch==='scrum'&&r.scrumLaunch!=='Phase play')distribution*=r.scrumLaunch==='Halfback'?(p.position==='scrum_half'?5:1):(p.id===m.teams[side].lineup[7]?5:1);if(r.attack==='Forward power'&&forward)distribution*=1.4;}let w=forward?(2-t.phaseStyle*.65):(.8+t.phaseStyle*.6);w*=.65+skill(p,'attack')/100;if(p.position==='outside_back')w*=.7+t.width*.35;if(m.field>86&&p.position==='hooker')w*=2.8;if(m.tacticalVersion===25){const job=jobAt(m.teams[side],p);distribution*=job==='Carrier'?1.9:job==='Support'?.42:job==='Link'?.7:job==='Return'?(m.teams[side].disrupted?2.3:.75):1;}return w*distribution;});}
function changePossession(m:GameMatch,newSide:number,field:number){for(const t of m.teams){delete t.launch;t.transition=false;if(m.tacticalVersion===25){t.ballQuality=0;t.disrupted=false;}}m.possession=newSide;m.field=clamp(field,5,95);m.phase=0;m.teams[newSide].stats.possessions++;}
function add(m:GameMatch,side:number,p:SimPlayer,key:'tries'|'assists'|'conversions'|'penaltyGoals'|'missedKicks'|'tackles'|'missedTackles'|'metres'|'linebreaks'|'turnovers'|'penalties'|'errors'|'yellow'|'red'|'offloads',n=1){p.stats[key]+=n;m.teams[side].stats[key]+=n;}
export function fieldKicker(m:GameMatch,side:number){const t=m.teams[side],ps=active(m,side);return ps.find(p=>p.id===t.kicker)??ps.find(p=>p.id===t.secondaryKicker)??[...ps].sort((a,b)=>skill(b,'kicking')-skill(a,'kicking'))[0];}
function kickGoal(m:GameMatch,side:number,conversion:boolean){const p=fieldKicker(m,side);if(!p)return;const quality=skill(p,'kicking');const chance=!conversion&&m.intelligence?goalChance(m,side):clamp((conversion?CONFIG.conversionBase:CONFIG.goalBase)+(quality-75)*.004-(conversion?0:(100-m.field)*.0015),.22,.95);if(random(m)<chance){add(m,side,p,conversion?'conversions':'penaltyGoals');m.teams[side].stats.score+=conversion?2:3;event(m,side,conversion?'conversion':'penalty_goal',`${p.name} adds ${conversion?'the conversion':'three points from the tee'}.`,p.id);}else{add(m,side,p,'missedKicks');event(m,side,'missed_kick',`${p.name} sends the ${conversion?'conversion':'penalty attempt'} wide.`,p.id);}}

function logTactic(t:Side,key:string){const log=t.tacticalLog??={};log[key]=(log[key]??0)+1;}
export function updateRugby(m:GameMatch,side:number,next:RugbyPlan,reason="Manager adjustment"){if(m.finished)throw Error('The match is finished.');if(m.rugbyVersion!==2)throw Error('Finish this legacy match; detailed plans apply from the next fixture.');recordChange(m,side,next,reason);const team=m.teams[side];if(m.tacticalVersion===25){team.adjustment={minute:m.minute,before:{...team.tacticalLog}};team.lastAdviceMinute=m.minute;team.tactics=canonicalTactics(next,team.tactics);}changeRugby(team,next);event(m,side,'rugby_tactics',`${m.teams[side].name}: ${next.attack}, ${next.defence.toLowerCase()}, ${next.penalty.toLowerCase()} at penalties.${m.intelligence?' '+reason:''}`);}
export function callStrike(m:GameMatch,side:number,id:Strike){const t=m.teams[side];if(m.finished||m.rugbyVersion!==2)throw Error('Strike calls are available in new live matches.');if(!plan(t.rugby).plays.includes(id))throw Error('Choose a play from your match arsenal.');t.nextStrike=id;event(m,side,'strike_call',`${STRIKES[id].name} called for the next suitable attacking phase.`);}
// Field is metres along the pitch from the attacking team's own line. No lateral
// angle is modelled, so the UI labels distance/chance as an estimate.
export function goalChance(m:GameMatch,side:number){const p=fieldKicker(m,side);if(!p)return 0;const distance=100-m.field+10;const quality=richSkill(p,['goal_kicking','composure'],'kicking'),range=richSkill(p,['kicking_distance'],'kicking');return clamp(.84+(quality-75)*.005-Math.max(0,distance-30)*.013-Math.max(0,distance-(40+range*.2))*.012-(m.minute>=68&&Math.abs(m.teams[side].stats.score-m.teams[1-side].stats.score)<=3?.035:0),.01,.95);}
export function penaltyImportance(m:GameMatch,side:number){const margin=m.teams[side].stats.score-m.teams[1-side].stats.score,late=m.minute>=65&&Math.abs(margin)<=7,inRange=m.field>=50&&goalChance(m,side)>=.35;return {key:m.field>=78||late||inRange,reason:m.field>=78?'Attacking 22: a try-scoring platform.':late?'Close late game: the next score could change the result.':inRange?'A realistic opportunity for three points.':'Build field position from your own half.'};}
export function penaltyOptions(m:GameMatch){const q=m.pendingPenalty;if(!q)return [];return (['Posts','Corner','Scrum','Tap'] as PenaltyDecision[]).map(choice=>({choice,disabled:choice==='Scrum'&&q.fromScrum,description:choice==='Posts'?`${Math.round(100-m.field+10)}m estimated kick · ${Math.round(goalChance(m,q.side)*100)}% modelled chance`:choice==='Corner'?`Touch near ${Math.round(100-Math.min(95,m.field+24))}m from their line; your lineout plan applies.`:choice==='Scrum'?q.fromScrum?'Repeat scrum choice unavailable in this simplified engine.':'Use your current scrum platform and launch.':'Play quickly; gain a short advance without a set piece.'}));}
function executePenalty(m:GameMatch,side:number,choice:PenaltyDecision){const t=m.teams[side];logTactic(t,'penalty_'+choice);event(m,side,'penalty_choice',`${t.name} choose ${choice.toLowerCase()}.`);
 if(choice==='Posts'){kickGoal(m,side,false);changePossession(m,1-side,28);}
 else if(choice==='Scrum')setPiece(m,side,'scrums',m.field);
 else if(choice==='Tap'){m.field=Math.min(98,m.field+3);m.phase=0;t.transition=true;}
 else setPiece(m,side,'lineouts',Math.min(95,m.field+24));
}
function delegatedChoice(m:GameMatch,side:number,fromScrum:boolean):PenaltyDecision {let choice=penaltyChoice(plan(m.teams[side].rugby),m.field,m.minute,m.teams[side].stats.score-m.teams[1-side].stats.score) as PenaltyDecision;if(fromScrum&&choice==='Scrum')choice='Corner';return choice;}
export function resolvePenalty(m:GameMatch,decision:PenaltyDecision|'Game plan',expectedId?:number){const q=m.pendingPenalty;if(!q||m.finished)throw Error('There is no penalty waiting for a decision.');if(expectedId!==undefined&&q.id!==expectedId)throw Error('That penalty has already been resolved.');const choice=decision==='Game plan'?delegatedChoice(m,q.side,q.fromScrum):decision;if(!['Posts','Corner','Scrum','Tap'].includes(choice)||q.fromScrum&&choice==='Scrum')throw Error('Choose an available penalty option.');delete m.pendingPenalty;executePenalty(m,q.side,choice);return m;}
function takePenalty(m:GameMatch,side:number,fromScrum=false){const control=m.penaltyControl,importance=penaltyImportance(m,side);if(m.intelligence&&control?.side===side&&(control.mode==='all'||control.mode==='key'&&importance.key)){const id=m.nextEventId;event(m,side,'penalty_wait','Penalty awarded. Your decision is required.');m.pendingPenalty={id,side,field:m.field,minute:m.minute,fromScrum,...importance};return;}executePenalty(m,side,delegatedChoice(m,side,fromScrum));}
function tryDropGoal(m:GameMatch,side:number){const t=m.teams[side],p=plan(t.rugby),margin=t.stats.score-m.teams[1-side].stats.score;
 if(p.dropGoal==='Never'||m.field<68||m.phase<2||p.dropGoal==='Late close game'&&!(m.minute>=72&&margin>=-3&&margin<=0)||random(m)>(p.dropGoal==='Late close game'?.24:.055))return false;
 const kicker=fieldKicker(m,side);logTactic(t,'drop_attempts');if(random(m)<clamp(.42+(skill(kicker,'kicking')-75)*.006-(100-m.field)*.004,.10,.78)){kicker.stats.dropGoals=(kicker.stats.dropGoals??0)+1;t.stats.dropGoals=(t.stats.dropGoals??0)+1;t.stats.score+=3;event(m,side,'drop_goal',`${kicker.name} lands a drop goal for three points.`,kicker.id);}else{add(m,side,kicker,'missedKicks');event(m,side,'drop_missed',`${kicker.name} misses the drop-goal attempt.`,kicker.id);}changePossession(m,1-side,28);return true;
}
function shouldKick(m:GameMatch,side:number){const p=plan(m.teams[side].rugby);if(m.field>88)return false;
 if(m.field<35&&p.exit==='Long exits'&&m.phase>=2)return random(m)<.35;
 const frequency=(p.attack==='Kick pressure'?1.8:1)*(p.kicking==='Territorial'?1.5:p.kicking==='Contestable'?1.25:1)*(p.box==='Frequent'?1.25:p.box==='Rare'?.8:1);
 return m.phase>=3&&random(m)<(m.field>65?(p.attackingKick==='Frequent'?.12:p.attackingKick==='Rare'?.01:.045):.075*frequency);
}
function rugbyKick(m:GameMatch,side:number,forced?:'Cross-kick'|'Long exit'){const t=m.teams[side],other=1-side,r=plan(t.rugby),d=plan(m.teams[other].rugby),ps=active(m,side),u=personnel(ps),v=personnel(active(m,other));
 const long=forced==='Long exit'||m.field<35&&r.exit==='Long exits',cross=forced==='Cross-kick'||!long&&m.field>65&&r.attackingKick!=='Rare'&&random(m)<.55;
 const box=!long&&!cross&&r.box!=='Rare'&&random(m)<(r.box==='Frequent'?.7:.25);
 const contest=!long&&(box||r.kicking==='Contestable'||r.kicking==='Balanced'&&random(m)<.25);
 const specialist=m.tacticalVersion===25?ps.find(p=>jobAt(t,p)==='Exit'):undefined;const kicker=(box?ps.find(p=>p.position==='scrum_half'):specialist??ps.find(p=>p.id===t.tacticalKicker))??fieldKicker(m,side),quality=richSkill(kicker,['tactical_kicking','kicking_distance','decision_making'],'kicking'),kind=long?'Long exit':cross?'Cross-kick':box?'Box-kick':contest?'Contestable kick':'Territorial kick';
 logTactic(t,kind);event(m,side,'rugby_kick',`${kicker.name}: ${kind.toLowerCase()}.`,kicker.id);
 const distance=long?35+(quality-65)*.15+random(m)*12:cross?12+random(m)*10:contest?20+random(m)*9:29+(quality-65)*.12+random(m)*13;
 const landing=Math.min(98,m.field+distance);
 if(contest||cross){if(m.tacticalVersion===25)logTactic(t,'contestable_attempts');const retention=clamp((cross?.29:.23)+(quality-70)*.004+(u.aerial-v.aerial)*.004+(d.backfield==='Deep cover'?-.05:d.backfield==='Chase pressure'?.045:0),.08,.57);
  if(random(m)<retention){logTactic(t,'kick_regains');m.field=landing;m.phase=0;t.transition=true;if(m.tacticalVersion===25){t.ballQuality=1;t.disrupted=true;}event(m,side,'kick_regain',`${t.name} reclaim the attacking kick and play on.`);return;}
 }
 if(!cross&&!contest&&random(m)<.67){setPiece(m,other,'lineouts',Math.max(8,100-landing));return;}
 changePossession(m,other,100-landing);logTactic(m.teams[other],'kick_receipts');
 const receiving=plan(m.teams[other].rugby);if(receiving.receipt==='Return kick'||receiving.receipt==='Balanced'&&m.field<30&&random(m)<.55){const back=active(m,other).find(p=>p.id===m.teams[other].tacticalKicker)??fieldKicker(m,other);const metres=clamp(27+(richSkill(back,['tactical_kicking','kicking_distance'],'kicking')-70)*.18,18,40);logTactic(m.teams[other],'return_kicks');event(m,other,'return_kick',`${back.name} returns the kick to touch.`,back.id);setPiece(m,side,'lineouts',Math.max(8,100-m.field-metres));}
 else{m.teams[other].transition=true;logTactic(m.teams[other],'counterattacks');const room=clamp(4+(v.handling-u.cover)*.08-(r.backfield==='Deep cover'?2:r.backfield==='Chase pressure'? -2:0),0,9);m.field=Math.min(98,m.field+room);event(m,other,'counterattack',`${m.teams[other].name} keep the ball and counterattack.`);}
}
function executeStrike(m:GameMatch,side:number){const t=m.teams[side],r=plan(t.rugby),empty={gain:0,breaks:0,ended:false};
 const suitable=(id:Strike)=>id==='power'?m.field>=85:id==='exit'?m.field<45: id==='cross'?m.field>=55&&m.field<89: m.field>=30&&m.field<90;
 let id=t.nextStrike;if(id&&!suitable(id))return empty;
 if(!id){if(random(m)>(t.launch||m.field>=85?.35:.025))return empty;const candidates=r.plays.filter(suitable);if(!candidates.length)return empty;id=candidates[Math.floor(random(m)*candidates.length)];}
 delete t.nextStrike;const move=STRIKES[id],u=personnel(active(m,side)),familiarity=t.familiarity?.[id]??25;logTactic(t,'play_'+id);event(m,side,'strike_play',`${t.name} run ${move.name.toLowerCase()}.`);
 if(random(m)>strikeOdds(id,familiarity,u)){const p=carrier(m,side);logTactic(t,'strike_errors');add(m,side,p,'errors');event(m,side,'strike_error',`${p.name}: the timing breaks down and the move ends in a handling error.`,p.id);setPiece(m,1-side,'scrums',100-m.field);return {...empty,ended:true};}
 if(id==='exit'||id==='cross'){rugbyKick(m,side,id==='exit'?'Long exit':'Cross-kick');return {...empty,ended:true};}
 logTactic(t,'strike_completed');return {gain:id==='power'?1.4:id==='tip'?.65:.4,breaks:move.complexity*.026+(familiarity/100)*.009,ended:false};
}

function setPiece(m:GameMatch,side:number,kind:'lineouts'|'scrums',field:number){
 const t=m.teams[side],other=1-side;
 // Broad prop/hooker qualifications are the available database evidence.
 // Never award a scrum shove/penalty against a side unable to contest safely.
 if(kind==='scrums'&&m.teams.some(t=>t.lineup.slice(0,3).some(id=>t.players[id]?.playingPosition))&&[0,1].some(n=>m.teams[n].lineup.slice(0,3).some((id,i)=>{const p=m.teams[n].players[id];return !p||p.injured||p.sentOff||p.cardUntil>m.minute||p.position!==(i===1?'hooker':'prop')}))){t.stats.scrums++;if(m.intelligence)logTactic(t,'scrums_attempts');changePossession(m,side,field);t.launch='scrum';event(m,side,'uncontested_scrum',`${t.name} retain an uncontested scrum: a qualified front row is unavailable.`);return;}
 if(m.intelligence){logTactic(t,kind+'_attempts');if(kind==='lineouts')logTactic(t,'throw_'+plan(t.rugby).throw);}const diff=strength(m,side,'set_piece','forwards')-strength(m,other,'set_piece','forwards');const rp=plan(t.rugby),dp=plan(m.teams[other].rugby),u=personnel(active(m,side)),v=personnel(active(m,other));const advanced=m.rugbyVersion===2;const unit=(n:number)=>{const ps=active(m,n).filter(p=>kind==='scrums'?['prop','hooker'].includes(p.position):['hooker','lock'].includes(p.position));return ps.reduce((v,p)=>v+richSkill(p,kind==='scrums'?['scrum','strength']:p.position==='hooker'?['throwing','composure']:['lineout','aerial'],'set_piece'),0)/Math.max(1,ps.length)};const richEdge=active(m,side).some(p=>p.rich)?clamp((unit(side)-unit(other))*.002,-.12,.12):0;const retained=random(m)<clamp(richEdge+(advanced?(kind==='lineouts'?lineoutOdds(rp,dp,u,v):scrumOdds(rp,u,v)):clamp(.86+diff*.003,.63,.98)),.55,.98);
 if(retained){t.stats[kind]++;let ps=active(m,side).filter(p=>kind==='scrums'?FORWARDS.includes(p.position):['hooker','lock','loose_forward'].includes(p.position));if(ps.length)pick(m,ps,p=>kind==='lineouts'&&p.position==='lock'?3:1).stats[kind]++;changePossession(m,side,field);if(advanced){t.launch=kind==='lineouts'?'lineout':'scrum';if(m.tacticalVersion===25)t.ballQuality=(kind==='lineouts'?rp.lineoutBall==='Quick':rp.scrum==='Quick release')?1:0;logTactic(t,kind);if(kind==='lineouts'){logTactic(t,'lineout_'+rp.lineoutTarget);if(rp.lineoutUse==='Maul'){const gain=clamp(3+(u.carrying-v.scrum)*.08-(dp.lineoutDefence==='Defend maul'?2:0),0,8);m.field=Math.min(98,m.field+gain);logTactic(t,'mauls');}else if(rp.lineoutBall==='Quick'){m.field=Math.min(98,m.field+2+(rp.lineoutSize==='Shortened'?1:0)-(dp.lineoutDefence==='Pressure halfback'?2:0));}event(m,side,'lineout_plan',`${rp.lineoutSize} lineout · ${rp.lineoutTarget.toLowerCase()} target · ${rp.throw.toLowerCase()} throw · ${rp.lineoutUse.toLowerCase()}, ${rp.lineoutBall.toLowerCase()} ball.`);}else{if(rp.scrum==='Eight-man pressure'){m.field=Math.min(98,m.field+clamp(2+(u.scrum-v.scrum)*.08,0,5));for(const forward of active(m,side).filter(p=>FORWARDS.includes(p.position)))forward.condition.fatigue=clamp(forward.condition.fatigue+.5,0,100);}if(rp.scrum==='Defensive survival')m.field=Math.max(5,m.field-1);if(rp.scrum==='Quick release')m.field=Math.min(98,m.field+1.5);event(m,side,'scrum_plan',`${rp.scrum} · ${rp.scrumLaunch.toLowerCase()}.`);if(rp.scrum==='Attack for penalty'&&random(m)<clamp(.10+(u.scrum-v.scrum)*.008,.025,.30)){const defenders=active(m,other),front=defenders.filter(p=>FORWARDS.includes(p.position));const offender=pick(m,front.length?front:defenders);add(m,other,offender,'penalties');event(m,side,'scrum_penalty',`${t.name} win a scrum penalty through sustained pressure.`,offender.id);takePenalty(m,side,true);return;}}}event(m,side,kind,`${t.name} secure their ${kind==='lineouts'?'lineout':'scrum'} and build again.`);}
 else{t.stats[kind==='lineouts'?'lineoutsLost':'scrumsLost']++;const winner=tackler(m,other);add(m,other,winner,'turnovers');changePossession(m,other,100-field);event(m,other,'set_piece_turnover',`${m.teams[other].name} disrupt the ${kind==='lineouts'?'lineout':'scrum'} and turn possession over.`,winner.id);}
}
function updateRatings(m:GameMatch){for(const side of m.teams)for(const p of Object.values(side.players)){const s=p.stats;if(!s.minutes){s.rating=0;continue;}const norm=Math.max(30,s.minutes);const contribution=s.tries*.82+s.assists*.5+s.turnovers*.3+s.linebreaks*.17+s.metres*.003+s.tackles*.016+s.conversions*.055+s.penaltyGoals*.1+(s.dropGoals??0)*.25-s.penalties*.2-s.errors*.16-s.missedTackles*.06-s.yellow*.5-s.red*1.1;const result=side.stats.score>m.teams.find(t=>t!==side)!.stats.score ? .15 : -.05;s.rating=Number(clamp(6.1+contribution*65/norm+result,3,10).toFixed(1));}}
export function createMatch(id:string,seed:number,home:Side,away:Side,knockout=false):GameMatch{
 const m:GameMatch={tacticalVersion:25,rugbyVersion:2,id,seed,rng:seed>>>0,minute:0,phase:0,field:28,possession:0,teams:[home,away],events:[],finished:false,halftime:false,knockout,extraTime:false,winner:null,decider:null,nextEventId:1};
 for(const t of m.teams){t.rugby??=aiRugby(t.lineup.map(id=>t.players[id]));t.familiarity??=Object.fromEntries(t.rugby.plays.map(id=>[id,55]));t.tacticalLog??={};if(m.tacticalVersion===25){t.tactics=canonicalTactics(t.rugby,t.tactics);t.ballQuality=0;t.disrupted=false;if(!t.rugby.jobs&&t.autoHalfTime){t.rugby.jobs={};for(const [slot,p] of t.lineup.map((id,i)=>[i,t.players[id]] as const)){if(p.position==='loose_forward')t.rugby.jobs[String(slot)]=eventSkill(p,'impact')>eventSkill(p,'work_rate')?'Carrier':'Support';if(p.position==='fly_half')t.rugby.jobs[String(slot)]='Link';}}}}
 home.matchMood+=(random(m)+random(m)+random(m)-1.5)*5;away.matchMood+=(random(m)+random(m)+random(m)-1.5)*5;m.possession=random(m)<.5?0:1;event(m,m.possession,'kickoff',`${m.teams[m.possession].name} receive the kick-off. We are underway.`);return m;
}
export function substitute(m:GameMatch,side:number,outId:string,inId:string):string|null{
 if(m.finished)return 'The match is finished.';const t=m.teams[side];const index=t.lineup.indexOf(outId),incoming=t.players[inId],outgoing=t.players[outId];
 if(index<0||!t.bench.includes(inId)||!incoming||!outgoing)return 'Choose an on-field player and an unused replacement.';
 if(outgoing.sentOff||outgoing.cardUntil>m.minute)return 'A carded player cannot be tactically replaced.';
 if(incoming.entered||incoming.injured||incoming.sentOff)return 'That replacement is unavailable.';
 if(!canCover(incoming,outgoing))return 'That replacement cannot cover this position under the current game rules.';
 t.lineup[index]=inId;t.bench=t.bench.filter(id=>id!==inId);t.used.push(outId);outgoing.left=true;incoming.entered=true;
 incoming.playingPosition=outgoing.playingPosition??outgoing.position;const fit=suitability(incoming.position,incoming.playingPosition);if(fit.factor<1)event(m,side,'cover',`${incoming.name}: ${fit.label.toLowerCase()} cover. Positional execution is reduced; physical attributes are unchanged.`,inId);
 event(m,side,'substitution',`${incoming.name} replaces ${outgoing.name}.`,inId);return null;
}
export function changeTactics(m:GameMatch,side:number,tactics:Tactics){if(m.finished)return;for(const v of Object.values(tactics))if(!Number.isInteger(v)||v<0||v>2)throw Error('Invalid tactical setting');if(m.tacticalVersion===25){const t=m.teams[side],next={...plan(t.rugby),tempo:tactics.tempo,risk:tactics.risk,attack:tactics.territory===2?'Kick pressure' as const:tactics.width===2?'Wide shape' as const:tactics.phaseStyle===0?'Forward power' as const:'Balanced phase play' as const};changeRugby(t,next);t.tactics=canonicalTactics(next);t.adjustment={minute:m.minute,before:{...t.tacticalLog}};t.lastAdviceMinute=m.minute;}else m.teams[side].tactics={...tactics};event(m,side,'tactics',`${m.teams[side].name} change their tactical approach.`);}
function autoSubs(m:GameMatch,side:number){
 const t=m.teams[side];if((!t.autoManage&&!Object.keys(t.minuteLimits??{}).length)||m.minute>= (m.extraTime?100:80))return;
 const margin=t.stats.score-m.teams[1-side].stats.score,approach=t.approach??'Balanced';
 for(const out of t.lineup.map(id=>t.players[id])){
  if(m.live?.side===side&&(out.injured||(t.minuteLimits?.[out.id]??1000)<=out.stats.minutes)&&!m.live.acknowledged?.includes(out.id))continue;
  if(out.sentOff||out.cardUntil>m.minute||out.stats.minutes<15&&!out.injured)continue;
  const options=t.bench.map(id=>t.players[id]).filter(p=>!p.entered&&!p.injured&&!p.sentOff&&canCover(p,out)).sort((a,b)=>Number(b.position===out.position)-Number(a.position===out.position)||(b.overall-b.condition.fatigue*.3+Number(t.developmentIds?.includes(b.id))*(approach==='Development'?8:2))-(a.overall-a.condition.fatigue*.3+Number(t.developmentIds?.includes(a.id))*(approach==='Development'?8:2)));
  const incoming=options[0];if(!incoming)continue;
  const development=t.developmentIds?.includes(incoming.id)&&(approach==='Development'||approach==='Balanced'&&Math.abs(margin)>=12)&&m.minute>=50;
  const front=['prop','hooker'].includes(out.position);
  const limited=(t.minuteLimits?.[out.id]??1000)<=out.stats.minutes;
  const planned=t.autoManage&&(t.benchPlan==='Front-row refresh'&&front&&m.minute>=50||t.benchPlan==='Fresh backs'&&!front&&m.minute>=58&&out.condition.fatigue>18||t.benchPlan==='Prospect minutes'&&m.minute>=55&&margin>=12&&t.developmentIds?.includes(incoming.id)||t.benchPlan==='Protect the lead'&&margin>0&&m.minute>=60&&incoming.overall-out.condition.fatigue*.1>=out.overall-8||t.benchPlan==='Chase the match'&&margin<0&&m.minute>=55&&incoming.overall>=out.overall-5);
  if(!t.autoManage&&!limited&&!out.injured)continue;
  if(t.benchPlan==='Keep playmaker'&&out.id===t.tacticalKicker&&!out.injured&&!limited&&out.condition.fatigue<45)continue;
  const freshness=m.minute>=(front?50:58)&&out.condition.fatigue>=(approach==='Strongest result'?23:16);
  const tactical=m.minute>=60&&margin<0&&incoming.overall-out.overall+out.condition.fatigue*.25>=0;
  const rotation=m.minute>=68&&Math.abs(margin)>=14;
  const performance=m.minute>=55&&out.stats.minutes>=30&&out.stats.errors+out.stats.penalties>=4;
  if(!limited&&!planned&&!out.injured&&!development&&!freshness&&!tactical&&!rotation&&!performance)continue;
  // Preserve late injury cover until the last ten minutes.
  if(!limited&&!out.injured&&t.bench.length<=2&&m.minute<70)continue;
  const reason=out.injured?'injury':limited?'return-to-play minutes limit':planned?'manager bench plan':development?'planned development minutes':freshness?'fresh legs':tactical?'chasing the result':performance?'performance':'rotation with the result opening up';
  if(!substitute(m,side,out.id,incoming.id))m.events[m.events.length-1].text+= ' Assistant: '+reason+'.';
 }
}
export function advancePhase(m:GameMatch){
 if(m.finished||m.pendingPenalty)return m;
 checkpoint(m);
 if(m.halftime&&m.minute===40&&!m.halfTimeHandled){m.halfTimeHandled=true;for(let side=0;side<2;side++){const t=m.teams[side];if(!t.autoHalfTime)continue;const advice=halfTimeAdvice(m,side);if(m.tacticalVersion!==25&&advice.plan&&t.approach!=='Development')changeTactics(m,side,MATCH_PLANS[advice.plan]);for(const sub of advice.subs){if(!substitute(m,side,sub.off,sub.on))m.events[m.events.length-1].text+=' Assistant halftime: '+sub.reason+'.';}}}
 if(m.halftime&&m.minute===40)event(m,m.possession,'second_half',`${m.teams[m.possession].name} receive the second-half kick-off.`);
 if(m.intelligence)for(let i=0;i<2;i++){if(!m.teams[i].autoHalfTime)continue;const a=aiDecision(m,i);if(a)updateRugby(m,i,{...plan(m.teams[i].rugby),...a.patch},a.reason);}
 const side=m.possession,other=1-side,t=m.teams[side],d=m.teams[other],tac=t.tactics,def=d.tactics;const advanced=m.rugbyVersion===2,rp=plan(t.rugby),dp=plan(d.rugby);
 const seconds=(CONFIG.phaseSeconds+random(m)*CONFIG.phaseJitter)*(1-.12*(tac.tempo-1));const end=!m.halftime?40:m.extraTime?100:80;const dt=Math.min(seconds/60,end-m.minute);m.minute+=dt;t.stats.possessionSeconds+=dt*60;m.teams[m.field>=50?side:other].stats.territorySeconds+=dt*60;t.stats.territorySum+=m.field;t.stats.phases++;
 for(let team=0;team<2;team++){
  const teamPlan=plan(m.teams[team].rugby),mobilityLoad=advanced&&m.teams[team].tactics.tempo===2?clamp((75-personnel(active(m,team)).mobility)*.008,-.1,.2):0;
  for(const p of active(m,team)){p.stats.minutes+=dt;p.condition.fatigue=clamp(p.condition.fatigue+dt*CONFIG.fatiguePerMinute*(1+.20*(m.teams[team].tactics.tempo-1)+.13*(m.teams[team].tactics.breakdown-1)+(advanced?(teamPlan.ruck==='Heavy'?.14:0)+(teamPlan.defence==='Blitz'?.1:0)+mobilityLoad:0)),0,100);p.condition.fitness=clamp(p.condition.fitness-dt*.065,45,100);
   if(random(m)<dt*CONFIG.injuryRate*(1+p.condition.fatigue/35)*(p.injuryResistance?1.3-p.injuryResistance*.3:1)){p.injured=true;p.injuryName=random(m)<.7?'Minor strain':'Contact injury';p.injuryWeeks=p.injuryName==='Minor strain'?1+Math.floor(random(m)*2):3+Math.floor(random(m)*4);if(p.rich&&random(m)<.025){p.injuryName='Knee ligament injury';p.injuryWeeks=12+Math.floor(random(m)*13);}event(m,team,'injury',`${p.name} leaves the field with a ${p.injuryName.toLowerCase()}.`,p.id);}
  }autoSubs(m,team);
 }
 if(!m.halftime&&m.minute>=40){m.halftime=true;for(const s of m.teams)for(const p of Object.values(s.players))p.condition.fatigue=Math.max(0,p.condition.fatigue-3);event(m,side,'halftime','Half-time. Both sides regroup.');changePossession(m,1-m.events[0].side,28);checkpoint(m,true);return m;}
 if(m.minute>=end){
  if(m.knockout&&t.stats.score===d.stats.score&&!m.extraTime){m.extraTime=true;event(m,side,'extra_time','Level at full-time. Twenty minutes of extra time will decide this knockout match.');changePossession(m,1-side,28);return m;}
  m.finished=true;m.winner=m.teams[0].stats.score===m.teams[1].stats.score?null:m.teams[0].stats.score>m.teams[1].stats.score?0:1;
  if(m.knockout&&m.winner===null){const goals=[0,0];for(let i=0;i<5;i++)for(let s=0;s<2;s++)if(random(m)<clamp(.65+(skill(fieldKicker(m,s),'kicking')-70)*.005,.3,.93))goals[s]++;while(goals[0]===goals[1])for(let s=0;s<2;s++)if(random(m)<.75)goals[s]++;m.winner=goals[0]>goals[1]?0:1;m.decider=`Kick shoot-out ${goals[0]}–${goals[1]}`;event(m,m.winner,'shootout',`${m.teams[m.winner].name} win the kick shoot-out ${goals[m.winner]}–${goals[1-m.winner]}.`);}
  updateRatings(m);checkpoint(m,true);event(m,m.winner??0,'fulltime',`Full-time: ${m.teams[0].name} ${m.teams[0].stats.score}–${m.teams[1].stats.score} ${m.teams[1].name}.`);return m;
 }
 if(active(m,side).length<3||active(m,other).length<3){m.finished=true;m.winner=active(m,side).length<3?other:side;event(m,m.winner,'abandoned','Match abandoned because a side cannot field enough players.');return m;}
 const u=personnel(active(m,side)),v=personnel(active(m,other)),effects=advanced?tacticalEffects(rp,dp,u,v,m.field,tac.tempo):{gain:0,breaks:0,error:1,turnover:1,fatigue:1};
 if(!m.intelligence&&m.tacticalVersion===25)for(let i=0;i<2;i++){const ai=m.teams[i];if(ai.autoHalfTime&&m.minute>=25&&m.minute-(ai.lastAdviceMinute??0)>18){const suggestion=advice(ai);if(suggestion)updateRugby(m,i,{...plan(ai.rugby),...suggestion.patch});}}
 if(!m.intelligence&&advanced&&m.minute>=65)for(let i=0;i<2;i++){const ai=m.teams[i];if(ai.autoHalfTime&&!ai.tacticalLog?.late_adjustment){const margin=ai.stats.score-m.teams[1-i].stats.score;const next={...plan(ai.rugby)};if(margin>7){next.exit='Long exits';next.kicking='Territorial';next.penalty='Posts';}else if(margin< -7){next.penalty='Corner';next.receipt='Counterattack';next.lineoutBall='Quick';}else continue;updateRugby(m,i,next);logTactic(ai,'late_adjustment');}}
 if(advanced&&t.launch==='lineout'&&rp.lineoutUse==='Launch'){effects.gain+=(rp.lineoutSize==='Shortened'?.35:0)+(rp.lineoutTarget==='Back'?.65:rp.lineoutTarget==='Middle'?.2:0);effects.breaks+=rp.throw==='Long'?.007:0;}
 if(advanced&&tryDropGoal(m,side))return m;
 const strike=advanced?executeStrike(m,side):{gain:0,breaks:0,ended:false};if(strike.ended)return m;
 const transition=advanced&&t.transition;if(m.tacticalVersion===25&&transition)t.disrupted=true;t.transition=false;
 const attack=strength(m,side,'attack'),defence=strength(m,other,'defence');const pack=strength(m,side,'attack','forwards'),backs=strength(m,side,'attack','backs');const synergy=(tac.phaseStyle-1)*(backs-pack)*.11+(tac.width-1)*(backs-72)*.06;
 const fatigue=active(m,side).reduce((s,p)=>s+p.condition.fatigue,0)/active(m,side).length;
 const numerical=(active(m,side).length-active(m,other).length)*2.9;const diff=attack-defence+synergy+numerical+(transition&&rp.attack==='Counterattack'?clamp((u.handling-v.cover)*.15+3,-2,7):0);
 const penaltyChance=CONFIG.penaltyRate*(advanced&&!m.intelligence?(dp.contest==='Compete'?1.25:dp.contest==='Fan out'?.85:1)*(dp.defence==='Blitz'?1.12:1):1)*(1+.28*(def.breakdown-1)+.18*(def.lineSpeed-1))*clamp(1+(75-strength(m,other,'discipline'))*.012,.62,1.6);
 if(random(m)<penaltyChance){const offender=pick(m,active(m,other),p=>Math.max(.2,(120-skill(p,'discipline'))/40)*(m.tacticalVersion===25&&jobAt(d,p)==='Contest'?1.4:1));add(m,other,offender,'penalties');event(m,side,'penalty',`${offender.name} is penalised at the breakdown. Advantage ${t.name}.`,offender.id);const cardRoll=random(m);
  if(cardRoll<CONFIG.redPerPenalty){offender.sentOff=true;add(m,other,offender,'red');event(m,other,'red',`${offender.name} is sent off. ${d.name} will play short.`,offender.id);}
  else if(cardRoll<CONFIG.redPerPenalty+CONFIG.yellowPerPenalty){add(m,other,offender,'yellow');if(offender.stats.yellow>=2){offender.sentOff=true;add(m,other,offender,'red');event(m,other,'red',`${offender.name} receives a second yellow and is sent off.`,offender.id);}else{offender.cardUntil=m.minute+10;event(m,other,'yellow',`${offender.name} goes to the sin bin for ten minutes.`,offender.id);}}
  if(advanced){takePenalty(m,side);return m;}const close=m.minute>66&&Math.abs(t.stats.score-d.stats.score)<=6;
  if(m.field>=60&&random(m)<(close?.48:.12+.06*tac.territory)){kickGoal(m,side,false);changePossession(m,other,28);}else setPiece(m,side,'lineouts',Math.min(92,m.field+24));return m;
 }
 if(m.tacticalVersion===25&&shouldKick(m,side)){rugbyKick(m,side);return m;}
 const p=carrier(m,side);if(m.intelligence)logTactic(t,'group_'+group(p)+'_attempts');if(m.tacticalVersion===25){logTactic(t,'carry_attempts');logTactic(t,'job_'+jobAt(t,p));}const context=m.tacticalVersion===25?phaseContext(t,active(m,other),active(m,side),p):null;if(context){effects.error*=clamp(1-(context.ball+context.distribution)*.025+(context.receivers*.03),.7,1.4);effects.breaks+=(context.ball+context.space+context.distribution-context.receivers)*.0015;effects.turnover*=clamp(1-context.support*.07,.70,1.2);}
 const contestPlayers=m.tacticalVersion===25?active(m,other).filter(q=>jobAt(d,q)==='Contest'):[];const contestEffect=contestPlayers.length?clamp(1+contestPlayers.reduce((n,q)=>n+(eventSkill(q,'work_rate')-60)*.006,0),.8,1.35):1;const turnoverChance=CONFIG.turnoverRate*contestEffect*effects.turnover*(m.intelligence?1:(1+.28*(def.breakdown-1)))*(1+.15*(tac.offloads-1))*clamp(1+(strength(m,other,'work_rate')-strength(m,side,'work_rate'))*.012,.65,1.5);
 if(random(m)<turnoverChance){const winner=tackler(m,other);add(m,other,winner,'turnovers');event(m,other,'turnover',`${winner.name} wins the ball at the breakdown.`,winner.id);changePossession(m,other,100-m.field);if(advanced)m.teams[other].transition=true;return m;}
 const errorChance=CONFIG.errorRate*(p.rich?clamp(1+(70-richSkill(p,['handling','passing','composure'],'attack'))*.012,.55,1.6):1)*effects.error*(1-(t.preparation?.focus==='Handling'?t.preparation.bonus*.025:0))*(1+.3*(tac.risk-1)+.23*(tac.offloads-1)+.2*(tac.tempo-1)+.10*(tac.width-1)+fatigue*.004);
 if(random(m)<errorChance){if(context)logTactic(t,'carry_errors');add(m,side,p,'errors');event(m,side,'error',`${p.name} spills the ball under pressure.`,p.id);setPiece(m,other,'scrums',100-m.field);return m;}
 if(advanced&&m.tacticalVersion!==25&&shouldKick(m,side)){rugbyKick(m,side);return m;}
 if(!advanced&&m.phase>=CONFIG.kickAfterPhases&&m.field<79&&random(m)<CONFIG.kickRate*(.25+tac.territory*.85)){
  const kicker=active(m,side).find(p=>p.id===t.tacticalKicker)??fieldKicker(m,side);const distance=CONFIG.kickMetres+random(m)*13+(kicker.overall-75)*.1;
  event(m,side,'territory_kick',`${kicker.name} kicks into space and ${t.name} chase for territory.`,kicker.id);setPiece(m,other,'lineouts',Math.max(8,100-m.field-distance));return m;
 }
 const defenderUnit=FORWARDS.includes(p.position)?active(m,other).filter(q=>FORWARDS.includes(q.position)):active(m,other).filter(q=>!FORWARDS.includes(q.position));const duel=context?eventSkill(p,rp.attack==='Forward power'?'impact':'attack')-(defenderUnit.length?defenderUnit.reduce((n,q)=>n+eventSkill(q,'defence'),0)/defenderUnit.length:35):0;
 const pressure=(def.lineSpeed-1);const breakChance=clamp(CONFIG.linebreakRate+(p.rich?(richSkill(p,['pace','acceleration','evasion'],'attack')-75)*.001:0)+effects.breaks+strike.breaks+(context?diff*.0005+duel*.001:diff*.0012)+.016*(tac.risk-1)+.010*(tac.tempo-1)+.006*(tac.width-def.defensiveWidth)+.007*pressure+.009*(tac.offloads-1),.009,.15);
 const broke=random(m)<breakChance;let gain=CONFIG.baseMetres+effects.gain+strike.gain+(advanced?clamp((skill(p,rp.attack==='Forward power'||rp.carriers==='Centres'?'impact':'attack')-defence)*.025,-.7,.7):0)+random(m)*1.9+diff*.022-pressure*.25+.55*(tac.tempo-1)+.55*(tac.risk-1)+.35*(def.defensiveWidth-1);
 if(broke){if(m.intelligence)logTactic(t,'group_'+group(p)+'_breaks');gain+=CONFIG.breakMetres+random(m)*13;add(m,side,p,'linebreaks');const missed=tackler(m,other);add(m,other,missed,'missedTackles');event(m,side,'linebreak',`${p.name} breaks the line and surges into space!`,p.id);}
 else{const defender=tackler(m,other);if(random(m)<clamp(CONFIG.missedTackleRate+diff*.001+.024*pressure,.045,.3)){add(m,other,defender,'missedTackles');gain+=3+random(m)*4;const covering=tackler(m,other);add(m,other,covering,'tackles');}else add(m,other,defender,'tackles');if(random(m)<CONFIG.assistTackleRate)add(m,other,tackler(m,other),'tackles');}
 delete t.launch;gain=Math.max(0,Math.min(gain+(context?clamp(duel*.055,-2,2):0),100-m.field));if(context){logTactic(t,'retained_carries');if(gain>=3)logTactic(t,'positive_carries');const ball=duel*.025+context.support*.35+(rp.ruck==='Heavy'?.45:rp.ruck==='Light'?-.35:0)+random(m)*2-1;t.ballQuality=ball>.65?1:ball<-.35?-1:0;t.disrupted=broke||t.ballQuality===1;logTactic(t,t.ballQuality===1?'quick_ball':t.ballQuality===-1?'slow_ball':'ordinary_ball');if(jobAt(t,p)==='Carrier')p.condition.fatigue=clamp(p.condition.fatigue+.12,0,100);}if(m.intelligence){const key='group_'+group(p);t.tacticalLog![key+'_metres']=(t.tacticalLog![key+'_metres']??0)+Math.round(gain);if(gain>=3)logTactic(t,key+'_positive');}add(m,side,p,'metres',Math.round(gain));m.field+=gain;m.phase++;
 let support:SimPlayer|undefined;
 if(random(m)<.038*(.4+tac.offloads*.7)*(p.rich?clamp(richSkill(p,['offloading','support_play'],'attack')/70,.5,1.4):1)){support=pick(m,active(m,side).filter(q=>q.id!==p.id));add(m,side,p,'offloads');m.field=Math.min(100,m.field+2);}
 if(m.field>=100){
  if(random(m)<clamp(CONFIG.tryFinish+diff*.005+(p.rich?(richSkill(support??p,['finishing','composure'],'attack')-75)*.006:0),.30,.90)){const scorer=support??p;add(m,side,scorer,'tries');t.stats.score+=5;if(support)add(m,side,p,'assists');else if(random(m)<.59){const passer=pick(m,active(m,side).filter(q=>q.id!==p.id),q=>['scrum_half','fly_half'].includes(q.position)?3:1);add(m,side,passer,'assists');}event(m,side,'try',`TRY ${t.name.toUpperCase()}! ${scorer.name} finishes the move.`,scorer.id);kickGoal(m,side,true);changePossession(m,other,28);}
  else{event(m,other,'held_up',`${d.name} hold the ball up over the line and earn a goal-line drop-out.`);changePossession(m,side,52);}
 }else if(m.phase%6===0)event(m,side,'phases',`${t.name} build through ${m.phase} phases, ${Math.round(100-m.field)} metres from the line.${m.tacticalVersion===25?` ${t.ballQuality===1?'Quick':t.ballQuality===-1?'Slow':'Ordinary'} ball from the last carry.`:''}`,p.id);
 if(Math.floor(m.minute*4)!==Math.floor((m.minute-dt)*4))updateRatings(m);
 return m;
}
export function advanceMatch(m:GameMatch,phases=1){for(let i=0;i<phases&&!m.finished&&!m.pendingPenalty;i++){const wasHalf=m.halftime;advancePhase(m);if(m.intelligence&&!wasHalf&&m.halftime)break;}return m;}
export function instantResult(m:GameMatch){const live=m.live;delete m.live;const control=m.penaltyControl;delete m.penaltyControl;if(m.pendingPenalty)resolvePenalty(m,'Game plan');for(const t of m.teams){t.autoManage=true;t.autoHalfTime=true;}let guard=0;while(!m.finished&&guard++<1500)advancePhase(m);if(!m.finished)throw Error('Match engine failed to finish.');if(control)m.penaltyControl=control;if(live){m.live=live;delete live.pause;delete live.clock;}return m;}
// User quick simulation preserves decision stops; background simulation delegates.
export function simulateManagedMatch(m:GameMatch){const live=m.live;delete m.live;for(let i=0;i<2;i++){m.teams[i].autoManage=true;if(i!==m.penaltyControl?.side)m.teams[i].autoHalfTime=true;}let guard=0;while(!m.finished&&!m.pendingPenalty&&guard++<1500)advancePhase(m);if(!m.finished&&!m.pendingPenalty)throw Error('Match engine failed to finish.');if(live){m.live=live;delete live.pause;delete live.clock;}return m;}
export function observations(m:GameMatch):string[]{
 const lines:string[]=[];for(const t of m.teams){const opponent=m.teams.find(s=>s!==t)!;lines.push(`${t.name} made ${t.stats.linebreaks} line breaks and ${t.stats.metres} metres; ${t.stats.errors} handling errors ended attacking sequences.`);if(t.tactics.breakdown===2)lines.push(`${t.name} finished with high breakdown commitment selected: ${t.stats.turnovers} turnovers won and ${t.stats.penalties} penalties conceded across the match.`);else if(t.stats.penalties>=10)lines.push(`${t.name} conceded ${t.stats.penalties} penalties; review their timing and outcomes in the match timeline.`);}
 const potm=Object.values(m.teams.flatMap(t=>Object.values(t.players))).filter(p=>p.stats.minutes>=20).sort((a,b)=>b.stats.rating-a.stats.rating)[0];if(potm)lines.push(`${potm.name} led the individual ratings with ${potm.stats.rating.toFixed(1)}: ${potm.stats.tries} tries, ${potm.stats.tackles} tackles and ${potm.stats.turnovers} turnovers.`);return lines.slice(0,4);
}

export function swapFieldPlayers(m:GameMatch,side:number,a:string,b:string):string|null{
 if(m.finished)return 'The match is finished.';const t=m.teams[side],i=t.lineup.indexOf(a),j=t.lineup.indexOf(b),p=t.players[a],q=t.players[b];
 if(i<0||j<0||i===j)return 'Choose two on-field players.';
 if([p,q].some(p=>p.injured||p.sentOff||p.cardUntil>m.minute))return 'An unavailable player cannot change positions.';
 if(!canCover(p,q)||!canCover(q,p))return 'Both players must cover their new position.';
 const first=p.playingPosition??p.position;p.playingPosition=q.playingPosition??q.position;q.playingPosition=first;[t.lineup[i],t.lineup[j]]=[b,a];event(m,side,'position_change',`${p.name} and ${q.name} exchange positions.`);return null;
}
