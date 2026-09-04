import { useState } from 'react'
import type { CardioPreferences, Goal, SecondaryGoal, TrainingType, UIMode, UserProfile } from '../types'
import EquipmentPicker from './EquipmentPicker'
import CardioPicker, { defaultCardio } from './CardioPicker'

const uid=()=>crypto.randomUUID?crypto.randomUUID():String(Date.now())
const defaultEquipment:Record<TrainingType,string[]>={
  calisthenics:['Pull-up Bar','Dip Bar'],
  home:['Dumbbell','Pull-up Bar','Dip Bar'],
  gym:['Pull-up Bar','Dip Bar','Barbell','Dumbbell','Bench','Adjustable Bench','Squat Rack','Cable Machine','Lat Pulldown','Leg Press','Leg Extension','Leg Curl','Chest Press','Shoulder Press Machine','Pec Deck','Row Machine','Cardio Machine']
}
const goals:{id:Goal;name:string;desc:string}[]=[
  {id:'fat_loss',name:'Giảm mỡ + giữ cơ',desc:'Giữ sức mạnh trong lúc giảm cân.'},
  {id:'recomp',name:'Giảm mỡ + tăng cơ',desc:'Tập đều và tăng dần theo khả năng.'},
  {id:'hypertrophy',name:'Tăng cơ',desc:'Nhiều khối lượng tập hơn, vẫn tăng từ từ.'},
  {id:'strength',name:'Tăng sức mạnh',desc:'Ưu tiên các bài chính và nghỉ lâu hơn.'},
  {id:'definition',name:'Siết / nét cơ',desc:'Giữ cơ, giữ sức và hỗ trợ giảm mỡ.'},
  {id:'fitness',name:'Khỏe toàn diện',desc:'Cân bằng sức mạnh, Core và thể lực.'},
  {id:'skill',name:'Kỹ năng Calisthenics',desc:'Tập nền để tiến dần lên kỹ năng khó hơn.'}
]
const secondary:{id:SecondaryGoal;name:string;desc:string}[]=[
  {id:'pullup_10',name:'10 Pull-ups',desc:'Tăng ưu tiên nhóm kéo.'},
  {id:'pushup_30',name:'30 Push-ups',desc:'Tăng ưu tiên hít đất.'},
  {id:'dip_20',name:'20 Dips',desc:'Tăng ưu tiên xà kép.'},
  {id:'l_sit_20',name:'L-sit 20 giây',desc:'Thêm nền Core.'},
  {id:'handstand',name:'Handstand',desc:'Thêm nền vai và Core.'},
  {id:'pistol_squat',name:'Pistol Squat',desc:'Tăng sức mạnh một chân.'}
]

