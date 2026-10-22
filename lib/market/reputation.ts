import {relationshipPremium,personality} from '../management/dynamics.ts';
import type {Season} from '../sim/types.ts';
import {bound,stable} from '../management/config.ts';
// Game estimates, not published club rankings. Simulated results gradually change them.
const baseline:Record<string,number>={'2':93,'8':87,'7':86,'11':85,'10':84,'1':77,'4':77,'3':74,'9':66,'5':62,'6':56};
export function clubReputation(s:Season,id:string){
 const seasons=s.history.slice(-4),results=seasons.map(h=>h.standings?.find(t=>t.id===id)).filter((t):t is NonNullable<typeof t>=>!!t);
 const current=s.standings.find(t=>t.id===id);if(current?.played)results.push(current);
 const performance=results.length?results.reduce((n,t)=>n+(t!.played?t!.wins/t!.played:.5),0)/results.length:.5;
 return Math.round(bound((baseline[id]??65)+(performance-.5)*28,40,97));
}
export function prestigePremium(s:Season,id:string,buyer:string){
 const c=s.management!.players[id];if(c.clubId===buyer)return relationshipPremium(s,id,buyer);
 const rep=clubReputation(s,buyer),expectation=Math.max(c.clubId?clubReputation(s,c.clubId):60,c.ability>=85?85:c.ability>=78?73:55);
 const drop=Math.max(0,expectation-rep),ambition=.75+personality(s,id).ambition/200;
 return 1+drop*(c.ability>=85?.025:.012)*ambition;
}
export function movedInWindow(s:Season,id:string){return (s.world||s.management?.phase==='offseason')&&s.market?.windowMoves?.[id]===s.year;}
