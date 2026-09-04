import type { ActivitySession, ProgramDay, TrainingProgram, WeekAvailability, WeekPlan, WeekPlanSlot, WorkoutSession } from '../types'

const DAY_ORDER=[1,2,3,4,5,6,0]
const dayPos=(weekday:number)=>DAY_ORDER.indexOf(weekday)
const isLower=(day?:ProgramDay)=>!!day&&(day.focus==='Lower'||day.focus==='Legs')
const isHardRun=(day?:ProgramDay)=>!!day?.cardio&&day.cardio.mode==='run'&&day.cardio.intensity!=='easy'
const isHardJump=(day?:ProgramDay)=>!!day?.cardio&&day.cardio.mode==='jump_rope'&&day.cardio.intensity==='hard'

export function getWeekKey(date=new Date()){
  const d=new Date(date)
  const diff=(d.getDay()+6)%7
  d.setHours(12,0,0,0)
  d.setDate(d.getDate()-diff)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export function currentAvailability(value:WeekAvailability|undefined,date=new Date()):WeekAvailability{
  const weekKey=getWeekKey(date)
  return value?.weekKey===weekKey?value:{weekKey,busyDays:[]}
}

function completedThisWeek(programDayKey:string,sessions:WorkoutSession[],activities:ActivitySession[],weekKey:string){
  const strength=sessions.find(s=>s.programDayKey===programDayKey&&s.completedAt&&getWeekKey(new Date(s.completedAt))===weekKey)
  if(strength)return new Date(strength.completedAt!).getDay()
  const cardio=activities.find(a=>a.programDayKey===programDayKey&&getWeekKey(new Date(a.completedAt))===weekKey)
  return cardio?new Date(cardio.completedAt).getDay():undefined
}

function conflictCost(day:ProgramDay,candidate:number,placed:Map<number,ProgramDay>){
  let cost=0
  const pos=dayPos(candidate)
  const prev=pos>0?placed.get(DAY_ORDER[pos-1]):undefined
  const prev2=pos>1?placed.get(DAY_ORDER[pos-2]):undefined
  if(isLower(day)&&isLower(prev))cost+=12
  if(isLower(day)&&isHardRun(prev))cost+=4
  if(isHardRun(day)&&isLower(prev))cost+=1
  if(isHardJump(day)&&isLower(prev))cost+=2
  if(isLower(day)&&isHardRun(prev)&&isLower(prev2))cost+=30
  return cost
}

export function buildWeekPlan(program:TrainingProgram,availability:WeekAvailability,sessions:WorkoutSession[]=[],activities:ActivitySession[]=[]):WeekPlan{
  const weekKey=availability.weekKey
  const busy=new Set(availability.busyDays)
  const placed=new Map<number,ProgramDay>()
  const slots:WeekPlanSlot[]=[]
  const unscheduled:string[]=[]
  const tasks=[...program.days].sort((a,b)=>dayPos(a.weekday)-dayPos(b.weekday))

  for(const day of tasks){
    const completedWeekday=completedThisWeek(day.key,sessions,activities,weekKey)
    if(completedWeekday!==undefined){
      placed.set(completedWeekday,day)
      slots.push({weekday:completedWeekday,programDayKey:day.key,originalWeekday:day.weekday,moved:completedWeekday!==day.weekday,completed:true})
      continue
    }
    const start=Math.max(0,dayPos(day.weekday))
    const candidates=DAY_ORDER.slice(start).filter(w=>!busy.has(w)&&!placed.has(w))
    if(!candidates.length){unscheduled.push(day.key);continue}
    const ranked=candidates
      .map(w=>({w,cost:(dayPos(w)-start)*2+conflictCost(day,w,placed)}))
      .sort((a,b)=>a.cost-b.cost||dayPos(a.w)-dayPos(b.w))
    const chosen=ranked[0].w
    placed.set(chosen,day)
    slots.push({weekday:chosen,programDayKey:day.key,originalWeekday:day.weekday,moved:chosen!==day.weekday,completed:false})
  }

  return {weekKey,busyDays:[...busy],slots:slots.sort((a,b)=>dayPos(a.weekday)-dayPos(b.weekday)),unscheduled}
}

export function scheduledDayForWeekday(program:TrainingProgram,plan:WeekPlan,weekday:number){
  const slot=plan.slots.find(s=>s.weekday===weekday)
  if(!slot)return undefined
  const day=program.days.find(d=>d.key===slot.programDayKey)
  return day?{day,slot}:undefined
}

export function movedDestination(program:TrainingProgram,plan:WeekPlan,programDayKey:string){
  const slot=plan.slots.find(s=>s.programDayKey===programDayKey)
  const day=program.days.find(d=>d.key===programDayKey)
  return slot&&day?{weekday:slot.weekday,from:day.weekday}:undefined
}
