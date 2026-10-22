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
function valid(s:Season){assert.ok(validSave(s,data),`Full save ${s.year}`);assert.ok(validSave(s,catalog),`Compact Worker save ${s.year}`);}
const base=newSeason(data,'1',75);valid(base);
for(const [id,r] of Object.entries(CURATED)){assert.equal(Math.round(base.management!.players[id].ability),r.ability);assert.equal(base.management!.players[id].potential,r.potential);}
const old=structuredClone(base);delete old.representative;old.version=4;
for(const [id,r] of Object.entries(CURATED)){old.management!.players[id].ability-=r.ability-r.baseline;}
const migrated=migrateCareer(old,data)!;assert.ok(migrated);valid(migrated);assert.equal(migrated.management!.players['92'].ability,90);assert.deepEqual(migrateCareer(migrated,data),migrated);
assert.deepEqual(migrated.fixtures,old.fixtures);assert.deepEqual(migrated.future,old.future);
console.log('PASS six ratings and one-time save migration preserve fixtures and existing prospects');
{
 const s=structuredClone(base);const aus=data.players.find(p=>p.squad_id==='10')!.player_id;s.management!.players[aus].clubId='1';assert.ok(eligibleReason(s,aus));assert.ok(eligibleReason(s,'107'));
 assert.ok(!watchList(s,data).some(r=>r.p.player_id===aus||r.p.player_id==='107'));assert.equal(eligibility(s,'166').union,'New Zealand');assert.equal(eligibility(s,'173').region,'NORTH');assert.equal(eligibility(s,'453').region,'NORTH');
 const g=Object.values(s.future!.generated).find(g=>g.nationality==='New Zealand')!;s.management!.players[g.id].clubId='1';g.level='senior';s.management!.players[g.id].contractEnd=s.year+1;const before=eligibility(s,g.id);assert.equal(eligibleReason(s,g.id),null);s.management!.players[g.id].clubId='10';assert.ok(eligibleReason(s,g.id));assert.deepEqual(eligibility(s,g.id),before);
 s.champion='1';assert.deepEqual(seriesIssues(s,data),[]);startRepresentativeMatch(s,data);advancePhase(repYear(s)!.active!);valid(s);const restored=JSON.parse(JSON.stringify(s));advancePhase(repYear(restored)!.active!);advancePhase(repYear(s)!.active!);assert.deepEqual(repYear(restored)!.active,repYear(s)!.active);assert.throws(()=>startOffer(s,data,'173',suggestedTerms(s,data,'173')));valid(s);
}
console.log('PASS Australian transfers excluded, genuine NZ internationals retained, island fixed and active match resumes deterministically');
{
 const s=structuredClone(base);s.champion='1';for(let i=0;i<3;i++)simulateRepresentativeMatch(s,data);selectAllBlacks(s,data);valid(s);assert.equal(repYear(s)!.matches.length,3);assert.equal(repYear(s)!.allBlacks.length,34);const before=JSON.stringify(repYear(s));selectAllBlacks(s,data);assert.equal(JSON.stringify(repYear(s)),before);assert.throws(()=>simulateRepresentativeMatch(s,data));
 const tampered=structuredClone(s);repYear(tampered)!.allBlacks[0]='107';assert.equal(validSave(tampered,data),false);
 const blocked=structuredClone(base);blocked.champion='1';for(const c of Object.values(blocked.condition))c.injuryWeeks=20;assert.throws(()=>simulateRepresentativeMatch(blocked,data));cancelSeries(blocked,data);assert.equal(repYear(blocked)!.stage,'skipped');assert.equal(repYear(blocked)!.allBlacks.length,0);valid(blocked);
}
console.log('PASS three-game programme, 34-player announcement, duplicate prevention and explicit shortage cancellation');
{
 const s=structuredClone(base);s.management!.phase='offseason';s.management!.developedYear=s.year;s.champion='1';repYear(s)!.stage='skipped';const c=s.management!.players['403'];c.clubId=null;c.salary=0;
 const t=startOffer(s,data,'403',{...suggestedTerms(s,data,'403'),salary:1000000,role:'Star'});for(let n=0;n<12&&active(t);n++){s.market!.day++;processReplies(s,data);if(['player_counter','agreed'].includes(t.stage))respond(s,data,t.id,'accept');}
 assert.equal(t.stage,'completed');assert.ok(movedInWindow(s,'403'));assert.throws(()=>startOffer(s,data,'403',suggestedTerms(s,data,'403','6'),'6'),/already moved/);assert.doesNotThrow(()=>startOffer(s,data,'403',suggestedTerms(s,data,'403')));
 assert.ok(clubReputation(s,'2')>clubReputation(s,'6'));assert.ok(prestigePremium(s,'115','6')>1.5);assert.equal(prestigePremium(s,'115','2'),1);valid(s);
 const assistant=structuredClone(base),contracts=JSON.stringify(assistant.management!.players);const sent=assistantRenewals(assistant,data);assert.ok(sent>0);assert.equal(JSON.stringify(assistant.management!.players),contracts);assert.equal(assistantRenewals(assistant,data),0);const day=assistant.market!.day;marketDay(assistant,data);assert.equal(assistant.market!.day,day+1);valid(assistant);
}
console.log('PASS one move per window, renewal exception, club premium, opt-in assistant and exact one-day advance');
{
 const c=structuredClone(base.management!.players['175']);c.ability=65;c.potential=95;const amount=(age:number,minutes=900,injuries=0)=>{c.birthDate=`${2027-age}-01-01`;return developmentFactors(c,'scrum_half',2027,2027,minutes,7,6.7,injuries,75).factors.reduce((n,f)=>n+f.value,0);};
 assert.ok(amount(19)>amount(27)+2.5);assert.ok(amount(19,900)>amount(19,100));assert.ok(amount(19,900,12)<amount(19,900));assert.ok(amount(34)<amount(27));
 let total=0,elite=0;for(let seed=200;seed<212;seed++){const s=newSeason(data,'1',seed),gs=Object.values(s.future!.generated);total+=gs.length;for(const g of gs){const c=s.management!.players[g.id];if(c.ability>=77){elite++;assert.ok(c.ability<=81.01&&c.potential>=90);}}const names=new Set(gs.map(g=>g.name));assert.equal(names.size,gs.length);const families=new Set(gs.map(g=>g.name.split(' ').at(-1)));assert.ok(families.size>120);assert.ok(gs.filter(g=>g.name.endsWith('Ropata')).length<8);}
 assert.ok(elite>0&&elite/total<.01);console.log(`PASS faster young development, injury drag, varied names and rare ready-made elites: ${elite}/${total}`);
}
let s=structuredClone(base);for(let year=0;year<3;year++){
 while(!s.champion)completeRound(s,data,true);
 while(repYear(s)!.matches.length<3){if(seriesIssues(s,data).length){if(repYear(s)!.recoveryWeeks<6){recoveryWeek(s);continue;}console.log('Pool shortage',s.year,seriesIssues(s,data));cancelSeries(s,data);break;}simulateRepresentativeMatch(s,data);}
 if(repYear(s)!.stage!=='skipped'){try{selectAllBlacks(s,data);}catch{while(repYear(s)!.recoveryWeeks<6){recoveryWeek(s);try{selectAllBlacks(s,data);break;}catch{}}if(repYear(s)!.stage!=='selected')cancelSeries(s,data);}}
 valid(s);beginOffseason(s,data);const abilities=JSON.stringify(s.management!.players);assert.equal(developPlayers(s,data),false);assert.equal(JSON.stringify(s.management!.players),abilities);
 runTrial(s,data);const intake=s.future!.intakes.find(i=>i.clubId===s.teamId&&i.year===s.year)!;for(const id of intake.ids.slice(0,12)){if(academySquad(s,s.teamId).length>=40)break;signAcademy(s,id);}finishIntake(s);runAIContracts(s,data,true);for(let day=0;day<42;day++){marketDay(s,data);for(const t of s.market!.threads.filter(t=>t.seller===s.teamId&&active(t)&&t.buyer!==s.teamId))respond(s,data,t.id,'reject');}
 valid(s);assert.deepEqual(offseasonIssues(s,data),[]);const moves=s.management!.transfers.filter(t=>t.year===s.year&&t.kind==='Signing');assert.equal(new Set(moves.map(t=>t.playerId)).size,moves.length);console.log(`PASS ${s.year}: ${repYear(s)!.matches.length} island matches, ${repYear(s)!.allBlacks.length} selections, ${moves.length} unique-player signings, valid save ${(JSON.stringify(s).length/1048576).toFixed(1)} MB`);s=nextCampaign(s,data);valid(s);
}
console.log('All representative/update checks passed.');
