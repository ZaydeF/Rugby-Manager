import {validSave} from '../sim/validation.ts';
import type {SimUniverse} from '../sim/types.ts';
const LIMIT=35*1024*1024;
function reply(message:string,status:number){return Response.json({error:message},{status,headers:{'Cache-Control':'no-store'}});}
async function context(request:Request,bucket:R2Bucket|undefined){
 const user=request.headers.get('oai-authenticated-user-id');if(!user)return {error:reply('Sign in to save or load your career.',401)};
 if(!bucket)return {error:reply('Career storage is temporarily unavailable. Keep playing and download a backup.',503)};
 const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(user));
 const key='careers/'+Array.from(new Uint8Array(hash)).map(n=>n.toString(16).padStart(2,'0')).join('')+'/current.json';
 return {bucket:bucket,key};
}
export async function getCareer(request:Request,bucket:R2Bucket|undefined){try{
 const ctx=await context(request,bucket);if(ctx.error)return ctx.error;
 const snapshot=new URL(request.url).searchParams.get('snapshot');let previousKey:string|undefined;if(snapshot==='previous'){const current=await ctx.bucket.get(ctx.key);previousKey=current?.customMetadata?.previousKey;if(!previousKey?.startsWith(ctx.key.replace('current.json','revision-')))return reply('No previous save is available yet.',404);}
 const key=snapshot==='previous'?previousKey!:snapshot==='before-world'?ctx.key.replace('current.json','before-world-v6.json'):snapshot==='before-representative'?ctx.key.replace('current.json','before-representative-v5.json'):snapshot==='before-future'?ctx.key.replace('current.json','before-future-v4.json'):snapshot==='before-management'?ctx.key.replace('current.json','before-management-v3.json'):ctx.key;const object=await ctx.bucket.get(key);if(!object&&['before-management','before-future','before-representative','before-world'].includes(snapshot??''))return reply('No pre-update backup exists for this career.',404);if(!object)return Response.json({career:null,revision:null},{headers:{'Cache-Control':'no-store'}});
 if(new URL(request.url).searchParams.get('envelope')==='1')return Response.json({career:JSON.parse(await new Response(object.body).text()),revision:object.httpEtag,savedAt:object.customMetadata?.savedAt??null},{headers:{'Cache-Control':'no-store','ETag':object.httpEtag}});
 return new Response(object.body,{headers:{'Content-Type':'application/json','Cache-Control':'no-store','ETag':object.httpEtag}});
}catch{console.error('Career load failed');return reply('Could not load your saved career. Try again shortly.',503);}}
export async function putCareer(request:Request,bucket:R2Bucket|undefined,catalog:SimUniverse){try{
 const origin=request.headers.get('Origin');if(origin&&origin!==new URL(request.url).origin)return reply('This save request came from another site.',403);
 const ctx=await context(request,bucket);if(ctx.error)return ctx.error;
 if(Number(request.headers.get('Content-Length')||0)>LIMIT)return reply('The backup exceeds the save size limit.',413);
 const compressed=request.headers.get('Content-Type')?.includes('application/gzip');if(!compressed&&!request.headers.get('Content-Type')?.includes('application/json'))return reply('Expected a JSON career backup.',415);
 const stream=compressed?request.body?.pipeThrough(new DecompressionStream('gzip')):request.body;
 const reader=stream?.getReader();if(!reader)return reply('No career was supplied.',400);let size=0;const parts:Uint8Array[]=[];
 while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>LIMIT){await reader.cancel();return reply('The backup exceeds the save size limit.',413);}parts.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.byteLength;}const body=new TextDecoder().decode(bytes);
 let parsed:unknown;try{parsed=JSON.parse(body);}catch{return reply('The backup is not valid JSON.',400);}
 if(!validSave(parsed,catalog))return reply('This career could not be validated. Download a backup and keep this tab open so the save can be recovered.',400);
 const revision=request.headers.get('X-Career-Revision')??request.headers.get('If-Match');const first=request.headers.get('X-Career-Create')==='1'||request.headers.get('If-None-Match')==='*';if(!revision&&!first)return reply('Reload your career before saving.',428);
 const existing=await ctx.bucket.get(ctx.key);if(existing&&(!revision||revision!==existing.httpEtag)||!existing&&!first)return reply('Your career changed in another tab or device. Download this session before reloading.',409);
 const existingText=existing?await new Response(existing.body).text():null;const previousKey=existing?ctx.key.replace('current.json','revision-'+encodeURIComponent(existing.httpEtag)+'.json'):undefined;
 if(existing&&previousKey)await ctx.bucket.put(previousKey,existingText!,{httpMetadata:{contentType:'application/json'},customMetadata:existing.customMetadata,onlyIf:new Headers({'If-None-Match':'*'})});
 if(existing&&existing.customMetadata?.careerVersion!==String(parsed.version)&&revision===existing.httpEtag){const previous=JSON.parse(existingText!) as {version?:number};if((previous.version??0)<6&&parsed.version===6)await ctx.bucket.put(ctx.key.replace('current.json','before-world-v6.json'),JSON.stringify(previous),{httpMetadata:{contentType:'application/json'},onlyIf:new Headers({'If-None-Match':'*'})});else if((previous.version??0)<5&&parsed.version===5)await ctx.bucket.put(ctx.key.replace('current.json','before-representative-v5.json'),JSON.stringify(previous),{httpMetadata:{contentType:'application/json'},onlyIf:new Headers({'If-None-Match':'*'})});else if((previous.version??0)<4&&parsed.version===4)await ctx.bucket.put(ctx.key.replace('current.json','before-future-v4.json'),JSON.stringify(previous),{httpMetadata:{contentType:'application/json'},onlyIf:new Headers({'If-None-Match':'*'})});else if(previous.version===2&&parsed.version===3)await ctx.bucket.put(ctx.key.replace('current.json','before-management-v3.json'),JSON.stringify(previous),{httpMetadata:{contentType:'application/json'},onlyIf:new Headers({'If-None-Match':'*'})});}
 const result=await ctx.bucket.put(ctx.key,body,{customMetadata:{careerVersion:String((parsed as {version:number}).version),savedAt:new Date().toISOString(),...(previousKey?{previousKey}:{})},httpMetadata:{contentType:'application/json'},onlyIf:new Headers(revision?{'If-Match':revision}:{'If-None-Match':'*'})});
 if(!result)return reply('Your career changed in another tab or device. Download this session as a backup, then reload to choose which progress to keep.',409);
 const obsolete=existing?.customMetadata?.previousKey;if(obsolete&&obsolete!==previousKey&&obsolete.startsWith(ctx.key.replace('current.json','revision-'))&&ctx.bucket.delete)await ctx.bucket.delete(obsolete).catch(()=>{});
 return Response.json({revision:result.httpEtag},{headers:{'Cache-Control':'no-store','ETag':result.httpEtag}});
}catch{console.error('Career save failed');return reply('Could not save your career. Your current session is still available; download a backup.',503);}}
