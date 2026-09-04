export const weekdays=['CN','T2','T3','T4','T5','T6','T7']
export function dateLabel(d=new Date()){return new Intl.DateTimeFormat('vi-VN',{weekday:'long',day:'2-digit',month:'2-digit'}).format(d)}
export function shortDate(iso:string){return new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(iso))}
