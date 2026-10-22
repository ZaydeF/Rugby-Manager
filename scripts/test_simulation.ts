import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createMatch,instantResult,advancePhase,substitute,active,changeTactics} from '../lib/sim/engine.ts';
import {autoSelect,makeSide,selectionErrors} from '../lib/sim/selection.ts';
import {newSeason,startFixture,completeRound,validSave,table,currentFixture,recordMatch} from '../lib/sim/career.ts';
import {DEFAULT_TACTICS} from '../lib/sim/config.ts';
import type {SimUniverse,Tactics} from '../lib/sim/types.ts';
const data=JSON.parse(fs.readFileSync('data/generated/universe.json','utf8')) as SimUniverse;
function side(index:number,tactics:Tactics={...DEFAULT_TACTICS}){const t=data.teams[index],squad=data.players.filter(p=>p.squad_id===t.id);return makeSide(t.id,t.name,squad,autoSelect(squad),{},tactics,true);}
function game(seed=999){return createMatch('test',seed,side(0),side(1));}
const check=(label:string,fn:()=>void)=>{fn();console.log('PASS '+label);};
check('All franchises can select a legal 23',()=>{for(const team of data.teams){const sq=data.players.filter(p=>p.squad_id===team.id);assert.equal(selectionErrors(autoSelect(sq),sq).length,0);}});
check('Same seed, phase stepping and JSON resume produce identical complete matches',()=>{const a=instantResult(game());let b=game();for(let i=0;i<100;i++)advancePhase(b);b=JSON.parse(JSON.stringify(b));while(!b.finished)advancePhase(b);assert.deepEqual(a,b);});
check('Substitutions reject reentry, incompatible roles and replacing carded players',()=>{const m=game();m.teams[0].autoManage=false;const out=m.teams[0].lineup[1],incoming=m.teams[0].bench[0];assert.equal(substitute(m,0,out,incoming),null);assert.ok(substitute(m,0,incoming,out));assert.ok(substitute(m,0,m.teams[0].lineup[9],m.teams[0].bench[1]));const p=m.teams[0].players[m.teams[0].lineup[0]];p.cardUntil=10;assert.ok(substitute(m,0,p.id,m.teams[0].bench[0]));assert.ok(!active(m,0).includes(p));m.minute=11;assert.ok(active(m,0).includes(p));p.sentOff=true;assert.ok(!active(m,0).includes(p));});
check('Only legal live tactics accepted',()=>{const m=game();changeTactics(m,0,{...DEFAULT_TACTICS,tempo:2});assert.equal(m.teams[0].tactics.tempo,2);assert.throws(()=>changeTactics(m,0,{...DEFAULT_TACTICS,risk:9}));});
check('Playable season, finals reseeding, idempotent recording, valid save states',()=>{
 for(let seed=1;seed<=12;seed++){
  const s=newSeason(data,data.teams[(seed-1)%11].id,seed*7919);assert.ok(validSave(s,data));
  for(let round=1;round<=19;round++){
   if(seed===1&&currentFixture(s)){startFixture(s,data);advancePhase(s.activeMatch!);assert.ok(validSave(JSON.parse(JSON.stringify(s)),data));instantResult(s.activeMatch!);const copy=structuredClone(s);recordMatch(copy,copy.activeMatch!);const snapshot=JSON.stringify(copy.standings);recordMatch(copy,copy.activeMatch!);assert.equal(JSON.stringify(copy.standings),snapshot);}
   completeRound(s,data,true);assert.ok(validSave(s,data),`valid save seed ${seed} round ${round}`);
   if(round===16){assert.ok(s.standings.every(t=>t.played===14));assert.equal(s.standings.reduce((a,t)=>a+t.for-t.against,0),0);const ranked=table(s.standings).map(t=>t.id);assert.deepEqual(s.fixtures.filter(f=>f.round===17).map(f=>[f.home,f.away]),[[ranked[0],ranked[5]],[ranked[1],ranked[4]],[ranked[2],ranked[3]]]);}
   if(round===17){const top=s.finalSeeds;assert.deepEqual(s.fixtures.filter(f=>f.round===18).map(f=>[f.home,f.away]),[[top[0],top[3]],[top[1],top[2]]]);}
  }
  assert.equal(s.fixtures.length,83);assert.ok(s.fixtures.every(f=>f.result?.finished));assert.ok(s.champion);assert.equal(s.history.length,1);assert.equal(newSeason(data,s.teamId,s.seed+1,2028,s.history).history[0].champion,s.champion);
 }
});
check('Corrupt and foreign career imports are rejected without throwing',()=>{const s=newSeason(data,data.teams[0].id,5);for(const bad of [null,{},[],{...s,tactics:null},{...s,selection:['bogus']},{...s,standings:[]},{...s,condition:{}},{...s,activeMatch:{}},{...s,fixtures:s.fixtures.map((f,i)=>i?f:{...f,result:{}})}])assert.equal(validSave(bad,data),false);s.selection[0]='';assert.ok(validSave(s,data),'incomplete draft selection may be saved');});
console.log('All functional simulation checks passed.');
