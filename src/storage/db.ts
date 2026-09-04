import type { AppState } from '../types'

const DB_NAME='smart-workout-coach'; const STORE='kv'; const DB_VERSION=1; export const SCHEMA_VERSION=1
const initialState:AppState={schemaVersion:SCHEMA_VERSION,sessions:[],metrics:[],demoMode:false}

function openDb():Promise<IDBDatabase>{
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION)
    req.onupgradeneeded=()=>{ const db=req.result; if(!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE) }
    req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error)
  })
}
async function get<T>(key:string):Promise<T|undefined>{ const db=await openDb(); return new Promise((res,rej)=>{const tx=db.transaction(STORE,'readonly'); const r=tx.objectStore(STORE).get(key); r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error)}) }
async function put<T>(key:string,value:T){ const db=await openDb(); return new Promise<void>((res,rej)=>{const tx=db.transaction(STORE,'readwrite'); tx.objectStore(STORE).put(value,key); tx.oncomplete=()=>res(); tx.onerror=()=>rej(tx.error)}) }

function migrate(raw:any):AppState{
  if(!raw) return structuredClone(initialState)
  const v=raw.schemaVersion??0
  let next={...raw}
  if(v<1) next={...next,schemaVersion:1,sessions:next.sessions??[],metrics:next.metrics??[],demoMode:false}
  return {...structuredClone(initialState),...next,schemaVersion:SCHEMA_VERSION}
}

export async function loadState(){ return migrate(await get<AppState>('app')) }
export async function saveState(state:AppState){ await put('app',{...state,schemaVersion:SCHEMA_VERSION}) }
export async function resetState(){ await saveState(structuredClone(initialState)); return structuredClone(initialState) }

export function makeDemoState():AppState{
  const now=new Date(); const days=(n:number)=>new Date(now.getTime()-n*86400000).toISOString()
  return {schemaVersion:1,demoMode:true,metrics:[{id:'m1',date:days(20),weightKg:78.4,waistCm:88},{id:'m2',date:days(2),weightKg:77.2,waistCm:86}],sessions:[
    {id:'d1',programDayKey:'demo',title:'Upper A',startedAt:days(7),completedAt:days(7),overallDifficulty:3,fatigue:2,completionPct:100,exercises:[{exerciseId:'pullup',name:'Pull-up',planned:{exerciseId:'pullup',name:'Pull-up',sets:3,minReps:5,maxReps:8,restSeconds:120},sets:[{reps:6,completed:true},{reps:5,completed:true},{reps:5,completed:true}],feedback:'good'}]},
    {id:'d2',programDayKey:'demo',title:'Upper B',startedAt:days(3),completedAt:days(3),overallDifficulty:3,fatigue:3,completionPct:100,exercises:[{exerciseId:'pullup',name:'Pull-up',planned:{exerciseId:'pullup',name:'Pull-up',sets:3,minReps:5,maxReps:8,restSeconds:120},sets:[{reps:7,completed:true},{reps:6,completed:true},{reps:6,completed:true}],feedback:'good'}]}
  ]}
}
