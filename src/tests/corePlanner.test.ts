import {describe,expect,it} from 'vitest'
import {buildCoreDay} from '../core/corePlanner'
import type {CoreProgress,UserProfile} from '../types'

const profile:UserProfile={
  id:'core-test',name:'Test',trainingType:'calisthenics',goal:'fat_loss',secondaryGoals:[],
  uiMode:'simple',experience:'beginner',daysPerWeek:3,trainingDays:[2,4,6],
  sessionMinutes:30,activityLevel:'medium',equipment:[],benchmarks:{plank:30},
  injuries:[],cardio:{enabled:false,modes:[],sessionsPerWeek:0,minutesByMode:{walk:0,run:0,jump_rope:0},avoidLegDays:true},
  exercisePreferences:{},unit:'kg',theme:'light',createdAt:'2026-11-13T00:00:00Z'
}
const progress:CoreProgress={completedDays:[],currentDay:1,difficultyScale:1,sessions:[]}

describe('Bụng · Eo · Lưng: lịch 30 chặng',()=>{
  it('mỗi buổi có đủ ba vùng, cả eo trái và phải',()=>{
    const days=Array.from({length:30},(_,i)=>buildCoreDay(i+1,profile,progress))
    expect(days.filter(d=>d.restDay)).toHaveLength(5)
    expect(days.filter(d=>!d.restDay)).toHaveLength(25)
    for(const day of days.filter(d=>!d.restDay)){
      expect(day.items).toHaveLength(12)
      for(const zone of ['Bụng','Eo','Lưng']){
        expect(day.items.filter(item=>item.area===zone).length).toBeGreaterThanOrEqual(2)
      }
      expect(day.items.some(item=>item.pose==='side-knee-left')).toBe(true)
      expect(day.items.some(item=>item.pose==='side-knee-right')).toBe(true)
      expect(day.items.at(-1)?.area).toBe('Thả lỏng')
      expect(day.totalSeconds).toBeGreaterThan(0)
    }
  })
  it('mười buổi tập đầu luân phiên đủ mười mẫu khác nhau',()=>{
    const signatures=Array.from({length:12},(_,i)=>buildCoreDay(i+1,profile,progress))
      .filter(day=>!day.restDay).map(day=>day.items.slice(0,8).map(item=>item.id).join(','))
    expect(signatures).toHaveLength(10)
    expect(new Set(signatures).size).toBe(10)
  })
  it('chặng 6, 12, 18, 24, 30 là hồi phục, không có động tác',()=>{
    for(const day of [6,12,18,24,30]){
      const result=buildCoreDay(day,profile,progress)
      expect(result.restDay).toBe(true)
      expect(result.items).toHaveLength(0)
      expect(result.totalSeconds).toBe(0)
    }
  })
  it('có lưu ý vấn đề cột sống thì tránh nằm sấp nâng lưng và vẫn đủ ba vùng',()=>{
    const sensitive={...profile,injuries:['đau thắt lưng']}
    for(let day=1;day<=30;day++){
      const result=buildCoreDay(day,sensitive,progress)
      if(result.restDay)continue
      expect(result.items.some(item=>item.pose==='prone-w'||item.pose==='prone-lift')).toBe(false)
      expect(new Set(result.items.map(item=>item.area))).toEqual(new Set(['Bụng','Eo','Lưng','Thả lỏng']))
    }
  })
  it('tăng tiến vừa phải và giới hạn tối đa 35 giây/bài',()=>{
    const early=buildCoreDay(1,profile,progress),later=buildCoreDay(25,profile,{...progress,difficultyScale:1.1})
    expect(later.items.every(item=>item.seconds>=10&&item.seconds<=35)).toBe(true)
    expect(later.items.reduce((n,item)=>n+item.seconds,0)).toBeGreaterThan(early.items.reduce((n,item)=>n+item.seconds,0))
    const easier=buildCoreDay(1,profile,{...progress,difficultyScale:0.65})
    expect(easier.totalSeconds).toBeLessThan(early.totalSeconds)
  })
})

describe('Bụng · Eo · Lưng: giai đoạn 2 khóa mở sau 30 chặng',()=>{
  it('chặng 31 đến 60 có 25 buổi tập và 5 buổi phục hồi',()=>{
    const days=Array.from({length:30},(_,i)=>buildCoreDay(i+31,profile,progress))
    expect(days.filter(d=>d.restDay)).toHaveLength(5)
    expect(days.filter(d=>!d.restDay)).toHaveLength(25)
    expect(days.filter(d=>d.restDay).map(d=>d.day)).toEqual([36,42,48,54,60])
    for(const day of days.filter(d=>!d.restDay)){
      expect(day.items).toHaveLength(12)
      expect(day.items.some(item=>item.pose==='side-knee-left'||item.pose==='side-full-left')).toBe(true)
      expect(day.items.some(item=>item.pose==='side-knee-right'||item.pose==='side-full-right')).toBe(true)
      for(const group of ['Bụng','Eo','Lưng'])expect(day.items.filter(item=>item.area===group).length).toBeGreaterThanOrEqual(2)
      expect(day.items.every(item=>item.seconds>=10&&item.seconds<=40)).toBe(true)
      expect(day.items.at(-1)?.area).toBe('Thả lỏng')
    }
  })
  it('giai đoạn sau có 10 mẫu luân phiên khác nhau',()=>{
    const signatures=Array.from({length:12},(_,i)=>buildCoreDay(i+31,profile,progress))
      .filter(day=>!day.restDay).map(day=>day.items.slice(0,8).map(x=>x.id).join('|'))
    expect(signatures).toHaveLength(10)
    expect(new Set(signatures).size).toBe(10)
  })
  it('chỉ sử dụng plank nghiêng chân thẳng khi khả năng phù hợp',()=>{
    const strong={...profile,benchmarks:{...profile.benchmarks,plank:55}}
    const advanced=buildCoreDay(31,strong,progress)
    expect(advanced.items.some(x=>x.pose==='side-full-left')).toBe(true)
    expect(advanced.items.some(x=>x.pose==='side-full-right')).toBe(true)
    const beginner=buildCoreDay(31,{...profile,benchmarks:{...profile.benchmarks,plank:20}},progress)
    expect(beginner.items.some(x=>x.pose==='side-full-left'||x.pose==='side-full-right')).toBe(false)
  })
  it('phương án nhạy cảm thắt lưng không dùng bài nâng ngực sấp',()=>{
    const sensitive={...profile,injuries:['đau thắt lưng']}
    for(let day=31;day<=60;day++){
      const plan=buildCoreDay(day,sensitive,progress)
      expect(plan.items.some(x=>x.pose==='prone-lift'||x.pose==='prone-w'||x.pose==='side-full-left'||x.pose==='side-full-right')).toBe(false)
    }
  })
})
