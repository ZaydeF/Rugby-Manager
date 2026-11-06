import {z} from 'zod';
import type {Season,Side,Fixture} from '../sim/types.ts';
import {systemSchema,systemRoles,type ClubSystem} from '../sim/club-system.ts';
import {registration,worldPlayers,worldAge,availability,ledger} from '../world/catalog.ts';
import {nextClubFixture} from '../management/advice.ts';
import {addStory} from '../world/pulse.ts';
import {reserved} from '../market/engine.ts';

export const pathways=['Development XV','Senior opportunity'] as const;
export const projectGoals=['Distribution','Gain line','Backfield','Throwing'] as const;
export const goalSkills={Distribution:['passing','decision_making'],'Gain line':['carrying','power'],Backfield:['aerial','defensive_positioning'],Throwing:['throwing','composure']} as const;
const projectSchema=z.object({id:z.string().min(1).max(100),goal:z.enum(projectGoals),route:z.enum(pathways),opened:z.number().int(),coach:z.string().max(100),reps:z.number().min(0).max(40),minutes:z.number().min(0).max(4000),matched:z.number().min(0).max(40),missed:z.number().int().min(0).max(40),lastMinutes:z.number().min(0).max(100),lastReview:z.string().max(100),senior:z.number().min(0).max(4000),youth:z.number().min(0).max(4000)}).strict();
const blockSchema=z.object({fixture:z.string().max(100),week:z.number().int(),plan:systemSchema.nullable(),staff:z.array(z.string().max(100)).max(3),used:z.number().int().min(0).max(3),rehearsal:z.number().min(0).max(1),assignments:z.array(z.string().max(100)).max(3)}).strict();
export const identitySchema=z.object({version:z.literal(1),system:systemSchema.nullable(),projects:z.array(projectSchema).max(2),block:blockSchema.nullable(),delegate:z.boolean(),brief:z.enum(['Any','Distribution','Gain line','Backfield']).default('Any')}).strict();
export type ClubIdentity=z.infer<typeof identitySchema>;
export type ProjectGoal=typeof projectGoals[number];
export type ProjectRoute=typeof pathways[number];
export function identity(s:Season):ClubIdentity{return s.clubIdentity??={version:1,system:null,projects:[],block:null,delegate:false,brief:'Any'};}
export function validClubIdentity(s:Season){const c=s?.clubIdentity;return !c||!!s.world&&identitySchema.safeParse(c).success&&new Set(c.projects.map(p=>p.id)).size===c.projects.length&&c.projects.every(p=>!!s.world?.players[p.id]);}
function editable(s:Season){if(s.activeMatch)throw Error('Finish the match before changing club programmes.');}
export function registered(s:Season,id:string){return !!s.world?.players[id]&&!s.world.players[id].retired&&registration(s,id,s.world.primary)?.teamId===s.teamId;}
export function eligibleProjects(s:Season){return worldPlayers(s).filter(p=>registered(s,p.id)&&(worldAge(s,p)??99)<23);}
function checkSystem(next:ClubSystem){if(!systemSchema.safeParse(next).success||!next.first||!next.runner||next.first===next.runner||next.shape==='Two distributors'&&(!next.second||[next.first,next.runner].includes(next.second)))throw Error('Name a different first distributor, runner and (for a two-distributor play) second distributor.');}
export function setClubSystem(s:Season,next:ClubSystem|null){
 if(next)checkSystem(next);
 if(s.activeMatch){
  const t=s.activeMatch.teams.find(t=>t.id===s.teamId);
  if(!t||!s.activeMatch.tacticalVersion||s.activeMatch.finished||s.activeMatch.pendingPenalty)throw Error('Finish the pending decision before making a live role change.');
  if(next&&systemRoles.some(role=>next[role]&&!t.players[next[role]]))throw Error('Choose a player in the matchday squad.');
  const previous=t.clubSystem?.plan.shape??'Standard playbook';
  if(next)t.clubSystem={plan:{...next},rehearsal:rehearsalFor(s,s.activeMatch.id,next),reads:t.clubSystem?.plan.shape===next.shape?t.clubSystem.reads:Math.min(300,t.tacticalLog?.['system_read_'+next.shape]??0)};
  else delete t.clubSystem;
  const m=s.activeMatch;
  m.events.push({id:m.nextEventId++,kind:'club_system_change',minute:Math.floor(m.minute),side:m.teams.indexOf(t),text:`Role assignments adjusted: ${previous} → ${next?.shape??'Standard playbook'}.`,score:[m.teams[0].stats.score,m.teams[1].stats.score],field:m.field});
  return;
 }
 if(next&&systemRoles.some(role=>next[role]&&!registered(s,next[role])))throw Error('Choose registered players at your club.');
 identity(s).system=next?{...next}:null;
}
export function projectCost(s:Season){return s.world?.primary==='NPC'?1800:6000;}
const coaches=(s:Season)=>s.coaching?.clubs[s.teamId];
const mentor=(s:Season,goal:ProjectGoal)=>coaches(s)?.staff[goal==='Throwing'?0:goal==='Distribution'||goal==='Backfield'?1:2];
export function addProject(s:Season,id:string,goal:ProjectGoal,route:ProjectRoute){
 editable(s);const c=identity(s),p=eligibleProjects(s).find(p=>p.id===id);
 if(!p||!projectGoals.includes(goal)||!pathways.includes(route)||route==='Development XV'&&(worldAge(s,p)??99)>=21)throw Error('Choose an eligible prospect, focus and age-appropriate pathway.');
 if(c.projects.length>=2||c.projects.some(p=>p.id===id))throw Error('Both funded places are limited to one project per player.');
 const f=s.management!.finances[s.teamId],cost=projectCost(s),coach=mentor(s,goal);
 if(!coach||f.cash-reserved(s,s.teamId).fee<cost)throw Error('A coach and uncommitted cash are required for a project.');
 const senior=ledger(s,s.world!.primary,id)?.minutes??0,youth=ledger(s,`${s.world!.primary}-U21`,id)?.minutes??0;
 f.cash-=cost;c.projects.push({id,goal,route,opened:s.year,coach:coach.id,reps:0,minutes:0,matched:0,missed:0,lastMinutes:0,lastReview:'',senior,youth});
}
export function renewProject(s:Season,id:string){
 editable(s);const c=identity(s),current=c.projects,p=current.find(p=>p.id===id),candidate=eligibleProjects(s).find(x=>x.id===id);
 if(!p||!candidate||p.opened>=s.year)throw Error('Only an eligible prospect from a completed season can renew.');
 c.projects=current.filter(p=>p.id!==id);
 try{addProject(s,id,p.goal,(worldAge(s,candidate)??99)>=21?'Senior opportunity':p.route);}
 catch(error){c.projects=current;throw error;}
}
export function releaseProject(s:Season,id:string){editable(s);const c=identity(s);c.projects=c.projects.filter(p=>p.id!==id);}
export function setProjectRoute(s:Season,id:string,route:ProjectRoute){editable(s);const p=s.clubIdentity?.projects.find(p=>p.id===id),player=eligibleProjects(s).find(p=>p.id===id);if(!p||!player||!pathways.includes(route)||route==='Development XV'&&(worldAge(s,player)??99)>=21)throw Error('Choose an eligible pathway for this prospect.');p.route=route;}
const weekOf=(date:string)=>Math.floor((Date.parse(date.slice(0,10))/86400000+3)/7);
export function coachingCapacity(s:Season){const c=coaches(s);return !c?.funded?0:c.staff.some(p=>p.capacity>=80)?3:2;}
export function nextBlock(s:Season){const f=nextClubFixture(s),b=s.clubIdentity?.block;return {fixture:f,used:f&&b?.week===weekOf(f.date)?b.used:0,capacity:coachingCapacity(s)};}
const sameLaunch=(a:ClubSystem,b:ClubSystem)=>a.shape===b.shape&&a.first===b.first&&(a.shape==='Carry first'||a.second===b.second)&&a.runner===b.runner;
export function rehearsalFor(s:Season,fixture:string,plan:ClubSystem){const b=s.clubIdentity?.block;return b?.fixture===fixture&&b.plan&&sameLaunch(b.plan,plan)?b.rehearsal:0;}
export function allocateSession(s:Season,target:'senior'|'recovery'|string){
 editable(s);const c=identity(s),{fixture,used,capacity}=nextBlock(s);
 if(!fixture||s.world?.primary!==s.world?.phase||used>=capacity)throw Error('There is no funded coaching session available before this fixture.');
 const previous=c.block,week=weekOf(fixture.date);
 const b=previous?.week===week?previous:{fixture:fixture.id,week,plan:null,staff:[],used:0,rehearsal:0,assignments:[]};
 if(b.fixture!==fixture.id)throw Error('This week’s coaching block was assigned to the earlier fixture.');
 const staff=coaches(s)!.staff;
 if(target==='senior'){
  const plan=c.system;if(!plan)throw Error('Name your lineout attack first.');
  const required=[plan.first,plan.runner,...(plan.shape==='Two distributors'?[plan.second]:[])];
  if(required.some(id=>!registered(s,id)||availability(s,id)!=='AVAILABLE'))throw Error('All named launch players must be available to rehearse.');
  const coach=staff[plan.shape==='Carry first'?0:1];const fit=coach.style==='Skills'&&plan.shape==='Two distributors'||coach.style==='Power'&&plan.shape==='Carry first';
  const gain=.26+coach.coaching*.009+(fit?.12:0);
  b.rehearsal=Math.min(1,(b.plan&&sameLaunch(b.plan,plan)?b.rehearsal:0)+gain);b.plan={...plan};b.staff.push(coach.name);
  for(const id of required)s.condition[id].fatigue=Math.min(100,s.condition[id].fatigue+2);
  b.assignments.push('Senior lineout rehearsal');
 }else if(target==='recovery'){
  const coach=staff[0];b.staff.push(coach.name);
  for(const id of s.selection.slice(0,15))if(registered(s,id)&&!s.condition[id].injuryWeeks)s.condition[id].fatigue=Math.max(0,s.condition[id].fatigue-2-coach.coaching*.1);
  b.assignments.push('Starting XV recovery');
 }else{
  const p=c.projects.find(p=>p.id===target),coach=p&&mentor(s,p.goal);
  if(!p||!coach||!registered(s,p.id)||availability(s,p.id)!=='AVAILABLE'||p.opened!==s.year)throw Error('This prospect is unavailable for a funded session.');
  if(b.assignments.includes(p.id))throw Error('Each prospect can receive one specialist session per fixture.');
  p.coach=coach.id;p.reps=Math.min(40,p.reps+.5+coach.youth*.035);s.condition[p.id].fatigue=Math.min(100,s.condition[p.id].fatigue+2);
  b.staff.push(coach.name);b.assignments.push(p.id);
 }
 b.used++;c.block=b;
}
export function assistantProgramme(s:Season){const c=s.clubIdentity;if(!c?.delegate||s.activeMatch||s.world?.phase!==s.world?.primary)return;const n=nextBlock(s);if(!n.fixture||n.used||!n.capacity)return;const tired=s.selection.slice(0,15).some(id=>(s.condition[id]?.fatigue??0)>=50);const project=c.projects.find(p=>p.opened===s.year&&registered(s,p.id)&&availability(s,p.id)==='AVAILABLE');try{allocateSession(s,tired?'recovery':c.system?'senior':project?.id??'recovery');}catch{ /* Leave the slot free if the named players are unavailable. */ }}
export function attachSystem(s:Season,side:Side,f:Fixture){const plan=s.clubIdentity?.system;if(plan)side.clubSystem={plan:{...plan},rehearsal:rehearsalFor(s,f.id,plan),reads:0};}
export function academyPriority(s:Season,id:string){return s.clubIdentity?.projects.some(p=>p.id===id&&p.opened===s.year&&p.route==='Development XV'&&registered(s,id))??false;}
export function reviewProjects(s:Season,fixture:string){
 for(const p of s.clubIdentity?.projects??[]){
  if(p.lastReview===fixture||p.opened!==s.year||!registered(s,p.id))continue;
  const a=ledger(s,s.world!.primary,p.id)?.minutes??0,b=ledger(s,`${s.world!.primary}-U21`,p.id)?.minutes??0;
  const senior=Math.max(0,a-p.senior),youth=Math.max(0,b-p.youth),minutes=p.route==='Senior opportunity'?senior:youth;
  p.senior=a;p.youth=b;p.lastReview=fixture;p.lastMinutes=Math.min(100,minutes);p.minutes=Math.min(4000,p.minutes+minutes);
  if(minutes>=20){p.missed=0;if(s.clubIdentity?.block?.fixture===fixture&&s.clubIdentity.block.assignments.includes(p.id)){const level=p.route==='Senior opportunity'?1:.65;p.matched=Math.min(40,p.matched+Math.min(1,minutes/55)*level);}}
  else if(!s.condition[p.id].injuryWeeks&&availability(s,p.id)==='AVAILABLE'){p.missed=Math.min(40,p.missed+1);if(p.missed>=3)s.condition[p.id].morale=Math.max(0,s.condition[p.id].morale-2);}
  const name=worldPlayers(s).find(x=>x.id===p.id)?.name??p.id;
  addStory(s,{id:`academy-review-${fixture}-${p.id}`,category:'Development',title:`${name}: pathway review`,text:`${Math.round(minutes)} minutes on the agreed ${p.route} pathway · ${Math.round(p.minutes)} project minutes this season. ${p.missed>=3?`Missed ${p.missed} available opportunities; morale is falling. Review the route to minutes.`:'Coach and match evidence are recorded in Academy projects.'}`,players:[p.id],clubs:[s.teamId],important:p.missed>=3});
 }
}
export function projectGrowth(s:Season,id:string,comp:string){const p=s.clubIdentity?.projects.find(p=>p.id===id&&p.opened===s.year);return p&&registered(s,id)&&comp===s.world?.primary?Math.min(.16,p.matched*.045,p.reps*.025):0;}
