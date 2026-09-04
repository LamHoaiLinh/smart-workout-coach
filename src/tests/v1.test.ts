import { describe,expect,it } from 'vitest'
import { activitySummary } from '../core/cardioEngine'
import { blockState,generateProgram,isPlateau,readinessExplanation } from '../core/trainingEngine'
import { buildWeekPlan,currentAvailability,getWeekKey } from '../core/weekPlanner'
import type { ActivitySession,PlannedExercise,TrainingProgram,UserProfile,WorkoutSession } from '../types'

const profile:UserProfile={id:'u1',name:'Test',trainingType:'calisthenics',goal:'fitness',secondaryGoals:['pullup_10'],uiMode:'simple',experience:'beginner',daysPerWeek:3,trainingDays:[1,3,5],sessionMinutes:30,activityLevel:'medium',equipment:['Pull-up Bar','Dip Bar'],benchmarks:{pushup:10,pullup:3,dip:4,bodyweight_squat:20,plank:30},injuries:[],cardio:{enabled:true,modes:['run','walk'],sessionsPerWeek:2,minutesByMode:{walk:30,run:20,jump_rope:15},avoidLegDays:true},exercisePreferences:{},unit:'kg',theme:'light',createdAt:new Date().toISOString()}
const completed=(i:number,fatigue=2,difficulty=3):WorkoutSession=>({id:`s${i}`,programDayKey:`k${i}`,title:'Full',startedAt:new Date(Date.now()-(i+1)*86400000).toISOString(),completedAt:new Date(Date.now()-i*86400000).toISOString(),fatigue,overallDifficulty:difficulty,completionPct:100,exercises:[]})
const exposure=(i:number,reps=6,feedback:'hard'|'good'='hard'):WorkoutSession=>({id:`e${i}`,programDayKey:'x',title:'Pull',startedAt:new Date(Date.now()-(i+1)*86400000).toISOString(),completedAt:new Date(Date.now()-i*86400000).toISOString(),exercises:[{exerciseId:'pullup',name:'Pull-up',planned:{exerciseId:'pullup',name:'Pull-up',sets:3,minReps:5,maxReps:8,restSeconds:120},sets:[{reps,completed:true},{reps,completed:true},{reps,completed:true}],feedback}]})
const ex:PlannedExercise={exerciseId:'x',name:'Exercise',sets:3,minReps:8,maxReps:10,restSeconds:90}
const flexibleProgram:TrainingProgram={id:'p',createdAt:new Date().toISOString(),blockWeek:1,blockLength:6,phase:'base',blockTitle:'Xây nền',splitName:'Test',explanation:'',days:[
  {key:'upper-mon',title:'Upper A',focus:'Upper',weekday:1,exercises:[ex]},
  {key:'run-tue',title:'Vận động',focus:'Cardio',weekday:2,exercises:[],cardio:{mode:'run',title:'Chạy bộ',minutes:20,intensity:'steady',note:''}},
  {key:'lower-wed',title:'Lower A',focus:'Lower',weekday:3,exercises:[ex]},
  {key:'upper-fri',title:'Upper B',focus:'Upper',weekday:5,exercises:[ex]},
  {key:'run-sat',title:'Vận động',focus:'Cardio',weekday:6,exercises:[],cardio:{mode:'run',title:'Chạy bộ',minutes:20,intensity:'easy',note:''}}
]}

describe('Smart Workout Coach 1.0',()=>{
  it('tạo đúng số buổi sức mạnh và ghép vận động',()=>{const p=generateProgram(profile,[],[]);expect(p.days.filter(d=>d.exercises.length>0)).toHaveLength(3);expect(p.days.filter(d=>d.cardio)).toHaveLength(2)})
  it('đi vào tuần nhẹ ở tuần thứ 6',()=>{const sessions=Array.from({length:15},(_,i)=>completed(i));const state=blockState(profile,sessions);expect(state.week).toBe(6);expect(state.phase).toBe('deload')})
  it('nhận diện bài chững sau 4 lần gần như không tiến bộ',()=>{expect(isPlateau('pullup',[exposure(0),exposure(1),exposure(2),exposure(3)])).toBe(true)})
  it('quick workout giải thích ngắn gọn',()=>{const text=readinessExplanation({energy:4,soreness:2,sleep:4,motivation:4,minutes:20,lighter:false});expect(text).toContain('20');expect(text.length).toBeLessThan(150)})
  it('tổng hợp đúng quãng đường và phút vận động',()=>{const now=new Date().toISOString();const a:ActivitySession[]=[{id:'a',mode:'run',startedAt:now,completedAt:now,durationSeconds:1200,distanceKm:3,avgPaceSecPerKm:400,effort:3},{id:'b',mode:'walk',startedAt:now,completedAt:now,durationSeconds:1800,distanceKm:2,effort:2}];const s=activitySummary(a,7);expect(s.distanceKm).toBe(5);expect(s.minutes).toBe(50);expect(s.bestRunPace).toBe(400)})
  it('ngày bận được để trống và buổi Lower được dời sang ngày gần nhất',()=>{const plan=buildWeekPlan(flexibleProgram,{weekKey:'2026-08-31',busyDays:[3]},[],[]);expect(plan.slots.some(s=>s.weekday===3)).toBe(false);expect(plan.slots.find(s=>s.programDayKey==='lower-wed')?.weekday).toBe(4)})
  it('nhiều ngày bận sẽ đẩy các buổi sau nhưng không xếp hai buổi cùng ngày',()=>{const plan=buildWeekPlan(flexibleProgram,{weekKey:'2026-08-31',busyDays:[3,4]},[],[]);const weekdays=plan.slots.map(s=>s.weekday);expect(new Set(weekdays).size).toBe(weekdays.length);expect(plan.slots.find(s=>s.programDayKey==='lower-wed')?.weekday).toBe(5);expect(plan.slots.find(s=>s.programDayKey==='upper-fri')?.weekday).toBe(6)})
  it('tránh chuỗi Lower → chạy vừa/nặng → Lower khi còn ngày trống',()=>{const p:TrainingProgram={...flexibleProgram,days:[{key:'l1',title:'Lower A',focus:'Lower',weekday:1,exercises:[ex]},{key:'r',title:'Chạy',focus:'Cardio',weekday:2,exercises:[],cardio:{mode:'run',title:'Chạy bộ',minutes:20,intensity:'hard',note:''}},{key:'l2',title:'Lower B',focus:'Lower',weekday:3,exercises:[ex]}]};const plan=buildWeekPlan(p,{weekKey:'2026-08-31',busyDays:[]},[],[]);expect(plan.slots.find(s=>s.programDayKey==='l2')?.weekday).toBe(4)})
  it('ngày bận tự reset khi sang tuần mới',()=>{const old={weekKey:'2026-08-31',busyDays:[3,4]};const next=currentAvailability(old,new Date('2026-09-07T09:00:00'));expect(next.weekKey).toBe(getWeekKey(new Date('2026-09-07T09:00:00')));expect(next.busyDays).toEqual([])})
})
