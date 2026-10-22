import type {Season} from '../sim/types.ts';
import {stable} from '../management/config.ts';

import {REAL_ELIGIBILITY as national,NZ_CONTRACT_CLUBS,FRANCHISE_FALLBACK,NON_NZ,north,south,provinceRegion,type Region,type Eligibility} from '../../data/packs/super-rugby/eligibility.ts';
export {REAL_ELIGIBILITY,NZ_CONTRACT_CLUBS,FRANCHISE_FALLBACK,NON_NZ,SOURCES,provinceRegion,type Region,type Eligibility} from '../../data/packs/super-rugby/eligibility.ts';
export function eligibility(s:Season,id:string):Eligibility{
 if(NON_NZ[id])return {status:'ineligible',union:NON_NZ[id].union,province:null,region:'UNKNOWN',basis:'Capped for another union; no automatic switch',source:NON_NZ[id].source,regionSource:null};
 const correction=s.representative?.overrides[id];if(correction)return {...correction,basis:`Career correction: ${correction.basis}`};
 const g=s.future?.generated[id];
 if(g){const bio=s.representative?.backgrounds[id];return bio??{status:'unverified',union:g.nationality,province:null,region:'UNKNOWN',basis:'Fictional background not yet assigned',source:null,regionSource:null};}
 const known=national[id],club=s.representative?.fallbacks?.[id],fallback=club?FRANCHISE_FALLBACK[club]:null;
 if(known){if(known.region==='UNKNOWN'&&fallback&&fallback.region!=='UNKNOWN')return {...known,region:fallback.region,basis:`${known.basis}. Island uses franchise fallback: ${fallback.name}; first province remains unverified.`};return known;}
 if(fallback&&fallback.union!=='Unverified')return {status:fallback.union==='New Zealand'?'eligible':'ineligible',union:fallback.union,province:null,region:fallback.region,basis:`Franchise fallback: ${fallback.name} at assignment. Game assumption, not verified national eligibility.`,source:null,regionSource:null};
 return {status:'unverified',union:'Unverified',province:null,region:'UNKNOWN',basis:fallback?'Moana has multiple national pathways; franchise alone cannot determine one.':'No club available for a franchise fallback.',source:null,regionSource:null};
}
export function eligibleReason(s:Season,id:string,region?:Region):string|null{
 const e=eligibility(s,id),c=s.management?.players[id],g=s.future?.generated[id];
 if(e.status!=='eligible'||e.union!=='New Zealand')return e.status==='ineligible'?'Represents another union':'NZ eligibility unverified';
 if(!c?.clubId||!NZ_CONTRACT_CLUBS.has(c.clubId)||c.contractEnd<s.year)return 'No active NZ domestic senior contract';
 if(s.future?.retired[id]||g&&g.level!=='senior')return 'Not in senior rugby';
 if(region&&(e.region==='UNKNOWN'||e.region!==region))return 'First province not verified for this island';
 return null;
}
export function generatedBackground(s:Season,id:string):Eligibility{
 const g=s.future!.generated[id],nz=g.nationality==='New Zealand';
 const list=g.region==='NORTH'?[...north]:[...south];
 const p=nz&&g.region!=='UNKNOWN'?list[Math.floor(stable(s.seed,`${id}-province`)*list.length)]:null;
 return {status:nz?'eligible':'ineligible',union:g.nationality,province:p,region:provinceRegion(p),basis:nz?'Fictional NZ-born prospect; assigned first provincial pathway (game background, not a real NPC appearance)':'Fictional non-NZ representative pathway; transfers do not change eligibility',source:null,regionSource:null};
}
