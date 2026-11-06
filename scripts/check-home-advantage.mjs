// A sensitivity check, not an empirical calibration of real-world home advantage.
import fs from 'node:fs';
import {newWorld,prepare} from '../lib/world/engine.ts';
import {instantResult} from '../lib/sim/engine.ts';
import {CONFIG} from '../lib/sim/config.ts';
const count=Number(process.argv[2]??500),output=process.argv[3]??'docs/home-advantage-check.json';
const s=newWorld('1',75),f=s.fixtures.find(f=>[f.home,f.away].includes('1')),base=prepare(s,f,'SR'),a=structuredClone(base.teams[0]);
a.matchMood=0;const b=structuredClone(a);b.id='mirror';b.name='Equal opposition';const rename=id=>'away-'+id;b.players=Object.fromEntries(Object.entries(b.players).map(([id,p])=>[rename(id),{...p,id:rename(id)}]));b.lineup=b.lineup.map(rename);b.bench=b.bench.map(rename);b.used=b.used.map(rename);for(const k of ['kicker','secondaryKicker','tacticalKicker'])b[k]=rename(b[k]);if(b.minuteLimits)b.minuteLimits=Object.fromEntries(Object.entries(b.minuteLimits).map(([id,v])=>[rename(id),v]));base.teams=[a,b];
const configured=CONFIG.homeAdvantage,rows=[];
try{for(const modifier of [0,configured]){CONFIG.homeAdvantage=modifier;let home=0,draws=0,margin=0,points=0;for(let i=0;i<count;i++){const m=structuredClone(base);m.seed=1000+i;m.rng=m.seed;instantResult(m);const [a,b]=m.teams.map(t=>t.stats.score);home+=+(a>b);draws+=+(a===b);margin+=a-b;points+=a+b;}rows.push({modifier,matches:count,homeWinRate:home/count,drawRate:draws/count,meanHomeMargin:margin/count,meanTotalPoints:points/count});}}
finally{CONFIG.homeAdvantage=configured;}
const report={method:'Identical player skills, condition, tactics, mood and team preparation on both sides. Independent phase seeds paired between neutral and configured scenarios. No venue, travel or crowd model. This measures model sensitivity, not agreement with real results.',rows};fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
