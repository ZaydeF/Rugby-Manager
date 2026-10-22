import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {createMatch,instantResult} from '../lib/sim/engine.ts';
import {makeSide,autoSelect} from '../lib/sim/selection.ts';
import {DEFAULT_TACTICS} from '../lib/sim/config.ts';
import type {SimUniverse,GameMatch} from '../lib/sim/types.ts';
const path=new URL('../lib/sim/_phase2_legacy_check.ts',import.meta.url);
try{
 fs.writeFileSync(path,execFileSync('git',['show','b3a6cd6be1b42a62b8fbfbfe31de52120d29193c:lib/sim/engine.ts'],{encoding:'utf8'}));
 const old=await import(path.href),data=JSON.parse(fs.readFileSync('data/generated/universe.json','utf8')) as SimUniverse;
 const side=(index:number)=>{const t=data.teams[index],p=data.players.filter(p=>p.squad_id===t.id);return makeSide(t.id,t.name,p,autoSelect(p),{},DEFAULT_TACTICS,true);};
 for(let i=0;i<12;i++){const m:GameMatch=old.createMatch('legacy',7919*(i+1),side(i%11),side((i+1)%11));for(let p=0;p<70;p++)old.advancePhase(m);const next=structuredClone(m);old.instantResult(m);instantResult(next);assert.deepEqual(next.events,m.events);assert.equal(next.rng,m.rng);assert.deepEqual(next.teams.map(t=>t.stats),m.teams.map(t=>t.stats));}
 console.log('PASS: twelve active Phase 1 matches resume with identical events, random state and final team statistics under the legacy engine path.');
}finally{fs.rmSync(path,{force:true});}
