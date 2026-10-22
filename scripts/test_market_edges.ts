import assert from 'node:assert/strict';
import fs from 'node:fs';
import {newSeason} from '../lib/sim/career.ts';
import {canLosePlayer} from '../lib/management/state.ts';
import {startOffer,suggestedTerms,respond,processReplies,marketDay,continueMarket} from '../lib/market/engine.ts';
import {active} from '../lib/market/state.ts';
import {generateIntakes,runTrial,signAcademy,releaseAcademy,academySquad} from '../lib/future/engine.ts';
import {fullUniverse} from '../lib/future/catalog.ts';
const data=JSON.parse(fs.readFileSync('data/generated/universe.json','utf8'));
function fixture(){const s=newSeason(data,'1',441);s.champion='1';s.management!.phase='offseason';s.management!.developedYear=s.year;return s;}
{
 const s=fixture();const p=data.players.filter((p:any)=>p.squad_id!==s.teamId&&canLosePlayer(s,data,p.player_id)&&s.management!.players[p.player_id].contractEnd>s.year).sort((a:any,b:any)=>a.overall-b.overall)[0];const t=startOffer(s,data,p.player_id,{...suggestedTerms(s,data,p.player_id),fee:0});s.market!.day++;processReplies(s,data);assert.equal(t.stage,'club_counter');assert.ok(t.terms.fee>0);respond(s,data,t.id,'accept');for(let n=0;n<10&&active(t);n++){s.market!.day++;processReplies(s,data);if(['player_counter','agreed'].includes(t.stage))respond(s,data,t.id,'accept');}assert.equal(t.stage,'completed');assert.equal(s.management!.players[p.player_id].clubId,s.teamId);console.log('PASS buying-club offer, seller counter, personal terms and final decision complete in sequence');
}
{
 const s=fixture();const p=data.players.filter((p:any)=>canLosePlayer(s,data,p.player_id)).sort((a:any,b:any)=>a.overall-b.overall)[0];s.management!.players[p.player_id].clubId=null;s.management!.players[p.player_id].salary=0;const buyers=data.teams.filter((t:any)=>t.id!==s.teamId).slice(0,2);const weak=startOffer(s,data,p.player_id,{...suggestedTerms(s,data,p.player_id,buyers[0].id),salary:250000,role:'Regular'},buyers[0].id);const strong=startOffer(s,data,p.player_id,{...suggestedTerms(s,data,p.player_id,buyers[1].id),salary:500000,role:'Important'},buyers[1].id);for(let n=0;n<6;n++){s.market!.day++;processReplies(s,data);}assert.equal(strong.stage,'completed');assert.equal(weak.stage,'withdrawn');assert.equal(s.management!.transfers.filter(t=>t.playerId===p.player_id).length,1);console.log('PASS competing offers produce one signing and cancel the losing offer');
}
{
 const s=fixture();s.market!.windowDay=41;s.management!.offseasonWeek=5;const p=data.players.find((p:any)=>p.squad_id===s.teamId);const t=startOffer(s,data,p.player_id,suggestedTerms(s,data,p.player_id));assert.equal(t.expires,1);marketDay(s,data);assert.equal(t.stage,'expired');assert.equal(s.management!.transfers.length,0);console.log('PASS reply deadlines respect the final transfer day; unfinished deals cannot leak past closure');
}
{
 const s=fixture();const p=data.players.filter((p:any)=>p.squad_id===s.teamId&&canLosePlayer(s,data,p.player_id)).sort((a:any,b:any)=>a.overall-b.overall)[0];const buyer=data.teams.find((t:any)=>t.id!==s.teamId).id;const t=startOffer(s,data,p.player_id,suggestedTerms(s,data,p.player_id,buyer),buyer);s.market!.day=t.expires-1;const day=s.market!.day;continueMarket(s,data);assert.equal(s.market!.day,day);assert.ok(s.market!.urgentSeen.includes(t.id));respond(s,data,t.id,'stall');assert.equal(t.expires,day+3);assert.throws(()=>respond(s,data,t.id,'stall'));console.log('PASS urgent bids pause Continue and stalling is limited');
}
{
 const s=fixture();for(const g of academySquad(s,s.teamId).slice(0,7))releaseAcademy(s,g.id);generateIntakes(s,data);runTrial(s,fullUniverse(s,data));const i=s.future!.intakes.find(i=>i.clubId===s.teamId)!;for(const id of i.ids.slice(0,12))signAcademy(s,id);const id=i.ids[0];s.future!.generated[id].level='senior';s.management!.players[id].clubId=s.teamId;s.management!.players[id].salary=45000;assert.throws(()=>signAcademy(s,i.ids[12]));assert.equal(i.signedIds.length,12);console.log('PASS promoting a prospect cannot bypass the annual academy-place limit');
}
