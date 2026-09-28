import {useEffect,useMemo,useRef,useState} from 'react'
import type {CoreDifficultyFeedback,CoreProgress,UserProfile} from '../types'

type Pose='knee-plank'|'plank'|'straight-knee'|'dead-bug'|'bird-dog'|'side-knee-left'|'side-knee-right'|'heel-taps'|'glute-bridge'|'reverse-crunch'|'cobra'
type CoreItem={id:string;name:string;pose:Pose;baseSeconds:number;tip:string}
type DayPlan={day:number;restDay:boolean;title:string;subtitle:string;items:(CoreItem&{seconds:number})[];restSeconds:number;totalSeconds:number}
type Runner={phase:'prepare'|'work'|'rest'|'finished';index:number;secondsLeft:number;paused:boolean;startedAt:number}

const DEFAULT_PROGRESS:CoreProgress={completedDays:[],currentDay:1,difficultyScale:1,sessions:[]}
const LIB:Record<string,CoreItem>={
  knee:{id:'knee',name:'Plank gối',pose:'knee-plank',baseSeconds:20,tip:'Siết bụng, mông; giữ đầu–hông–gối gần thành một đường.'},
  plank:{id:'plank',name:'Plank cẳng tay',pose:'plank',baseSeconds:18,tip:'Không võng lưng. Nếu mất form, hạ gối xuống ngay.'},
  straightKnee:{id:'straight-knee',name:'Plank tay thẳng chống gối',pose:'straight-knee',baseSeconds:20,tip:'Vai ở trên cổ tay, bụng siết nhẹ, không khóa cứng khuỷu.'},
  deadBug:{id:'dead-bug',name:'Dead bug',pose:'dead-bug',baseSeconds:20,tip:'Ép lưng dưới nhẹ xuống sàn, đi chậm và thở đều.'},
  birdDog:{id:'bird-dog',name:'Bird dog',pose:'bird-dog',baseSeconds:20,tip:'Duỗi tay và chân đối diện, giữ hông không xoay.'},
  sideLeft:{id:'side-left',name:'Plank nghiêng gối trái',pose:'side-knee-left',baseSeconds:15,tip:'Tỳ cẳng tay, gối co; nâng hông vừa đủ để thân thẳng.'},
  sideRight:{id:'side-right',name:'Plank nghiêng gối phải',pose:'side-knee-right',baseSeconds:15,tip:'Tỳ cẳng tay, gối co; nâng hông vừa đủ để thân thẳng.'},
  heel:{id:'heel',name:'Chạm gót luân phiên',pose:'heel-taps',baseSeconds:20,tip:'Nằm co gối, siết bụng rồi nghiêng thân nhẹ sang từng bên.'},
  bridge:{id:'bridge',name:'Cầu mông',pose:'glute-bridge',baseSeconds:20,tip:'Đẩy hông bằng mông, không ưỡn lưng quá mức.'},
  reverse:{id:'reverse',name:'Co gối cuộn bụng',pose:'reverse-crunch',baseSeconds:15,tip:'Co gối chậm về ngực, chỉ nhấc hông nhẹ và không lấy đà.'},
  cobra:{id:'cobra',name:'Giãn bụng kiểu rắn hổ mang',pose:'cobra',baseSeconds:25,tip:'Nâng ngực nhẹ, vai hạ xuống; không ép lưng nếu khó chịu.'}
}
const PATTERNS=[
  ['deadBug','knee','birdDog','sideLeft','sideRight','cobra'],
  ['bridge','deadBug','heel','knee','birdDog','cobra'],
  ['straightKnee','birdDog','deadBug','sideLeft','sideRight','cobra'],
  ['bridge','heel','reverse','knee','birdDog','cobra'],
  ['knee','deadBug','birdDog','heel','sideLeft','sideRight']
] as const

