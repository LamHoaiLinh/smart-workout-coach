import type { ActivityMode, CardioPreference } from '../types'
import { cardioLabels } from '../core/cardioEngine'

const descriptions:Record<ActivityMode,string>={walk:'Nhẹ nhàng, hợp cho ngày hồi phục.',run:'Tăng thể lực và theo dõi quãng đường bằng GPS.',jump_rope:'Gọn, nhanh, không cần GPS.'}

export default function ActivityPreferences({value,onChange}:{value:CardioPreference;onChange:(v:CardioPreference)=>void}){
  const toggle=(mode:ActivityMode)=>{
    const modes=value.modes.includes(mode)?value.modes.filter(x=>x!==mode):[...value.modes,mode]
    onChange({...value,modes,enabled:modes.length>0})
  }
  return <div className="activity-pref">
    <label className="switch-line"><input type="checkbox" checked={value.enabled} onChange={e=>onChange({...value,enabled:e.target.checked})}/> Ghép thêm đi bộ / chạy / nhảy dây vào lịch</label>
    {value.enabled&&<>
      <div className="activity-choice-grid">{(['walk','run','jump_rope'] as ActivityMode[]).map(mode=><button key={mode} className={value.modes.includes(mode)?'activity-choice selected':'activity-choice'} onClick={()=>toggle(mode)}><b>{cardioLabels[mode]}</b><span>{descriptions[mode]}</span></button>)}</div>
      <label>Số buổi vận động mỗi tuần <strong>{value.sessionsPerWeek}</strong><input type="range" min="1" max="5" value={value.sessionsPerWeek} onChange={e=>onChange({...value,sessionsPerWeek:+e.target.value})}/></label>
      <div className="form-grid">{value.modes.map(mode=><label key={mode}>{cardioLabels[mode]} mỗi buổi<select value={value.minutesByMode[mode]} onChange={e=>onChange({...value,minutesByMode:{...value.minutesByMode,[mode]:+e.target.value}})}>{[10,15,20,25,30,40,45,60].map(x=><option key={x} value={x}>{x} phút</option>)}</select></label>)}</div>
      <label className="switch-line"><input type="checkbox" checked={value.avoidLegDays} onChange={e=>onChange({...value,avoidLegDays:e.target.checked})}/> Hạn chế xếp chạy / nhảy dây vào ngày tập chân</label>
    </>}
  </div>
}
