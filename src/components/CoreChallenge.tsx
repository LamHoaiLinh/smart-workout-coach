import {useEffect,useMemo,useRef,useState} from 'react'
import type {CoreDifficultyFeedback,CoreProgress,UserProfile} from '../types'
import {buildCoreDay,type Pose} from '../core/corePlanner'

type Runner={phase:'prepare'|'work'|'rest'|'finished';index:number;secondsLeft:number;paused:boolean;startedAt:number}

const DEFAULT_PROGRESS:CoreProgress={completedDays:[],currentDay:1,difficultyScale:1,sessions:[]}
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n))
const fmt=(sec:number)=>`${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`

function speakVi(text:string){
  if(!('speechSynthesis'in window))return
  const u=new SpeechSynthesisUtterance(text);u.lang='vi-VN';u.rate=.95;u.pitch=1
  const voices=window.speechSynthesis.getVoices(),vi=voices.find(v=>v.lang.toLowerCase().startsWith('vi'))
  if(vi)u.voice=vi
  window.speechSynthesis.speak(u)
}

export default function CoreChallenge({profile,progress:raw,onChange}:{profile:UserProfile;progress?:CoreProgress;onChange:(p:CoreProgress)=>void}){
  const progress=raw??DEFAULT_PROGRESS
  const [selectedDay,setSelectedDay]=useState(clamp(progress.currentDay||1,1,60))
  const [view,setView]=useState<'list'|'preview'|'train'|'done'>('list')
  const [voice,setVoice]=useState(true),[runner,setRunner]=useState<Runner|null>(null)
  const spoken=useRef(''),elapsedRef=useRef(0)
  const plan=useMemo(()=>buildCoreDay(selectedDay,profile,progress),[selectedDay,profile,progress])
  const completed=new Set(progress.completedDays)
  const stageTwoUnlocked=Array.from({length:30},(_,i)=>i+1).every(day=>completed.has(day))
  const availableDay=stageTwoUnlocked?Math.max(progress.currentDay,31):progress.currentDay

  const announce=(key:string,text:string)=>{if(!voice||spoken.current===key)return;spoken.current=key;speakVi(text)}
  const openDay=(day:number)=>{
    const unlocked=(day<=30||stageTwoUnlocked)&&(day<=availableDay||completed.has(day))
    if(!unlocked)return
    setSelectedDay(day);setView('preview')
  }
  const start=()=>{
    if(plan.restDay)return
    window.speechSynthesis?.cancel()
    spoken.current=''
    elapsedRef.current=Date.now()
    setRunner({phase:'prepare',index:0,secondsLeft:3,paused:false,startedAt:Date.now()})
    setView('train')
    if(voice)speakVi('Chuẩn bị tập bụng, eo và lưng')
  }
  const moveAfterWork=(r:Runner)=>{
    if(r.index>=plan.items.length-1){
      const elapsed=Math.max(1,Math.round((Date.now()-r.startedAt)/1000))
      elapsedRef.current=elapsed
      setRunner({...r,phase:'finished',secondsLeft:0})
      setView('done')
      if(voice)speakVi('Hoàn thành buổi tập. Tốt lắm.')
    }else setRunner({...r,phase:'rest',secondsLeft:plan.restSeconds})
  }
  const advance=(r:Runner)=>{
    if(r.phase==='prepare')setRunner({...r,phase:'work',secondsLeft:plan.items[r.index].seconds})
    else if(r.phase==='work')moveAfterWork(r)
    else if(r.phase==='rest'){const next=r.index+1;setRunner({...r,phase:'work',index:next,secondsLeft:plan.items[next].seconds})}
  }
  useEffect(()=>{
    if(view!=='train'||!runner||runner.paused||runner.phase==='finished')return
    if(runner.phase==='prepare')announce(`p-${runner.secondsLeft}`,String(runner.secondsLeft))
    if(runner.phase==='work'){
      const item=plan.items[runner.index]
      if(runner.secondsLeft===item.seconds)announce(`w-${runner.index}`,item.name)
      else if(runner.secondsLeft<=5)announce(`c-${runner.index}-${runner.secondsLeft}`,String(runner.secondsLeft))
    }
    if(runner.phase==='rest'){
      if(runner.secondsLeft===plan.restSeconds)announce(`r-${runner.index}`,`Nghỉ ${plan.restSeconds} giây. Tiếp theo ${plan.items[runner.index+1]?.name??''}`)
      else if(runner.secondsLeft<=3)announce(`rc-${runner.index}-${runner.secondsLeft}`,String(runner.secondsLeft))
    }
    const t=window.setTimeout(()=>runner.secondsLeft>1?setRunner({...runner,secondsLeft:runner.secondsLeft-1}):advance(runner),1000)
    return()=>window.clearTimeout(t)
  },[runner,view,voice,plan])

  const complete=(feedback:CoreDifficultyFeedback)=>{
    const scale=feedback==='easy'?clamp(progress.difficultyScale*1.05,.65,1.1):feedback==='hard'?clamp(progress.difficultyScale*.88,.65,1.1):progress.difficultyScale
    const days=Array.from(new Set([...progress.completedDays,selectedDay])).sort((a,b)=>a-b)
    const nextDay=clamp(Math.max(progress.currentDay,selectedDay+1),1,60)
    onChange({...progress,completedDays:days,currentDay:nextDay,difficultyScale:scale,sessions:[...progress.sessions,{day:selectedDay,completedAt:new Date().toISOString(),feedback,durationSeconds:elapsedRef.current||plan.totalSeconds}]})
    setSelectedDay(nextDay);setRunner(null);setView('list')
  }
  const completeRest=()=>{
    const days=Array.from(new Set([...progress.completedDays,selectedDay])).sort((a,b)=>a-b),nextDay=clamp(Math.max(progress.currentDay,selectedDay+1),1,60)
    onChange({...progress,completedDays:days,currentDay:nextDay,sessions:[...progress.sessions,{day:selectedDay,completedAt:new Date().toISOString(),durationSeconds:0}]})
    setSelectedDay(nextDay);setView('list')
  }

  if(view==='train'&&runner){
    const item=plan.items[runner.index],pct=runner.phase==='work'?((item.seconds-runner.secondsLeft)/item.seconds)*100:runner.phase==='rest'?100:0
    return <div className={`core-runner ${runner.phase==='rest'?'resting':''}`}>
      <div className="core-segments">{plan.items.map((_,i)=><i key={i} className={i<runner.index?'done':i===runner.index?'active':''}><b style={{width:i<runner.index?'100%':i===runner.index?`${pct}%`:'0%'}}/></i>)}</div>
      <header className="core-runner-top"><button onClick={()=>{window.speechSynthesis?.cancel();setView('preview');setRunner(null)}} aria-label="Thoát">‹</button><strong>BA VÙNG · BUỔI {selectedDay}</strong><button onClick={()=>{setVoice(!voice);if(voice)window.speechSynthesis?.cancel()}} aria-label="Giọng đọc">{voice?'🔊':'🔇'}</button></header>
      {runner.phase==='rest'?<main className="core-rest-screen"><span>NGHỈ GIỮA HIỆP</span><b>{runner.secondsLeft}</b><p>Tiếp theo: <strong>{plan.items[runner.index+1]?.name}</strong></p><CorePose pose={plan.items[runner.index+1]?.pose??'knee-plank'}/><div className="core-rest-buttons"><button onClick={()=>setRunner({...runner,secondsLeft:runner.secondsLeft+10})}>+10 giây</button><button onClick={()=>advance({...runner,secondsLeft:1})}>Bỏ qua nghỉ</button></div></main>:
      <main className="core-work-screen"><div className="core-pose-large"><CorePose pose={item.pose}/></div>{runner.phase==='prepare'?<><h2>Sẵn sàng!</h2><div className="core-ready-number">{runner.secondsLeft}</div><h3>{item.name}</h3></>:<><div className="core-clock">{fmt(runner.secondsLeft)}</div><h2>{item.name}</h2><p>{item.area} · {item.tip}</p></>}</main>}
      <footer className="core-runner-controls"><button onClick={()=>setRunner({...runner,paused:!runner.paused})}>{runner.paused?'▶ Tiếp tục':'Ⅱ Tạm dừng'}</button>{runner.phase==='work'&&<button onClick={()=>moveAfterWork(runner)}>Bài tiếp ›</button>}</footer>
    </div>
  }

  if(view==='done'){
    return <div className="core-finish"><div className="core-finish-icon">✓</div><p>BUỔI {selectedDay} HOÀN THÀNH</p><h1>Bụng, eo và lưng hôm nay thế nào?</h1><p className="muted">Phản hồi này dùng để tăng hoặc giảm nhẹ thời lượng các ngày sau. Giai đoạn 1 tối đa 35 giây/bài; giai đoạn 2 tối đa 40 giây/bài, tự điều chỉnh theo phản hồi.</p><div className="core-feedback"><button onClick={()=>complete('easy')}><b>Quá nhẹ</b><span>Tăng rất nhẹ lần sau</span></button><button onClick={()=>complete('good')} className="recommended"><b>Vừa sức</b><span>Giữ nhịp hiện tại</span></button><button onClick={()=>complete('hard')}><b>Khó quá</b><span>Giảm khoảng 12% lần sau</span></button></div></div>
  }

  if(view==='preview'){
    return <main className="page core-preview"><button className="back" onClick={()=>setView('list')}>‹ Quay lại lộ trình</button><div className="core-preview-head"><span className="pill">BUỔI {selectedDay}</span><h1>{plan.title}</h1><p className="muted">{plan.subtitle}</p></div>
      {plan.restDay?<section className="card core-rest-day"><div className="coffee">☕</div><h2>Buổi hồi phục cả ba vùng</h2><p>{plan.subtitle}</p><p className="muted">Không cần cố “tập bù”. Buổi hồi phục là một phần của tiến trình 60 chặng.</p><button className="btn primary full" onClick={completeRest}>{completed.has(selectedDay)?'Đã hoàn thành · sang ngày tiếp':'Hoàn thành ngày hồi phục'}</button></section>:<>
        <section className="card"><div className="core-plan-summary"><div><b>{Math.ceil(plan.totalSeconds/60)} phút</b><span>ước tính</span></div><div><b>{plan.items.length}</b><span>bài</span></div><div><b>{plan.restSeconds}s</b><span>nghỉ giữa hiệp</span></div></div>
          <p className="core-personal-note">Cá nhân hoá theo plank hiện tại <b>{profile.benchmarks?.plank??'chưa có'}{profile.benchmarks?.plank!==undefined?' giây':''}</b>, mức kinh nghiệm <b>{profile.experience==='new'?'mới tập':profile.experience==='beginner'?'cơ bản':profile.experience==='intermediate'?'trung bình':'nâng cao'}</b> và phản hồi các ngày trước.</p>
          <div className="core-exercise-list">{plan.items.map((x,i)=><div key={x.id+`-${i}`} className="core-exercise-row"><div className="core-thumb"><CorePose pose={x.pose}/></div><div><b>{x.name}</b><span>{x.area} · {x.seconds} giây</span><small>{x.tip}</small></div></div>)}</div>
        </section><button className="btn primary full xl core-start" onClick={start}>{completed.has(selectedDay)?'Tập lại ngày này':'Bắt đầu tập'}</button><p className="core-safety">Nếu đau nhói, tê, chóng mặt hoặc đau lưng tăng rõ, dừng bài đang gây khó chịu. Tập chậm, thở đều; không cố ưỡn lưng để lấy thêm biên độ.</p></>}
    </main>
  }

  const countOne=Array.from({length:30},(_,i)=>i+1).filter(day=>completed.has(day)).length
  const countTwo=Array.from({length:30},(_,i)=>i+31).filter(day=>completed.has(day)).length
  const activeStage=stageTwoUnlocked?2:1
  const stageCount=stageTwoUnlocked?countTwo:countOne
  const percent=Math.round(stageCount/30*100)
  const stageCards=(begin:number,finish:number,stageTwo:boolean)=>Array.from({length:finish-begin+1},(_,i)=>begin+i).map(day=>{
    const p=buildCoreDay(day,profile,progress)
    const done=completed.has(day),current=day===availableDay&&!done
    const locked=(stageTwo&&!stageTwoUnlocked)||(day>availableDay&&!done)
    return <button key={day} disabled={locked} aria-label={`Chặng ${day}: ${locked?'đang khóa':done?'đã hoàn thành':'có thể bắt đầu'}`}
      className={`core-day-card ${current?'current':''} ${done?'completed':''} ${p.restDay?'rest-day-card':''} ${locked?'core-locked':''}`}
      onClick={()=>openDay(day)}>
      <div><b>Buổi {day}</b><span>{p.restDay?'Hồi phục':`${p.items.length} bài · ~${Math.ceil(p.totalSeconds/60)} phút`}</span></div>
      <strong>{locked?'🔒':p.restDay?'☕':done?'✓':current?'BẮT ĐẦU':'›'}</strong>
    </button>
  })
  return <main className="page core-page">
    <header><p className="eyebrow">THỬ THÁCH BA VÙNG</p><h1>Bụng · Eo · Lưng</h1>
      <p className="muted">2 giai đoạn · 60 chặng · đủ 3 vùng mỗi buổi · điều chỉnh theo thể lực</p>
    </header>
    <section className="core-hero"><div><span>GIAI ĐOẠN {activeStage} / 2</span>
      <h2>{activeStage===1?'Xây nền bụng · eo · lưng':'Vững hơn và đa dạng hơn'}</h2>
      <p>Luân phiên các mẫu tập. Có thể tập thứ 3–5–7, không cần hoàn thành các chặng vào ngày liên tục.</p>
    </div><div className="core-hero-pose"><CorePose pose="plank"/></div></section>
    <section className="core-progress-card">
      <div><b>Giai đoạn {activeStage} · {Math.max(0,30-stageCount)} chặng còn lại</b><span>{percent}%</span></div>
      <div className="core-progress-track"><i style={{width:`${percent}%`}}/></div>
      <small>Đã hoàn thành {countOne+countTwo}/60 chặng · độ khó hiện tại {Math.round(progress.difficultyScale*100)}%</small>
    </section>
    <div className="core-stage-header"><b>Giai đoạn 1 · Nền tảng</b><span>Chặng 1–30 · {countOne}/30</span></div>
    <div className="core-day-list">{stageCards(1,30,false)}</div>
    <details className={`core-stage-two ${stageTwoUnlocked?'stage-unlocked':'stage-locked'}`} key={stageTwoUnlocked?'open':'closed'} open={stageTwoUnlocked?true:undefined}>
      <summary><div><b>Giai đoạn 2 · Tăng kiểm soát</b><span>Chặng 31–60 · {countTwo}/30 · 10 mẫu luân phiên mới</span></div>
        <strong>{stageTwoUnlocked?'ĐÃ MỞ':'🔒 XEM TRƯỚC'}</strong>
      </summary>
      <div className="core-stage-two-content">
        <p className="muted">{stageTwoUnlocked?'Chọn chặng tiếp theo, tập với tốc độ phù hợp.':'Hoàn thành đủ 30 chặng giai đoạn 1 để mở khóa. Có thể xem trước nhưng chưa thể bắt đầu.'}</p>
        <div className="core-day-list">{stageCards(31,60,true)}</div>
      </div>
    </details>
    {countTwo===30&&<section className="card core-complete-note"><b>Đã hoàn thành cả hai giai đoạn.</b>
      <p>Tiếp tục duy trì 2–3 buổi/tuần, luân phiên các bài đã học và thêm bài kéo lưng phù hợp. Không cần tăng độ khó vô hạn.</p>
    </section>}
  </main>
}

