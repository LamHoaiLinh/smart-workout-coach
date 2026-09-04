import type { AppState } from '../types'
import { SCHEMA_VERSION } from './db'

export function downloadBackup(state:AppState){
  const payload={app:'Smart Workout Coach V4',schemaVersion:SCHEMA_VERSION,exportedAt:new Date().toISOString(),data:state}
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})
  const url=URL.createObjectURL(blob)
  const a=document.createElement('a')
  a.href=url;a.download=`smart-workout-v4-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url)
}

export async function parseBackup(file:File):Promise<AppState>{
  const raw=JSON.parse(await file.text())
  if(raw?.app!=='Smart Workout Coach V4'||raw?.schemaVersion!==SCHEMA_VERSION||!raw?.data)throw new Error('File sao lưu không đúng phiên bản V4.')
  if(!Array.isArray(raw.data.sessions)||!Array.isArray(raw.data.activities)||!Array.isArray(raw.data.metrics))throw new Error('File sao lưu thiếu dữ liệu cần thiết.')
  return raw.data as AppState
}
