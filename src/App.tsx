import { useEffect, useMemo, useState } from 'react'
import Onboarding from './components/Onboarding'
import Nav, { type Tab } from './components/Nav'
import Today from './components/Today'
import Program from './components/Program'
import Progress from './components/Progress'
import Library from './components/Library'
import Settings from './components/Settings'
import Workout from './components/Workout'
import { applyReadiness, createSession, finishSession, generateProgram, getTodayProgramDay } from './core/trainingEngine'
import { downloadBackup, parseBackup } from './storage/backup'
import { loadState, makeDemoState, resetState, saveState } from './storage/db'
import type { AppState, BodyMetric, Readiness, UserProfile, WorkoutSession } from './types'

export default function App(){
  const [state,setState]=useState<AppState|null>(null); const [tab,setTab]=useState<Tab>('today'); const [toast,setToast]=useState(''); const [workoutOpen,setWorkoutOpen]=useState(false)
  useEffect(()=>{loadState().then(setState)},[])
  useEffect(()=>{if(state) saveState(state)},[state])
  useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),2600);return()=>clearTimeout(t)},[toast])
  const update=(next:AppState)=>setState(next)
  const createProfile=(profile:UserProfile)=>{const program=generateProgram(profile,[]);update({schemaVersion:1,profile,program,sessions:[],metrics:[],demoMode:false});setTab('today')}
  const demo=()=>{const d=makeDemoState();const profile:UserProfile={id:'demo-profile',name:'Người dùng Demo',trainingType:'calisthenics',goal:'recomp',experience:'beginner',daysPerWeek:3,trainingDays:[1,3,5],sessionMinutes:30,activityLevel:'medium',equipment:['Pull-up Bar','Dip Bar'],benchmarks:{pushup:15,pullup:4,dip:6},injuries:[],unit:'kg',theme:'light',createdAt:new Date().toISOString()};const program=generateProgram(profile,d.sessions);update({...d,profile,program})}
  if(!state)return <div className="loading">Đang mở dữ liệu cục bộ…</div>
  if(!state.profile||!state.program)return <Onboarding onDone={createProfile} onDemo={demo}/>
  const p=state.profile, program=state.program, today=getTodayProgramDay(program)
  const start=(r:Readiness)=>{const adjusted=applyReadiness(today,r);update({...state,activeSession:createSession(adjusted,r)});setWorkoutOpen(true)}
  const activeChange=(s:WorkoutSession)=>update({...state,activeSession:s})
  const complete=(overall:number,fatigue:number,pain:boolean,painArea:string)=>{if(!state.activeSession)return;const done=finishSession(state.activeSession,overall,fatigue,pain,painArea);const sessions=[...state.sessions,done];const nextProgram=generateProgram(p,sessions);update({...state,sessions,program:nextProgram,activeSession:undefined});setWorkoutOpen(false);setToast(`Đã lưu buổi tập · hoàn thành ${done.completionPct}%`);setTab('today')}
  const regenerate=()=>{update({...state,program:generateProgram(p,state.sessions)});setToast('Đã tính lại giáo án từ tiến độ hiện tại')}
  const addMetric=(m:BodyMetric)=>update({...state,metrics:[...state.metrics,m]})
  const restore=async(file:File)=>{try{const data=await parseBackup(file);if(!confirm(`Khôi phục ${data.sessions.length} buổi tập? Dữ liệu hiện tại sẽ bị thay thế.`))return;update(data);setToast('Khôi phục dữ liệu thành công')}catch(e){alert(e instanceof Error?e.message:'Không thể đọc file sao lưu')}}
  const reset=async()=>{if(!confirm('Xoá toàn bộ hồ sơ, giáo án và lịch sử trên thiết bị này?'))return;setState(await resetState())}
  const theme=(t:UserProfile['theme'])=>update({...state,profile:{...p,theme:t}})
  const cls=p.theme==='dark'?'app dark':'app'
  if(state.activeSession&&workoutOpen)return <Workout session={state.activeSession} profile={p} history={state.sessions} onChange={activeChange} onFinish={complete} onCancel={()=>{if(confirm('Thoát màn hình tập? Buổi đang tập vẫn được lưu để tiếp tục sau.'))setWorkoutOpen(false)}}/>
  return <div className={cls}><div className="app-frame">
    {tab==='today'&&<Today profile={p} day={today} sessions={state.sessions} activeSession={state.activeSession} onStart={start} onResume={()=>setWorkoutOpen(true)}/>} {tab==='program'&&<Program program={program} onRegenerate={regenerate}/>} {tab==='progress'&&<Progress sessions={state.sessions} metrics={state.metrics} onAddMetric={addMetric}/>} {tab==='library'&&<Library profile={p}/>} {tab==='settings'&&<Settings state={state} onBackup={()=>downloadBackup(state)} onRestore={restore} onReset={reset} onTheme={theme} onExitDemo={async()=>setState(await resetState())}/>}<Nav tab={tab} onChange={setTab}/>{toast&&<div className="toast">{toast}</div>}
  </div></div>
}
