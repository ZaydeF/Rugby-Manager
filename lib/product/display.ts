export function positionLabel(value:string|null|undefined){const labels:Record<string,string>={prop:'Prop',hooker:'Hooker',lock:'Lock',loose_forward:'Loose Forward',scrum_half:'Scrum Half',fly_half:'Fly Half',center:'Centre',outside_back:'Outside Back',unknown:'Unconfirmed'};return labels[value??'']??(value??'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());}
export const ratingTone=(rating:number)=>rating>=7?'good':rating>=6.3?'amber':'bad';
export const readinessTone=(value:number)=>value>=75?'good':value>=60?'amber':'bad';
