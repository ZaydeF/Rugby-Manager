import fs from 'node:fs';
import {COHESION_RULES} from '../lib/sim/cohesion.ts';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const studies={};
for(const [key,name,count] of [['baseline','baseline',5000],['candidate','final',5000],['tactics','tactics',1200]]){
 const path=`docs/cohesion-raw-${name}.json`,bytes=fs.readFileSync(path),raw=JSON.parse(bytes);
 assert.equal(raw.matches,count,`${key}: expected complete sample`);assert.equal(raw.rows.length,count);
 studies[key]={matches:count,rawSha256:createHash('sha256').update(bytes).digest('hex'),method:'Prepared ordered home/away pair snapshots with varied phase RNG; kickoff mood remains fixed within a pair. Tactical identities use paired seeds with automatic changes disabled.',summary:raw.summary};
}
const report={version:1,status:'Release candidate; competitiveness balance gate remains open',parameters:COHESION_RULES,studies};
fs.writeFileSync('docs/cohesion-calibration.json',JSON.stringify(report,null,2)+'\n');
const lines=['| Competition / metric | Baseline | Candidate | Published SR 2025 |','| --- | ---: | ---: | ---: |'];
for(const comp of ['SR','NPC'])for(const [key,label,reference,percent] of [['points','combined points',57.8],['tries','tries',8.2],['goalAttempts','penalty-goal attempts',2.1],['penalties','infringements',null],['close','margin ≤7',43.1,true],['blowout','margin ≥28',null,true],['margin','mean winning margin',null]]){
 const val=study=>(studies[study].summary[comp][key].mean*(percent?100:1)).toFixed(2)+(percent?'%':'');
 lines.push(`| ${comp} ${label} | ${val('baseline')} | ${val('candidate')} | ${comp==='SR'&&reference!==null?reference+(percent?'%':''):'—'} |`);
}
const path='docs/product-cohesion-release.md',text=fs.readFileSync(path,'utf8'),table='<!-- CALIBRATION_START -->\n'+lines.join('\n')+'\n<!-- CALIBRATION_END -->';
fs.writeFileSync(path,text.replace(/<!-- CALIBRATION_TABLE -->|<!-- CALIBRATION_START -->[\s\S]*?<!-- CALIBRATION_END -->/,table));
console.log('Published baseline/candidate/tactical distributions and source hashes.');
