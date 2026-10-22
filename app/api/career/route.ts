import {env} from 'cloudflare:workers';
import {getCareer,putCareer} from '@/lib/server/career-store';
import catalog from '@/data/generated/simulation-catalog.json';
import type {SimUniverse} from '@/lib/sim/types';
export const dynamic='force-dynamic';
export function GET(request:Request){return getCareer(request,env.BUCKET);}
export function PUT(request:Request){return putCareer(request,env.BUCKET,catalog as unknown as SimUniverse);}
