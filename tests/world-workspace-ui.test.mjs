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
 for(const [file,words] of [['home',['Decisions','Club briefing','Next fixture','Season context']],['squad-table',['First-team squad','Potential range','Search first-team squad','Select visible players']],['preparation',['Weekly team emphasis','Not yet trained this week','Opposition evidence']],['recruitment',['Recruitment decision','Proposed contract years','Scout player','Open negotiation']]]){
 const module=await vite.ssrLoadModule('/app/play/product/'+file+'.tsx'),html=renderToStaticMarkup(React.createElement(module.default,props));for(const word of words)assert.ok(html.includes(word),`${file}: ${word}`);assert.ok(!html.includes('undefined'));if(file==='recruitment')assert.ok(!html.includes('<option value="4"'));
 }
});
