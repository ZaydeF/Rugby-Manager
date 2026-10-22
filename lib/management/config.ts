export {MANAGEMENT,ROLE_FACTOR,EXPECTED_STARTS,POSITION_MIN,POSITION_TARGET} from '../../data/packs/super-rugby/finances.ts';
export function stable(seed:number,key:string){let n=seed>>>0;for(const c of key)n=Math.imul(n^c.charCodeAt(0),16777619)>>>0;return n/4294967296;}
export const bound=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
