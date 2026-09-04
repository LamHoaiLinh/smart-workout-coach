import type { ActivitySession, CardioMode, CardioPlan, ProgramDay, UserProfile } from '../types'

export const cardioLabels:Record<CardioMode,string>={walk:'Đi bộ',run:'Chạy bộ',jump_rope:'Nhảy dây'}

function interference(day:ProgramDay,mode:CardioMode){
  if(mode==='walk') return day.focus==='Lower'||day.focus==='Legs'?1:0
  if(day.focus==='Upper'||day.focus==='Push'||day.focus==='Pull') return 0
  if(day.focus==='Full') return 1
  return 3
}

function planFor(mode:CardioMode,minutes:number,order:number):CardioPlan{
  if(mode==='walk') return {mode,minutes,intensity:'easy',title:'Đi bộ nhẹ',note:'Đi thoải mái, không cần cố nhanh. Có thể làm sau tập hoặc tách sang lúc khác trong ngày.'}
  if(mode==='jump_rope') return {mode,minutes:Math.min(minutes,20),intensity:order%2===0?'easy':'steady',title:'Nhảy dây',note:'Giữ nhịp vừa sức. Nếu bắp chân nặng hoặc kỹ thuật xuống, dừng sớm hơn cũng được.'}
  return {mode,minutes,intensity:order%2===0?'easy':'steady',title:order%2===0?'Chạy nhẹ':'Chạy đều',note:'Giữ nhịp mà bạn còn kiểm soát được hơi thở. Không cần chạy nhanh để hoàn thành buổi.'}
}

export function attachCardio(days:ProgramDay[],profile:UserProfile){
  const pref=profile.cardio
  if(!pref?.enabled||!pref.modes.length||pref.sessionsPerWeek<1) return days.map(d=>({...d,cardio:undefined}))
  const result=days.map(d=>({...d,cardio:undefined as CardioPlan|undefined}))
  const count=Math.min(pref.sessionsPerWeek,result.length)
  const used=new Set<number>()
  for(let i=0;i<count;i++){
    const mode=pref.modes[i%pref.modes.length]
    const candidates=result.map((d,index)=>({index,score:used.has(index)?99:interference(d,mode)})).sort((a,b)=>a.score-b.score||a.index-b.index)
    const pick=candidates[0]?.index
    if(pick===undefined||used.has(pick)) break
    used.add(pick)
    result[pick].cardio=planFor(mode,pref.minutes,i)
  }
  return result
}

export function formatPace(secondsPerKm?:number){
  if(!secondsPerKm||!Number.isFinite(secondsPerKm)) return '—'
  const m=Math.floor(secondsPerKm/60),s=Math.round(secondsPerKm%60)
  return `${m}:${String(s).padStart(2,'0')}/km`
}

export function activitySummary(activities:ActivitySession[],days=7){
  const now=Date.now(),range=days*86400000
  const recent=activities.filter(a=>now-new Date(a.completedAt).getTime()<=range)
  const minutes=Math.round(recent.reduce((n,a)=>n+a.durationSeconds,0)/60)
  const distance=Math.round(recent.reduce((n,a)=>n+(a.distanceKm??0),0)*100)/100
  const jumps=recent.reduce((n,a)=>n+(a.jumpCount??0),0)
  const bestRun=recent.filter(a=>a.mode==='run'&&a.avgPaceSecPerKm).sort((a,b)=>(a.avgPaceSecPerKm??Infinity)-(b.avgPaceSecPerKm??Infinity))[0]
  return {count:recent.length,minutes,distance,jumps,bestRun}
}

export function activityName(a:ActivitySession){
  if(a.mode==='walk') return 'Đi bộ'
  if(a.mode==='run') return 'Chạy bộ'
  return 'Nhảy dây'
}
