import type {Eligibility} from './eligibility.ts';
import type {GameMatch} from '../sim/types.ts';
export type RepYear={archivedMatches?:import('../sim/archive.ts').ArchivedRep[];year:number;stage:'watch'|'series'|'selected'|'skipped';matches:GameMatch[];active:GameMatch|null;allBlacks:string[];north:string[];south:string[];omissions:string[];reason:string|null;recoveryWeeks:number};
export type Representative={version:1;fallbacks?:Record<string,string>;backgrounds:Record<string,Eligibility>;overrides:Record<string,Eligibility>;portraits:Record<string,number>;years:RepYear[];watch:Record<string,string>};
