import { exerciseById, exercises } from '../data/exercises'
import type { Exercise, PlannedExercise, ProgramDay, TrainingProgram, UserProfile, WorkoutSession, Readiness, Goal, MovementPattern } from '../types'

const uid = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`

const goalConfig: Record<Goal,{sets:number; repMin:number; repMax:number; rest:number}> = {
  fat_loss:{sets:3,repMin:8,repMax:15,rest:75}, recomp:{sets:3,repMin:8,repMax:12,rest:90},
  hypertrophy:{sets:4,repMin:8,repMax:15,rest:90}, strength:{sets:4,repMin:4,repMax:8,rest:150},
  definition:{sets:3,repMin:8,repMax:15,rest:75}, fitness:{sets:3,repMin:8,repMax:15,rest:75}, skill:{sets:3,repMin:5,repMax:10,rest:120}
}

function equipmentOk(ex:Exercise,p:UserProfile){
  if(!ex.equipment.length) return true
  return ex.equipment.every(eq=>p.equipment.includes(eq) || eq==='Ghế/bục' || eq==='Điểm bám')
}
function injuryOk(ex:Exercise,p:UserProfile){ return !ex.contraindicationTags.some(t=>p.injuries.includes(t)) }
function typeOk(ex:Exercise,p:UserProfile){ return ex.trainingTypes.includes(p.trainingType) }

function historyFor(id:string,sessions:WorkoutSession[]){
  return sessions.filter(s=>s.completedAt).flatMap(s=>s.exercises).filter(e=>e.exerciseId===id && !e.skipped).slice(-4)
}

export function detectFatigue(sessions:WorkoutSession[]){
  const recent=sessions.filter(s=>s.completedAt).slice(-4)
  if(recent.length<2) return false
  const high=recent.filter(s=>(s.fatigue??0)>=4 || (s.overallDifficulty??0)>=5).length
  return high>=Math.min(3,recent.length)
}

function lastWorkingWeight(id:string,sessions:WorkoutSession[]){
  const h=historyFor(id,sessions)
  const last=h.at(-1)
  if(!last) return undefined
  const weights=last.sets.map(s=>s.weightKg).filter((x):x is number=>typeof x==='number')
  return weights.length?Math.max(...weights):last.planned.weightKg
}

function shouldProgress(ex:Exercise,sessions:WorkoutSession[]){
  const h=historyFor(ex.id,sessions)
  if(!h.length) return false
  const last=h.at(-1)!
  const top=last.planned.maxReps ?? ex.maxReps ?? 12
  const completed=last.sets.filter(s=>s.completed)
  return completed.length>=last.planned.sets && completed.every(s=>(s.reps??0)>=top) && !['hard','near_limit','failed'].includes(last.feedback??'good')
}

function shouldRegress(ex:Exercise,sessions:WorkoutSession[]){
  const h=historyFor(ex.id,sessions).slice(-3)
  if(h.length<2) return false
  return h.filter(x=>x.feedback==='failed' || x.feedback==='near_limit').length>=2
}

function adaptExercise(ex:Exercise,p:UserProfile,sessions:WorkoutSession[],baseSets:number):Exercise{
  if(shouldProgress(ex,sessions) && !ex.weighted && ex.harderProgression){
    const harder=exerciseById.get(ex.harderProgression)
    if(harder && typeOk(harder,p) && equipmentOk(harder,p) && injuryOk(harder,p)) return harder
  }
  if(shouldRegress(ex,sessions) && ex.easierProgression){
    const easier=exerciseById.get(ex.easierProgression)
    if(easier && typeOk(easier,p) && equipmentOk(easier,p) && injuryOk(easier,p)) return easier
  }
  void baseSets
  return ex
}

function planned(ex:Exercise,p:UserProfile,sessions:WorkoutSession[],sets:number):PlannedExercise{
  const cfg=goalConfig[p.goal]
  let chosen=adaptExercise(ex,p,sessions,sets)
  let min=chosen.minReps ?? cfg.repMin, max=chosen.maxReps ?? cfg.repMax
  if(p.goal==='strength' && chosen.category==='compound' && !chosen.holdSeconds){ min=Math.max(3,Math.min(min,5)); max=Math.min(8,Math.max(max,6)) }
  const item:PlannedExercise={exerciseId:chosen.id,name:chosen.nameEnglish,sets,minReps:min,maxReps:max,seconds:chosen.holdSeconds,restSeconds:Math.max(chosen.recommendedRest,cfg.rest)}
  if(chosen.weighted){
    let w=lastWorkingWeight(chosen.id,sessions)
    if(w===undefined) w=p.trainingType==='home' ? Math.max(p.dumbbell?.minKg??2,2) : 10
    if(shouldProgress(chosen,sessions)) w += p.trainingType==='home' ? (p.dumbbell?.stepKg??1) : 2.5
    item.weightKg=Math.round(w*10)/10
    if(shouldProgress(chosen,sessions)) item.progressionReason='Đạt đầu trên của khoảng số lần ở buổi trước → tăng mức tạ một bước.'
  } else if(chosen.id!==ex.id){
    item.progressionReason=chosen.difficulty>ex.difficulty?'Đã kiểm soát tốt biến thể trước → tăng một cấp độ.':'Các buổi gần đây quá khó → lùi một cấp để giữ kỹ thuật.'
  }
  return item
}

const focusPatterns: Record<string,MovementPattern[]> = {
  Full:['vertical_pull','horizontal_push','squat','hinge','vertical_push','core','horizontal_pull','lunge'],
  Upper:['vertical_pull','horizontal_pull','horizontal_push','vertical_push','isolation','core'],
  Lower:['squat','hinge','lunge','isolation','core'],
  Push:['horizontal_push','vertical_push','isolation','core'],
  Pull:['vertical_pull','horizontal_pull','isolation','core'],
  Legs:['squat','hinge','lunge','isolation','core']
}

function candidateScore(ex:Exercise,p:UserProfile,sessions:WorkoutSession[],pattern:MovementPattern){
  let score=100
  score -= Math.abs(ex.difficulty - ({new:2,beginner:3,intermediate:4,advanced:5}[p.experience]))*9
  if(ex.movementPattern===pattern) score+=35
  if(ex.category==='compound') score+=10
  if(historyFor(ex.id,sessions).length) score+=8
  if(shouldRegress(ex,sessions)) score-=15
  if(p.goal==='strength' && ex.category==='compound') score+=12
  if(p.goal==='hypertrophy' && (ex.category==='compound'||ex.category==='accessory')) score+=7
  return score
}

function pickForPattern(pattern:MovementPattern,p:UserProfile,sessions:WorkoutSession[],used:Set<string>){
  const pool=exercises.filter(e=>typeOk(e,p)&&equipmentOk(e,p)&&injuryOk(e,p)&&e.movementPattern===pattern&&!used.has(e.id)&&e.category!=='warmup')
  pool.sort((a,b)=>candidateScore(b,p,sessions,pattern)-candidateScore(a,p,sessions,pattern))
  const choice=pool[0]
  if(choice) used.add(choice.id)
  return choice
}

function splitFor(days:number){
  if(days<=2) return ['Full A','Full B']
  if(days===3) return ['Full A','Full B','Full C']
  if(days===4) return ['Upper A','Lower A','Upper B','Lower B']
  if(days===5) return ['Upper','Lower','Push','Pull','Legs']
  return ['Push A','Pull A','Legs A','Push B','Pull B','Legs B']
}
function focusOf(title:string){ return title.startsWith('Full')?'Full':title.startsWith('Upper')?'Upper':title.startsWith('Lower')?'Lower':title.startsWith('Push')?'Push':title.startsWith('Pull')?'Pull':'Legs' }

function exerciseCount(minutes:number){ return minutes<=20?3:minutes<=30?4:minutes<=45?5:minutes<=60?6:7 }

function buildDay(title:string,weekday:number,p:UserProfile,sessions:WorkoutSession[],fatigued:boolean):ProgramDay{
  const focus=focusOf(title), patterns=[...(focusPatterns[focus]||focusPatterns.Full)]
  const max=exerciseCount(p.sessionMinutes)
  const used=new Set<string>(); const chosen:Exercise[]=[]
  // prioritize main patterns; push core later
  for(const pat of patterns){
    if(chosen.length>=max) break
    const found=pickForPattern(pat,p,sessions,used)
    if(found) chosen.push(found)
  }
  const cfg=goalConfig[p.goal]
  let sets=cfg.sets
  if(p.experience==='new') sets=Math.min(3,sets)
  if(fatigued) sets=Math.max(2,sets-1)
  const items=chosen.map((e,i)=>planned(e,p,sessions,i<2?sets:Math.max(2,sets-1)))
  return {key:`${title.replaceAll(' ','-').toLowerCase()}-${weekday}`,title,focus,weekday,exercises:items}
}

export function generateProgram(p:UserProfile,sessions:WorkoutSession[]=[]):TrainingProgram{
  const split=splitFor(p.daysPerWeek)
  const weekdays=(p.trainingDays.length?p.trainingDays:[1,3,5]).slice(0,split.length)
  while(weekdays.length<split.length) weekdays.push(((weekdays.at(-1)??0)+1)%7)
  const fatigued=detectFatigue(sessions)
  const days=split.map((name,i)=>buildDay(name,weekdays[i],p,sessions,fatigued))
  const splitName=split.length<=3?'Full Body':split.length===4?'Upper / Lower':split.length===5?'Upper / Lower / Push / Pull / Legs':'Push / Pull / Legs × 2'
  return {id:uid(),createdAt:new Date().toISOString(),blockWeek:1,blockLength:6,splitName,explanation:`Bạn tập ${p.daysPerWeek} buổi/tuần, mục tiêu ${goalLabel(p.goal)}. Hệ thống ưu tiên tần suất hợp lý, bài phù hợp dụng cụ và tăng dần theo lịch sử thực tế.${fatigued?' Khối lượng hiện được giảm nhẹ vì các buổi gần đây có dấu hiệu mệt tích lũy.':''}`,days}
}

export function goalLabel(g:Goal){ return ({fat_loss:'giảm mỡ và giữ cơ',recomp:'giảm mỡ đồng thời tăng cơ',hypertrophy:'tăng cơ',strength:'tăng sức mạnh',definition:'giữ cơ và tăng độ nét',fitness:'thể lực toàn diện',skill:'kỹ năng Calisthenics'} as const)[g] }

export function getTodayProgramDay(program:TrainingProgram,date=new Date()):ProgramDay{
  const day=date.getDay()
  return program.days.find(d=>d.weekday===day) ?? program.days[0]
}

export function applyReadiness(day:ProgramDay,r:Readiness):ProgramDay{
  const stress=(6-r.energy)+(r.soreness-1)+(6-r.sleep)+(6-r.motivation)
  const light=r.lighter || stress>=13
  const max=exerciseCount(r.minutes)
  const exercises=day.exercises.slice(0,max).map((e,i)=>({
    ...e,
    sets: light ? Math.max(2,e.sets-1) : e.sets,
    restSeconds: light ? Math.round(e.restSeconds*1.1) : e.restSeconds,
    note: light && i<2 ? 'Buổi nhẹ: giảm 1 hiệp để ưu tiên hồi phục.' : e.note
  }))
  return {...day,title:light?`${day.title} · Nhẹ`:day.title,exercises}
}

export function createSession(day:ProgramDay,readiness?:Readiness):WorkoutSession{
  return {id:uid(),programDayKey:day.key,title:day.title,startedAt:new Date().toISOString(),readiness,exercises:day.exercises.map(p=>({exerciseId:p.exerciseId,name:p.name,planned:{...p},sets:Array.from({length:p.sets},()=>({weightKg:p.weightKg,completed:false}))}))}
}

export function suggestSwap(currentId:string,p:UserProfile,usedIds:string[]){
  const cur=exerciseById.get(currentId); if(!cur) return []
  return exercises.filter(e=>e.id!==currentId&&!usedIds.includes(e.id)&&typeOk(e,p)&&equipmentOk(e,p)&&injuryOk(e,p)&&e.movementPattern===cur.movementPattern&&Math.abs(e.difficulty-cur.difficulty)<=1).slice(0,5)
}

export function finishSession(session:WorkoutSession, overallDifficulty:number, fatigue:number, abnormalPain:boolean, painArea=''){
  const total=session.exercises.reduce((n,e)=>n+e.sets.length,0)
  const done=session.exercises.reduce((n,e)=>n+e.sets.filter(s=>s.completed).length,0)
  return {...session,completedAt:new Date().toISOString(),overallDifficulty,fatigue,abnormalPain,painArea,completionPct:total?Math.round(done/total*100):0}
}

export function personalRecords(sessions:WorkoutSession[]){
  const map=new Map<string,{name:string,reps:number,weight:number}>()
  sessions.filter(s=>s.completedAt).forEach(s=>s.exercises.forEach(e=>e.sets.forEach(set=>{
    if(!set.completed) return
    const reps=set.reps??0,weight=set.weightKg??0,prev=map.get(e.exerciseId)
    const score=weight>0?weight*Math.max(1,reps):reps
    const prevScore=prev?(prev.weight>0?prev.weight*Math.max(1,prev.reps):prev.reps):-1
    if(score>prevScore) map.set(e.exerciseId,{name:e.name,reps,weight})
  })))
  return [...map.values()].sort((a,b)=>(b.weight*b.reps+b.reps)-(a.weight*a.reps+a.reps))
}
