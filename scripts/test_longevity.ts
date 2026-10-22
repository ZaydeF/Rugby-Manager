import {fullUniverse} from '../lib/future/catalog.ts';
import {payroll,minimumIssues,squadIds} from '../lib/management/state.ts';
import {gzipSync} from 'node:zlib';
import {auditDatabase,PACK} from '../lib/packs/foundation.ts';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {newSeason,completeRound,nextCampaign,validSave} from '../lib/sim/career.ts';
import {migrateCareer} from '../lib/management/migrate.ts';
import {CURATED} from '../lib/management/curated.ts';
import {developmentFactors,developPlayers} from '../lib/management/development.ts';
import {beginOffseason,runAIContracts,offseasonIssues} from '../lib/management/offseason.ts';
import {eligibility,eligibleReason} from '../lib/representative/eligibility.ts';
import {repYear} from '../lib/representative/state.ts';
import {watchList,seriesIssues,startRepresentativeMatch,simulateRepresentativeMatch,selectAllBlacks,recoveryWeek,cancelSeries} from '../lib/representative/engine.ts';
import {advancePhase} from '../lib/sim/engine.ts';
import {startOffer,suggestedTerms,processReplies,respond,marketDay,assistantRenewals} from '../lib/market/engine.ts';
import {movedInWindow,prestigePremium,clubReputation} from '../lib/market/reputation.ts';
import {active} from '../lib/market/state.ts';
import {runTrial,finishIntake,signAcademy,academySquad} from '../lib/future/engine.ts';
import type {Season,SimUniverse} from '../lib/sim/types.ts';
const data=JSON.parse(fs.readFileSync('data/generated/universe.json','utf8')) as SimUniverse;
const catalog=JSON.parse(fs.readFileSync('data/generated/simulation-catalog.json','utf8')) as SimUniverse;
const years=Number(process.argv[2]??20),seed=Number(process.argv[3]??75);
assert.ok(Number.isInteger(years)&&years>=1&&years<=20);
const metrics:Record<string,unknown>[]=[];
function valid(s:Season){assert.ok(validSave(s,data),'Full save '+s.year);assert.ok(validSave(s,catalog),'Worker save '+s.year);const migrated=migrateCareer(JSON.parse(JSON.stringify(s)),data);assert.ok(migrated,'Migrated save');for(const key of Object.keys(s))assert.ok(JSON.stringify(migrated[key as keyof Season])===JSON.stringify(s[key as keyof Season]),'Stable save migration: '+key);}
let s=newSeason(data,'1',seed);const started=performance.now();let failure:string|null=null;try{for(let year=0;year<years;year++){
 while(!s.champion)completeRound(s,data,true);
 while(repYear(s)!.matches.length<3){if(seriesIssues(s,data).length){if(repYear(s)!.recoveryWeeks<6){recoveryWeek(s);continue;}console.log('Pool shortage',s.year,seriesIssues(s,data));cancelSeries(s,data);break;}simulateRepresentativeMatch(s,data);}
 if(repYear(s)!.stage!=='skipped'){try{selectAllBlacks(s,data);}catch{while(repYear(s)!.recoveryWeeks<6){recoveryWeek(s);try{selectAllBlacks(s,data);break;}catch{}}if(repYear(s)!.stage!=='selected')cancelSeries(s,data);}}
 valid(s);beginOffseason(s,data);const abilities=JSON.stringify(s.management!.players);assert.equal(developPlayers(s,data),false);assert.equal(JSON.stringify(s.management!.players),abilities);
 runTrial(s,data);const intake=s.future!.intakes.find(i=>i.clubId===s.teamId&&i.year===s.year)!;for(const id of intake.ids.slice(0,12)){if(academySquad(s,s.teamId).length>=40)break;signAcademy(s,id);}finishIntake(s);runAIContracts(s,data,true);for(let day=0;day<42;day++){marketDay(s,data);for(const t of s.market!.threads.filter(t=>t.seller===s.teamId&&active(t)&&t.buyer!==s.teamId))respond(s,data,t.id,'reject');}
 valid(s);assert.deepEqual(offseasonIssues(s,data),[]);const moves=s.management!.transfers.filter(t=>t.year===s.year&&t.kind==='Signing');assert.equal(new Set(moves.map(t=>t.playerId)).size,moves.length,JSON.stringify(moves.filter((t,i)=>moves.findIndex(m=>m.playerId===t.playerId)!==i)));const json=JSON.stringify(s);const rows=Object.entries(s.management!.players).filter(([id])=>!s.future!.retired[id]);const clubMetrics=data.teams.map(t=>({id:t.id,squad:squadIds(s,t.id).length,payroll:payroll(s,t.id),cap:s.management!.finances[t.id].payrollCap,cash:s.management!.finances[t.id].cash}));for(const club of clubMetrics){assert.deepEqual(minimumIssues(s,fullUniverse(s,data),club.id),[],'Positional depth '+club.id);assert.ok(club.squad<=46,'Squad limit '+club.id);assert.ok(club.payroll<=club.cap+.01,'Wage cap '+club.id);}const metric={clubs:clubMetrics,season:year+1,year:s.year,players:rows.length,retired:Object.keys(s.future!.retired).length,elite:rows.filter(([,p])=>p.ability>=90).length,saveMB:Buffer.byteLength(json)/1048576,sectionsMB:Object.fromEntries(Object.entries(s).filter(([,v])=>Buffer.byteLength(JSON.stringify(v))>100000).map(([k,v])=>[k,Math.round(Buffer.byteLength(JSON.stringify(v))/10485.76)/100])),gzipMB:gzipSync(json).length/1048576,elapsedSeconds:(performance.now()-started)/1000,champion:s.champion};assert.ok(metric.saveMB<35,'Decoded save exceeds account storage limit');metrics.push(metric);console.log(JSON.stringify(metric));s=nextCampaign(s,data);valid(s);
}
}catch(e){failure=e instanceof Error?e.message:String(e);process.exitCode=1;console.error(failure);}
const audit=auditDatabase(data,s);
const report={pack:PACK,seed,seasons:metrics.length,requestedSeasons:years,failure,checkpoints:[5,10,20].filter(n=>n<=metrics.length),structuralChecks:failure?'failed':'passed',balanceGate:audit.missingBirthDates.length?'blocked by incomplete real-player ages':'requires review',policy:'User club contracts and intake automated; incoming offers rejected; representative series simulated where a legal pool is available.',audit,metrics};
fs.writeFileSync(process.argv[4]??'public/reports/phase0-longevity.json',JSON.stringify(report,null,2));
console.log('Longevity structural checks '+report.structuralChecks+'. Balance gate: '+report.balanceGate);
