import { useState } from 'react'
import type { AppState, SecondaryGoal, UserProfile } from '../types'
import EquipmentPicker from './EquipmentPicker'
import CardioPicker from './CardioPicker'
import { equipmentInfo } from '../data/equipmentCatalog'

const secondary:{id:SecondaryGoal;name:string}[]=[
  {id:'pullup_10',name:'10 Pull-ups'},{id:'pushup_30',name:'30 Push-ups'},{id:'dip_20',name:'20 Dips'},
  {id:'l_sit_20',name:'L-sit 20 giây'},{id:'handstand',name:'Handstand'},{id:'pistol_squat',name:'Pistol Squat'}
]

export default function Settings({state,onBackup,onRestore,onReset,onProfile,onExitDemo}:{state:AppState;onBackup:()=>void;onRestore:(f:File)=>void;onReset:()=>void;onProfile:(p:UserProfile,recalc?:boolean)=>void;onExitDemo:()=>void}){
  const p=state.profile
  const [equipmentOpen,setEquipmentOpen]=useState(false)
  if(!p) return null
  const toggleGoal=(id:SecondaryGoal)=>{
    const current=p.secondaryGoals??[]
    const next=current.includes(id)?current.filter(x=>x!==id):[...current,id].slice(0,2)
    onProfile({...p,secondaryGoals:next},true)
  }
  return <main className="page"><header><p className="eyebrow">SMART WORKOUT COACH · V3</p><h1>Cài đặt</h1></header>
    <section className="card"><h3>{p.name}</h3><p className="muted">{p.trainingType==='calisthenics'?'Calisthenics':p.trainingType==='home'?'Tạ đơn tại nhà':'Phòng Gym'} · {p.daysPerWeek} buổi/tuần · {p.sessionMinutes} phút</p><label>Cách hiển thị</label><div className="seg mode-seg"><button className={(p.uiMode??'simple')==='simple'?'active':''} onClick={()=>onProfile({...p,uiMode:'simple'})}>Đơn giản</button><button className={p.uiMode==='advanced'?'active':''} onClick={()=>onProfile({...p,uiMode:'advanced'})}>Nâng cao</button></div><label>Giao diện</label><div className="seg"><button className={p.theme==='light'?'active':''} onClick={()=>onProfile({...p,theme:'light'})}>Sáng</button><button className={p.theme==='dark'?'active':''} onClick={()=>onProfile({...p,theme:'dark'})}>Tối</button></div></section>
    <section className="card"><div className="section-title"><div><h3>Đi bộ / chạy / nhảy dây</h3><p className="muted">Bật phần bạn muốn ghép vào giáo án chính.</p></div></div><CardioPicker value={p.cardio} onChange={next=>onProfile({...p,cardio:next},true)}/></section>
    <section className="card"><div className="section-title"><div><h3>Dụng cụ đang có</h3><p className="muted">Sửa ở đây sẽ tính lại giáo án.</p></div><button className="text-btn" onClick={()=>setEquipmentOpen(!equipmentOpen)}>{equipmentOpen?'Thu gọn':'Chỉnh sửa'}</button></div>{!equipmentOpen&&<div className="equipment-summary">{p.equipment.length?p.equipment.map(k=><span key={k}>{equipmentInfo(k).vi}</span>):<span>Không có dụng cụ đặc biệt</span>}</div>}{equipmentOpen&&<EquipmentPicker type={p.trainingType} value={p.equipment} onChange={next=>onProfile({...p,equipment:next},true)}/>}</section>
    <section className="card"><h3>Mục tiêu phụ</h3><p className="muted">Chọn tối đa 2.</p><div className="goal-chip-grid settings-goals">{secondary.map(x=><button key={x.id} className={(p.secondaryGoals??[]).includes(x.id)?'goal-chip selected':'goal-chip'} onClick={()=>toggleGoal(x.id)}><b>{x.name}</b></button>)}</div></section>
    <section className="card"><h3>Dữ liệu cá nhân</h3><p className="muted">Dữ liệu nằm trong trình duyệt trên thiết bị này.</p><button className="btn secondary full" onClick={onBackup}>Xuất Backup JSON</button><label className="btn secondary full file-btn">Nhập Restore JSON<input type="file" accept="application/json" onChange={e=>e.target.files?.[0]&&onRestore(e.target.files[0])}/></label></section>
    <section className="card warning"><b>Khi đổi điện thoại</b><p>Hãy xuất Backup JSON trước khi đổi máy hoặc xoá dữ liệu Safari/Chrome.</p></section>{state.demoMode&&<button className="btn secondary full" onClick={onExitDemo}>Thoát Demo và tạo hồ sơ thật</button>}<button className="btn danger-btn full" onClick={onReset}>Xoá toàn bộ dữ liệu trên thiết bị này</button>
  </main>
}
