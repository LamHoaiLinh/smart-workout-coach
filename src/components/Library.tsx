import { useMemo, useState } from 'react'
import { exercises } from '../data/exercises'
import { equipmentInfo } from '../data/equipmentCatalog'
import type { Exercise, UserProfile } from '../types'

const simpleDifficulty=(n:number)=>n<=2?'Dễ':n<=4?'Vừa':'Khó'

export default function Library({profile}:{profile:UserProfile}){
  const [q,setQ]=useState(''); const [selected,setSelected]=useState<Exercise|null>(null)
  const simple=(profile.uiMode??'simple')==='simple'
  const list=useMemo(()=>exercises.filter(e=>e.trainingTypes.includes(profile.trainingType)&&(!q||`${e.nameEnglish} ${e.nameVietnamese} ${e.primaryMuscles.join(' ')}`.toLowerCase().includes(q.toLowerCase()))),[profile.trainingType,q])
  if(selected)return <main className="page"><button className="back" onClick={()=>setSelected(null)}>← Thư viện</button><section className="card detail"><span className="pill">Độ khó {simple?simpleDifficulty(selected.difficulty):`${selected.difficulty}/6`}</span><h1>{selected.nameEnglish}</h1><p className="muted">{selected.nameVietnamese}</p><h3>Nhóm cơ chính</h3><p>{selected.primaryMuscles.join(', ')}</p><h3>Dụng cụ</h3>{selected.equipment.length?<div className="detail-equipment">{selected.equipment.map(k=>{const x=equipmentInfo(k);return <div key={k}><b>{x.vi}</b><small>{x.en}</small>{!simple&&<p>{x.desc}</p>}</div>})}</div>:<p>Không cần dụng cụ đặc biệt.</p>}<h3>Cách thực hiện</h3><ol>{selected.instructionsVietnamese.map((x,i)=><li key={i}>{x}</li>)}</ol><h3>Hít thở</h3><p>{selected.breathingVietnamese}</p><h3>Lỗi thường gặp</h3><ul>{selected.commonMistakesVietnamese.map((x,i)=><li key={i}>{x}</li>)}</ul><div className="warning"><b>An toàn</b><p>{selected.safetyNotesVietnamese}</p></div></section></main>
  return <main className="page"><header><p className="eyebrow">{list.length} ĐỘNG TÁC</p><h1>Thư viện bài tập</h1><p className="muted">Tên động tác giữ tiếng Anh để dễ tìm video; hướng dẫn và dụng cụ được giải thích bằng tiếng Việt.</p></header><input className="search" value={q} onChange={e=>setQ(e.target.value)} placeholder="Tìm Pull-up, ngực, vai..."/>{list.map(e=><button className="library-row" key={e.id} onClick={()=>setSelected(e)}><div><b>{e.nameEnglish}</b><small>{e.nameVietnamese} · {e.primaryMuscles.join(', ')}</small></div><span>›</span></button>)}</main>
}
