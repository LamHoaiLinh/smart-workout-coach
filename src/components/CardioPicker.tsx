import type { CardioMode, CardioPreferences } from '../types'

const options:{id:CardioMode;name:string;desc:string}[]=[
  {id:'walk',name:'Đi bộ',desc:'Nhẹ nhàng, dễ ghép sau buổi tập hoặc vào ngày bận.'},
  {id:'run',name:'Chạy bộ',desc:'Theo dõi thời gian, quãng đường và pace bằng GPS.'},
  {id:'jump_rope',name:'Nhảy dây',desc:'Theo dõi thời gian và số lần nhảy.'}
]

export const defaultCardio:CardioPreferences={enabled:false,modes:[],sessionsPerWeek:2,minutes:20}

export default function CardioPicker({value,onChange}:{value?:CardioPreferences;onChange:(next:CardioPreferences)=>void}){
  const v=value??defaultCardio
  const toggleMode=(mode:CardioMode)=>{
    const modes=v.modes.includes(mode)?v.modes.filter(x=>x!==mode):[...v.modes,mode]
    onChange({...v,enabled:modes.length?true:v.enabled,modes})
  }
  return <div className="cardio-picker">
    <label className="switch-line cardio-switch"><input type="checkbox" checked={v.enabled} onChange={e=>onChange({...v,enabled:e.target.checked})}/><span><b>Kết hợp vận động vào giáo án</b><small>Không bắt buộc. Có thể bật hoặc tắt bất kỳ lúc nào.</small></span></label>
    {v.enabled&&<>
      <div className="cardio-choice-grid">{options.map(x=><button type="button" key={x.id} className={v.modes.includes(x.id)?'cardio-choice selected':'cardio-choice'} onClick={()=>toggleMode(x.id)}><b>{x.name}</b><span>{x.desc}</span></button>)}</div>
      {!v.modes.length&&<p className="inline-warning">Chọn ít nhất một loại vận động.</p>}
      <div className="form-grid cardio-form"><label>Số buổi vận động/tuần<select value={v.sessionsPerWeek} onChange={e=>onChange({...v,sessionsPerWeek:+e.target.value})}>{[1,2,3,4].map(n=><option key={n} value={n}>{n} buổi</option>)}</select></label><label>Thời gian mỗi buổi<select value={v.minutes} onChange={e=>onChange({...v,minutes:+e.target.value})}>{[10,15,20,30,45].map(n=><option key={n} value={n}>{n} phút</option>)}</select></label></div>
      <p className="helper">Phần vận động sẽ được xếp vào những ngày ít vướng buổi chân nhất có thể. Bạn vẫn có thể bỏ qua một hôm nếu cơ thể không ổn.</p>
    </>}
  </div>
}
