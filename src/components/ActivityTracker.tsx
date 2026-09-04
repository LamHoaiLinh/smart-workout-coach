import { useEffect, useRef, useState } from 'react'
import { cardioLabels, formatPace } from '../core/cardioEngine'
import type { ActivitySession, CardioPlan } from '../types'

type Point={lat:number;lon:number;accuracy:number}
const uid=()=>crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random()}`
function haversine(a:Point,b:Point){const r=6371,rad=Math.PI/180,dLat=(b.lat-a.lat)*rad,dLon=(b.lon-a.lon)*rad,x=Math.sin(dLat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dLon/2)**2;return 2*r*Math.asin(Math.sqrt(x))}

export default function ActivityTracker({plan,programDayKey,onSave,onClose}:{plan:CardioPlan;programDayKey:string;onSave:(a:ActivitySession)=>void;onClose:()=>void}){
  const [status,setStatus]=useState<'idle'|'running'|'paused'|'review'>('idle'),[seconds,setSeconds]=useState(0),[distance,setDistance]=useState(0),[jumps,setJumps]=useState(0),[gps,setGps]=useState(''),[effort,setEffort]=useState(3),[manualKm,setManualKm]=useState('')
  const startedAt=useRef(''),watchId=useRef<number|null>(null),lastPoint=useRef<Point|null>(null)
  useEffect(()=>{if(status!=='running')return;const t=window.setInterval(()=>setSeconds(v=>v+1),1000);return()=>window.clearInterval(t)},[status])
  const stopGps=()=>{if(watchId.current!==null){navigator.geolocation?.clearWatch(watchId.current);watchId.current=null}lastPoint.current=null}
  useEffect(()=>()=>stopGps(),[])
  const startGps=()=>{if(plan.mode==='jump_rope')return;if(!navigator.geolocation){setGps('Thiết bị này không hỗ trợ GPS trong trình duyệt.');return}setGps('Đang lấy GPS…');watchId.current=navigator.geolocation.watchPosition(pos=>{const p:Point={lat:pos.coords.latitude,lon:pos.coords.longitude,accuracy:pos.coords.accuracy};setGps(p.accuracy<=50?'GPS ổn':`GPS đang yếu · ±${Math.round(p.accuracy)} m`);const prev=lastPoint.current;lastPoint.current=p;if(!prev||p.accuracy>60||prev.accuracy>60)return;const km=haversine(prev,p);if(km>=0.002&&km<=0.25)setDistance(v=>v+km)},err=>setGps(err.code===1?'Chưa được cấp quyền vị trí.':'Chưa lấy được GPS. Thử ra nơi thoáng hơn.'),{enableHighAccuracy:true,maximumAge:2000,timeout:12000})}
  const start=()=>{if(!startedAt.current)startedAt.current=new Date().toISOString();setStatus('running');startGps()}
  const pause=()=>{setStatus('paused');stopGps()}
  const resume=()=>{setStatus('running');startGps()}
  const review=()=>{stopGps();setStatus('review')}
  const save=()=>{const completedAt=new Date().toISOString(),finalDistance=plan.mode==='jump_rope'?undefined:(distance>=0.05?distance:Math.max(0,+manualKm||0)),pace=finalDistance&&finalDistance>=0.05?Math.round(seconds/finalDistance):undefined;onSave({id:uid(),programDayKey,mode:plan.mode,startedAt:startedAt.current||completedAt,completedAt,durationSeconds:seconds,distanceKm:finalDistance!==undefined?Math.round(finalDistance*1000)/1000:undefined,jumpCount:plan.mode==='jump_rope'?jumps:undefined,avgPaceSecPerKm:pace,plannedMinutes:plan.minutes,effort})}
  const cancel=()=>{if(status==='idle'||confirm('Huỷ buổi này? Số liệu chưa lưu sẽ mất.')){stopGps();onClose()}}
  const pace=distance>=0.05?seconds/distance:undefined,mm=String(Math.floor(seconds/60)).padStart(2,'0'),ss=String(seconds%60).padStart(2,'0'),pct=Math.min(100,Math.round(seconds/Math.max(1,plan.minutes*60)*100))
  return <div className="activity-shell"><header className="activity-top"><button className="icon-btn" onClick={cancel}>×</button><div><small>VẬN ĐỘNG</small><b>{cardioLabels[plan.mode]}</b></div><span>{pct}%</span></header><main className="activity-main">
    <section className="activity-hero"><p>{plan.title}</p><h1>{mm}:{ss}</h1><span>Mục tiêu khoảng {plan.minutes} phút</span></section>
    {plan.mode!=='jump_rope'?<section className="activity-metrics"><div><b>{distance.toFixed(2)}</b><span>km</span></div><div><b>{formatPace(pace)}</b><span>pace</span></div></section>:<section className="jump-panel"><p>Số lần nhảy</p><b>{jumps}</b><div><button onClick={()=>setJumps(Math.max(0,jumps-10))}>−10</button><button onClick={()=>setJumps(jumps+10)}>+10</button><button onClick={()=>setJumps(jumps+50)}>+50</button></div><label>Nhập nhanh<input type="number" min="0" value={jumps} onChange={e=>setJumps(Math.max(0,+e.target.value||0))}/></label></section>}
    {plan.mode!=='jump_rope'&&<div className="gps-note"><b>{gps||'GPS chỉ bật khi bấm Bắt đầu'}</b><span>Nếu GPS không ổn, có thể nhập quãng đường lúc kết thúc.</span></div>}
    <div className="activity-plan-note">{plan.note}</div>
    {status==='review'?<section className="card activity-review"><h3>Kết thúc buổi</h3>{plan.mode!=='jump_rope'&&distance<0.05&&<label>Quãng đường thực tế (km)<input type="number" min="0" step="0.01" value={manualKm} onChange={e=>setManualKm(e.target.value)} placeholder="Ví dụ 2.5"/></label>}<label>Cảm giác chung <strong>{effort}/5</strong><input type="range" min="1" max="5" value={effort} onChange={e=>setEffort(+e.target.value)}/></label><button className="btn primary full" onClick={save}>Lưu buổi vận động</button></section>:<div className="activity-controls">{status==='idle'&&<button className="btn primary xl full" onClick={start}>Bắt đầu</button>}{status==='running'&&<><button className="btn secondary" onClick={pause}>Tạm dừng</button><button className="btn primary" onClick={review}>Kết thúc</button></>}{status==='paused'&&<><button className="btn secondary" onClick={resume}>Tiếp tục</button><button className="btn primary" onClick={review}>Kết thúc</button></>}</div>}
  </main></div>
}
