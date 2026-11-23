import fs from 'node:fs';
import {newWorld} from '../lib/world/engine.ts';
import {advanceDay,calendarDate,matchDue} from '../lib/world/calendar.ts';
import {quickSim} from '../lib/world/engine.ts';
import {instantResult} from '../lib/sim/engine.ts';
import {setResponsibility} from '../lib/club/staff.ts';
import {validSave} from '../lib/sim/validation.ts';
const rows=process.argv[3]?JSON.parse(fs.readFileSync(process.argv[2]??'docs/manager-ux-daily-check.json','utf8')).rows:[];
for(const club of (process.argv[3]??'5,6,4,npc-9').split(',')){const s=newWorld(club,73);for(const task of ['playingPlans','training','preparation','fitness','scouting','renewals'])setResponsibility(s,task,true);let matches=0,days=0;const first=s.year;
 for(let n=0;n<520&&s.year===first;n++){if(s.world.announcement!=null)s.world.announcement=null;if(s.world.representative?.xvAnnouncement!=null)s.world.representative.xvAnnouncement=null;if(matchDue(s)){quickSim(s);matches++;}advanceDay(s);days++;if(!validSave(s,{}))throw Error(`invalid ${club} ${calendarDate(s)}`);}
 const row={club,days,matches,year:s.year,staffPaidCurrentSeason:s.staffOffice.clubs[club].paid,plans:Object.keys(s.managerPlans.players).length,clubsWithNegativeCash:Object.entries(s.management.finances).filter(([,f])=>f.cash<0).map(([id])=>id),valid:validSave(s,{})};if(s.year===first)throw Error('career did not roll over');rows.push(row);fs.writeFileSync(process.argv[2]??'docs/manager-ux-daily-check.json',JSON.stringify({method:'Four actual calendar careers over one full season/rollover each, all six tasks delegated. Every day validates; user matches explicitly delegated. This is bounded integration evidence, not a long-term balance calibration.',rows},null,2)+'\n');console.log(JSON.stringify(row));}
