import { useState } from 'react'
import type { ProgramDay, Readiness, UserProfile, WorkoutSession } from '../types'
import { readinessExplanation } from '../core/trainingEngine'
import { dateLabel } from '../utils/date'

const focusLabel:Record<string,string>={Full:'Toàn thân',Upper:'Thân trên',Lower:'Thân dưới',Push:'Nhóm đẩy',Pull:'Nhóm kéo',Legs:'Chân'}

export default function Today({profile,day,sessions,activeSession,onStart,onResume}:{profile:UserProfile;day:ProgramDay;sessions:WorkoutSession[];activeSession?:WorkoutSession;onStart:(r:Readiness)=>void;onResume:()=>void}){
  const [open,setOpen]=useState(false)
  const [why,setWhy]=useState<string>()
  const [r,setR]=useState<Readiness>({energy:4,soreness:2,sleep:4,motivation:4,minutes:profile.sessionMinutes,lighter:false})
  const completed=sessions.filter(s=>s.completedAt)
  const weekCount=completed.filter(s=>Date.now()-new Date(s.completedAt!).getTime()<7*86400000).length
  const simple=(profile.uiMode??'simple')==='simple'
  return <main className="page"><header><p className="eyebrow">{dateLabel().toUpperCase()}</p><h1>Hôm nay</h1><p className="muted">{profile.name}, mở app là biết buổi cần tập. Không cần tự ghép bài.</p></header>
    {activeSession&&<section className="resume-card"><div><b>Bạn có một buổi tập chưa hoàn thành</b><span>{activeSession.title} · đã lưu tự động</span></div><button className="btn primary" onClick={onResume}>Tiếp tục</button></section>}
    <section className="hero-card"><div><span className="pill">{focusLabel[day.focus]??day.focus}</span><h2>{day.title}</h2><p>{r.minutes} phút dự kiến · {day.exercises.length} bài</p></div><div className="hero-score">{weekCount}<small>buổi / 7 ngày</small></div></section>
    <section className="card"><div className="section-title"><h3>Buổi tập</h3><button className="text-btn" onClick={()=>setOpen(!open)}>{open?'Ẩn điều chỉnh':'Điều chỉnh hôm nay'}</button></div>{day.exercises.map((e,i)=><div className="exercise-block" key={e.exerciseId}><div className="exercise-row"><span className="num">{i+1}</span><div><b>{e.name}</b><small>{e.sets} hiệp × {e.seconds?`${e.seconds} giây`:`${e.minReps}–${e.maxReps} lần`}{e.weightKg?` · ${e.weightKg} kg`:''}</small></div><em>{Math.round(e.restSeconds/60*10)/10}' nghỉ</em></div><button className="why-btn" onClick={()=>setWhy(why===e.exerciseId?undefined:e.exerciseId)}>Vì sao app chọn bài này?</button>{why===e.exerciseId&&<div className="why-box"><p>{e.selectionReason??'Bài này phù hợp với mục tiêu, dụng cụ và cấu trúc buổi tập hiện tại.'}</p>{e.progressionReason&&<p><b>Điều chỉnh độ khó:</b> {e.progressionReason}</p>}{e.note&&<p><b>Hôm nay:</b> {e.note}</p>}</div>}</div>)}
      {open&&<div className="readiness"><h3>Cơ thể hôm nay</h3>{[['Năng lượng','energy'],['Đau mỏi','soreness'],['Giấc ngủ','sleep'],['Động lực','motivation']].map(([label,key])=><label key={key}>{label}<strong>{r[key as keyof Readiness] as number}/5</strong><input type="range" min="1" max="5" value={r[key as keyof Readiness] as number} onChange={e=>setR({...r,[key]:+e.target.value})}/></label>)}<label>Thời gian thực tế<select value={r.minutes} onChange={e=>setR({...r,minutes:+e.target.value})}>{[15,20,30,45,60,75,90].map(v=><option key={v} value={v}>{v} phút</option>)}</select></label><label className="switch-line"><input type="checkbox" checked={r.lighter} onChange={e=>setR({...r,lighter:e.target.checked})}/> Cho tôi buổi nhẹ hơn</label><div className="readiness-preview"><b>App sẽ làm gì?</b><p>{readinessExplanation(r)}</p></div>{!simple&&<div className="advanced-note">Chế độ nâng cao: readiness chỉ điều chỉnh khối lượng/thời gian nghỉ; app không tự huỷ buổi chỉ vì một chỉ số thấp.</div>}</div>}
      <button className="btn primary full" onClick={()=>onStart(r)}>Bắt đầu tập</button>
    </section>
    <section className="mini-grid"><div className="stat"><b>{completed.length}</b><span>Tổng buổi</span></div><div className="stat"><b>{Math.round(completed.reduce((n,s)=>n+(s.completionPct??0),0)/Math.max(1,completed.length))}%</b><span>Hoàn thành TB</span></div><div className="stat"><b>{profile.daysPerWeek}</b><span>Mục tiêu/tuần</span></div></section>
  </main>
}
