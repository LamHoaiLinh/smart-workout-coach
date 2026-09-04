import type { ActivitySession, TrainingProgram, WeekPlan, WorkoutSession } from '../types'
import { weekdays } from '../utils/date'

export default function Program({program,weekPlan,sessions,activities,onRegenerate,onToggleBusy}:{program:TrainingProgram;weekPlan:WeekPlan;sessions:WorkoutSession[];activities:ActivitySession[];onRegenerate:()=>void;onToggleBusy:(weekday:number)=>void}){
  const recent=Date.now()-7*86400000
  const doneStrength=new Set(sessions.filter(s=>s.completedAt&&new Date(s.completedAt).getTime()>=recent).map(s=>s.programDayKey)),doneCardio=new Set(activities.filter(a=>new Date(a.completedAt).getTime()>=recent&&a.programDayKey).map(a=>a.programDayKey!))
  const order=[1,2,3,4,5,6,0],busy=new Set(weekPlan.busyDays)
  return <main className="page"><header><p className="eyebrow">TUẦN {program.blockWeek}/{program.blockLength}</p><h1>Giáo án</h1><p className="muted">{program.splitName} · {program.blockTitle}</p></header>
    <section className="card week-availability"><div className="section-title"><div><h3>Tuần này bạn bận ngày nào?</h3><p className="muted">Đánh dấu trước, lịch còn lại sẽ tự xếp lại.</p></div></div><div className="busy-day-grid">{order.map(w=><button key={w} className={busy.has(w)?'active':''} onClick={()=>onToggleBusy(w)}><b>{weekdays[w]}</b><span>{busy.has(w)?'Bận':'Rảnh'}</span></button>)}</div></section>
    <section className="card block-card"><b>{program.blockTitle}</b><p>{program.explanation}</p><div className="block-dots">{Array.from({length:program.blockLength},(_,i)=><i key={i} className={i+1<=program.blockWeek?'active':''}/>)}</div></section>
    {weekPlan.unscheduled.length>0&&<section className="warning"><b>Tuần này hơi kín lịch.</b><div>{weekPlan.unscheduled.length} buổi chưa tìm được ngày trống. Bạn có thể bỏ bớt một ngày bận hoặc giữ buổi đó cho tuần sau.</div></section>}
    <div className="week-plan">{order.map(weekday=>{
      if(busy.has(weekday))return <section className="card program-day rest-day busy-day" key={weekday}><span className="pill">{weekdays[weekday]}</span><h3>Bận / nghỉ</h3><p className="muted">Không xếp buổi tập vào ngày này.</p></section>
      const slot=weekPlan.slots.find(s=>s.weekday===weekday),d=slot?program.days.find(x=>x.key===slot.programDayKey):undefined
      if(!d)return <section className="card program-day rest-day" key={weekday}><span className="pill">{weekdays[weekday]}</span><h3>Nghỉ / linh hoạt</h3><p className="muted">Không có buổi bắt buộc.</p></section>
      const strengthDone=!d.exercises.length||doneStrength.has(d.key),cardioDone=!d.cardio||doneCardio.has(d.key)
      return <section className="card program-day" key={`${weekday}-${d.key}`}><div className="section-title"><div><span className="pill">{weekdays[weekday]}</span><h3>{d.title}</h3>{slot?.moved&&<small className="moved-label">Dời từ {weekdays[slot.originalWeekday]}</small>}</div>{strengthDone&&cardioDone?<span className="done-badge">Đã xong</span>:slot?.moved?<span className="moved-badge">Đã dời</span>:<span className="pending-badge">Theo lịch</span>}</div>{d.exercises.length>0&&<><b className="plan-subtitle">Sức mạnh · {d.exercises.length} bài</b>{d.exercises.map((e,i)=><div className="exercise-row" key={`${e.exerciseId}-${i}`}><span className="num">{i+1}</span><div><b>{e.name}</b><small>{e.sets} hiệp × {e.seconds?`${e.seconds} giây`:`${e.minReps}–${e.maxReps} lần`}{e.weightKg?` · ${e.weightKg} kg`:''}</small></div></div>)}</>}{d.cardio&&<div className="cardio-line"><b>{d.cardio.title}</b><span>{d.cardio.minutes} phút · {d.cardio.intensity==='easy'?'nhẹ':d.cardio.intensity==='steady'?'vừa':'cao'}</span></div>}</section>
    })}</div>
    <button className="btn secondary full" onClick={onRegenerate}>Tính lại giáo án từ tiến độ hiện tại</button></main>
}
