import type { AppState } from '../types'

const DB_NAME='smart-workout-coach-v4'
const STORE='kv'
const DB_VERSION=1
export const SCHEMA_VERSION=4

export const freshState=():AppState=>({schemaVersion:SCHEMA_VERSION,sessions:[],activities:[],metrics:[],demoMode:false})

function openDb():Promise<IDBDatabase>{
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION)
    req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE)}
    req.onsuccess=()=>resolve(req.result)
    req.onerror=()=>reject(req.error)
  })
}

async function get<T>(key:string):Promise<T|undefined>{
  const db=await openDb()
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,'readonly')
    const req=tx.objectStore(STORE).get(key)
    req.onsuccess=()=>resolve(req.result)
    req.onerror=()=>reject(req.error)
  })
}

async function put<T>(key:string,value:T){
  const db=await openDb()
  return new Promise<void>((resolve,reject)=>{
    const tx=db.transaction(STORE,'readwrite')
    tx.objectStore(STORE).put(value,key)
    tx.oncomplete=()=>resolve()
    tx.onerror=()=>reject(tx.error)
  })
}

export async function loadState(){
  const raw=await get<AppState>('app')
  if(!raw||raw.schemaVersion!==SCHEMA_VERSION)return freshState()
  return {...freshState(),...raw,activities:raw.activities??[]}
}

export async function saveState(state:AppState){await put('app',{...state,schemaVersion:SCHEMA_VERSION})}
export async function resetState(){const next=freshState();await saveState(next);return next}

export function makeDemoState():AppState{
  const now=Date.now(), iso=(days:number)=>new Date(now-days*86400000).toISOString()
  return {
    schemaVersion:SCHEMA_VERSION,demoMode:true,metrics:[{id:'m1',date:iso(28),weightKg:78.4,waistCm:88},{id:'m2',date:iso(2),weightKg:77.1,waistCm:86}],
    activities:[{id:'a1',mode:'run',startedAt:iso(4),completedAt:iso(4),durationSeconds:1480,distanceKm:3.2,avgPaceSecPerKm:463,plannedMinutes:25,effort:3}],
    sessions:[
      {id:'d1',programDayKey:'full-a-1',title:'Full A',startedAt:iso(10),completedAt:iso(10),overallDifficulty:3,fatigue:2,completionPct:100,exercises:[{exerciseId:'pullup',name:'Pull-up',planned:{exerciseId:'pullup',name:'Pull-up',sets:3,minReps:5,maxReps:8,restSeconds:120},sets:[{reps:5,completed:true},{reps:5,completed:true},{reps:4,completed:true}],feedback:'good'}]},
      {id:'d2',programDayKey:'full-b-3',title:'Full B',startedAt:iso(6),completedAt:iso(6),overallDifficulty:3,fatigue:3,completionPct:100,exercises:[{exerciseId:'pullup',name:'Pull-up',planned:{exerciseId:'pullup',name:'Pull-up',sets:3,minReps:5,maxReps:8,restSeconds:120},sets:[{reps:6,completed:true},{reps:5,completed:true},{reps:5,completed:true}],feedback:'good'}]},
      {id:'d3',programDayKey:'full-c-5',title:'Full C',startedAt:iso(2),completedAt:iso(2),overallDifficulty:3,fatigue:2,completionPct:100,exercises:[{exerciseId:'pushup',name:'Push-up',planned:{exerciseId:'pushup',name:'Push-up',sets:3,minReps:8,maxReps:15,restSeconds:75},sets:[{reps:15,completed:true},{reps:14,completed:true},{reps:13,completed:true}],feedback:'good'}]}
    ]
  }
}
