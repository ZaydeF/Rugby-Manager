export const DEPARTMENTS=[
 {name:'Home',route:'Home',pages:[['Home','Today'],['Inbox','Inbox'],['Manager','Manager & career']]},
 {name:'Squad',route:'Squad',pages:[['Squad','Players'],['Selection','Selection'],['Plans','Playing plans'],['Fitness','Fitness & sharpness'],['Dynamics','Dressing room']]},
 {name:'Tactics',route:'Tactics',pages:[['Tactics','Game plan'],['Preparation','Weekly preparation'],['Matchday','Match preview'],['Match','Live match']]},
 {name:'Recruitment',route:'Recruitment',pages:[['Recruitment','Player search'],['Scouting','Scouting'],['RecruitInbox','Negotiations'],['Contracts','Club contracts']]},
 {name:'Development',route:'Development',pages:[['Development','Pathways'],['Youth','Development matches'],['Progress','Player progress'],['Intake','Academy intake'],['Coaching','Coaching & training']]},
 {name:'Club',route:'Club',pages:[['Club','Club report'],['History','Club history'],['Staff','Staff & responsibilities'],['Schedule','Fixtures'],['Table','Competition'],['Stats','Statistics'],['All Blacks','Representative']]},
] as const;
export function department(tab:string){const alias=tab==='NPC Watch'?'Development':tab==='Union'?'Club':tab==='Player'?'Squad':tab;return DEPARTMENTS.find(d=>d.pages.some(p=>p[0]===alias))??DEPARTMENTS[0];}
