import type {Season} from './types.ts';
let revision:string|null=null;
let loaded=false;
let loadedAt:string|null=null;
let baseline:string|null=null;
export class SaveConflictError extends Error {}
export async function inspectAccountSave():Promise<{career:Season|null;revision:string|null;savedAt?:string}>{const r=await fetch('/api/career?envelope=1',{cache:'no-store',credentials:'same-origin'});if(!r.ok)throw await failure(r);return r.json();}
export async function keepSession(s:Season,approvedRevision:string|null){await queue.catch(()=>{});revision=approvedRevision;loaded=true;baseline=null;await saveCareer(s);await verifyCareer(s);}
export function savedAt(){return loadedAt;}
export async function previousCareer():Promise<unknown>{const r=await fetch('/api/career?snapshot=previous',{cache:'no-store',credentials:'same-origin'});if(!r.ok)throw await failure(r);return r.json();}
export async function verifyCareer(s:Season){const r=await fetch('/api/career?envelope=1',{cache:'no-store',credentials:'same-origin'});if(!r.ok)throw await failure(r);const result=await r.json() as {career:unknown;revision:string;savedAt?:string};if(JSON.stringify(result.career)!==JSON.stringify(s))throw new SaveConflictError('The stored career differs from this session. Review the save conflict to choose which progress to keep.');revision=result.revision;baseline=JSON.stringify(s);loadedAt=result.savedAt??null;return true;}
let queue:Promise<unknown>=Promise.resolve();
async function failure(r:Response){const data=await r.json().catch(()=>({})) as {error?:string};return r.status===409?new SaveConflictError(data.error||'Another career revision is stored. Choose which progress to keep.'):Error(data.error||'Career storage is unavailable. Download a backup.');}
export async function loadCareer():Promise<unknown>{
 const r=await fetch('/api/career?envelope=1',{cache:'no-store',credentials:'same-origin'});if(!r.ok)throw await failure(r);const body=await r.json() as {career?:unknown;revision?:string;savedAt?:string};loadedAt=body.savedAt??null;revision='revision' in body?(body.revision??null):r.headers.get('ETag');loaded=true;const career='career' in body?body.career:body;baseline=career?JSON.stringify(career):null;return career;
}
export function saveCareer(s:Season):Promise<void>{
 // Serialize writes so a slow save cannot overwrite a more recent one from this tab.
 const body=JSON.stringify(s);const next=queue.catch(()=>{}).then(async()=>{
  if(!loaded){const existing=await loadCareer();if(existing!==null){loaded=false;revision=null;throw new SaveConflictError('An existing career was found. Review the save conflict to choose which progress to keep.');}}
  let payload:BodyInit=body,contentType='application/json';if(typeof CompressionStream!=='undefined'){const stream=new Blob([body]).stream().pipeThrough(new CompressionStream('gzip'));payload=await new Response(stream).blob();contentType='application/gzip';}
  const write=()=>fetch('/api/career',{method:'PUT',credentials:'same-origin',headers:{'Content-Type':contentType,...(revision?{'X-Career-Revision':revision}:{'X-Career-Create':'1'})},body:payload});
  let r=await write();if(r.status===409){const remote=await inspectAccountSave();const remoteBody=remote.career?JSON.stringify(remote.career):null;if(remoteBody===body){revision=remote.revision;baseline=body;return;}if(baseline!==null&&remoteBody===baseline){revision=remote.revision;r=await write();}}
  if(!r.ok)throw await failure(r);const result=await r.json() as {revision?:string};revision=result.revision??null;baseline=body;if(!revision)throw Error('Storage did not confirm the save revision. Download a backup before reloading.');
 });queue=next;return next;
}
export function downloadCareer(s:Season){const blob=new Blob([JSON.stringify(s)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`super-rugby-manager-${s.year}-round-${s.round}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

export function downloadSeasonArchive(archive:Season['history'][number]){const blob=new Blob([JSON.stringify(archive,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`super-rugby-${archive.year}-season-record.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
