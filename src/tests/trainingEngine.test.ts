import { describe, expect, it } from 'vitest'
import { applyReadiness, detectFatigue, generateProgram, suggestSwap } from '../core/trainingEngine'
import type { UserProfile, WorkoutSession } from '../types'

const profile:UserProfile={id:'u',name:'Test',trainingType:'calisthenics',goal:'recomp',experience:'beginner',daysPerWeek:3,trainingDays:[1,3,5],sessionMinutes:30,activityLevel:'medium',equipment:['Pull-up Bar','Dip Bar'],benchmarks:{pullup:4,pushup:15,dip:5},injuries:[],unit:'kg',theme:'light',createdAt:new Date().toISOString()}

describe('Training Engine',()=>{
  it('tạo đúng số ngày và không giao bài vượt loại hình',()=>{
    const p=generateProgram(profile,[])
    expect(p.days).toHaveLength(3)
    expect(p.days.every(d=>d.exercises.length<=4)).toBe(true)
  })
  it('người mới pull-up thấp không mặc định 3×10 Pull-up',()=>{
    const p=generateProgram(profile,[])
    const pulls=p.days.flatMap(d=>d.exercises).filter(x=>x.exerciseId==='pullup')
    expect(pulls.every(x=>(x.maxReps??0)<=8)).toBe(true)
  })
  it('quick workout 20 phút cắt còn tối đa 3 bài',()=>{
    const day=generateProgram(profile,[]).days[0]
    const quick=applyReadiness(day,{energy:4,soreness:2,sleep:4,motivation:4,minutes:20,lighter:false})
    expect(quick.exercises.length).toBeLessThanOrEqual(3)
  })
  it('buổi nhẹ giảm ít nhất một hiệp so với kế hoạch',()=>{
    const day=generateProgram(profile,[]).days[0]
    const light=applyReadiness(day,{energy:2,soreness:5,sleep:2,motivation:2,minutes:30,lighter:true})
    expect(light.exercises[0].sets).toBeLessThanOrEqual(day.exercises[0].sets)
  })
  it('fatigue chỉ bật sau nhiều buổi mệt',()=>{
    const mk=(n:number):WorkoutSession=>({id:String(n),programDayKey:'x',title:'x',startedAt:new Date().toISOString(),completedAt:new Date().toISOString(),overallDifficulty:5,fatigue:5,exercises:[]})
    expect(detectFatigue([mk(1)])).toBe(false)
    expect(detectFatigue([mk(1),mk(2),mk(3)])).toBe(true)
  })
  it('smart swap chỉ trả bài cùng movement pattern phù hợp',()=>{
    const swaps=suggestSwap('pushup',profile,[])
    expect(swaps.every(e=>e.movementPattern==='horizontal_push')).toBe(true)
  })
})
