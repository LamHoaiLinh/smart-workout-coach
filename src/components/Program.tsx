import type { TrainingProgram } from '../types'
import { cardioLabels } from '../core/cardioEngine'
import { weekdays } from '../utils/date'

export default function Program({program,onRegenerate}:{program:TrainingProgram;onRegenerate:()=>void}){
  return <main className="page"><header><p className="eyebrow">TUẦN {program.blockWeek}/{program.blockLength}</p><h1>Giáo án</h1><p className="muted">{program.splitName}</p></header>
    <section className="card info"><b>Lịch tuần này</b><p>{program.explanation}</p></section>
    {program.days.map(d=><section className="card program-day" key={d.key}><div className="section-title"><div><span className="pill">{weekdays[d.weekday]}</span><h3>{d.title}</h3></div><b>{d.exercises.length} bài</b></div>{d.exercises.map((e,i)=><div className="exercise-row" key={`${e.exerciseId}-${i}`}><span className="num">{i+1}</span><div><b>{e.name}</b><small>{e.sets} hiệp × {e.seconds?`${e.seconds} giây`:`${e.minReps}–${e.maxReps} lần`}{e.weightKg?` · ${e.weightKg} kg`:''}</small>{e.progressionReason&&<small className="good">{e.progressionReason}</small>}</div></div>)}{d.cardio&&<div className="program-cardio"><span>+</span><div><b>{cardioLabels[d.cardio.mode]} · {d.cardio.minutes} phút</b><small>{d.cardio.note}</small></div></div>}</section>)}
    <button className="btn secondary full" onClick={onRegenerate}>Tính lại giáo án</button>
  </main>
}
