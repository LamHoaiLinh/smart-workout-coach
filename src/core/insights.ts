import type { ActivitySession, BodyMetric, UserProfile, WorkoutSession } from '../types'
import { activitySummary } from './cardioEngine'
import { isPlateau } from './trainingEngine'

export const skillTracks=[
  {key:'pull',title:'Sức kéo',steps:[['dead_hang','Dead Hang'],['scap_pullup','Scapular Pull-up'],['negative_pullup','Negative Pull-up'],['chinup','Chin-up'],['pullup','Pull-up'],['chest_to_bar','Chest-to-bar Pull-up']] as const},
  {key:'push',title:'Sức đẩy',steps:[['wall_pushup','Wall Push-up'],['incline_pushup','Incline Push-up'],['knee_pushup','Knee Push-up'],['pushup','Push-up'],['diamond_pushup','Diamond Push-up'],['decline_pushup','Decline Push-up'],['archer_pushup','Archer Push-up']] as const},
  {key:'dip',title:'Xà kép',steps:[['support_hold','Parallel Bar Support Hold'],['negative_dip','Negative Dip'],['dip','Dip'],['deep_dip','Deep Dip']] as const},
  {key:'core',title:'Core',steps:[['dead_bug','Dead Bug'],['plank','Plank'],['hollow_hold','Hollow Body Hold'],['hanging_knee_raise','Hanging Knee Raise'],['hanging_leg_raise','Hanging Leg Raise']] as const},
  {key:'legs',title:'Chân',steps:[['bodyweight_squat','Bodyweight Squat'],['split_squat','Split Squat'],['bulgarian_split_squat','Bulgarian Split Squat'],['assisted_pistol','Assisted Pistol Squat'],['pistol_squat','Pistol Squat']] as const}
]
function doneIds(sessions:WorkoutSession[]){const ids=new Set<string>();sessions.filter(s=>s.completedAt).forEach(s=>s.exercises.forEach(e=>{if(!e.skipped&&e.sets.some(x=>x.completed))ids.add(e.exerciseId)}));return ids}
export function progressionFor(profile:UserProfile,sessions:WorkoutSession[]){const completed=doneIds(sessions),bench=new Set<string>();if((profile.benchmarks.pullup??0)>0)bench.add('pullup');if((profile.benchmarks.pushup??0)>0)bench.add('pushup');if((profile.benchmarks.dip??0)>0)bench.add('dip');if((profile.benchmarks.bodyweight_squat??0)>0)bench.add('bodyweight_squat');if((profile.benchmarks.plank??0)>0)bench.add('plank');return skillTracks.map(track=>{let index=0;track.steps.forEach(([id],i)=>{if(completed.has(id)||bench.has(id))index=Math.max(index,i)});return {...track,index,pct:Math.round((index+1)/track.steps.length*100),current:track.steps[index][1],next:track.steps[index+1]?.[1]}})}
function durationMinutes(s:WorkoutSession){if(!s.completedAt)return 0;const d=(new Date(s.completedAt).getTime()-new Date(s.startedAt).getTime())/60000;return Number.isFinite(d)&&d>0&&d<240?Math.round(d):0}
export function weeklySummary(profile:UserProfile,sessions:WorkoutSession[],activities:ActivitySession[],metrics:BodyMetric[]){
  const now=Date.now(),day=86400000,done=sessions.filter(s=>s.completedAt),week=done.filter(s=>now-new Date(s.completedAt!).getTime()<=7*day),prev=done.filter(s=>{const a=now-new Date(s.completedAt!).getTime();return a>7*day&&a<=14*day})
  const sets=week.reduce((n,s)=>n+s.exercises.reduce((a,e)=>a+e.sets.filter(x=>x.completed).length,0),0),prevSets=prev.reduce((n,s)=>n+s.exercises.reduce((a,e)=>a+e.sets.filter(x=>x.completed).length,0),0),minutes=week.reduce((n,s)=>n+durationMinutes(s),0),avgCompletion=Math.round(week.reduce((n,s)=>n+(s.completionPct??0),0)/Math.max(1,week.length)),high=week.filter(s=>(s.fatigue??0)>=4||(s.overallDifficulty??0)>=5).length
  let note='Cứ giữ nhịp đều. Chưa cần thay đổi nhiều khi dữ liệu còn ít.';if(week.length>=profile.daysPerWeek&&high===0)note='Tuần này đủ buổi và mức mệt ổn. Giữ lịch hiện tại là hợp lý.';else if(high>=2)note='Mấy buổi gần đây khá mệt. Tuần tới nên giữ hoặc giảm nhẹ, không cần cố tăng mọi thứ.';else if(week.length<Math.max(1,profile.daysPerWeek-1))note='Tuần này hụt khá nhiều buổi. Ưu tiên quay lại nhịp đều trước khi tăng độ khó.'
  const latest=metrics.at(-1),first=metrics.length>1?metrics[0]:undefined
  return {sessions:week.length,target:profile.daysPerWeek,sets,prevSets,minutes,avgCompletion,note,cardio:activitySummary(activities,7),weightChange:latest?.weightKg!==undefined&&first?.weightKg!==undefined?Math.round((latest.weightKg-first.weightKg)*10)/10:undefined}
}
export function plateauList(sessions:WorkoutSession[]){const ids=[...new Set(sessions.flatMap(s=>s.exercises.map(e=>e.exerciseId)))];return ids.filter(id=>isPlateau(id,sessions))}
export function trainingAge(profile:UserProfile,sessions:WorkoutSession[],activities:ActivitySession[]){const days=Math.max(1,Math.floor((Date.now()-new Date(profile.createdAt).getTime())/86400000)+1);return {days,weeks:Math.floor(days/7),months:Math.floor(days/30),strengthSessions:sessions.filter(s=>s.completedAt).length,activitySessions:activities.length}}
