import assert from 'node:assert/strict';
import test,{after} from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {autoSelect,selectionDrop,selectionErrors} from '../lib/sim/selection.ts';
import {newSeason} from '../lib/sim/career.ts';
const root=fileURLToPath(new URL('..',import.meta.url));
const data=JSON.parse(fs.readFileSync(path.join(root,'data/generated/universe.json'),'utf8'));
const s=newSeason(data,'1',75),squad=data.players.filter(p=>p.squad_id==='1'),ids=autoSelect(squad,s.condition);
const vite=await createServer({appType:'custom',configFile:false,root,resolve:{alias:{'@':root}},server:{middlewareMode:true}});
after(()=>vite.close());
test('starter and bench swap identically in both directions',()=>{
 const forward=selectionDrop(ids,squad,s.condition,ids[0],{slot:16});
 const reverse=selectionDrop(ids,squad,s.condition,ids[16],{slot:0});
 assert.deepEqual(forward,reverse);assert.deepEqual(selectionErrors(forward,squad,s.condition),[]);
 assert.deepEqual(selectionDrop(ids,squad,s.condition,ids[0],{playerId:ids[16]}),reverse);
});
test('pitch-to-reserve-row is the reverse of reserve-to-pitch',()=>{
 const reserve=squad.find(p=>p.position==='prop'&&!ids.includes(p.player_id));assert.ok(reserve);
 const forward=selectionDrop(ids,squad,s.condition,reserve.player_id,{slot:0});
 const reverse=selectionDrop(ids,squad,s.condition,ids[0],{playerId:reserve.player_id});
 assert.deepEqual(forward,reverse);assert.equal(reverse.includes(ids[0]),false);assert.deepEqual(selectionErrors(reverse,squad,s.condition),[]);
});
test('removal frees the slot, accepts replacement, and permits undo',()=>{
 const before=[...ids],removed=selectionDrop(ids,squad,s.condition,ids[0],{remove:true});
 assert.equal(removed[0],'');assert.equal(removed.length,23);assert.deepEqual(ids,before);
 assert.deepEqual(selectionDrop(removed,squad,s.condition,ids[0],{slot:0}),before);
});
test('invalid and injured reverse replacements never mutate the selection',()=>{
 const before=[...ids];assert.throws(()=>selectionDrop(ids,squad,s.condition,ids[0],{playerId:ids[9]}));
 const reserve=squad.find(p=>p.position==='prop'&&!ids.includes(p.player_id));const injured=structuredClone(s.condition);injured[reserve.player_id].injuryWeeks=2;
 assert.throws(()=>selectionDrop(ids,squad,injured,ids[0],{playerId:reserve.player_id}));assert.deepEqual(ids,before);
});
test('opponent briefing renders graphic stars rather than component source',async()=>{
 s.round=s.fixtures.find(f=>f.home==='1'||f.away==='1').round;
 const {AssistantBriefing}=await vite.ssrLoadModule('/app/play/assistant.tsx');
 const html=renderToStaticMarkup(React.createElement(AssistantBriefing,{s,data,mutate:()=>{}}));
 assert.match(html,/Opponent to watch/);assert.match(html,/class="fm-stars"/);assert.match(html,/Assessed ability/);assert.doesNotMatch(html,/PlayerStars|\$&lt;/);
});