function clamp(n:number,min:number,max:number){return Math.max(min,Math.min(max,n))}
function fmt(sec:number){const m=Math.floor(sec/60),s=sec%60;return `${m}:${String(s).padStart(2,'0')}`}
function profileFactor(profile:UserProfile){
  const plank=profile.benchmarks?.plank
  if(plank!==undefined){if(plank<=20)return .78;if(plank<=40)return .9;if(plank<=70)return 1;return 1.05}
  return profile.experience==='new'?.78:profile.experience==='beginner'?.9:1
}
function buildDay(day:number,profile:UserProfile,progress:CoreProgress):DayPlan{
  const cycle=Math.min(4,Math.floor((day-1)/6)),slot=(day-1)%6
  if(slot===5)return {day,restDay:true,title:'Ngày hồi phục',subtitle:'Đi bộ nhẹ, thở sâu, ngủ đủ và để core phục hồi.',items:[],restSeconds:0,totalSeconds:0}
  const hasBackConcern=profile.injuries.some(x=>/lưng|back|cột sống/i.test(x))
  const useFullPlank=(profile.benchmarks?.plank??0)>=30&&cycle>=2&&progress.difficultyScale>=.82
  const factor=clamp(profileFactor(profile)*progress.difficultyScale,.65,1.1)
  const ids=[...PATTERNS[slot]].map(id=>id==='knee'&&useFullPlank?'plank':id==='reverse'&&hasBackConcern?'deadBug':id)
  const items=ids.map(id=>{
    const base=LIB[id],add=cycle*2+(slot>=3?2:0)
    const seconds=clamp(Math.round((base.baseSeconds+add)*factor/5)*5,10,35)
    return {...base,seconds}
  })
  const restSeconds=clamp(25-cycle*2,17,25)
  const totalSeconds=3+items.reduce((a,x)=>a+x.seconds,0)+restSeconds*Math.max(0,items.length-1)
  const names=['Làm quen core','Ổn định thân người','Kiểm soát tốt hơn','Tăng sức bền','Củng cố nền tảng']
  return {day,restDay:false,title:names[cycle],subtitle:`Mức người mới · ${items.length} bài · mỗi bài tối đa 35 giây`,items,restSeconds,totalSeconds}
}
function speakVi(text:string){
  if(!('speechSynthesis'in window))return
  const u=new SpeechSynthesisUtterance(text);u.lang='vi-VN';u.rate=.95;u.pitch=1
  const voices=window.speechSynthesis.getVoices(),vi=voices.find(v=>v.lang.toLowerCase().startsWith('vi'))
  if(vi)u.voice=vi
  window.speechSynthesis.speak(u)
}

