'use client';
import {useEffect,useState} from 'react';
// Device-local view preferences, never career simulation state.
export function usePreference<T>(key:string,fallback:T,durable=false){const [value,setValue]=useState<T>(fallback),[ready,setReady]=useState(false);useEffect(()=>{try{const saved=(durable?localStorage:sessionStorage).getItem('srm-view-'+key);if(saved!==null)setValue(JSON.parse(saved));}catch{}setReady(true)},[key,durable]);useEffect(()=>{if(ready)try{(durable?localStorage:sessionStorage).setItem('srm-view-'+key,JSON.stringify(value));}catch{}},[key,value,ready,durable]);return [value,setValue] as const;}
