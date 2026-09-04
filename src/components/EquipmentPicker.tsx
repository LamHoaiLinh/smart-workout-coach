import { useMemo, useState } from 'react'
import { equipmentFor, equipmentInfo } from '../data/equipmentCatalog'
import type { TrainingType } from '../types'

const commonGym=['Pull-up Bar','Dip Bar','Barbell','Dumbbell','Bench','Adjustable Bench','Squat Rack','Cable Machine','Lat Pulldown','Row Machine','Chest Press','Shoulder Press Machine','Leg Press','Leg Extension','Leg Curl','Pec Deck','Cardio Machine']

export default function EquipmentPicker({type,value,onChange}:{type:TrainingType;value:string[];onChange:(next:string[])=>void}){
  const [custom,setCustom]=useState(type!=='gym')
  const items=useMemo(()=>equipmentFor(type),[type])
  const toggle=(key:string)=>onChange(value.includes(key)?value.filter(x=>x!==key):[...value,key])
  const chooseCommonGym=()=>{onChange(commonGym);setCustom(false)}
  if(type==='calisthenics') return <div className="equipment-section"><p className="helper">Calisthenics không dùng tạ. Chỉ chọn loại xà bạn thực sự có.</p><div className="equipment-grid">{items.filter(x=>['Pull-up Bar','Neutral Pull-up Bar','Dip Bar'].includes(x.key)).map(x=><EquipmentCard key={x.key} k={x.key} selected={value.includes(x.key)} onClick={()=>toggle(x.key)}/>)}</div></div>
  if(type==='home') return <div className="equipment-section"><p className="helper">Chọn những món đang có tại nhà. App sẽ tự loại các bài cần dụng cụ bạn không sở hữu.</p><div className="equipment-grid">{items.filter(x=>['Dumbbell','Pull-up Bar','Neutral Pull-up Bar','Dip Bar','Adjustable Bench','Resistance Band'].includes(x.key)).map(x=><EquipmentCard key={x.key} k={x.key} selected={value.includes(x.key)} onClick={()=>toggle(x.key)}/>)}</div></div>
  return <div className="equipment-section">
    <div className="gym-preset">
      <button className={!custom?'preset-card active':'preset-card'} onClick={chooseCommonGym}><b>Phòng gym cơ bản</b><span>Phòng của tôi có hầu hết máy thông thường. App tự bật bộ dụng cụ phổ biến.</span></button>
      <button className={custom?'preset-card active':'preset-card'} onClick={()=>setCustom(true)}><b>Tôi muốn tự chọn</b><span>Dùng khi phòng tập nhỏ, thiếu máy hoặc bạn chỉ muốn tập với một số thiết bị.</span></button>
    </div>
    {custom&&<><p className="helper">Tên tiếng Việt được đặt lớn; tên tiếng Anh chỉ để bạn nhận diện khi xem máy hoặc tìm video.</p><div className="equipment-grid">{items.map(x=><EquipmentCard key={x.key} k={x.key} selected={value.includes(x.key)} onClick={()=>toggle(x.key)}/>)}</div></>}
    {!custom&&<div className="preset-summary">Đã bật {value.length} dụng cụ phổ biến. Bộ này gồm cả xà đơn, xà kép và ghế chỉnh dốc thường có ở phòng gym.</div>}
  </div>
}

function EquipmentCard({k,selected,onClick}:{k:string;selected:boolean;onClick:()=>void}){
  const x=equipmentInfo(k)
  const [more,setMore]=useState(false)
  return <div className={selected?'equipment-card selected':'equipment-card'}>
    <button className="equipment-main" onClick={onClick}><span className="equipment-icon">{x.icon}</span><span><b>{x.vi}</b><small>{x.en}</small></span><i>{selected?'✓':'+'}</i></button>
    <button className="equipment-help" onClick={()=>setMore(!more)}>{more?'Ẩn mô tả':'Dụng cụ này là gì?'}</button>
    {more&&<p>{x.desc}</p>}
  </div>
}
