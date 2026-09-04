import type { AppState } from '../types'
import { migrate, SCHEMA_VERSION } from './db'

export function downloadBackup(state:AppState){
  const payload={app:'Smart Workout Coach',exportedAt:new Date().toISOString(),schemaVersion:SCHEMA_VERSION,data:{...state,schemaVersion:SCHEMA_VERSION}}
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})
  const url=URL.createObjectURL(blob); const a=document.createElement('a')
  a.href=url; a.download=`smart-workout-backup-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url)
}
export async function parseBackup(file:File):Promise<AppState>{
  const raw=JSON.parse(await file.text())
  if(raw?.app!=='Smart Workout Coach'||!raw?.data||!Array.isArray(raw.data.sessions)) throw new Error('File sao lưu không hợp lệ.')
  if((raw.schemaVersion??0)>SCHEMA_VERSION) throw new Error('Bản sao lưu được tạo bởi phiên bản mới hơn.')
  return migrate(raw.data)
}
