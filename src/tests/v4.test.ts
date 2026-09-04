import { describe,expect,it } from 'vitest'
import { activitySummary } from '../core/cardioEngine'
import { blockState,generateProgram,isPlateau,readinessExplanation,suggestTodayDay } from '../core/trainingEngine'
import type { ActivitySession,UserProfile,WorkoutSession } from '../types'

const profile:UserProfile={id:'u4',name:'Test',trainingType:'calisthenics',goal:'fitness',secondaryGoals:['pullup_10'],uiMode:'simple',experience:'beginner',daysPerWeek:3,trainingDays:[1,3,5],sessionMinutes:30,activityLevel:'medium',equipment:['Pull-up Bar','Dip Bar'],benchmarks:{pushup:10,pullup:3,dip:4,bodyweight_squat:20,plank:30},injuries:[],cardio:{enabled:true,modes:['run','walk'],sessionsPerWeek:2,minutesByMode:{walk:30,run:20,jump_rope:15},avoidLegDays:true},exercisePreferences:{},unit:'kg',theme:'light',createdAt:new Date().toISOString()}
const completed=(i:number,fatigue=2,difficulty=3):WorkoutSession=>({id:`s${i}`,programDayKey:`k${i}`,title:'Full',startedAt:new Date(Date.now()-(i+1)*86400000).toISOString(),completedAt:new Date(Date.now()-i*86400000).toISOString(),fatigue,overallDifficulty:difficulty,completionPct:100,exercises:[]})
const exposure=(i:number,reps=6,feedback:'hard'|'good'='hard'):WorkoutSession=>({id:`e${i}`,programDayKey:'x',title:'Pull',startedAt:new Date(Date.now()-(i+1)*86400000).toISOString(),completedAt:new Date(Date.now()-i*86400000).toISOString(),exercises:[{exerciseId:'pullup',name:'Pull-up',planned:{exerciseId:'pullup',name:'Pull-up',sets:3,minReps:5,maxReps:8,restSeconds:120},sets:[{reps,completed:true},{reps,completed:true},{reps,completed:true}],feedback}]})

describe('V4 core rewrite',()=>{
  it('tạo đúng số buổi sức mạnh và ghép cardio',()=>{const p=generateProgram(profile,[],[]);expect(p.days.filter(d=>d.exercises.length>0)).toHaveLength(3);expect(p.days.filter(d=>d.cardio)).toHaveLength(2)})
  it('đi vào tuần nhẹ ở tuần thứ 6',()=>{const sessions=Array.from({length:15},(_,i)=>completed(i));const state=blockState(profile,sessions);expect(state.week).toBe(6);expect(state.phase).toBe('deload');expect(generateProgram(profile,sessions,[]).blockTitle).toBe('Tuần nhẹ')})
  it('có thể vào tuần nhẹ sớm khi mệt tích luỹ',()=>{const sessions=[completed(0,5,5),completed(1,4,4),completed(2,2,3)];expect(blockState(profile,sessions).phase).toBe('deload')})
  it('nhận diện bài chững sau 4 lần gần như không tiến bộ',()=>{const sessions=[exposure(0),exposure(1),exposure(2),exposure(3)];expect(isPlateau('pullup',sessions)).toBe(true)})
  it('không báo chững khi số lần đang tăng',()=>{const sessions=[exposure(0,5,'good'),exposure(1,6,'good'),exposure(2,7,'good'),exposure(3,8,'good')];expect(isPlateau('pullup',sessions)).toBe(false)})
  it('dời buổi gần nhất bị lỡ sang ngày kế tiếp',()=>{const p=generateProgram(profile,[],[]);const result=suggestTodayDay(p,[],new Date('2026-09-08T09:00:00'));expect(result.shifted).toBe(true);expect(result.day.weekday).toBe(1)})
  it('quick workout giải thích ngắn gọn',()=>{const text=readinessExplanation({energy:4,soreness:2,sleep:4,motivation:4,minutes:20,lighter:false});expect(text).toContain('20');expect(text.length).toBeLessThan(150)})
  it('tổng hợp đúng quãng đường và phút vận động',()=>{const now=new Date().toISOString();const a:ActivitySession[]=[{id:'a',mode:'run',startedAt:now,completedAt:now,durationSeconds:1200,distanceKm:3,avgPaceSecPerKm:400,effort:3},{id:'b',mode:'walk',startedAt:now,completedAt:now,durationSeconds:1800,distanceKm:2,effort:2}];const s=activitySummary(a,7);expect(s.distanceKm).toBe(5);expect(s.minutes).toBe(50);expect(s.bestRunPace).toBe(400)})
  it('bài bị đánh dấu không hợp được giảm ưu tiên',()=>{const p={...profile,exercisePreferences:{pushup:'avoid' as const}};const plan=generateProgram(p,[],[]);expect(plan.days.flatMap(d=>d.exercises).filter(e=>e.name==='Push-up').length).toBe(0)})
})
