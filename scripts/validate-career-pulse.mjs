import fs from 'node:fs';
import {newWorld,advanceWorld} from '../lib/world/engine.ts';
import {ensurePulse,pulseDay} from '../lib/world/pulse.ts';
import {migrateWorld} from '../lib/world/migrate.ts';
import {validSave} from '../lib/sim/validation.ts';
const report=[];
for(const team of ['1','npc-1']){
 const s=newWorld(team,20260918);let steps=0;
 while(s.year<2031&&steps++<700){advanceWorld(s);pulseDay(s);if(steps%25===0){if(!validSave(s,{}))throw Error(`Invalid save ${team} ${s.year} ${s.world.phase} ${steps}`);const copy=migrateWorld(JSON.parse(JSON.stringify(s)),{});if(!copy||JSON.stringify(copy.world.pulse)!==JSON.stringify(s.world.pulse))throw Error('Pulse migration differs');}if(steps%50===0)console.log(team,s.year,s.world.phase,steps);}
 if(s.year!==2031)throw Error('Career did not advance five seasons');
 const p=ensurePulse(s);if(new Set(p.matches.map(m=>m.id)).size!==p.matches.length)throw Error('Duplicate matches');if(new Set(p.awards.map(a=>a.id)).size!==p.awards.length)throw Error('Duplicate awards');if(new Set(p.stories.map(a=>a.id)).size!==p.stories.length)throw Error('Duplicate stories');
 const bytes=Buffer.byteLength(JSON.stringify(s));if(bytes>35*1024*1024)throw Error('Save exceeds storage limit');
 report.push({team,year:s.year,steps,matches:p.matches.length,awards:p.awards.length,stories:p.stories.length,bytes,valid:validSave(s,{})});
 fs.writeFileSync(`docs/career-pulse-validation.json`,JSON.stringify(report,null,2));console.log(report.at(-1));
}
