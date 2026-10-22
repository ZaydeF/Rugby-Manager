import type {Season,Fixture,GameMatch} from '../sim/types.ts';
import {catalog} from './catalog.ts';
import {news} from './development.ts';
export function ensureShield(s:Season){return s.world!.shield??={holder:catalog.teams.find(t=>t.name==='Otago')!.id,history:[]};}
export function shieldChallenge(s:Season,f:Fixture){const sh=s.world!.shield;return !!sh&&f.round<=10&&f.home===sh.holder&&catalog.teams.some(t=>t.id===f.home&&t.competition==='NPC');}
export function recordShield(s:Season,f:Fixture,m:GameMatch){const sh=ensureShield(s);if(sh.history.some(h=>h.fixtureId===f.id)||!shieldChallenge(s,f))return;const [homeScore,awayScore]=m.teams.map(t=>t.stats.score),holder=sh.holder,winner=awayScore>homeScore?f.away:holder;sh.history.push({fixtureId:f.id,date:f.date.slice(0,10),holder,challenger:f.away,homeScore,awayScore,winner});sh.holder=winner;const name=catalog.teams.find(t=>t.id===winner)!.name;news(s,`shield-${f.id}`,`${name} ${winner===holder?'retain':'win'} the Ranfurly Shield`,`${homeScore}–${awayScore}. ${winner===holder?'The holder survives the challenge.':'The Shield has a new home.'} Regular-season NPC home matches are challenges; playoffs are excluded.`);}
// Existing current-season results can be replayed without touching match/player records.
export function migrateShield(s:Season){if(s.world!.shield)return;ensureShield(s);const fixtures=s.world!.primary==='NPC'?s.fixtures:s.world!.background.fixtures;for(const f of [...fixtures].sort((a,b)=>a.date.localeCompare(b.date)))if(f.result)recordShield(s,f,f.result);}
