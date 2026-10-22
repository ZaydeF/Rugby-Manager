import assert from 'node:assert/strict';
import fs from 'node:fs';
import {getCareer,putCareer} from '../lib/server/career-store.ts';
import {migrateCareer} from '../lib/management/migrate.ts';
import {newSeason} from '../lib/sim/career.ts';
import type {SimUniverse} from '../lib/sim/types.ts';
const data=JSON.parse(fs.readFileSync('data/generated/universe.json','utf8')) as SimUniverse;
const saved=new Map<string,{body:string;httpEtag:string}>();let writes=0;
const bucket={async get(key:string){return saved.get(key)??null;},async put(key:string,body:string,options:{onlyIf:Headers}){const old=saved.get(key);const expected=options.onlyIf.get('If-Match');if(expected&&expected!==old?.httpEtag||options.onlyIf.get('If-None-Match')==='*'&&old)return null;const value={body,httpEtag:`"${++writes}"`};saved.set(key,value);return value;}} as unknown as R2Bucket;
function request(user:string|null,body?:string,extra:Record<string,string>={}){return new Request('https://game.example/api/career',{method:body===undefined?'GET':'PUT',headers:{...(user?{'oai-authenticated-user-id':user}:{}),...(body!==undefined?{'Content-Type':'application/json','Origin':'https://game.example','If-None-Match':'*'}:{}),...extra},body});}
const career=newSeason(data,data.teams[0].id,100),body=JSON.stringify(career);
assert.equal((await getCareer(request(null),bucket)).status,401);
assert.equal((await getCareer(request('one'),undefined)).status,503);
assert.deepEqual(await (await getCareer(request('one'),bucket)).json(),{career:null,revision:null});
let r=await putCareer(request('one',body),bucket,data);assert.equal(r.status,200);const etag=r.headers.get('ETag')!;
r=await getCareer(request('one'),bucket);assert.deepEqual(await r.json(),career);
assert.deepEqual(await (await getCareer(request('two'),bucket)).json(),{career:null,revision:null});
r=await putCareer(request('one',body),bucket,data);assert.equal(r.status,409,'duplicate first-save cannot overwrite');
r=await putCareer(request('one',body,{'If-Match':etag,'If-None-Match':''}),bucket,data);assert.equal(r.status,200);
r=await putCareer(request('one',body,{'If-Match':etag,'If-None-Match':''}),bucket,data);assert.equal(r.status,409,'stale tab cannot overwrite');
assert.equal((await putCareer(request('one',body,{'Origin':'https://other.example'}),bucket,data)).status,403);
assert.equal((await putCareer(request('one','{}'),bucket,data)).status,400);
assert.equal((await putCareer(request('one','not json'),bucket,data)).status,400);
assert.equal((await putCareer(request('one','{}',{'Content-Length':String(40*1024*1024)}),bucket,data)).status,413);
assert.equal(saved.size,2);assert.equal(writes,3); // Current save plus its recovery checkpoint.
console.log('PASS career storage: authenticated ownership, durable round-trip, conditional conflict protection, invalid imports, size limits and unavailable-state handling. R2 adapter mocked; hosted integration remains unverified.');

const old=structuredClone(career);for(const id of Object.keys(old.future!.generated)){delete old.management!.players[id];delete old.condition[id];}delete old.future;delete old.market;delete old.representative;old.version=3;const initial=await putCareer(request('legacy',JSON.stringify(old)),bucket,data);assert.equal(initial.status,200);const updated=migrateCareer(old,data)!;const migrated=await putCareer(request('legacy',JSON.stringify(updated),{'If-Match':initial.headers.get('ETag')!,'If-None-Match':''}),bucket,data);assert.equal(migrated.status,200);const checkpointRequest=new Request('https://game.example/api/career?snapshot=before-representative',{headers:{'oai-authenticated-user-id':'legacy'}});const checkpoint=await getCareer(checkpointRequest,bucket);assert.equal(checkpoint.status,200);assert.deepEqual(await checkpoint.json(),old);assert.equal((await getCareer(new Request('https://game.example/api/career?snapshot=before-representative',{headers:{'oai-authenticated-user-id':'two'}}),bucket)).status,404);console.log('PASS pre-update backup retained on v3 to v5 save; other accounts cannot access it.');
