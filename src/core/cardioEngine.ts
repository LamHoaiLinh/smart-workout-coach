import type { ActivityMode, ActivitySession, CardioPlan, ProgramDay, TrainingPhase, UserProfile } from '../types'

export const cardioLabels:Record<ActivityMode,string>={walk:'Đi bộ',run:'Chạy bộ',jump_rope:'Nhảy dây'}
export const activityName=(a:Pick<ActivitySession,'mode'>)=>cardioLabels[a.mode]

export function formatPace(sec?:number){
  if(!sec||!Number.isFinite(sec))return '—'
  const m=Math.floor(sec/60),s=Math.round(sec%60)
  return `${m}:${String(s).padStart(2,'0')}/km`
}

export function cardioMinutes(profile:UserProfile,mode:ActivityMode,blockWeek:number,phase:TrainingPhase,activities:ActivitySession[]){
  const base=profile.cardio.minutesByMode[mode]||20
  const recent=activities.filter(a=>a.mode===mode).slice(-2)
  const handled=recent.length>=2&&recent.every(a=>(a.effort??3)<=3&&(a.durationSeconds/60)>=(a.plannedMinutes??base)*0.85)
  let factor=phase==='deload'?0.8:blockWeek>=4&&handled?1.15:blockWeek>=2&&handled?1.08:1
  if(mode==='jump_rope')factor=Math.min(factor,1.1)
  return Math.max(10,Math.round(base*factor/5)*5)
}

function dayScore(day:ProgramDay|undefined,mode:ActivityMode,avoidLegDays:boolean){
  if(!day)return 3
  if(mode==='walk')return day.focus==='Lower'||day.focus==='Legs'?1:4
  if(day.focus==='Upper'||day.focus==='Push'||day.focus==='Pull')return 7
  if(day.focus==='Full')return 3
  if((day.focus==='Lower'||day.focus==='Legs')&&avoidLegDays)return -6
  return 1
}

export function attachCardio(profile:UserProfile,strengthDays:ProgramDay[],blockWeek:number,phase:TrainingPhase,activities:ActivitySession[]){
  const pref=profile.cardio
  if(!pref.enabled||!pref.modes.length||pref.sessionsPerWeek<=0)return strengthDays
  const map=new Map(strengthDays.map(d=>[d.weekday,{...d}]))
  const used:number[]=[]
  const candidates=[1,2,3,4,5,6,0]
  for(let i=0;i<pref.sessionsPerWeek;i++){
    const mode=pref.modes[i%pref.modes.length]
    const ranked=candidates.map(weekday=>{
      const day=map.get(weekday)
      let score=dayScore(day,mode,pref.avoidLegDays)
      if(used.includes(weekday))score-=8
      if(used.some(x=>Math.abs(x-weekday)===1))score-=2
      return {weekday,score}
    }).sort((a,b)=>b.score-a.score)
    const weekday=ranked[0].weekday
    used.push(weekday)
    const minutes=cardioMinutes(profile,mode,blockWeek,phase,activities)
    const intensity=phase==='deload'?'easy':mode==='walk'?'easy':'steady'
    const note=mode==='walk'?'Giữ nhịp thoải mái, vẫn nói chuyện được.':mode==='run'?'Chạy vừa sức, không cần đua pace ở mọi buổi.':'Giữ nhịp đều; nghỉ ngắn khi bắp chân bắt đầu căng nhiều.'
    const cardio:CardioPlan={mode,title:cardioLabels[mode],minutes,intensity,note}
    const existing=map.get(weekday)
    if(existing)map.set(weekday,{...existing,cardio})
    else map.set(weekday,{key:`cardio-${weekday}`,title:'Vận động',focus:'Cardio',weekday,exercises:[],cardio})
  }
  return [...map.values()].sort((a,b)=>((a.weekday+6)%7)-((b.weekday+6)%7))
}

export function activitySummary(activities:ActivitySession[],days=7){
  const since=Date.now()-days*86400000
  const list=activities.filter(a=>new Date(a.completedAt).getTime()>=since)
  return {
    sessions:list.length,
    minutes:Math.round(list.reduce((n,a)=>n+a.durationSeconds,0)/60),
    distanceKm:Math.round(list.reduce((n,a)=>n+(a.distanceKm??0),0)*100)/100,
    jumps:list.reduce((n,a)=>n+(a.jumpCount??0),0),
    bestRunPace:list.filter(a=>a.mode==='run'&&a.avgPaceSecPerKm).reduce<number|undefined>((best,a)=>best===undefined? a.avgPaceSecPerKm : Math.min(best,a.avgPaceSecPerKm!),undefined)
  }
}
