import { describe, expect, it } from 'vitest'
import { equipmentInfo } from '../data/equipmentCatalog'
import { generateProgram, readinessExplanation } from '../core/trainingEngine'
import { weeklySummary } from '../core/v2Insights'
import { migrate, SCHEMA_VERSION } from '../storage/db'
import type { UserProfile, WorkoutSession } from '../types'

const profile:UserProfile={id:'u2',name:'V2',trainingType:'calisthenics',goal:'recomp',secondaryGoals:['pullup_10'],uiMode:'simple',experience:'beginner',daysPerWeek:3,trainingDays:[1,3,5],sessionMinutes:30,activityLevel:'medium',equipment:['Pull-up Bar','Dip Bar'],benchmarks:{pullup:4,pushup:12,dip:5},injuries:[],unit:'kg',theme:'light',createdAt:new Date().toISOString()}

describe('V2 upgrades',()=>{
  it('migrate V1 lên V2 mà giữ lịch sử',()=>{
    const old={schemaVersion:1,profile:{...profile,uiMode:undefined,secondaryGoals:undefined},sessions:[{id:'old'}],metrics:[],demoMode:false}
    const next=migrate(old)
    expect(next.schemaVersion).toBe(SCHEMA_VERSION)
    expect(next.profile?.uiMode).toBe('simple')
    expect(next.profile?.secondaryGoals).toEqual([])
    expect(next.sessions).toHaveLength(1)
  })
  it('tên dụng cụ phổ biến có tiếng Việt dễ hiểu',()=>{
    expect(equipmentInfo('Lat Pulldown').vi).toContain('kéo xô')
    expect(equipmentInfo('Dumbbell').vi).toBe('Tạ đơn')
  })
  it('giáo án giải thích lý do chọn bài và mục tiêu phụ',()=>{
    const program=generateProgram(profile,[])
    const items=program.days.flatMap(d=>d.exercises)
    expect(items.every(x=>Boolean(x.selectionReason))).toBe(true)
    expect(items.some(x=>x.selectionReason?.includes('mục tiêu phụ'))).toBe(true)
  })
  it('readiness giải thích rõ khi cần buổi nhẹ',()=>{
    const text=readinessExplanation({energy:2,soreness:5,sleep:2,motivation:2,minutes:20,lighter:false})
    expect(text).toContain('giảm')
    expect(text).toContain('20')
  })
  it('báo cáo tuần đếm đúng buổi và hiệp',()=>{
    const now=new Date().toISOString()
    const session:WorkoutSession={id:'w',programDayKey:'x',title:'Full A',startedAt:new Date(Date.now()-30*60000).toISOString(),completedAt:now,completionPct:100,fatigue:2,overallDifficulty:3,exercises:[{exerciseId:'pushup',name:'Push-up',planned:{exerciseId:'pushup',name:'Push-up',sets:2,minReps:6,maxReps:15,restSeconds:60},sets:[{reps:10,completed:true},{reps:10,completed:true}]}]}
    const result=weeklySummary(profile,[session],[])
    expect(result.sessions).toBe(1)
    expect(result.sets).toBe(2)
  })
})
