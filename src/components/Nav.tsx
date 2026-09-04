export type Tab='today'|'program'|'progress'|'library'|'settings'
export default function Nav({tab,onChange}:{tab:Tab;onChange:(t:Tab)=>void}){
  const items:[Tab,string,string][]=[['today','Hôm nay','⌂'],['program','Giáo án','▦'],['progress','Tiến độ','↗'],['library','Bài tập','◎'],['settings','Cài đặt','⚙']]
  return <nav className="bottom-nav">{items.map(([id,label,icon])=><button key={id} className={tab===id?'active':''} onClick={()=>onChange(id)}><span>{icon}</span><small>{label}</small></button>)}</nav>
}
