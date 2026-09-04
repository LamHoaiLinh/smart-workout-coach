import { exerciseById, exercises } from '../data/exercises'
import { attachCardio } from './cardioEngine'
import type { ActivitySession, Exercise, Goal, MovementPattern, PlannedExercise, ProgramDay, Readiness, SecondaryGoal, TrainingPhase, TrainingProgram, UserProfile, WorkoutSession } from '../types'

const uid=()=>crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(16).slice(2)}`
const goalConfig:Record<Goal,{sets:number;repMin:number;repMax:number;rest:number}>={
  fat_loss:{sets:3,repMin:8,repMax:15,rest:75},recomp:{sets:3,repMin:8,repMax:12,rest:90},hypertrophy:{sets:4,repMin:8,repMax:15,rest:90},
  strength:{sets:4,repMin:4,repMax:8,rest:150},definition:{sets:3,repMin:8,repMax:15,rest:75},fitness:{sets:3,repMin:8,repMax:15,rest:75},skill:{sets:3,repMin:5,repMax:10,rest:120}
}
const focusPatterns:Record<string,MovementPattern[]>={
  Full:['vertical_pull','horizontal_push','squat','hinge','vertical_push','core','horizontal_pull','lunge'],Upper:['vertical_pull','horizontal_pull','horizontal_push','vertical_push','isolation','core'],
  Lower:['squat','hinge','lunge','isolation','core'],Push:['horizontal_push','vertical_push','isolation','core'],Pull:['vertical_pull','horizontal_pull','isolation','core'],Legs:['squat','hinge','lunge','isolation','core']
}
const patternLabel:Record<MovementPattern,string>={horizontal_push:'ngực và tay sau',vertical_push:'vai và tay sau',horizontal_pull:'lưng giữa',vertical_pull:'lưng xô và tay trước',squat:'đùi và mông',hinge:'mông và gân kheo',lunge:'chân một bên',core:'core',carry:'toàn thân',isolation:'nhóm cơ phụ',mobility:'độ linh hoạt',conditioning:'thể lực'}

function typeOk(e:Exercise,p:UserProfile){return e.trainingTypes.includes(p.trainingType)}
function equipmentOk(e:Exercise,p:UserProfile){return !e.equipment.length||e.equipment.every(x=>p.equipment.includes(x)||x==='Ghế/bục'||x==='Điểm bám')}
function injuryOk(e:Exercise,p:UserProfile){return !e.contraindicationTags.some(x=>p.injuries.includes(x))}
function historyFor(id:string,sessions:WorkoutSession[]){return sessions.filter(s=>s.completedAt).flatMap(s=>s.exercises).filter(e=>e.exerciseId===id&&!e.skipped).slice(-4)}

export function detectFatigue(sessions:WorkoutSession[]){
  const recent=sessions.filter(s=>s.completedAt).slice(-4)
  return recent.length>=3&&recent.filter(s=>(s.fatigue??0)>=4||(s.overallDifficulty??0)>=5).length>=2
}

function exposureScore(log:WorkoutSession['exercises'][number]){
  const completed=log.sets.filter(s=>s.completed)
  if(!completed.length)return 0
  return Math.max(...completed.map(s=>(s.weightKg??0)>0?(s.weightKg??0)*Math.max(1,s.reps??1):(s.reps??0)))
}

export function isPlateau(id:string,sessions:WorkoutSession[]){
  const h=historyFor(id,sessions)
  if(h.length<4)return false
  const scores=h.map(exposureScore)
  const best=Math.max(...scores),worst=Math.min(...scores)
  const noClearGain=best<=0?true:(best-worst)/best<0.04
  const hard=h.filter(x=>['hard','near_limit','failed'].includes(x.feedback??'good')).length>=2
  return noClearGain&&hard
}

function shouldProgress(e:Exercise,sessions:WorkoutSession[]){
  const last=historyFor(e.id,sessions).at(-1);if(!last)return false
  const top=last.planned.maxReps??e.maxReps??12,done=last.sets.filter(s=>s.completed)
  return done.length>=last.planned.sets&&done.every(s=>(s.reps??0)>=top)&&!['hard','near_limit','failed'].includes(last.feedback??'good')
}
function shouldRegress(e:Exercise,sessions:WorkoutSession[]){const h=historyFor(e.id,sessions).slice(-3);return h.length>=2&&h.filter(x=>x.feedback==='failed'||x.feedback==='near_limit').length>=2}
function lastWeight(id:string,sessions:WorkoutSession[]){const last=historyFor(id,sessions).at(-1);if(!last)return undefined;const w=last.sets.map(s=>s.weightKg).filter((x):x is number=>typeof x==='number');return w.length?Math.max(...w):last.planned.weightKg}

function secondaryMatch(e:Exercise,goals:SecondaryGoal[]){return goals.some(g=>(g==='pullup_10'&&e.movementPattern==='vertical_pull')||(g==='pushup_30'&&e.movementPattern==='horizontal_push')||(g==='dip_20'&&e.movementPattern==='vertical_push')||(g==='l_sit_20'&&e.movementPattern==='core')||(g==='handstand'&&(e.movementPattern==='vertical_push'||e.movementPattern==='core'))||(g==='pistol_squat'&&(e.movementPattern==='squat'||e.movementPattern==='lunge')))}
function preferenceScore(e:Exercise,p:UserProfile){return p.exercisePreferences[e.id]==='prefer'?24:p.exercisePreferences[e.id]==='avoid'?-60:0}

function adapt(e:Exercise,p:UserProfile,sessions:WorkoutSession[]){
  if(shouldProgress(e,sessions)&&!e.weighted&&e.harderProgression){const x=exerciseById.get(e.harderProgression);if(x&&typeOk(x,p)&&equipmentOk(x,p)&&injuryOk(x,p))return x}
  if(shouldRegress(e,sessions)&&e.easierProgression){const x=exerciseById.get(e.easierProgression);if(x&&typeOk(x,p)&&equipmentOk(x,p)&&injuryOk(x,p))return x}
  return e
}

function reason(e:Exercise,p:UserProfile,sessions:WorkoutSession[]){
  const bits=[`Bài này phụ trách nhóm ${patternLabel[e.movementPattern]} trong buổi hôm nay.`]
  if(e.category==='compound')bits.push('Đây là một trong các bài chính của buổi.')
  if(secondaryMatch(e,p.secondaryGoals))bits.push('Nó cũng khớp với mục tiêu phụ bạn đã chọn.')
  if(p.exercisePreferences[e.id]==='prefer')bits.push('Bạn đã đánh dấu thích bài này.')
  if(historyFor(e.id,sessions).length)bits.push('Giữ lại một bài quen giúp so sánh tiến bộ dễ hơn.')
  return bits.join(' ')
}

function planned(base:Exercise,p:UserProfile,sessions:WorkoutSession[],sets:number,phase:TrainingPhase):PlannedExercise{
  const cfg=goalConfig[p.goal],e=adapt(base,p,sessions)
  let min=e.minReps??cfg.repMin,max=e.maxReps??cfg.repMax
  if(p.goal==='strength'&&e.category==='compound'&&!e.holdSeconds){min=Math.max(3,Math.min(min,5));max=Math.min(8,Math.max(max,6))}
  const plateau=isPlateau(e.id,sessions)
  const item:PlannedExercise={exerciseId:e.id,name:e.nameEnglish,sets:phase==='deload'?Math.max(2,sets-1):sets,minReps:min,maxReps:max,seconds:e.holdSeconds,restSeconds:Math.max(e.recommendedRest,cfg.rest),selectionReason:reason(e,p,sessions),plateau}
  if(e.weighted){
    let w=lastWeight(e.id,sessions)??(p.trainingType==='home'?Math.max(2,p.dumbbell?.minKg??2):10)
    if(phase==='deload')w*=0.9
    else if(shouldProgress(e,sessions))w+=p.trainingType==='home'?(p.dumbbell?.stepKg??1):2.5
    item.weightKg=Math.max(0.5,Math.round(w*10)/10)
    if(phase==='deload')item.progressionReason='Tuần nhẹ: giảm tải một chút để cơ thể hồi lại.'
    else if(shouldProgress(e,sessions))item.progressionReason='Lần trước đã chạm mức trên khá gọn, lần này tăng tạ một bước nhỏ.'
  }else if(e.id!==base.id){item.progressionReason=e.difficulty>base.difficulty?'Biến thể trước đã ổn, chuyển lên một mức khó hơn.':'Mấy lần gần đây khá căng, lùi một mức để lấy lại nhịp.'}
  if(plateau)item.note='Bài này đang chững. Giữ kỹ thuật sạch; nếu vẫn không nhích sau vài buổi nữa có thể đổi biến thể.'
  return item
}

function splitFor(n:number){if(n<=2)return ['Full A','Full B'];if(n===3)return ['Full A','Full B','Full C'];if(n===4)return ['Upper A','Lower A','Upper B','Lower B'];if(n===5)return ['Upper','Lower','Push','Pull','Legs'];return ['Push A','Pull A','Legs A','Push B','Pull B','Legs B']}
function focusOf(title:string){return title.startsWith('Full')?'Full':title.startsWith('Upper')?'Upper':title.startsWith('Lower')?'Lower':title.startsWith('Push')?'Push':title.startsWith('Pull')?'Pull':'Legs'}
function exerciseCount(minutes:number){return minutes<=20?3:minutes<=30?4:minutes<=45?5:minutes<=60?6:7}
function candidateScore(e:Exercise,p:UserProfile,sessions:WorkoutSession[],pattern:MovementPattern){
  let s=100-Math.abs(e.difficulty-({new:2,beginner:3,intermediate:4,advanced:5}[p.experience]))*9
  if(e.movementPattern===pattern)s+=35;if(e.category==='compound')s+=10;if(historyFor(e.id,sessions).length)s+=8;if(secondaryMatch(e,p.secondaryGoals))s+=18
  if(p.goal==='strength'&&e.category==='compound')s+=12;if(p.goal==='hypertrophy'&&(e.category==='compound'||e.category==='accessory'))s+=7;if(isPlateau(e.id,sessions))s-=6
  return s+preferenceScore(e,p)
}
function pick(pattern:MovementPattern,p:UserProfile,sessions:WorkoutSession[],used:Set<string>){
  const pool=exercises.filter(e=>typeOk(e,p)&&equipmentOk(e,p)&&injuryOk(e,p)&&e.movementPattern===pattern&&!used.has(e.id)&&e.category!=='warmup')
  pool.sort((a,b)=>candidateScore(b,p,sessions,pattern)-candidateScore(a,p,sessions,pattern));const chosen=pool[0];if(chosen)used.add(chosen.id);return chosen
}

export function blockState(profile:UserProfile,sessions:WorkoutSession[]){
  const done=sessions.filter(s=>s.completedAt).length
  const week=Math.floor(done/Math.max(1,profile.daysPerWeek))%6+1
  const fatigue=detectFatigue(sessions)
  const phase:TrainingPhase=fatigue||week===6?'deload':week<=2?'base':'build'
  return {week,phase}
}

function buildStrengthDay(title:string,weekday:number,p:UserProfile,sessions:WorkoutSession[],phase:TrainingPhase):ProgramDay{
  const focus=focusOf(title),patterns=focusPatterns[focus]??focusPatterns.Full,max=exerciseCount(p.sessionMinutes),used=new Set<string>(),chosen:Exercise[]=[]
  for(const pattern of patterns){if(chosen.length>=max)break;const e=pick(pattern,p,sessions,used);if(e)chosen.push(e)}
  let sets=goalConfig[p.goal].sets;if(p.experience==='new')sets=Math.min(3,sets)
  return {key:`${title.replaceAll(' ','-').toLowerCase()}-${weekday}`,title,focus,weekday,exercises:chosen.map((e,i)=>planned(e,p,sessions,i<2?sets:Math.max(2,sets-1),phase))}
}

export function generateProgram(p:UserProfile,sessions:WorkoutSession[]=[],activities:ActivitySession[]=[]):TrainingProgram{
  const split=splitFor(p.daysPerWeek),days=[...p.trainingDays].slice(0,split.length)
  const fallback=[1,3,5,2,4,6];for(const d of fallback)if(days.length<split.length&&!days.includes(d))days.push(d)
  const {week,phase}=blockState(p,sessions)
  const strength=split.map((name,i)=>buildStrengthDay(name,days[i],p,sessions,phase))
  const plannedDays=attachCardio(p,strength,week,phase,activities)
  const splitName=split.length<=3?'Full Body':split.length===4?'Upper / Lower':split.length===5?'Upper / Lower / Push / Pull / Legs':'Push / Pull / Legs × 2'
  const blockTitle=phase==='deload'?'Tuần nhẹ':week<=2?'Xây nền':'Tăng dần'
  const explanation=phase==='deload'?'Tuần này nhẹ hơn một chút. Giữ kỹ thuật đẹp và đừng cố lập kỷ lục.':week<=2?'Hai tuần đầu ưu tiên làm quen nhịp tập và giữ bài ổn định.':'Giữ các bài chính đủ lâu để thấy mình tiến bộ, tăng từng chút khi buổi trước đã làm tốt.'
  return {id:uid(),createdAt:new Date().toISOString(),blockWeek:week,blockLength:6,phase,blockTitle,splitName,explanation,days:plannedDays}
}

export function getTodayProgramDay(program:TrainingProgram,date=new Date()){const w=date.getDay();return program.days.find(d=>d.weekday===w)??program.days[0]}
export function suggestTodayDay(program:TrainingProgram,sessions:WorkoutSession[],date=new Date()){
  const today=date.getDay(),recent=new Set(sessions.filter(s=>s.completedAt&&Date.now()-new Date(s.completedAt).getTime()<7*86400000).map(s=>s.programDayKey))
  const exact=program.days.find(d=>d.weekday===today)
  if(exact&&(!exact.exercises.length||!recent.has(exact.key)))return {day:exact,shifted:false}
  const missed=program.days.filter(d=>d.exercises.length&&!recent.has(d.key)).map(d=>({d,age:(today-d.weekday+7)%7})).filter(x=>x.age>0&&x.age<=3).sort((a,b)=>a.age-b.age)[0]
  if(missed)return {day:missed.d,shifted:true}
  const next=[...program.days].sort((a,b)=>((a.weekday-today+7)%7)-((b.weekday-today+7)%7))[0]
  return {day:next??program.days[0],shifted:false}
}

export function applyReadiness(day:ProgramDay,r:Readiness){
  const stress=(6-r.energy)+(r.soreness-1)+(6-r.sleep)+(6-r.motivation),light=r.lighter||stress>=13,max=exerciseCount(r.minutes)
  const exercises=day.exercises.slice(0,max).map((e,i)=>({...e,sets:light?Math.max(2,e.sets-1):e.sets,restSeconds:light?Math.round(e.restSeconds*1.1):e.restSeconds,note:light&&i<2?'Hôm nay giảm một hiệp và nghỉ lâu hơn một chút.':e.note}))
  return {...day,title:light?`${day.title} · Nhẹ`:day.title,exercises}
}
export function readinessExplanation(r:Readiness){const stress=(6-r.energy)+(r.soreness-1)+(6-r.sleep)+(6-r.motivation);if(r.lighter||stress>=13)return `Hôm nay nên nhẹ hơn: bớt khoảng một hiệp ở nhiều bài, nghỉ lâu hơn và giữ trong ${r.minutes} phút.`;if(r.minutes<=20)return `Chỉ có ${r.minutes} phút thì giữ các bài chính trước, phần phụ có thể bỏ.`;return `Có thể giữ buổi như kế hoạch trong khoảng ${r.minutes} phút.`}
export function createSession(day:ProgramDay,readiness?:Readiness):WorkoutSession{return {id:uid(),programDayKey:day.key,title:day.title,startedAt:new Date().toISOString(),readiness,exercises:day.exercises.map(p=>({exerciseId:p.exerciseId,name:p.name,planned:{...p},sets:Array.from({length:p.sets},()=>({weightKg:p.weightKg,completed:false}))}))}}
export function suggestSwap(currentId:string,p:UserProfile,usedIds:string[]){const cur=exerciseById.get(currentId);if(!cur)return[];return exercises.filter(e=>e.id!==currentId&&!usedIds.includes(e.id)&&typeOk(e,p)&&equipmentOk(e,p)&&injuryOk(e,p)&&e.movementPattern===cur.movementPattern&&Math.abs(e.difficulty-cur.difficulty)<=1&&p.exercisePreferences[e.id]!=='avoid').sort((a,b)=>preferenceScore(b,p)-preferenceScore(a,p)).slice(0,5)}
export function finishSession(session:WorkoutSession,overallDifficulty:number,fatigue:number,abnormalPain:boolean,painArea=''){const total=session.exercises.reduce((n,e)=>n+e.sets.length,0),done=session.exercises.reduce((n,e)=>n+e.sets.filter(s=>s.completed).length,0);return {...session,completedAt:new Date().toISOString(),overallDifficulty,fatigue,abnormalPain,painArea,completionPct:total?Math.round(done/total*100):0}}
export function personalRecords(sessions:WorkoutSession[]){const map=new Map<string,{id:string;name:string;reps:number;weight:number}>();sessions.filter(s=>s.completedAt).forEach(s=>s.exercises.forEach(e=>e.sets.forEach(set=>{if(!set.completed)return;const reps=set.reps??0,weight=set.weightKg??0,score=weight>0?weight*Math.max(1,reps):reps,prev=map.get(e.exerciseId),prevScore=prev?(prev.weight>0?prev.weight*Math.max(1,prev.reps):prev.reps):-1;if(score>prevScore)map.set(e.exerciseId,{id:e.exerciseId,name:e.name,reps,weight})})));return [...map.values()].sort((a,b)=>(b.weight*b.reps+b.reps)-(a.weight*a.reps+a.reps))}
