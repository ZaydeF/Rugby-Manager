import {SLOTS,FORWARDS} from './config.ts';
export type BenchSplit='4-4'|'5-3'|'6-2'|'7-1';
export const BENCH_SPLITS:BenchSplit[]=['4-4','5-3','6-2','7-1'];
export function matchSlots(split:BenchSplit='5-3'):readonly (readonly [string,string])[]{
 const forwards=Number(split[0]),extra=forwards-3,backs=8-forwards;
 return [...SLOTS.slice(0,15),['Hooker cover','hooker'],['Prop cover','prop'],['Prop cover','prop'],...Array.from({length:extra},(_,i)=>[i===0?'Lock / back-row cover':'Back-row / lock cover',i===0?'lock|loose_forward':'loose_forward|lock'] as const),...Array.from({length:backs},(_,i)=>[backs===1?'Utility back':i===0?'Halfback cover':i===1?'Playmaker cover':'Outside cover',backs===1?'scrum_half|fly_half|center|outside_back':i===0?'scrum_half':i===1?(backs===2?'scrum_half|fly_half|center|outside_back':'fly_half'):'outside_back|center'] as const)] as readonly (readonly [string,string])[];
}
export function suitability(position:string,target:string){
 if(target.split('|').includes(position))return {label:'Natural',factor:1,allowed:true};
 if(target.split('|').some(p=>p==='prop'||p==='hooker'))return {label:'Specialist required',factor:0,allowed:false};
 if(['center','outside_back'].includes(position)&&target.split('|').some(p=>['center','outside_back'].includes(p)))return {label:'Competent',factor:.94,allowed:true};
 if(['lock','loose_forward'].includes(position)&&target.split('|').some(p=>['lock','loose_forward'].includes(p)))return {label:'Competent',factor:.91,allowed:true};
 if(!FORWARDS.includes(position)&&target.split('|').every(p=>!FORWARDS.includes(p)))return {label:'Emergency',factor:target==='scrum_half'?.72:target==='fly_half'?.78:.86,allowed:true};
 return {label:'Unsuitable',factor:0,allowed:false};
}
export function slotSuitability(position:string,slot:number,split:BenchSplit='5-3'){
 const target=matchSlots(split)[slot]?.[1]??'';
 // Bench counts describe actual forwards/backs; specialist reserve places stay protected.
 if(slot>=15)return {label:target.split('|').includes(position)?'Natural':'Unsuitable',factor:target.split('|').includes(position)?1:0,allowed:target.split('|').includes(position)};
 return suitability(position,target);
}
export function positionalPenalty(p:{position:string;playingPosition?:string},key:string){
 if(!p.playingPosition)return 0;const fit=suitability(p.position,p.playingPosition);if(fit.factor===1)return 0;
 // Physical gifts remain intact; unfamiliar execution and decisions pay the cost.
 if(['pace','acceleration','agility','strength','power','stamina','engine','impact'].includes(key))return 0;
 return (1-fit.factor)*100*(key==='decision_making'||key==='defensive_positioning'?1.15:.8);
}