export default function CoreChallenge({profile,progress:raw,onChange}:{profile:UserProfile;progress?:CoreProgress;onChange:(p:CoreProgress)=>void}){
  const progress=raw??DEFAULT_PROGRESS
  const [selectedDay,setSelectedDay]=useState(clamp(progress.currentDay||1,1,30))
  const [view,setView]=useState<'list'|'preview'|'train'|'done'>('list')
  const [voice,setVoice]=useState(true),[runner,setRunner]=useState<Runner|null>(null)
  const spoken=useRef(''),elapsedRef=useRef(0)
  const plan=useMemo(()=>buildDay(selectedDay,profile,progress),[selectedDay,profile,progress])
  const completed=new Set(progress.completedDays)

  const announce=(key:string,text:string)=>{if(!voice||spoken.current===key)return;spoken.current=key;speakVi(text)}
  const openDay=(day:number)=>{
    const unlocked=day<=progress.currentDay||completed.has(day)
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
    if(voice)speakVi('Chuẩn bị tập bụng và core')
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
    const nextDay=clamp(Math.max(progress.currentDay,selectedDay+1),1,30)
    onChange({...progress,completedDays:days,currentDay:nextDay,difficultyScale:scale,sessions:[...progress.sessions,{day:selectedDay,completedAt:new Date().toISOString(),feedback,durationSeconds:elapsedRef.current||plan.totalSeconds}]})
    setSelectedDay(nextDay);setRunner(null);setView('list')
  }
  const completeRest=()=>{
    const days=Array.from(new Set([...progress.completedDays,selectedDay])).sort((a,b)=>a-b),nextDay=clamp(Math.max(progress.currentDay,selectedDay+1),1,30)
    onChange({...progress,completedDays:days,currentDay:nextDay,sessions:[...progress.sessions,{day:selectedDay,completedAt:new Date().toISOString(),durationSeconds:0}]})
    setSelectedDay(nextDay);setView('list')
  }

  if(view==='train'&&runner){
    const item=plan.items[runner.index],pct=runner.phase==='work'?((item.seconds-runner.secondsLeft)/item.seconds)*100:runner.phase==='rest'?100:0
    return <div className={`core-runner ${runner.phase==='rest'?'resting':''}`}>
      <div className="core-segments">{plan.items.map((_,i)=><i key={i} className={i<runner.index?'done':i===runner.index?'active':''}><b style={{width:i<runner.index?'100%':i===runner.index?`${pct}%`:'0%'}}/></i>)}</div>
      <header className="core-runner-top"><button onClick={()=>{window.speechSynthesis?.cancel();setView('preview');setRunner(null)}} aria-label="Thoát">‹</button><strong>CORE · NGÀY {selectedDay}</strong><button onClick={()=>{setVoice(!voice);if(voice)window.speechSynthesis?.cancel()}} aria-label="Giọng đọc">{voice?'🔊':'🔇'}</button></header>
      {runner.phase==='rest'?<main className="core-rest-screen"><span>NGHỈ GIỮA HIỆP</span><b>{runner.secondsLeft}</b><p>Tiếp theo: <strong>{plan.items[runner.index+1]?.name}</strong></p><CorePose pose={plan.items[runner.index+1]?.pose??'knee-plank'}/><div className="core-rest-buttons"><button onClick={()=>setRunner({...runner,secondsLeft:runner.secondsLeft+10})}>+10 giây</button><button onClick={()=>advance({...runner,secondsLeft:1})}>Bỏ qua nghỉ</button></div></main>:
      <main className="core-work-screen"><div className="core-pose-large"><CorePose pose={item.pose}/></div>{runner.phase==='prepare'?<><h2>Sẵn sàng!</h2><div className="core-ready-number">{runner.secondsLeft}</div><h3>{item.name}</h3></>:<><div className="core-clock">{fmt(runner.secondsLeft)}</div><h2>{item.name}</h2><p>{item.tip}</p></>}</main>}
      <footer className="core-runner-controls"><button onClick={()=>setRunner({...runner,paused:!runner.paused})}>{runner.paused?'▶ Tiếp tục':'Ⅱ Tạm dừng'}</button>{runner.phase==='work'&&<button onClick={()=>moveAfterWork(runner)}>Bài tiếp ›</button>}</footer>
    </div>
  }

  if(view==='done'){
    return <div className="core-finish"><div className="core-finish-icon">✓</div><p>NGÀY {selectedDay} HOÀN THÀNH</p><h1>Core hôm nay cảm giác thế nào?</h1><p className="muted">Phản hồi này dùng để tăng hoặc giảm nhẹ thời lượng các ngày sau. App không tăng quá 35 giây mỗi bài.</p><div className="core-feedback"><button onClick={()=>complete('easy')}><b>Quá nhẹ</b><span>Tăng rất nhẹ lần sau</span></button><button onClick={()=>complete('good')} className="recommended"><b>Vừa sức</b><span>Giữ nhịp hiện tại</span></button><button onClick={()=>complete('hard')}><b>Khó quá</b><span>Giảm khoảng 12% lần sau</span></button></div></div>
  }

  if(view==='preview'){
    return <main className="page core-preview"><button className="back" onClick={()=>setView('list')}>‹ Quay lại 30 ngày</button><div className="core-preview-head"><span className="pill">NGÀY {selectedDay}</span><h1>{plan.title}</h1><p className="muted">{plan.subtitle}</p></div>
      {plan.restDay?<section className="card core-rest-day"><div className="coffee">☕</div><h2>Hôm nay nghỉ core</h2><p>{plan.subtitle}</p><p className="muted">Không cần cố “tập bù”. Ngày hồi phục là một phần của tiến trình 30 ngày.</p><button className="btn primary full" onClick={completeRest}>{completed.has(selectedDay)?'Đã hoàn thành · sang ngày tiếp':'Hoàn thành ngày hồi phục'}</button></section>:<>
        <section className="card"><div className="core-plan-summary"><div><b>{Math.ceil(plan.totalSeconds/60)} phút</b><span>ước tính</span></div><div><b>{plan.items.length}</b><span>bài</span></div><div><b>{plan.restSeconds}s</b><span>nghỉ giữa hiệp</span></div></div>
          <p className="core-personal-note">Cá nhân hoá theo plank hiện tại <b>{profile.benchmarks?.plank??'chưa có'}{profile.benchmarks?.plank!==undefined?' giây':''}</b>, mức kinh nghiệm <b>{profile.experience==='new'?'mới tập':profile.experience==='beginner'?'cơ bản':profile.experience==='intermediate'?'trung bình':'nâng cao'}</b> và phản hồi các ngày trước.</p>
          <div className="core-exercise-list">{plan.items.map((x,i)=><div key={x.id+`-${i}`} className="core-exercise-row"><div className="core-thumb"><CorePose pose={x.pose}/></div><div><b>{x.name}</b><span>{x.seconds} giây</span><small>{x.tip}</small></div></div>)}</div>
        </section><button className="btn primary full xl core-start" onClick={start}>{completed.has(selectedDay)?'Tập lại ngày này':'Bắt đầu tập'}</button><p className="core-safety">Nếu đau nhói, tê, chóng mặt hoặc đau lưng tăng rõ, dừng bài đang gây khó chịu. Mỏi cơ bụng nhẹ không giống đau bất thường.</p></>}
    </main>
  }

  const percent=Math.round(completed.size/30*100)
  return <main className="page core-page"><header><p className="eyebrow">THỬ THÁCH RIÊNG</p><h1>Tập bụng & core</h1><p className="muted">30 ngày · ưu tiên nền tảng · tự điều chỉnh để không tăng quá nhanh</p></header>
    <section className="core-hero"><div><span>CORE 30 NGÀY</span><h2>Nền tảng trước, khó dần sau</h2><p>Không video. Mỗi bài có hình minh hoạ, đồng hồ, giọng Việt và nghỉ tự động.</p></div><div className="core-hero-pose"><CorePose pose="plank"/></div></section>
    <section className="core-progress-card"><div><b>{30-progress.currentDay+1>0?Math.max(0,30-progress.currentDay+1):0} ngày còn lại</b><span>{percent}%</span></div><div className="core-progress-track"><i style={{width:`${percent}%`}}/></div><small>Đã hoàn thành {completed.size}/30 ngày · hệ số độ khó {Math.round(progress.difficultyScale*100)}%</small></section>
    <div className="core-day-list">{Array.from({length:30},(_,i)=>i+1).map(day=>{const p=buildDay(day,profile,progress),done=completed.has(day),current=day===progress.currentDay,locked=day>progress.currentDay&&!done;return <button key={day} disabled={locked} className={`core-day-card ${current?'current':''} ${done?'completed':''} ${p.restDay?'rest-day-card':''}`} onClick={()=>openDay(day)}><div><b>Ngày {day}</b><span>{p.restDay?'Hồi phục':`${p.items.length} bài · ~${Math.ceil(p.totalSeconds/60)} phút`}</span></div><strong>{p.restDay?'☕':done?'✓':locked?'🔒':current?'BẮT ĐẦU':'›'}</strong></button>})}</div>
  </main>
}

