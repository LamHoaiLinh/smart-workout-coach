import { useEffect, useState } from 'react'
import Onboarding from './components/Onboarding'
import Nav,{type Tab} from './components/Nav'
import Today from './components/Today'
import Program from './components/Program'
import Progress from './components/Progress'
import Library from './components/Library'
import Settings from './components/Settings'
import Workout from './components/Workout'
import ActivityTracker from './components/ActivityTracker'
import { applyReadiness,createSession,finishSession,generateProgram } from './core/trainingEngine'
import { buildWeekPlan,currentAvailability,scheduledDayForWeekday } from './core/weekPlanner'
import { downloadBackup,parseBackup } from './storage/backup'
import { loadState,makeDemoState,resetState,saveState,SCHEMA_VERSION } from './storage/db'
import type { ActivitySession,BodyMetric,CardioPlan,ExercisePreference,Readiness,UserProfile,WorkoutSession } from './types'

export default function App(){
  const [state,setState]=useState<Awaited<ReturnType<typeof loadState>>|null>(null),[tab,setTab]=useState<Tab>('today'),[toast,setToast]=useState(''),[workoutOpen,setWorkoutOpen]=useState(false),[activityOpen,setActivityOpen]=useState<{plan:CardioPlan;key:string}|null>(null)
  useEffect(()=>{loadState().then(setState)},[])
  useEffect(()=>{if(state)saveState(state)},[state])
  useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),2600);return()=>clearTimeout(t)},[toast])
  if(!state)return <div className="loading">Đang mở dữ liệu…</div>
  const update=(next:typeof state)=>setState(next)
  const createProfile=(profile:UserProfile)=>{const program=generateProgram(profile,[],[]);update({schemaVersion:SCHEMA_VERSION,profile,program,sessions:[],activities:[],metrics:[],demoMode:false});setTab('today')}
  const demo=()=>{const base=makeDemoState();const profile:UserProfile={id:'demo-profile',name:'Demo',trainingType:'calisthenics',goal:'recomp',secondaryGoals:['pullup_10'],uiMode:'simple',experience:'beginner',daysPerWeek:3,trainingDays:[1,3,5],sessionMinutes:30,activityLevel:'medium',equipment:['Pull-up Bar','Dip Bar'],benchmarks:{pushup:15,pullup:4,dip:6,bodyweight_squat:30,plank:45},injuries:[],cardio:{enabled:true,modes:['run','walk'],sessionsPerWeek:2,minutesByMode:{walk:30,run:20,jump_rope:15},avoidLegDays:true},exercisePreferences:{},unit:'kg',theme:'light',createdAt:new Date(Date.now()-40*86400000).toISOString()};update({...base,profile,program:generateProgram(profile,base.sessions,base.activities)})}
  if(!state.profile||!state.program)return <Onboarding onDone={createProfile} onDemo={demo}/>
  const p=state.profile,program=state.program,availability=currentAvailability(state.weekAvailability),weekPlan=buildWeekPlan(program,availability,state.sessions,state.activities),todayWeekday=new Date().getDay(),scheduled=scheduledDayForWeekday(program,weekPlan,todayWeekday),day=scheduled?.day,busy=availability.busyDays.includes(todayWeekday)
  const start=(r:Readiness)=>{if(state.activeSession){setWorkoutOpen(true);return}if(!day){setToast('Hôm nay không có buổi sức mạnh');return}const adjusted=applyReadiness(day,r);update({...state,activeSession:createSession(adjusted,r)});setWorkoutOpen(true)}
  const activeChange=(s:WorkoutSession)=>update({...state,activeSession:s})
  const complete=(overall:number,fatigue:number,pain:boolean,painArea:string)=>{if(!state.activeSession)return;const done=finishSession(state.activeSession,overall,fatigue,pain,painArea),sessions=[...state.sessions,done],nextProgram=generateProgram(p,sessions,state.activities);update({...state,sessions,program:nextProgram,activeSession:undefined});setWorkoutOpen(false);setToast(`Đã lưu buổi tập · ${done.completionPct}%`);setTab('today')}
  const saveActivity=(a:ActivitySession)=>{const activities=[...state.activities,a],nextProgram=generateProgram(p,state.sessions,activities);update({...state,activities,program:nextProgram});setActivityOpen(null);setToast('Đã lưu buổi vận động')}
  const regenerate=()=>{update({...state,program:generateProgram(p,state.sessions,state.activities)});setToast('Đã tính lại giáo án')}
  const addMetric=(m:BodyMetric)=>update({...state,metrics:[...state.metrics,m]})
  const restore=async(file:File)=>{try{const data=await parseBackup(file);if(!confirm('Khôi phục file sao lưu 1.0? Dữ liệu hiện tại sẽ bị thay thế.'))return;update(data);setToast('Đã khôi phục dữ liệu')}catch(e){alert(e instanceof Error?e.message:'Không đọc được file')}}
  const reset=async()=>{if(!confirm('Xoá toàn bộ dữ liệu trên thiết bị này?'))return;setState(await resetState())}
  const updateProfile=(next:UserProfile,recalc=false)=>{update({...state,profile:next,program:recalc?generateProgram(next,state.sessions,state.activities):state.program});if(recalc)setToast('Đã cập nhật giáo án')}
  const setPreference=(id:string,pref:ExercisePreference)=>{const next={...p,exercisePreferences:{...p.exercisePreferences,[id]:pref}},nextProgram=generateProgram(next,state.sessions,state.activities);update({...state,profile:next,program:nextProgram});setToast(pref==='prefer'?'Đã ưu tiên bài này':pref==='avoid'?'Sẽ hạn chế bài này':'Đã đưa về bình thường')}
  const toggleBusy=(weekday:number)=>{
    if(state.activeSession&&weekday===todayWeekday){setToast('Bạn đang có một buổi tập chưa xong');return}
    const completed=weekPlan.slots.some(s=>s.weekday===weekday&&s.completed)
    if(completed){setToast('Ngày này đã hoàn thành rồi');return}
    const isBusy=availability.busyDays.includes(weekday),busyDays=isBusy?availability.busyDays.filter(x=>x!==weekday):[...availability.busyDays,weekday]
    update({...state,weekAvailability:{weekKey:availability.weekKey,busyDays}})
    setToast(isBusy?'Đã mở lại ngày này':'Đã xếp lại phần còn lại của tuần')
  }
  const cls=p.theme==='dark'?'app dark':'app'
  if(state.activeSession&&workoutOpen)return <Workout session={state.activeSession} profile={p} history={state.sessions} onChange={activeChange} onFinish={complete} onCancel={()=>setWorkoutOpen(false)}/>
  if(activityOpen)return <ActivityTracker plan={activityOpen.plan} programDayKey={activityOpen.key} onSave={saveActivity} onClose={()=>setActivityOpen(null)}/>
  return <div className={cls}><div className="app-frame">{tab==='today'&&<Today profile={p} program={program} day={busy?undefined:day} slot={scheduled?.slot} busy={busy} sessions={state.sessions} activities={state.activities} activeSession={state.activeSession} onStart={start} onResume={()=>setWorkoutOpen(true)} onStartCardio={(plan,key)=>setActivityOpen({plan,key})} onBusyToggle={()=>toggleBusy(todayWeekday)}/>} {tab==='program'&&<Program program={program} weekPlan={weekPlan} sessions={state.sessions} activities={state.activities} onRegenerate={regenerate} onToggleBusy={toggleBusy}/>} {tab==='progress'&&<Progress profile={p} sessions={state.sessions} activities={state.activities} metrics={state.metrics} onAddMetric={addMetric}/>} {tab==='library'&&<Library profile={p} onPreference={setPreference}/>} {tab==='settings'&&<Settings state={state} onBackup={()=>downloadBackup(state)} onRestore={restore} onReset={reset} onProfile={updateProfile} onRebuild={regenerate} onExitDemo={async()=>setState(await resetState())}/>}<Nav tab={tab} onChange={setTab}/>{toast&&<div className="toast">{toast}</div>}</div></div>
}
