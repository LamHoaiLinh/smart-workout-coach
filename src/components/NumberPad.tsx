import { useEffect, useState } from 'react'

type Props={title:string;value:number;allowDecimal?:boolean;unit?:string;onConfirm:(value:number)=>void;onClose:()=>void}

export default function NumberPad({title,value,allowDecimal=false,unit,onConfirm,onClose}:Props){
  const [text,setText]=useState(String(value))
  const [fresh,setFresh]=useState(true)
  useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose();if(e.key==='Enter')confirm()};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)})
  const tap=()=>{try{navigator.vibrate?.(8)}catch{}}
  const key=(k:string)=>{
    tap()
    if(k==='C'){setText('0');setFresh(true);return}
    if(k==='⌫'){setText(v=>v.length<=1?'0':v.slice(0,-1));setFresh(false);return}
    if(k==='.'&&!allowDecimal)return
    setText(v=>{
      if(k==='.'&&v.includes('.'))return v
      if(fresh)return k==='.'?'0.':k
      if(v.length>=7)return v
      return v==='0'&&k!=='.'?k:v+k
    })
    setFresh(false)
  }
  const confirm=()=>{const n=Number(text);if(Number.isFinite(n)&&n>=0)onConfirm(allowDecimal?Math.round(n*10)/10:Math.round(n))}
  const keys=['7','8','9','⌫','4','5','6','C','1','2','3',allowDecimal?'.':'','0','00','OK']
  return <div className="numberpad-back" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
    <section className="numberpad-panel" role="dialog" aria-modal="true" aria-label={title}>
      <div className="numberpad-head"><div><small>NHẬP NHANH</small><b>{title}</b></div><button onClick={onClose}>×</button></div>
      <div className="numberpad-display"><strong>{text}</strong>{unit&&<span>{unit}</span>}</div>
      <div className="numberpad-grid">{keys.map((k,i)=>k?<button key={`${k}-${i}`} className={k==='OK'?'ok':k==='C'||k==='⌫'?'utility':''} onClick={()=>k==='OK'?(tap(),confirm()):key(k)}>{k}</button>:<span key={`blank-${i}`}/>)}</div>
      <p>Chạm số cần nhập rồi bấm OK.</p>
    </section>
  </div>
}