function CorePose({pose}:{pose:Pose}){
  const mirror=pose==='side-knee-right'
  return <svg viewBox="0 0 360 200" role="img" aria-label="Hình minh hoạ động tác">
    <rect x="24" y="151" width="312" height="10" rx="5" fill="#bdeaf1"/>
    <g transform={mirror?'translate(360 0) scale(-1 1)':undefined} fill="none" strokeLinecap="round" strokeLinejoin="round">
      {(pose==='plank'||pose==='knee-plank'||pose==='straight-knee')&&<><circle cx="278" cy="87" r="13" fill="#5b6467" stroke="none"/><path d="M255 96 L178 96 L105 88" stroke="#43a8d0" strokeWidth="25"/><path d={pose==='knee-plank'||pose==='straight-knee'?'M108 90 L82 128 L54 145':'M108 90 L67 112 L38 146'} stroke="#f1a588" strokeWidth="15"/><path d={pose==='straight-knee'?'M245 103 L247 146 M247 146 L279 146':'M247 103 L236 144 L284 144'} stroke="#f1a588" strokeWidth="14"/></>}
      {pose==='dead-bug'&&<><circle cx="259" cy="122" r="13" fill="#5b6467" stroke="none"/><path d="M241 124 L166 129" stroke="#43a8d0" strokeWidth="25"/><path d="M179 121 L160 72 M160 72 L150 42" stroke="#f1a588" strokeWidth="13"/><path d="M172 134 L134 96 L96 70 M172 135 L128 147 L82 146" stroke="#f1a588" strokeWidth="14"/></>}
      {pose==='bird-dog'&&<><circle cx="242" cy="86" r="12" fill="#5b6467" stroke="none"/><path d="M220 94 L158 106 L115 108" stroke="#43a8d0" strokeWidth="24"/><path d="M208 102 L235 145 M160 114 L151 146" stroke="#f1a588" strokeWidth="13"/><path d="M117 108 L67 86 L34 72 M118 115 L86 145" stroke="#f1a588" strokeWidth="13"/></>}
      {(pose==='side-knee-left'||pose==='side-knee-right')&&<><circle cx="254" cy="91" r="13" fill="#5b6467" stroke="none"/><path d="M232 101 L174 114 L119 127" stroke="#43a8d0" strokeWidth="25"/><path d="M221 108 L233 146 L277 146" stroke="#f1a588" strokeWidth="13"/><path d="M123 132 L83 145 M126 132 L96 111" stroke="#f1a588" strokeWidth="14"/></>}
      {pose==='heel-taps'&&<><circle cx="275" cy="129" r="13" fill="#5b6467" stroke="none"/><path d="M255 130 L186 132 L146 139" stroke="#43a8d0" strokeWidth="24"/><path d="M151 141 L112 107 L78 145 M152 142 L119 119 L95 147" stroke="#f1a588" strokeWidth="14"/><path d="M220 135 L202 149" stroke="#f1a588" strokeWidth="12"/></>}
      {pose==='glute-bridge'&&<><circle cx="280" cy="132" r="13" fill="#5b6467" stroke="none"/><path d="M257 133 L198 128 L146 92 L111 92" stroke="#43a8d0" strokeWidth="24"/><path d="M113 99 L77 121 L58 148 M117 98 L92 125 L86 148" stroke="#f1a588" strokeWidth="14"/><path d="M224 139 L207 149" stroke="#f1a588" strokeWidth="12"/></>}
      {pose==='reverse-crunch'&&<><circle cx="280" cy="132" r="13" fill="#5b6467" stroke="none"/><path d="M257 132 L187 133 L150 126" stroke="#43a8d0" strokeWidth="24"/><path d="M155 126 L131 91 L149 56 M153 126 L111 103 L111 64" stroke="#f1a588" strokeWidth="14"/><path d="M225 138 L205 149" stroke="#f1a588" strokeWidth="12"/></>}
      {pose==='cobra'&&<><circle cx="270" cy="79" r="13" fill="#5b6467" stroke="none"/><path d="M249 90 L207 105 L163 132 L105 142" stroke="#43a8d0" strokeWidth="24"/><path d="M226 106 L235 146 L273 146" stroke="#f1a588" strokeWidth="13"/><path d="M107 144 L65 147 L39 147" stroke="#f1a588" strokeWidth="14"/></>}
    </g>
  </svg>
}
