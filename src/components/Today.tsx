import { useState } from 'react'
import type { ProgramDay, Readiness, UserProfile, WorkoutSession } from '../types'
import { dateLabel } from '../utils/date'

export default function Today({profile,day,sessions,activeSession,onStart,onResume}:{profile:UserProfile;day:ProgramDay;sessions:WorkoutSession[];activeSession?:WorkoutSession;onStart:(r:Readiness)=>void;onResume:()=>void}){
  const [open,setOpen]=useState(false)
  const [r,setR]=useState<Readiness>({energy:4,soreness:2,sleep:4,motivation:4,minutes:profile.sessionMinutes,lighter:false})
  const completed=sessions.filter(s=>s.completedAt)
  const weekCount=completed.filter(s=>Date.now()-new Date(s.completedAt!).getTime()<7*86400000).length
  return <main className="page"><header><p className="eyebrow">{dateLabel().toUpperCase()}</p><h1>Hôm nay</h1><p className="muted">{profile.name}, mở app là biết buổi cần tập. Không cần tự ghép bài.</p></header>
    {activeSession&&<section className="resume-card"><div><b>Bạn có một buổi tập chưa hoàn thành</b><span>{activeSession.title} · đã lưu tự động</span></div><button className="btn primary" onClick={onResume}>Tiếp tục</button></section>}
    <section className="hero-card"><div><span className="pill">{day.focus}</span><h2>{day.title}</h2><p>{r.minutes} phút dự kiến · {day.exercises.length} bài</p></div><div className="hero-score">{weekCount}<small>buổi / 7 ngày</small></div></section>
    <section className="card"><div className="section-title"><h3>Buổi tập</h3><button className="text-btn" onClick={()=>setOpen(!open)}>{open?'Ẩn kiểm tra':'Điều chỉnh hôm nay'}</button></div>{day.exercises.map((e,i)=><div className="exercise-row" key={e.exerciseId}><span className="num">{i+1}</span><div><b>{e.name}</b><small>{e.sets} hiệp × {e.seconds?`${e.seconds} giây`:`${e.minReps}–${e.maxReps} lần`}{e.weightKg?` · ${e.weightKg} kg`:''}</small></div><em>{Math.round(e.restSeconds/60*10)/10}' nghỉ</em></div>)}
      {open&&<div className="readiness"><h3>Cơ thể hôm nay</h3>{[['Năng lượng','energy'],['Đau mỏi','soreness'],['Giấc ngủ','sleep'],['Động lực','motivation']].map(([label,key])=><label key={key}>{label}<strong>{r[key as keyof Readiness] as number}/5</strong><input type="range" min="1" max="5" value={r[key as keyof Readiness] as number} onChange={e=>setR({...r,[key]:+e.target.value})}/></label>)}<label>Thời gian thực tế<select value={r.minutes} onChange={e=>setR({...r,minutes:+e.target.value})}>{[15,20,30,45,60,75,90].map(v=><option key={v} value={v}>{v} phút</option>)}</select></label><label className="switch-line"><input type="checkbox" checked={r.lighter} onChange={e=>setR({...r,lighter:e.target.checked})}/> Cho tôi buổi nhẹ hơn</label></div>}
      <button className="btn primary full" onClick={()=>onStart(r)}>Bắt đầu tập</button>
    </section>
    <section className="mini-grid"><div className="stat"><b>{completed.length}</b><span>Tổng buổi</span></div><div className="stat"><b>{Math.round(completed.reduce((n,s)=>n+(s.completionPct??0),0)/Math.max(1,completed.length))}%</b><span>Hoàn thành TB</span></div><div className="stat"><b>{profile.daysPerWeek}</b><span>Mục tiêu/tuần</span></div></section>
  </main>
}
