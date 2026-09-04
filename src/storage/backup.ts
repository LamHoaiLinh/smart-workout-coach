import type { AppState } from '../types'
import { SCHEMA_VERSION } from './db'

const APP_ID='Smart Workout Coach 1.0'

export function downloadBackup(state:AppState){
  const payload={app:APP_ID,schemaVersion:SCHEMA_VERSION,exportedAt:new Date().toISOString(),data:state}
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})
  const url=URL.createObjectURL(blob)
  const a=document.createElement('a')
  a.href=url;a.download=`smart-workout-1.0-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url)
}

export async function parseBackup(file:File):Promise<AppState>{
  const raw=JSON.parse(await file.text())
  if(raw?.app!==APP_ID||raw?.schemaVersion!==SCHEMA_VERSION||!raw?.data)throw new Error('File sao lưu không đúng phiên bản 1.0.')
  if(!Array.isArray(raw.data.sessions)||!Array.isArray(raw.data.activities)||!Array.isArray(raw.data.metrics))throw new Error('File sao lưu thiếu dữ liệu cần thiết.')
  return raw.data as AppState
}
