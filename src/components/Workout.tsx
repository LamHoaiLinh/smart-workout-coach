import { useEffect, useMemo, useState } from 'react'
import { exerciseById } from '../data/exercises'
import { suggestSwap } from '../core/trainingEngine'
import NumberPad from './NumberPad'
import type { DifficultyFeedback, UserProfile, WorkoutSession } from '../types'

type Props={session:WorkoutSession;profile:UserProfile;history:WorkoutSession[];onChange:(s:WorkoutSession)=>void;onFinish:(overall:number,fatigue:number,pain:boolean,painArea:string)=>void;onCancel:()=>void}
const simpleDifficulty=(n:number)=>n<=2?'Dễ':n<=4?'Vừa':'Khó'

export default function Workout({session,profile,history,onChange,onFinish,onCancel}:Props){
  const [exerciseIndex,setExerciseIndex]=useState(()=>Math.max(0,session.exercises.findIndex(e=>!e.skipped&&e.sets.some(s=>!s.completed))))
  const [rest,setRest]=useState(0),[showSwap,setShowSwap]=useState(false),[finishOpen,setFinishOpen]=useState(false)
  const [overall,setOverall]=useState(3),[fatigue,setFatigue]=useState(3),[pain,setPain]=useState(false),[painArea,setPainArea]=useState('')
  const item=session.exercises[exerciseIndex],ex=exerciseById.get(item.exerciseId)
  const activeSet=Math.max(0,item.sets.findIndex(s=>!s.completed)),currentSet=item.sets[Math.min(activeSet,item.sets.length-1)]
  const [reps,setReps]=useState(currentSet?.reps??item.planned.minReps??0),[seconds,setSeconds]=useState(currentSet?.seconds??item.planned.seconds??0),[weight,setWeight]=useState(currentSet?.weightKg??item.planned.weightKg??0)
  const simple=profile.uiMode==='simple'

  useEffect(()=>{if(rest<=0)return;const t=setInterval(()=>setRest(x=>Math.max(0,x-1)),1000);return()=>clearInterval(t)},[rest])
  useEffect(()=>{const next=item?.sets.find(s=>!s.completed);setReps(next?.reps??item?.planned.minReps??0);setSeconds(next?.seconds??item?.planned.seconds??0);setWeight(next?.weightKg??item?.planned.weightKg??0)},[exerciseIndex,activeSet,item?.exerciseId])
  const previous=useMemo(()=>history.filter(s=>s.completedAt).flatMap(s=>s.exercises).filter(e=>e.exerciseId===item.exerciseId).at(-1),[history,item.exerciseId])
  const swaps=suggestSwap(item.exerciseId,profile,session.exercises.map(e=>e.exerciseId))
  const updateItem=(next:any)=>{const arr=[...session.exercises];arr[exerciseIndex]=next;onChange({...session,exercises:arr})}
  const completeSet=()=>{const idx=item.sets.findIndex(s=>!s.completed);if(idx<0)return;const sets=item.sets.map((s,i)=>i===idx?{...s,reps:item.planned.seconds?undefined:reps,seconds:item.planned.seconds?seconds:undefined,weightKg:item.planned.weightKg!==undefined?weight:undefined,completed:true}:s);updateItem({...item,sets});setRest(item.planned.restSeconds)}
  const feedback=(f:DifficultyFeedback)=>updateItem({...item,feedback:f})
  const goNext=()=>{if(exerciseIndex<session.exercises.length-1){setExerciseIndex(exerciseIndex+1);setRest(0);setShowSwap(false)}else setFinishOpen(true)}
  const skip=()=>{updateItem({...item,skipped:true,sets:item.sets.map(s=>({...s,completed:false}))});goNext()}
  const swap=(id:string)=>{const e=exerciseById.get(id);if(!e)return;const p={...item.planned,exerciseId:e.id,name:e.nameEnglish,minReps:e.minReps,maxReps:e.maxReps,seconds:e.holdSeconds,restSeconds:e.recommendedRest,weightKg:e.weighted?item.planned.weightKg:undefined,selectionReason:'Đã đổi sang bài cùng kiểu vận động, dụng cụ phù hợp và độ khó gần tương đương.',progressionReason:undefined};updateItem({exerciseId:e.id,name:e.nameEnglish,planned:p,sets:Array.from({length:p.sets},()=>({weightKg:p.weightKg,completed:false}))});setShowSwap(false)}
  const allDone=item.skipped||item.sets.every(s=>s.completed)
  const feedbackItems=simple?([['too_easy','Quá nhẹ'],['good','Vừa'],['hard','Khó'],['near_limit','Gần hết sức'],['failed','Không hoàn thành']] as [DifficultyFeedback,string][]):([['too_easy','Quá nhẹ · RIR 4+'],['good','Vừa · RIR 2–3'],['hard','Khó · RIR 1–2'],['near_limit','Gần hết sức · RIR 0–1'],['failed','Không hoàn thành · RIR 0']] as [DifficultyFeedback,string][])
  return <div className="workout-shell"><header className="workout-top"><button className="icon-btn" onClick={onCancel}>×</button><div><small>{session.title}</small><b>Bài {exerciseIndex+1}/{session.exercises.length}</b></div><span>{Math.round(session.exercises.filter(e=>e.skipped||e.sets.every(s=>s.completed)).length/session.exercises.length*100)}%</span></header>
    <main className="workout-main"><div className="progress-line"><i style={{width:`${(exerciseIndex+1)/session.exercises.length*100}%`}}/></div><section className="workout-title"><span className="pill">{ex?.primaryMuscles.join(' · ')}</span><h1>{item.name}</h1><p>{ex?.nameVietnamese}</p>{previous&&<div className="last-time">Lần trước: {previous.sets.filter(s=>s.completed).map(s=>s.reps??s.seconds).join(' / ')} {item.planned.seconds?'giây':'lần'}</div>}{item.planned.progressionReason&&<div className="progression-callout"><b>Điều chỉnh:</b> {item.planned.progressionReason}</div>}</section>
      <section className="set-card"><div className="set-head"><b>Hiệp {Math.min(activeSet+1,item.sets.length)} / {item.sets.length}</b><span>Mục tiêu {item.planned.seconds?`${item.planned.seconds} giây`:`${item.planned.minReps}–${item.planned.maxReps} lần`}</span></div>{!allDone&&<>{item.planned.weightKg!==undefined&&<Counter label="Mức tạ" value={weight} step={profile.trainingType==='home'?(profile.dumbbell?.stepKg??1):2.5} suffix="kg" decimal onChange={setWeight}/>}<Counter label={item.planned.seconds?'Thời gian thực tế':'Số lần thực tế'} value={item.planned.seconds?seconds:reps} step={1} suffix={item.planned.seconds?'giây':'lần'} onChange={item.planned.seconds?setSeconds:setReps}/><p className="tap-number-hint">Ví dụ mục tiêu 10 lần nhưng bạn làm được 9: chạm vào số và nhập 9.</p><button className="btn primary full xl" onClick={completeSet}>Hoàn thành hiệp</button></>}
        <div className="set-dots">{item.sets.map((s,i)=><span key={i} className={s.completed?'done':''}>{i+1}</span>)}</div></section>
      {allDone&&<section className="card"><h3>Bài này cảm giác thế nào?</h3>{simple&&<p className="muted">Chọn cảm giác gần nhất. Lần sau mức tập sẽ dựa thêm vào lựa chọn này.</p>}<div className="feedback-grid">{feedbackItems.map(([v,n])=><button className={item.feedback===v?'active':''} key={v} onClick={()=>feedback(v)}>{n}</button>)}</div><div className="actions"><button className="btn ghost" onClick={()=>setShowSwap(!showSwap)}>Đổi bài</button><button className="btn primary" onClick={goNext}>{exerciseIndex===session.exercises.length-1?'Kết thúc buổi':'Bài tiếp theo'}</button></div></section>}
      {!allDone&&<div className="small-actions"><button onClick={()=>setShowSwap(!showSwap)}>Đổi bài</button><button onClick={skip}>Bỏ bài hôm nay</button></div>}
      {showSwap&&<section className="card"><h3>Đổi bài tương đương</h3><p className="muted">Cùng kiểu vận động, dụng cụ phù hợp và độ khó gần tương đương.</p>{swaps.length?swaps.map(e=><button className="swap-row" key={e.id} onClick={()=>swap(e.id)}><div><b>{e.nameEnglish}</b><small>{e.nameVietnamese}</small></div><span>Độ khó {simple?simpleDifficulty(e.difficulty):`${e.difficulty}/6`}</span></button>):<p>Không có bài thay thế phù hợp với dụng cụ hiện tại.</p>}</section>}
      {ex&&<details className="card"><summary>Kỹ thuật động tác</summary><ol>{ex.instructionsVietnamese.map((x,i)=><li key={i}>{x}</li>)}</ol><b>Hít thở</b><p>{ex.breathingVietnamese}</p></details>}
    </main>
    {rest>0&&<div className="rest-overlay"><div><small>NGHỈ GIỮA HIỆP</small><b>{String(Math.floor(rest/60)).padStart(2,'0')}:{String(rest%60).padStart(2,'0')}</b><div className="rest-actions"><button onClick={()=>setRest(rest+15)}>+15 giây</button><button onClick={()=>setRest(rest+30)}>+30 giây</button><button onClick={()=>setRest(0)}>Bỏ qua</button></div></div></div>}
    {finishOpen&&<div className="modal-back"><section className="modal card"><h2>Kết thúc buổi tập</h2><label>Độ khó chung <strong>{overall}/5</strong><input type="range" min="1" max="5" value={overall} onChange={e=>setOverall(+e.target.value)}/></label><label>Mức mệt <strong>{fatigue}/5</strong><input type="range" min="1" max="5" value={fatigue} onChange={e=>setFatigue(+e.target.value)}/></label><label className="switch-line"><input type="checkbox" checked={pain} onChange={e=>setPain(e.target.checked)}/> Có đau bất thường</label>{pain&&<input value={painArea} onChange={e=>setPainArea(e.target.value)} placeholder="Vị trí đau..."/>}<div className="warning">Nếu đau nhói, sưng, yếu hoặc hạn chế vận động, dừng động tác gây đau và cân nhắc đánh giá chuyên môn y tế.</div><button className="btn primary full" onClick={()=>onFinish(overall,fatigue,pain,painArea)}>Lưu và hoàn thành</button><button className="btn ghost full" onClick={()=>setFinishOpen(false)}>Quay lại buổi tập</button></section></div>}
  </div>
}

function Counter({label,value,step,suffix,onChange,decimal=false}:{label:string;value:number;step:number;suffix:string;onChange:(v:number)=>void;decimal?:boolean}){
  const [pad,setPad]=useState(false)
  const set=(v:number)=>onChange(Math.max(0,Math.round(v*10)/10))
  return <div className="counter"><span>{label}</span><div><button onClick={()=>set(value-step)}>−</button><button className="counter-value" onClick={()=>setPad(true)} aria-label={`Nhập ${label}`}><b>{value}<small>{suffix}</small></b><em>chạm để nhập</em></button><button onClick={()=>set(value+step)}>+</button></div>{pad&&<NumberPad title={label} value={value} allowDecimal={decimal} unit={suffix} onClose={()=>setPad(false)} onConfirm={v=>{set(v);setPad(false)}}/>}</div>
}
