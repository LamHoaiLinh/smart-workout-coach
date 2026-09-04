import { useMemo, useState } from 'react'
import { exercises } from '../data/exercises'
import type { Exercise, UserProfile } from '../types'
export default function Library({profile}:{profile:UserProfile}){
  const [q,setQ]=useState(''); const [selected,setSelected]=useState<Exercise|null>(null)
  const list=useMemo(()=>exercises.filter(e=>e.trainingTypes.includes(profile.trainingType)&&(!q||`${e.nameEnglish} ${e.nameVietnamese} ${e.primaryMuscles.join(' ')}`.toLowerCase().includes(q.toLowerCase()))),[profile.trainingType,q])
  if(selected)return <main className="page"><button className="back" onClick={()=>setSelected(null)}>← Thư viện</button><section className="card detail"><span className="pill">Độ khó {selected.difficulty}/6</span><h1>{selected.nameEnglish}</h1><p className="muted">{selected.nameVietnamese}</p><h3>Nhóm cơ chính</h3><p>{selected.primaryMuscles.join(', ')}</p><h3>Dụng cụ</h3><p>{selected.equipment.length?selected.equipment.join(', '):'Không cần dụng cụ'}</p><h3>Cách thực hiện</h3><ol>{selected.instructionsVietnamese.map((x,i)=><li key={i}>{x}</li>)}</ol><h3>Hít thở</h3><p>{selected.breathingVietnamese}</p><h3>Lỗi thường gặp</h3><ul>{selected.commonMistakesVietnamese.map((x,i)=><li key={i}>{x}</li>)}</ul><div className="warning"><b>An toàn</b><p>{selected.safetyNotesVietnamese}</p></div></section></main>
  return <main className="page"><header><p className="eyebrow">{list.length} ĐỘNG TÁC</p><h1>Thư viện bài tập</h1></header><input className="search" value={q} onChange={e=>setQ(e.target.value)} placeholder="Tìm Pull-up, ngực, vai..."/>{list.map(e=><button className="library-row" key={e.id} onClick={()=>setSelected(e)}><div><b>{e.nameEnglish}</b><small>{e.nameVietnamese} · {e.primaryMuscles.join(', ')}</small></div><span>›</span></button>)}</main>
}
