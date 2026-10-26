import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {fileURLToPath} from 'node:url';
import {newWorld} from '../lib/world/engine.ts';
const root=fileURLToPath(new URL('..',import.meta.url));
const vite=await createServer({appType:'custom',configFile:false,root,resolve:{alias:{'@':root}},server:{middlewareMode:true,hmr:false}});
after(()=>vite.close());
for(const team of ['1','npc-9'])test(`professional workspace, readiness register and dossier render for ${team}`,async()=>{
  const s=newWorld(team,12),props={s,mutate:()=>{},onPlayer:()=>{},onClub:()=>{},navigate:()=>{},onPlan:()=>{},onContract:()=>{}};
  const workspace=await vite.ssrLoadModule('/app/play/world-workspace.tsx');
  const desk=renderToStaticMarkup(React.createElement(workspace.ManagerDesk,props));
  assert.match(desk,/Club briefing/);assert.match(desk,/Next fixture/);assert.match(desk,/The week ahead/);assert.match(desk,/Selection room/);
  const nav=renderToStaticMarkup(React.createElement(workspace.WorkspaceNavigation,{...props,tab:'Fitness'}));
  assert.equal((nav.match(/<button/g)??[]).length,6);assert.match(nav,/Recruitment/);assert.match(nav,/aria-current="page"/);
  const primitives=await vite.ssrLoadModule('/app/play/product/primitives.tsx');
  const secondary=renderToStaticMarkup(React.createElement(primitives.SectionNav,{tab:'Fitness',navigate:()=>{}}));
  assert.match(secondary,/Fitness &amp; sharpness/);assert.match(secondary,/aria-current="page"/);
  const fitness=await vite.ssrLoadModule('/app/play/world-fitness.tsx');
  const register=renderToStaticMarkup(React.createElement(fitness.default,props));
  assert.match(register,/Fitness &amp; match sharpness/);assert.match(register,/Super Rugby/);assert.match(register,/How the assessment works/);assert.match(register,/role="meter"/);assert.match(register,/aria-valuenow=/);
  const profile=await vite.ssrLoadModule('/app/play/world-player-profile.tsx');
  const dossier=renderToStaticMarkup(React.createElement(profile.default,{...props,id:s.selection[0]}));
  assert.match(dossier,/PLAYER DOSSIER/);assert.match(dossier,/Mental &amp; tactical/);assert.match(dossier,/Fitness &amp; readiness/);assert.match(dossier,/Development/);assert.match(dossier,/Contract/);
  assert.ok(!dossier.includes('undefined'));
});
test('cohesion pages expose real decisions, bounded preparation and contract controls',async()=>{
 const s=newWorld('1',12),{projected}=await import('../lib/world/catalog.ts'),data=projected(s),props={s,data,mutate:()=>{},onPlayer:()=>{},navigate:()=>{},onInbox:()=>{}};
 for(const [file,words] of [['home',['Decisions','Club briefing','Next fixture','Season context']],['squad-table',['First-team squad','Potential','Search first-team squad','Select visible players']],['preparation',['Weekly team emphasis','Not yet trained this week','Opposition evidence']],['recruitment',['Recruitment decision','Proposed contract years','Scout player','Open negotiation']]]){
 const module=await vite.ssrLoadModule('/app/play/product/'+file+'.tsx'),html=renderToStaticMarkup(React.createElement(module.default,props));for(const word of words)assert.ok(html.includes(word),`${file}: ${word}`);assert.ok(!html.includes('undefined'));if(file==='recruitment')assert.ok(!html.includes('<option value="4"'));if(file==='squad-table'){assert.match(html,/of 5 stars/);assert.doesNotMatch(html,/>CA<|CA \d|Potential range/);assert.match(html,/Scrum Half/);}
 }
});
test('staff departments, a single inbox and live register render actual controls without raw ability disclosure',async()=>{const s=newWorld('5',12),{projected}=await import('../lib/world/catalog.ts'),{prepare}=await import('../lib/world/engine.ts'),props={s,data:projected(s),mutate:()=>{},onPlayer:()=>{},navigate:()=>{},onChange:()=>{}};const staff=await vite.ssrLoadModule('/app/play/product/staff-office.tsx');const html=renderToStaticMarkup(React.createElement(staff.default,props));for(const name of ['Assistant Manager','Performance Coach','Physiotherapist','Head Scout','Opposition Analyst','Compare candidates'])assert.ok(html.includes(name));const tasks=renderToStaticMarkup(React.createElement(staff.StaffResponsibilities,props));for(const name of ['Season playing plans','Individual training','Weekly team preparation','Fitness plans','Commission scouting','Propose expiring'])assert.ok(tasks.includes(name));const inbox=await vite.ssrLoadModule('/app/play/inbox.tsx');const messages=renderToStaticMarkup(React.createElement(inbox.default,props));assert.equal((messages.match(/class="manager-inbox"/g)??[]).length,1);assert.match(messages,/Correspondence/);assert.match(messages,/Inbox filter/);const stars=await vite.ssrLoadModule('/app/play/stars.tsx');const star=renderToStaticMarkup(React.createElement(stars.default,{s,id:s.selection[0]}));assert.match(star,/of 5 stars/);assert.doesNotMatch(star,/CA \d|True PA|ability: \d{2}/);const live=await vite.ssrLoadModule('/app/play/product/live-overview.tsx'),f=s.fixtures.find(f=>[f.home,f.away].includes(s.teamId)),m=prepare(s,f,'SR',true),side=m.teams.findIndex(t=>t.id===s.teamId),register=renderToStaticMarkup(React.createElement(live.LiveTeam,{...props,m,side,editable:true}));assert.equal((register.match(/aria-label="Replacement for/g)??[]).length,15);assert.match(register,/Match sharpness/);assert.match(register,/Swap positions/);assert.match(register,/live-value good/);});
