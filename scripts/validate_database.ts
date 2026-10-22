import fs from 'node:fs';
import {validateDatabaseImport} from '../lib/packs/importer.ts';
const path=process.argv[2]??'data/generated/universe.json';
try{const issues=validateDatabaseImport(JSON.parse(fs.readFileSync(path,'utf8')));console.log(JSON.stringify({file:path,status:issues.length?'rejected':'valid for current adapter',issues},null,2));if(issues.length)process.exitCode=1;}catch(e){console.error(String(e));process.exitCode=1;}
