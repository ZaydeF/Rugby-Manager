import type {SquadRole} from '../management/types.ts';
export type Terms={fee:number;salary:number;years:number;role:SquadRole};
export type OfferState='club_pending'|'club_counter'|'incoming'|'player_pending'|'player_counter'|'decision'|'agreed'|'completed'|'rejected'|'withdrawn'|'expired';
export type Thread={id:string;playerId:string;buyer:string;seller:string|null;year:number;stage:OfferState;terms:Terms;clubAccepted:boolean;userAccepted:boolean;patience:number;rounds:number;due:number;expires:number;stalled:boolean;read:boolean;messages:{day:number;sender:string;text:string;terms:Terms|null}[]};
export type Bulletin={id:string;title:string;text:string;year:number;day:number;read:boolean;kind:'market'|'academy'|'development'|'concern'|'retirement';playerId?:string};
export type Market={version:1;day:number;windowDay:number;threads:Thread[];shortlist:string[];bulletins:Bulletin[];urgentSeen:string[];windowMoves?:Record<string,number>;retirementNotices:Record<string,number>};
