import { useState } from 'react'
import type { ActivitySession, CardioPlan, ProgramDay, Readiness, UserProfile, WorkoutSession } from '../types'
import { readinessExplanation } from '../core/trainingEngine'
import { activityName, cardioLabels, formatPace } from '../core/cardioEngine'
import { dateLabel } from '../utils/date'

const focusLabel:Record<string,string>={Full:'Toàn thân',Upper:'Thân trên',Lower:'Thân dưới',Push:'Nhóm đẩy',Pull:'Nhóm kéo',Legs:'Chân'}

export default function Today({profile,day,sessions,activities,activeSession,onStart,onResume,onStartCardio}:{profile:UserProfile;day:ProgramDay;sessions:WorkoutSession[];activities:ActivitySession[];activeSession?:WorkoutSession;onStart:(r:Readiness)=>void;onResume:()=>void;onStartCardio:(p:CardioPlan)=>void}){
  const [open,setOpen]=useState(false)
  const [why,setWhy]=useState<string>()
  const [r,setR]=useState<Readiness>({energy:4,soreness:2,sleep:4,motivation:4,minutes:profile.sessionMinutes,lighter:false})
  const completed=sessions.filter(s=>s.completedAt)
  const weekCount=completed.filter(s=>Date.now()-new Date(s.completedAt!).getTime()<7*86400000).length
  const simple=(profile.uiMode??'simple')==='simple'
  const todayKey=new Date().toDateString()
  const todayActivities=activities.filter(a=>new Date(a.completedAt).toDateString()===todayKey)
  const cardio=day.cardio
  return <main className="page"><header><p className="eyebrow">{dateLabel().toUpperCase()}</p><h1>Hôm nay</h1><p className="muted">{profile.name}, đây là phần tập hôm nay.</p></header>
    {activeSession&&<section className="resume-card"><div><b>Bạn có một buổi chưa xong</b><span>{activeSession.title} · đã lưu lại</span></div><button className="btn primary" onClick={onResume}>Tiếp tục</button></section>}
    <section className="hero-card"><div><span className="pill">{focusLabel[day.focus]??day.focus}</span><h2>{day.title}</h2><p>{r.minutes} phút dự kiến · {day.exercises.length} bài{cardio?' · có thêm vận động':''}</p></div><div className="hero-score">{weekCount}<small>buổi / 7 ngày</small></div></section>
    <section className="card"><div className="section-title"><h3>Tập sức mạnh</h3><button className="text-btn" onClick={()=>setOpen(!open)}>{open?'Ẩn':'Điều chỉnh hôm nay'}</button></div>{day.exercises.map((e,i)=><div className="exercise-block" key={e.exerciseId}><div className="exercise-row"><span className="num">{i+1}</span><div><b>{e.name}</b><small>{e.sets} hiệp × {e.seconds?`${e.seconds} giây`:`${e.minReps}–${e.maxReps} lần`}{e.weightKg?` · ${e.weightKg} kg`:''}</small></div><em>{Math.round(e.restSeconds/60*10)/10}' nghỉ</em></div><button className="why-btn" onClick={()=>setWhy(why===e.exerciseId?undefined:e.exerciseId)}>Vì sao có bài này?</button>{why===e.exerciseId&&<div className="why-box"><p>{e.selectionReason??'Bài này hợp với buổi tập và dụng cụ bạn đang có.'}</p>{e.progressionReason&&<p><b>Lần này:</b> {e.progressionReason}</p>}{e.note&&<p><b>Hôm nay:</b> {e.note}</p>}</div>}</div>)}
      {open&&<div className="readiness"><h3>Cơ thể hôm nay</h3>{[['Năng lượng','energy'],['Đau mỏi','soreness'],['Giấc ngủ','sleep'],['Động lực','motivation']].map(([label,key])=><label key={key}>{label}<strong>{r[key as keyof Readiness] as number}/5</strong><input type="range" min="1" max="5" value={r[key as keyof Readiness] as number} onChange={e=>setR({...r,[key]:+e.target.value})}/></label>)}<label>Thời gian thực tế<select value={r.minutes} onChange={e=>setR({...r,minutes:+e.target.value})}>{[15,20,30,45,60,75,90].map(v=><option key={v} value={v}>{v} phút</option>)}</select></label><label className="switch-line"><input type="checkbox" checked={r.lighter} onChange={e=>setR({...r,lighter:e.target.checked})}/> Hôm nay tập nhẹ hơn</label><div className="readiness-preview"><b>Điều chỉnh</b><p>{readinessExplanation(r)}</p></div>{!simple&&<div className="advanced-note">Buổi nhẹ chỉ giảm bớt khối lượng, không tự bỏ cả buổi.</div>}</div>}
      <button className="btn primary full" onClick={()=>onStart(r)}>Bắt đầu tập sức mạnh</button>
    </section>
    {cardio&&<section className="card cardio-today"><div className="section-title"><div><p className="eyebrow">VẬN ĐỘNG THÊM</p><h3>{cardio.title}</h3></div><span className="cardio-duration">{cardio.minutes} phút</span></div><p className="muted">{cardio.note}</p><button className="btn secondary full" onClick={()=>onStartCardio(cardio)}>Bắt đầu {cardioLabels[cardio.mode].toLowerCase()}</button></section>}
    {todayActivities.length>0&&<section className="card"><h3>Đã làm hôm nay</h3>{todayActivities.map(a=><div className="history" key={a.id}><div><b>{activityName(a)}</b><small>{Math.round(a.durationSeconds/60)} phút{a.distanceKm!==undefined?` · ${a.distanceKm.toFixed(2)} km`:''}{a.jumpCount!==undefined?` · ${a.jumpCount} lần`:''}</small></div><span>{a.avgPaceSecPerKm?formatPace(a.avgPaceSecPerKm):'✓'}</span></div>)}</section>}
    <section className="mini-grid"><div className="stat"><b>{completed.length}</b><span>Tổng buổi</span></div><div className="stat"><b>{Math.round(completed.reduce((n,s)=>n+(s.completionPct??0),0)/Math.max(1,completed.length))}%</b><span>Hoàn thành TB</span></div><div className="stat"><b>{activities.length}</b><span>Buổi vận động</span></div></section>
  </main>
}
