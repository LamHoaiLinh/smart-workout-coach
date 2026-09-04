import { useEffect, useRef, useState } from 'react'
import { cardioLabels, formatPace } from '../core/cardioEngine'
import type { ActivitySession, CardioPlan } from '../types'

type Point={lat:number;lon:number;accuracy:number}
const uid=()=>crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random()}`

function haversine(a:Point,b:Point){
  const r=6371,rad=Math.PI/180
  const dLat=(b.lat-a.lat)*rad,dLon=(b.lon-a.lon)*rad
  const x=Math.sin(dLat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dLon/2)**2
  return 2*r*Math.asin(Math.sqrt(x))
}

export default function ActivityTracker({plan,onSave,onClose}:{plan:CardioPlan;onSave:(a:ActivitySession)=>void;onClose:()=>void}){
  const [status,setStatus]=useState<'idle'|'running'|'paused'>('idle')
  const [seconds,setSeconds]=useState(0)
  const [distance,setDistance]=useState(0)
  const [jumps,setJumps]=useState(0)
  const [gps,setGps]=useState('')
  const startedAt=useRef('')
  const watchId=useRef<number|undefined>(undefined)
  const lastPoint=useRef<Point|undefined>(undefined)

  useEffect(()=>{
    if(status!=='running') return
    const t=window.setInterval(()=>setSeconds(v=>v+1),1000)
    return()=>window.clearInterval(t)
  },[status])

  const stopGps=()=>{
    if(watchId.current!==undefined){navigator.geolocation?.clearWatch(watchId.current);watchId.current=undefined}
    lastPoint.current=undefined
  }
  useEffect(()=>()=>stopGps(),[])

  const startGps=()=>{
    if(plan.mode==='jump_rope') return
    if(!navigator.geolocation){setGps('Thiết bị này không hỗ trợ GPS trong trình duyệt.');return}
    setGps('Đang lấy GPS…')
    watchId.current=navigator.geolocation.watchPosition(pos=>{
      const p:Point={lat:pos.coords.latitude,lon:pos.coords.longitude,accuracy:pos.coords.accuracy}
      setGps(p.accuracy<=50?'GPS ổn':`GPS đang yếu · ±${Math.round(p.accuracy)} m`)
      const prev=lastPoint.current
      lastPoint.current=p
      if(!prev||p.accuracy>60||prev.accuracy>60) return
      const km=haversine(prev,p)
      if(km>=0.002&&km<=0.25) setDistance(v=>v+km)
    },err=>setGps(err.code===1?'Bạn chưa cho phép dùng vị trí.':'Chưa lấy được GPS. Thử ra nơi thoáng hơn.'),{enableHighAccuracy:true,maximumAge:2000,timeout:12000})
  }

  const start=()=>{if(!startedAt.current)startedAt.current=new Date().toISOString();setStatus('running');startGps()}
  const pause=()=>{setStatus('paused');stopGps()}
  const resume=()=>{setStatus('running');startGps()}
  const finish=()=>{
    stopGps()
    const completedAt=new Date().toISOString()
    const pace=distance>=0.05?Math.round(seconds/distance):undefined
    onSave({id:uid(),mode:plan.mode,startedAt:startedAt.current||completedAt,completedAt,durationSeconds:seconds,distanceKm:plan.mode==='jump_rope'?undefined:Math.round(distance*1000)/1000,jumpCount:plan.mode==='jump_rope'?jumps:undefined,avgPaceSecPerKm:pace,plannedMinutes:plan.minutes})
  }
  const cancel=()=>{if(status==='idle'||confirm('Huỷ buổi này? Số liệu chưa lưu sẽ mất.'))onClose()}
  const pace=distance>=0.05?seconds/distance:undefined
  const mm=String(Math.floor(seconds/60)).padStart(2,'0'),ss=String(seconds%60).padStart(2,'0')
  const pct=Math.min(100,Math.round(seconds/Math.max(1,plan.minutes*60)*100))

  return <div className="activity-shell"><header className="activity-top"><button className="icon-btn" onClick={cancel}>×</button><div><small>VẬN ĐỘNG</small><b>{cardioLabels[plan.mode]}</b></div><span>{pct}%</span></header>
    <main className="activity-main">
      <section className="activity-hero"><p>{plan.title}</p><h1>{mm}:{ss}</h1><span>Mục tiêu khoảng {plan.minutes} phút</span></section>
      {plan.mode!=='jump_rope'?<section className="activity-metrics"><div><b>{distance.toFixed(2)}</b><span>km</span></div><div><b>{formatPace(pace)}</b><span>pace</span></div></section>:<section className="jump-panel"><p>Số lần nhảy</p><b>{jumps}</b><div><button onClick={()=>setJumps(Math.max(0,jumps-10))}>−10</button><button onClick={()=>setJumps(jumps+10)}>+10</button><button onClick={()=>setJumps(jumps+50)}>+50</button></div><label>Nhập nhanh<input type="number" min="0" value={jumps} onChange={e=>setJumps(Math.max(0,+e.target.value||0))}/></label></section>}
      {plan.mode!=='jump_rope'&&<div className="gps-note"><b>{gps||'GPS chỉ bật khi bạn bắt đầu'}</b><span>Giữ màn hình mở khi đo quãng đường để số liệu ổn định hơn.</span></div>}
      <div className="activity-plan-note">{plan.note}</div>
      <div className="activity-controls">{status==='idle'&&<button className="btn primary xl full" onClick={start}>Bắt đầu</button>}{status==='running'&&<><button className="btn secondary" onClick={pause}>Tạm dừng</button><button className="btn primary" onClick={finish}>Kết thúc & lưu</button></>}{status==='paused'&&<><button className="btn secondary" onClick={resume}>Tiếp tục</button><button className="btn primary" onClick={finish}>Kết thúc & lưu</button></>}</div>
    </main>
  </div>
}
