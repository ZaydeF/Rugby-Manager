'use client';
import {useEffect,useState} from 'react';
// Device-local view preferences, never career simulation state.
export function usePreference<T>(key:string,fallback:T){const [value,setValue]=useState<T>(fallback),[ready,setReady]=useState(false);useEffect(()=>{try{const saved=sessionStorage.getItem('srm-view-'+key);if(saved!==null)setValue(JSON.parse(saved));}catch{}setReady(true)},[key]);useEffect(()=>{if(ready)try{sessionStorage.setItem('srm-view-'+key,JSON.stringify(value));}catch{}},[key,value,ready]);return [value,setValue] as const;}