export default function Onboarding({onDone,onDemo}:{onDone:(p:UserProfile)=>void;onDemo:()=>void}){
  const [step,setStep]=useState(1)
  const [type,setType]=useState<TrainingType>('calisthenics')
  const [uiMode,setUiMode]=useState<UIMode>('simple')
  const [goal,setGoal]=useState<Goal>('fitness')
  const [secondaryGoals,setSecondaryGoals]=useState<SecondaryGoal[]>([])
  const [days,setDays]=useState(3)
  const [minutes,setMinutes]=useState(45)
  const [trainingDays,setTrainingDays]=useState<number[]>([1,3,5])
  const [cardio,setCardio]=useState<CardioPreferences>(defaultCardio)
  const [exp,setExp]=useState<UserProfile['experience']>('beginner')
  const [name,setName]=useState('')
  const [gender,setGender]=useState<UserProfile['gender']>()
  const [age,setAge]=useState<number|undefined>()
  const [height,setHeight]=useState<number|undefined>()
  const [weight,setWeight]=useState<number|undefined>()
  const [target,setTarget]=useState<number|undefined>()
  const [equipment,setEquipment]=useState<string[]>(defaultEquipment.calisthenics)
  const [injuries,setInjuries]=useState<string[]>([])
  const [bench,setBench]=useState({pushup:0,pullup:0,dip:0,squat:0,plank:0})
  const [db,setDb]=useState({fixed:false,minKg:2,maxKg:20,stepKg:1})
  const chooseType=(t:TrainingType)=>{setType(t);setEquipment(defaultEquipment[t]);if(t==='gym'&&goal==='skill')setGoal('fitness')}
  const toggle=(v:string,list:string[],set:(x:string[])=>void)=>set(list.includes(v)?list.filter(x=>x!==v):[...list,v])
  const toggleSecondary=(v:SecondaryGoal)=>setSecondaryGoals(secondaryGoals.includes(v)?secondaryGoals.filter(x=>x!==v):[...secondaryGoals,v].slice(0,2))
  const toggleDay=(d:number)=>{const next=trainingDays.includes(d)?trainingDays.filter(x=>x!==d):[...trainingDays,d].sort();setTrainingDays(next)}
  const finish=()=>{
    const selectedDays=(trainingDays.length>=days?trainingDays:([1,2,3,4,5,6].filter(d=>!trainingDays.includes(d)).slice(0,days-trainingDays.length).concat(trainingDays))).slice(0,days).sort()
    const safeCardio=cardio.enabled&&cardio.modes.length?cardio:{...cardio,enabled:false}
    onDone({id:uid(),name:name.trim()||'Bạn',gender,age,heightCm:height,weightKg:weight,targetWeightKg:target,trainingType:type,goal,secondaryGoals,uiMode,cardio:safeCardio,experience:exp,daysPerWeek:days,trainingDays:selectedDays,sessionMinutes:minutes,activityLevel:'medium',equipment,benchmarks:{pushup:bench.pushup,pullup:bench.pullup,dip:bench.dip,bodyweight_squat:bench.squat,plank:bench.plank},injuries,unit:'kg',theme:'light',createdAt:new Date().toISOString(),dumbbell:type==='home'?db:undefined})
  }
  return <div className="onboarding-shell"><div className="brand"><div className="brand-mark">SW</div><div><b>Smart Workout Coach</b><span>Giáo án theo tiến độ · dữ liệu lưu trên thiết bị</span></div></div>
    <div className="onboarding card">
      <div className="stepbar">{[1,2,3,4,5,6].map(n=><i key={n} className={n<=step?'active':''}/>)}</div>
      {step===1&&<><p className="eyebrow">BƯỚC 1/6</p><h1>Bạn tập ở đâu?</h1><p className="muted">Chọn đúng chỗ tập để app không đưa bài cần dụng cụ bạn không có.</p><div className="choice-grid">
        <button className={type==='calisthenics'?'choice selected':'choice'} onClick={()=>chooseType('calisthenics')}><b>Calisthenics</b><span>Xà đơn · xà kép · hít đất · không tạ</span></button>
        <button className={type==='home'?'choice selected':'choice'} onClick={()=>chooseType('home')}><b>Tạ đơn tại nhà</b><span>Tạ đơn + xà đơn/xà kép, ít dụng cụ</span></button>
        <button className={type==='gym'?'choice selected':'choice'} onClick={()=>chooseType('gym')}><b>Phòng Gym</b><span>Tạ đòn, máy tập, cáp và tạ đơn</span></button>
      </div><h3 className="subheading">Cách hiển thị</h3><div className="mode-grid"><button className={uiMode==='simple'?'mode-card selected':'mode-card'} onClick={()=>setUiMode('simple')}><b>Đơn giản</b><span>Ít thuật ngữ, dễ dùng khi mới tập.</span></button><button className={uiMode==='advanced'?'mode-card selected':'mode-card'} onClick={()=>setUiMode('advanced')}><b>Nâng cao</b><span>Hiện thêm RIR và số liệu chi tiết.</span></button></div></>}
      {step===2&&<><p className="eyebrow">BƯỚC 2/6</p><h1>Mục tiêu</h1><div className="choice-grid compact">{goals.filter(g=>g.id!=='skill'||type!=='gym').map(g=><button key={g.id} className={goal===g.id?'choice selected':'choice'} onClick={()=>setGoal(g.id)}><b>{g.name}</b><span>{g.desc}</span></button>)}</div><div className="section-title v2-title"><div><h3>Mục tiêu phụ</h3><p className="muted">Không bắt buộc. Chọn tối đa 2.</p></div></div><div className="goal-chip-grid">{secondary.map(x=><button key={x.id} className={secondaryGoals.includes(x.id)?'goal-chip selected':'goal-chip'} onClick={()=>toggleSecondary(x.id)}><b>{x.name}</b><span>{x.desc}</span></button>)}</div></>}
      {step===3&&<><p className="eyebrow">BƯỚC 3/6</p><h1>Lịch tập</h1><label>Số buổi sức mạnh mỗi tuần <strong>{days}</strong></label><input type="range" min="2" max="6" value={days} onChange={e=>setDays(+e.target.value)}/><label>Thời gian mỗi buổi</label><div className="chips">{[15,20,30,45,60,75,90].map(v=><button className={minutes===v?'chip active':'chip'} onClick={()=>setMinutes(v)} key={v}>{v}'</button>)}</div><label>Ngày thuận tiện</label><div className="chips">{['CN','T2','T3','T4','T5','T6','T7'].map((x,i)=><button className={trainingDays.includes(i)?'chip active':'chip'} key={x} onClick={()=>toggleDay(i)}>{x}</button>)}</div><h3 className="subheading">Muốn tập thêm gì?</h3><CardioPicker value={cardio} onChange={setCardio}/></>}
      {step===4&&<><p className="eyebrow">BƯỚC 4/6</p><h1>Thông tin cơ bản</h1><label>Kinh nghiệm</label><div className="chips wrap">{[['new','Chưa từng tập'],['beginner','< 6 tháng'],['intermediate','6–24 tháng'],['advanced','> 2 năm']].map(([v,n])=><button key={v} className={exp===v?'chip active':'chip'} onClick={()=>setExp(v as UserProfile['experience'])}>{n}</button>)}</div><div className="form-grid"><label>Tên hiển thị<input value={name} onChange={e=>setName(e.target.value)} placeholder="Không bắt buộc"/></label><label>Giới tính<select value={gender||''} onChange={e=>setGender((e.target.value||undefined) as UserProfile['gender'])}><option value="">Không khai báo</option><option value="male">Nam</option><option value="female">Nữ</option><option value="other">Khác</option></select></label><label>Tuổi<input type="number" value={age??''} onChange={e=>setAge(e.target.value?+e.target.value:undefined)}/></label><label>Chiều cao (cm)<input type="number" value={height??''} onChange={e=>setHeight(e.target.value?+e.target.value:undefined)}/></label><label>Cân nặng (kg)<input type="number" step="0.1" value={weight??''} onChange={e=>setWeight(e.target.value?+e.target.value:undefined)}/></label><label>Mục tiêu cân nặng<input type="number" step="0.1" value={target??''} onChange={e=>setTarget(e.target.value?+e.target.value:undefined)}/></label></div></>}
      {step===5&&<><p className="eyebrow">BƯỚC 5/6</p><h1>Khả năng và dụng cụ</h1><p className="muted">Không biết thì để 0. Sau vài buổi app sẽ có dữ liệu thực tế hơn.</p><div className="form-grid"><label>Push-up tối đa<input type="number" min="0" value={bench.pushup} onChange={e=>setBench({...bench,pushup:+e.target.value})}/></label><label>Pull-up tối đa<input type="number" min="0" value={bench.pullup} onChange={e=>setBench({...bench,pullup:+e.target.value})}/></label><label>Dip tối đa<input type="number" min="0" value={bench.dip} onChange={e=>setBench({...bench,dip:+e.target.value})}/></label><label>Bodyweight Squat<input type="number" min="0" value={bench.squat} onChange={e=>setBench({...bench,squat:+e.target.value})}/></label><label>Plank (giây)<input type="number" min="0" value={bench.plank} onChange={e=>setBench({...bench,plank:+e.target.value})}/></label></div><h3 className="subheading">Dụng cụ bạn có</h3><EquipmentPicker type={type} value={equipment} onChange={setEquipment}/>{type==='home'&&<div className="subcard"><b>Thông số tạ đơn</b><label className="switch-line"><input type="checkbox" checked={db.fixed} onChange={e=>setDb({...db,fixed:e.target.checked})}/> Tạ của tôi là loại cố định</label><div className="form-grid"><label>Mức nhẹ nhất (kg)<input type="number" value={db.minKg} onChange={e=>setDb({...db,minKg:+e.target.value})}/></label><label>Mức nặng nhất (kg)<input type="number" value={db.maxKg} onChange={e=>setDb({...db,maxKg:+e.target.value})}/></label><label>Bước tăng (kg)<select value={db.stepKg} onChange={e=>setDb({...db,stepKg:+e.target.value})}>{[0.5,1,2,2.5,5].map(x=><option key={x}>{x}</option>)}</select></label></div></div>}</>}
      {step===6&&<><p className="eyebrow">BƯỚC 6/6</p><h1>Đau / hạn chế vận động</h1><p className="muted">Chọn vùng đang có vấn đề để app tránh bớt các bài dễ làm bạn khó chịu hơn. Đây không phải chẩn đoán.</p><div className="chips wrap">{['Vai','Khuỷu tay','Cổ tay','Lưng dưới','Hông','Đầu gối','Cổ chân'].map(x=><button key={x} className={injuries.includes(x)?'chip danger active':'chip'} onClick={()=>toggle(x,injuries,setInjuries)}>{x}</button>)}</div><div className="privacy-note">Dữ liệu chỉ lưu trên thiết bị này. Khi đổi máy, nhớ xuất file sao lưu trước.</div></>}
      <div className="actions"><button className="btn ghost" disabled={step===1} onClick={()=>setStep(Math.max(1,step-1))}>Quay lại</button>{step<6?<button className="btn primary" onClick={()=>setStep(step+1)}>Tiếp tục</button>:<button className="btn primary" onClick={finish}>Tạo giáo án</button>}</div>
    </div><button className="demo-link" onClick={onDemo}>Dùng thử Demo</button>
  </div>
}
