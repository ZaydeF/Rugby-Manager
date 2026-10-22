import type {MatchStats} from '../sim/types.ts';
export type Generated={id:string;name:string;position:string;birthDate:string;academyId:string;intake:number;level:'trialist'|'academy'|'senior'|'retired'|'guest';trait:'Diligent'|'Balanced'|'Inconsistent';region:'NORTH'|'SOUTH'|'UNKNOWN';nationality:string;contractEnd:number;scoutOffset:number;retiredYear:number|null};
export type YouthRow={id:string;name:string;team:string;stats:MatchStats;injuryWeeks:number};
export type YouthMatch={id:string;year:number;round:number;home:string;away:string;homeScore:number;awayScore:number;rows:YouthRow[];events:string[];forfeit:boolean};
export type Intake={year:number;clubId:string;ids:string[];signedIds:string[];trial:YouthMatch|null;decided:boolean};
export type YouthSeason={year:number;matches:YouthMatch[];finishedRounds:number[]};
export type Future={plans?:Record<string,import('./pathway.ts').YouthPlan>;version:1;generated:Record<string,Generated>;intakes:Intake[];u21:YouthSeason;history:{year:number;champion:string;table:{id:string;played:number;points:number;difference:number}[];standouts:{id:string;name:string;minutes:number;rating:number}[]}[];retired:Record<string,number>};
