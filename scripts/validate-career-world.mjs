import fs from 'node:fs';
import assert from 'node:assert/strict';
import {newWorld,advanceWorld,start} from '../lib/world/engine.ts';
import {catalog,projected} from '../lib/world/catalog.ts';
import {schedule} from '../lib/world/schedule.ts';
import {validSave} from '../lib/sim/validation.ts';
import {initialSkills,develop} from '../lib/world/development.ts';
import {instantResult} from '../lib/sim/engine.ts';
const report={canonicalPlayers:catalog.players.length,careers:[],development:[],checks:[]};
for(let seed=1;seed<=10;seed++){const c=schedule('NPC',2026,seed);for(const t of catalog.teams.filter(t=>t.competition==='NPC')){assert.equal(c.fixtures.filter(f=>f.home===t.id).length,5);assert.equal(c.fixtures.filter(f=>f.away===t.id).length,5);assert.equal(new Set(c.fixtures.filter(f=>f.home===t.id||f.away===t.id).map(f=>f.home===t.id?f.away:f.home)).size,10);}}
report.checks.push('10 seeds: NPC 10 unique opponents, five home/five away');
for(const team of ['1','npc-1']){let s=newWorld(team,75);let guard=0;while(s.year<2028&&guard++<110){advanceWorld(s);assert.ok(validSave(s,{}),`invalid ${team} ${s.year} ${s.world.phase} ${s.round}`);const copy=JSON.parse(JSON.stringify(s));assert.deepEqual(copy.world.players,s.world.players);if(guard%10===0)console.log(team,s.year,s.world.phase,s.round,Object.keys(s.world.players).length);}assert.equal(s.year,2028);report.careers.push({team,years:2,players:Object.keys(s.world.players).length,bytes:Buffer.byteLength(JSON.stringify(s)),reviews:s.world.reviews.length,squads:s.world.squads.length});}
const p=catalog.players.find(p=>p.id==='175');for(let seed=1;seed<=10;seed++){const s=newWorld('1',seed);for(let y=0;y<10;y++){for(const comp of ['SR','NPC']){s.world.stats[`${s.year}-${comp}`]=Object.fromEntries(catalog.players.map(p=>[p.id,{apps:10,starts:8,minutes:seed%3===0?120:seed%3===1?650:1000,tries:0,tackles:0,metres:0,turnovers:0,ratings:seed%3===0?63:72,recent:[],injuryWeeks:0}]));develop(s,comp);}s.year++;}report.development.push({seed,hiddenPA:s.world.players[p.id].savePA,finalCA:s.management.players[p.id].ability});}
fs.writeFileSync('docs/career-world-validation.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
