import type { BodyMetric, UserProfile, WorkoutSession } from '../types'

export const skillTracks = [
  {key:'pull',title:'Sức kéo',steps:[['dead_hang','Dead Hang'],['scap_pullup','Scapular Pull-up'],['negative_pullup','Negative Pull-up'],['chinup','Chin-up'],['pullup','Pull-up'],['chest_to_bar','Chest-to-bar Pull-up']] as const},
  {key:'push',title:'Sức đẩy',steps:[['wall_pushup','Wall Push-up'],['incline_pushup','Incline Push-up'],['knee_pushup','Knee Push-up'],['pushup','Push-up'],['diamond_pushup','Diamond Push-up'],['decline_pushup','Decline Push-up'],['archer_pushup','Archer Push-up']] as const},
  {key:'dip',title:'Xà kép',steps:[['support_hold','Parallel Bar Support Hold'],['negative_dip','Negative Dip'],['dip','Dip'],['deep_dip','Deep Dip']] as const},
  {key:'core',title:'Core',steps:[['dead_bug','Dead Bug'],['plank','Plank'],['hollow_hold','Hollow Body Hold'],['hanging_knee_raise','Hanging Knee Raise'],['hanging_leg_raise','Hanging Leg Raise']] as const},
  {key:'legs',title:'Chân',steps:[['bodyweight_squat','Bodyweight Squat'],['split_squat','Split Squat'],['bulgarian_split_squat','Bulgarian Split Squat'],['assisted_pistol','Assisted Pistol Squat'],['pistol_squat','Pistol Squat']] as const}
]

function completedExerciseIds(sessions:WorkoutSession[]){
  const ids=new Set<string>()
  sessions.filter(s=>s.completedAt).forEach(s=>s.exercises.forEach(e=>{
    if(!e.skipped && e.sets.some(x=>x.completed)) ids.add(e.exerciseId)
  }))
  return ids
}

export function progressionFor(profile:UserProfile,sessions:WorkoutSession[]){
  const completed=completedExerciseIds(sessions)
  const benchmarkIds=new Set<string>()
  if((profile.benchmarks.pullup??0)>0) benchmarkIds.add('pullup')
  if((profile.benchmarks.pushup??0)>0) benchmarkIds.add('pushup')
  if((profile.benchmarks.dip??0)>0) benchmarkIds.add('dip')
  if((profile.benchmarks.bodyweight_squat??0)>0) benchmarkIds.add('bodyweight_squat')
  if((profile.benchmarks.plank??0)>0) benchmarkIds.add('plank')
  return skillTracks.map(track=>{
    let index=0
    track.steps.forEach(([id],i)=>{if(completed.has(id)||benchmarkIds.has(id)) index=Math.max(index,i)})
    const pct=Math.round((index+1)/track.steps.length*100)
    return {...track,index,pct,current:track.steps[index][1],next:track.steps[index+1]?.[1]}
  })
}

function durationMinutes(s:WorkoutSession){
  if(!s.completedAt) return 0
  const d=(new Date(s.completedAt).getTime()-new Date(s.startedAt).getTime())/60000
  return Number.isFinite(d)&&d>0&&d<240?Math.round(d):0
}

export function weeklySummary(profile:UserProfile,sessions:WorkoutSession[],metrics:BodyMetric[]){
  const now=Date.now(), day=86400000
  const done=sessions.filter(s=>s.completedAt)
  const week=done.filter(s=>now-new Date(s.completedAt!).getTime()<=7*day)
  const prev=done.filter(s=>{const age=now-new Date(s.completedAt!).getTime();return age>7*day&&age<=14*day})
  const sets=week.reduce((n,s)=>n+s.exercises.reduce((a,e)=>a+e.sets.filter(x=>x.completed).length,0),0)
  const prevSets=prev.reduce((n,s)=>n+s.exercises.reduce((a,e)=>a+e.sets.filter(x=>x.completed).length,0),0)
  const minutes=week.reduce((n,s)=>n+durationMinutes(s),0)
  const avgCompletion=Math.round(week.reduce((n,s)=>n+(s.completionPct??0),0)/Math.max(1,week.length))
  const highFatigue=week.filter(s=>(s.fatigue??0)>=4||(s.overallDifficulty??0)>=5).length
  let coach='Bạn đang xây nền đều. App sẽ tiếp tục ưu tiên kỹ thuật và tăng dần khi dữ liệu đủ rõ.'
  if(week.length>=profile.daysPerWeek&&highFatigue===0) coach='Bạn hoàn thành đủ lịch và mức mệt chưa cao. Chưa cần tăng số ngày tập; hãy để progressive overload diễn ra trong từng bài.'
  else if(highFatigue>=2) coach='Nhiều buổi gần đây có mức mệt cao. Tuần tới nên giữ hoặc giảm nhẹ khối lượng thay vì cố tăng tất cả cùng lúc.'
  else if(week.length<Math.max(1,profile.daysPerWeek-1)) coach='Số buổi tuần này thấp hơn kế hoạch. App nên ưu tiên đưa lịch về nhịp đều trước khi tăng độ khó.'
  const latest=metrics.at(-1), first=metrics.length>1?metrics[0]:undefined
  return {sessions:week.length,target:profile.daysPerWeek,sets,prevSets,minutes,avgCompletion,coach,weightChange:latest?.weightKg!==undefined&&first?.weightKg!==undefined?Math.round((latest.weightKg-first.weightKg)*10)/10:undefined}
}

export function bestRepByExercise(sessions:WorkoutSession[],exerciseId:string){
  let best=0
  sessions.filter(s=>s.completedAt).forEach(s=>s.exercises.filter(e=>e.exerciseId===exerciseId).forEach(e=>e.sets.forEach(x=>{if(x.completed) best=Math.max(best,x.reps??0)})))
  return best
}
