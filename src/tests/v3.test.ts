import { describe, expect, it } from 'vitest'
import { activitySummary, attachCardio, formatPace } from '../core/cardioEngine'
import { generateProgram } from '../core/trainingEngine'
import { migrate, SCHEMA_VERSION } from '../storage/db'
import type { ActivitySession, ProgramDay, UserProfile } from '../types'

const profile:UserProfile={id:'v3',name:'V3',trainingType:'gym',goal:'fitness',uiMode:'simple',secondaryGoals:[],cardio:{enabled:true,modes:['run','jump_rope'],sessionsPerWeek:2,minutes:20},experience:'beginner',daysPerWeek:4,trainingDays:[1,2,4,5],sessionMinutes:45,activityLevel:'medium',equipment:['Barbell','Dumbbell','Bench','Squat Rack','Cable Machine','Lat Pulldown','Leg Press','Leg Extension','Leg Curl','Chest Press','Row Machine'],benchmarks:{},injuries:[],unit:'kg',theme:'light',createdAt:new Date().toISOString()}

describe('V3 integrated activity',()=>{
  it('migrate V2 lên V3 mà không làm mất dữ liệu cũ',()=>{
    const old={schemaVersion:2,profile:{...profile,cardio:undefined},sessions:[{id:'old'}],metrics:[],demoMode:false}
    const next=migrate(old)
    expect(next.schemaVersion).toBe(SCHEMA_VERSION)
    expect(next.activities).toEqual([])
    expect(next.sessions).toHaveLength(1)
    expect(next.profile?.cardio?.enabled).toBe(false)
  })

  it('ghép đúng số buổi vận động vào giáo án chính',()=>{
    const program=generateProgram(profile,[])
    expect(program.days.filter(d=>d.cardio)).toHaveLength(2)
  })

  it('chạy và nhảy dây ưu tiên tránh ngày Lower khi còn ngày thân trên',()=>{
    const program=generateProgram(profile,[])
    const cardioDays=program.days.filter(d=>d.cardio)
    expect(cardioDays.every(d=>d.focus!=='Lower'&&d.focus!=='Legs')).toBe(true)
  })

  it('tắt cardio thì không chèn hoạt động',()=>{
    const days:ProgramDay[]=[{key:'a',title:'Full A',focus:'Full',weekday:1,exercises:[]}]
    expect(attachCardio(days,{...profile,cardio:{...profile.cardio!,enabled:false}})[0].cardio).toBeUndefined()
  })

  it('tính tổng hoạt động và pace',()=>{
    const now=new Date().toISOString()
    const list:ActivitySession[]=[
      {id:'r',mode:'run',startedAt:now,completedAt:now,durationSeconds:600,distanceKm:2,avgPaceSecPerKm:300},
      {id:'j',mode:'jump_rope',startedAt:now,completedAt:now,durationSeconds:300,jumpCount:500}
    ]
    const s=activitySummary(list)
    expect(s.count).toBe(2)
    expect(s.distance).toBe(2)
    expect(s.jumps).toBe(500)
    expect(formatPace(300)).toBe('5:00/km')
  })
})
