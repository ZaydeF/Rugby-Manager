import {validOffice} from '../club/staff.ts';
import {validWeekly} from '../product/weekly.ts';
import {validIdentity} from '../career-setup/state.ts';
import {penaltyModeSchema,penaltyControlSchema,pendingPenaltySchema,intelligenceSchema,memorySchema,contextSchema} from './intelligence-schema.ts';
import {validWorld} from '../world/validation.ts';
import {validArchive} from './archive.ts';
import {validDynamics} from '../management/dynamics.ts';
import {rugbySchema,preparationSchema,familiaritySchema} from './rugby.ts';
import {validCoaching} from '../management/coaching.ts';
import {validScouting} from '../scouting.ts';
import {compatibleFoundation} from '../packs/foundation.ts';
import {validRepresentative} from '../representative/validation.ts';
import {validFuture} from '../future/validation.ts';
import {validMarket} from '../market/validation.ts';
import {fullUniverse} from '../future/catalog.ts';
import {validManagement} from '../management/validation.ts';
import {z} from 'zod';
import {DEFAULT_TACTICS} from './config.ts';
import {blankPlayerStats,blankTeamStats} from './selection.ts';
import type {Season,SimUniverse,GameMatch} from './types.ts';
const number=z.number().finite();
const positive=number.nonnegative();
const id=z.string().min(1).max(80);
const text=z.string().max(800);
const condition=z.object({fitness:number.min(0).max(100),fatigue:number.min(0).max(100),form:number.min(-4).max(4),morale:number.min(0).max(100),sharpness:number.min(0).max(100),injuryWeeks:number.int().min(0).max(30),injuryName:text.nullable()});
const tactics=z.object(Object.fromEntries(Object.keys(DEFAULT_TACTICS).map(k=>[k,number.int().min(0).max(2)])) as Record<keyof typeof DEFAULT_TACTICS,z.ZodNumber>);
const stats=(values:object)=>z.object(Object.fromEntries(Object.keys(values).map(k=>[k,positive]))).extend({dropGoals:positive.int().optional()});
const player=z.object({shirtNumber:number.int().min(1).max(23).optional(),playingPosition:z.string().max(40).optional(),id,name:text,position:id,overall:number.min(1).max(100),attributes:z.object(Object.fromEntries(['attack','defence','work_rate','set_piece','kicking','discipline','engine','impact'].map(k=>[k,number.min(0).max(100).nullable()]))),condition,stats:stats(blankPlayerStats()),cardUntil:positive,sentOff:z.boolean(),injured:z.boolean(),injuryName:text.nullable(),injuryWeeks:positive.int().max(30),entered:z.boolean(),left:z.boolean()});
const side=z.object({captain:z.string().optional(),benchPlan:z.enum(['Balanced','Front-row refresh','Protect the lead','Chase the match','Prospect minutes','Fresh backs','Keep playmaker']).optional(),minuteLimits:z.record(number.min(0).max(80)).optional(),ballQuality:number.int().min(-1).max(1).optional(),disrupted:z.boolean().optional(),lastAdviceMinute:positive.optional(),adjustment:z.object({minute:positive,before:z.record(positive.int())}).optional(),rugby:rugbySchema.optional(),familiarity:familiaritySchema.optional(),nextStrike:z.enum(['midfield','blindside','tip','screen','cross','exit','power']).optional(),launch:z.enum(['lineout','scrum']).optional(),transition:z.boolean().optional(),tacticalLog:z.record(z.string().max(80),positive.int()).optional(),autoHalfTime:z.boolean().optional(),preparation:z.object({focus:z.enum(['Balanced','Defence','Handling','Set piece']),bonus:number.min(0).max(2)}).optional(),approach:z.enum(['Strongest result','Balanced','Development']).optional(),developmentIds:z.array(id).optional(),id,name:text,players:z.record(player),lineup:z.array(id).length(15),bench:z.array(id).max(8),used:z.array(id).max(8),tactics,kicker:id,secondaryKicker:id,tacticalKicker:id,stats:stats(blankTeamStats()),autoManage:z.boolean(),matchMood:number.min(-10).max(10)});
const match=z.object({cohesionVersion:z.literal(1).optional(),live:z.object({clock:number.min(0).max(100).optional(),side:number.int().min(0).max(1),pause:z.string().max(300).optional(),review60:z.boolean(),reviewed60:z.boolean().optional(),acknowledged:z.array(id).max(23).optional()}).optional(),intelligence:intelligenceSchema.optional(),penaltyControl:penaltyControlSchema.optional(),pendingPenalty:pendingPenaltySchema.optional(),tacticalVersion:z.literal(25).optional(),rugbyVersion:z.literal(2).optional(),halfTimeHandled:z.boolean().optional(),id,seed:number.int(),rng:positive.int().max(4294967295),minute:number.min(0).max(100),phase:positive.int(),field:number.min(0).max(100),possession:number.int().min(0).max(1),teams:z.tuple([side,side]),events:z.array(z.object({context:contextSchema.optional(),id:positive.int(),minute:number.min(0).max(100),side:number.int().min(0).max(1),kind:id,text,playerId:id.optional(),score:z.tuple([positive.int(),positive.int()]),field:number.min(0).max(100)})).max(1500),finished:z.boolean(),halftime:z.boolean(),knockout:z.boolean(),extraTime:z.boolean(),winner:number.int().min(0).max(1).nullable(),decider:text.nullable(),nextEventId:positive.int()});
const standing=z.object({id,name:text,played:positive.int(),wins:positive.int(),draws:positive.int(),losses:positive.int(),for:positive.int(),against:positive.int(),triesFor:positive.int(),triesAgainst:positive.int(),points:positive.int(),bonus:positive.int(),form:z.array(z.enum(['W','D','L'])).max(16)});
const schema=z.object({benchSplit:z.enum(['4-4','5-3','6-2','7-1']).optional(),penaltyMode:penaltyModeSchema.optional(),matchMemory:memorySchema.optional(),tacticalVersion:z.literal(25).optional(),starBenchmark:z.object({year:number.int(),value:number.min(25).max(99)}).optional(),primaryRugby:rugbySchema.optional(),rugbyPlan:rugbySchema.optional(),rugbyPreparation:preparationSchema.optional(),savedRugby:rugbySchema.optional(),drawOrder:z.array(number.int().min(1).max(16)).length(16).optional(),managerPlans:z.object({training:z.object({load:z.enum(['Recovery','Balanced','Intensive']),focus:z.enum(['Balanced','Defence','Handling','Set piece']),appliedKey:z.string().max(40).optional()}).optional(),savedTactics:tactics.optional(),nextMatch:z.object({fixtureId:id,players:z.record(z.enum(['start','bench','rest']))}).optional(),approach:z.enum(['Strongest result','Balanced','Development']),assistantSelection:z.boolean(),assistantSubs:z.boolean(),players:z.record(z.object({role:z.enum(['Key starter','Rotation','Developing prospect','Depth']),position:id,minutes:number.int().min(0).max(2000),usage:z.enum(['Balanced','Start easier fixtures','Regular bench'])})),preferred:z.record(z.object({starter:z.string(),backup:z.string()})),releaseAtExpiry:z.array(id)}).optional(),ratingReview:z.number().int().min(0).max(2).optional(),version:z.union([z.literal(2),z.literal(3),z.literal(4),z.literal(5)]),modelVersion:id,year:number.int().min(2027).max(9999),teamId:id,seed:number.int(),round:number.int().min(1).max(19),fixtures:z.array(z.object({id,round:number.int().min(1).max(19),date:id,home:id,away:id,venue:text,stage:text,result:match.optional()})).min(77).max(83),condition:z.record(condition),standings:z.array(standing).length(11),tactics,selection:z.array(z.string()).length(23),kicker:id,secondaryKicker:id,tacticalKicker:id,activeMatch:match.nullable(),activeFixtureId:id.nullable(),champion:id.nullable(),finalSeeds:z.array(id).max(6),news:z.array(z.object({id,title:text,text})).max(100),history:z.array(z.object({year:number.int(),champion:id,runnerUp:id})).max(8000)});
export function validSave(value:unknown,data:SimUniverse):value is Season{
 try{
  if(!validOffice(value as Season)||!validWeekly(value as Season)||!validIdentity(value as Season))return false;
  if((value as Season)?.version===6)return validWorld(value,m=>match.safeParse(m).success&&validPending(m as GameMatch));
  if(!schema.safeParse(value).success)return false;const s=value as Season;if(!compatibleFoundation(s.foundation)||!validScouting(s)||!validCoaching(s)||!validDynamics(s)||!validArchive(s))return false;if(s.modelVersion!==data.config.version)return false;
  if(s.version===2&&s.management!==undefined)return false;
  if(s.version<4&&(s.future!==undefined||s.market!==undefined))return false;
  if(s.version>=4){if(!validFuture(s,data))return false;data=fullUniverse(s,data);if(!validMarket(s,data))return false;}
  if(s.version>=5&&!validRepresentative(s,data,m=>match.safeParse(m).success))return false;if(s.version<5&&s.representative!==undefined)return false;
  if(s.version>=3&&!validManagement(s,data))return false;
  const players=new Map(data.players.map(p=>[p.player_id,p])),teams=new Set(data.teams.map(t=>t.id));
  if(!teams.has(s.teamId)||s.champion&&!teams.has(s.champion)||s.finalSeeds.some(id=>!teams.has(id))||s.history.some(h=>!teams.has(h.champion)||!teams.has(h.runnerUp)))return false;
  if(Object.keys(s.condition).length!==players.size||data.players.some(p=>!s.condition[p.player_id]))return false;
  if(s.selection.some(id=>id&&(s.management?s.management.players[id]?.clubId:players.get(id)?.squad_id)!==s.teamId)||new Set(s.selection.filter(Boolean)).size!==s.selection.filter(Boolean).length)return false;
  if([s.kicker,s.secondaryKicker,s.tacticalKicker].some(id=>(s.management?s.management.players[id]?.clubId:players.get(id)?.squad_id)!==s.teamId))return false;
  if(new Set(s.fixtures.map(f=>f.id)).size!==s.fixtures.length||new Set(s.standings.map(r=>r.id)).size!==11||s.standings.some(r=>!teams.has(r.id)))return false;
  const original=new Map(data.fixtures.map(f=>[`${s.year}-${f.id}`,f]));
  if(s.fixtures.filter(f=>f.round<=16).length!==77||s.drawOrder&&new Set(s.drawOrder).size!==16)return false;
  if(s.managerPlans){if(s.managerPlans.nextMatch&&(!s.fixtures.some(f=>f.id===s.managerPlans!.nextMatch!.fixtureId)||Object.keys(s.managerPlans.nextMatch.players).some(id=>!players.has(id))))return false;if(Object.entries(s.managerPlans.players).some(([id,p])=>!players.has(id)||players.get(id)?.position!==p.position)||s.managerPlans.releaseAtExpiry.some(id=>!players.has(id))||Object.entries(s.managerPlans.preferred).some(([slot,p])=>!/^([0-9]|1[0-4])$/.test(slot)||[p.starter,p.backup].some(id=>id&&!players.has(id))))return false;}
  function validateMatch(m:GameMatch,home:string,away:string){
   if(!validPending(m))return false;
   if(m.teams[0].id!==home||m.teams[1].id!==away||m.nextEventId<=Math.max(0,...m.events.map(e=>e.id)))return false;
   for(const t of m.teams){const all=[...t.lineup,...t.bench,...t.used];if(all.length!==23||new Set(all).size!==23||Object.keys(t.players).length!==23)return false;
    if(all.some(id=>!t.players[id]||(s.version===2&&players.get(id)?.squad_id!==t.id)||t.players[id].id!==id||players.get(id)?.position!==t.players[id].position))return false;
    if(t.stats.score!==t.stats.tries*5+t.stats.conversions*2+t.stats.penaltyGoals*3+(t.stats.dropGoals??0)*3)return false;
    if(Object.values(t.players).some(p=>p.stats.minutes>m.minute+.001))return false;
   }return true;
  }
  for(const f of s.fixtures){if(!teams.has(f.home)||!teams.has(f.away)||f.home===f.away||!Number.isFinite(Date.parse(f.date)))return false;
   if(f.round<=16){const originalFixture=original.get(f.id);if(!originalFixture||originalFixture.home!==f.home||originalFixture.away!==f.away||(s.drawOrder?s.drawOrder[f.round-1]:f.round)!==originalFixture.round)return false;}
   if(f.result&&(!f.result.finished||f.result.id!==f.id||!validateMatch(f.result,f.home,f.away)))return false;
  }
  if(s.activeMatch&&s.management&&s.activeMatch.teams.some(t=>Object.keys(t.players).some(id=>s.management!.players[id]?.clubId!==t.id)))return false;
  if(s.activeMatch){const f=s.fixtures.find(f=>f.id===s.activeFixtureId);if(!f||f.round!==s.round||f.result||s.activeMatch.id!==f.id||![f.home,f.away].includes(s.teamId)||!validateMatch(s.activeMatch,f.home,f.away))return false;}else if(s.activeFixtureId!==null)return false;
  return true;
 }catch{return false;}
}

function validPending(m:GameMatch){const q=m.pendingPenalty;return !q||!!m.intelligence&&!m.finished&&q.side===m.penaltyControl?.side&&q.side===m.possession&&q.minute===m.minute&&q.field===m.field&&m.events.some(e=>e.id===q.id&&e.kind==='penalty_wait'&&e.side===q.side);}