const CORE_SPRITE:Partial<Record<Pose,{x:number;y:number}>>={
  'plank':{x:0,y:0},'knee-plank':{x:1,y:0},'straight-knee':{x:2,y:0},
  'side-knee-left':{x:3,y:0},'side-knee-right':{x:3,y:0},'cobra':{x:4,y:0},
  'dead-bug':{x:0,y:1},'heel-taps':{x:1,y:1},'bird-dog':{x:2,y:1},
  'glute-bridge':{x:3,y:1},'reverse-crunch':{x:4,y:1}
}
function CorePose({pose}:{pose:Pose}){
  if(pose==='side-full-left'||pose==='side-full-right')return <div className={`core-side-full-pose ${pose==='side-full-right'?'mirror':''}`} role="img" aria-label="Plank nghiêng chân thẳng, tỳ cẳng tay và hai bàn chân">
    <svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="24" y="24" width="252" height="252" rx="22" fill="#edf4ef"/>
      <line x1="36" y1="248" x2="265" y2="248" stroke="#a5bfaf" strokeWidth="5" strokeLinecap="round"/>
      <line x1="67" y1="216" x2="205" y2="135" stroke="#367a61" strokeWidth="25" strokeLinecap="round"/>
      <line x1="77" y1="220" x2="55" y2="236" stroke="#325f52" strokeWidth="9" strokeLinecap="round"/>
      <line x1="205" y1="134" x2="217" y2="225" stroke="#deb293" strokeWidth="15" strokeLinecap="round"/>
      <line x1="217" y1="225" x2="254" y2="225" stroke="#deb293" strokeWidth="14" strokeLinecap="round"/>
      <circle cx="228" cy="113" r="24" fill="#e8be9d" stroke="#367a61" strokeWidth="3"/>
      <line x1="195" y1="132" x2="193" y2="91" stroke="#deb293" strokeWidth="11" strokeLinecap="round"/>
      <text x="150" y="276" textAnchor="middle" fill="#275344" fontSize="12" fontWeight="700">PLANK NGHIÊNG CHÂN THẲNG</text>
    </svg>
  </div>
  if(pose==='prone-w'||pose==='prone-lift')return <div className="core-prone-pose" role="img" aria-label={pose==='prone-w'?'Minh hoạ nằm sấp kéo hai bả vai về sau':'Minh hoạ nằm sấp nâng ngực nhẹ'}>
    <svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="24" y="24" width="252" height="252" rx="22" fill="#eaf0ea"/>
      <rect x="45" y="34" width="210" height="232" rx="16" fill="#d4e2da"/>
      <ellipse cx="150" cy="140" rx="39" ry="63" fill="#4a9779"/>
      <circle cx="150" cy="62" r="22" fill="#ebbf9d" stroke="#497663" strokeWidth="3"/>
      <path d="M128 191 L112 242 M172 191 L188 242" stroke="#345f50" strokeWidth="18" strokeLinecap="round"/>
      {pose==='prone-w'?<>
        <path d="M116 105 L79 118 L66 83 M184 105 L221 118 L234 83" stroke="#ebbf9d" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M94 100 L79 87 M206 100 L221 87" stroke="#276e5d" strokeWidth="3" strokeLinecap="round"/>
      </>:<>
        <path d="M116 109 L92 167 L76 203 M184 109 L208 167 L224 203" stroke="#ebbf9d" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M100 103 L100 85 M200 103 L200 85" stroke="#276e5d" strokeWidth="3" strokeLinecap="round"/>
      </>}
      <path d="M141 35 L150 25 L159 35" fill="none" stroke="#276e5d" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      <text x="150" y="278" textAnchor="middle" fill="#214c3b" fontSize="12" fontWeight="700">{pose==='prone-w'?'SIẾT BẢ VAI · CHỮ W':'NÂNG NGỰC THẤP'}</text>
    </svg>
  </div>
  const p=CORE_SPRITE[pose]
  return <div className={`core-pose-img ${pose==='side-knee-right'?'mirror':''}`} role="img" aria-label="Hình minh hoạ động tác" style={{'--pose-x':p?.x??0,'--pose-y':p?.y??0} as React.CSSProperties}/>
}
