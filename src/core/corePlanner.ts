import type {CoreProgress,UserProfile} from '../types'

export type Pose='knee-plank'|'plank'|'straight-knee'|'dead-bug'|'bird-dog'|'side-knee-left'|'side-knee-right'|'heel-taps'|'glute-bridge'|'reverse-crunch'|'cobra'|'prone-w'|'prone-lift'|'side-full-left'|'side-full-right'
export type CoreArea='Bụng'|'Eo'|'Lưng'|'Thả lỏng'
export type CoreItem={id:string;name:string;pose:Pose;area:CoreArea;baseSeconds:number;tip:string}
export type CoreDayPlan={day:number;restDay:boolean;title:string;subtitle:string;items:(CoreItem&{seconds:number})[];restSeconds:number;totalSeconds:number}

const LIB:Record<string,CoreItem>={
  knee:{id:'knee',name:'Plank chống gối',pose:'knee-plank',area:'Bụng',baseSeconds:22,tip:'Siết bụng và mông; đầu, hông, gối thẳng hàng. Thở đều.'},
  plank:{id:'plank',name:'Plank cẳng tay',pose:'plank',area:'Bụng',baseSeconds:20,tip:'Giữ thân thẳng, không võng lưng; nếu mất tư thế hãy hạ gối.'},
  straightKnee:{id:'straight-knee',name:'Plank tay thẳng chống gối',pose:'straight-knee',area:'Bụng',baseSeconds:22,tip:'Vai trên cổ tay, siết bụng; không khóa cứng khuỷu.'},
  deadBug:{id:'dead-bug',name:'Dead bug đối bên',pose:'dead-bug',area:'Bụng',baseSeconds:25,tip:'Duỗi tay và chân đối diện chậm, lưng dưới ổn định trên sàn.'},
  deadBugHold:{id:'dead-bug-hold',name:'Dead bug giữ 2 nhịp',pose:'dead-bug',area:'Bụng',baseSeconds:23,tip:'Giữ tay và chân đối diện ở điểm xa 2 nhịp, sau đó đổi bên, không ưỡn lưng.'},
  reverse:{id:'reverse',name:'Cuộn bụng ngược',pose:'reverse-crunch',area:'Bụng',baseSeconds:22,tip:'Cuộn nhẹ xương chậu lên, không đung đưa chân hay kéo bằng cổ.'},
  reverseSlow:{id:'reverse-slow',name:'Cuộn bụng ngược hạ chậm',pose:'reverse-crunch',area:'Bụng',baseSeconds:20,tip:'Nâng nhẹ hông, hạ về trong 3 nhịp, không giật người.'},
  sideLeft:{id:'side-left',name:'Plank nghiêng gối trái',pose:'side-knee-left',area:'Eo',baseSeconds:20,tip:'Tỳ cẳng tay trái, nâng hông để vai–hông–gối thẳng hàng.'},
  sideRight:{id:'side-right',name:'Plank nghiêng gối phải',pose:'side-knee-right',area:'Eo',baseSeconds:20,tip:'Tỳ cẳng tay phải, nâng hông để vai–hông–gối thẳng hàng.'},
  sideLeftPulse:{id:'side-left-pulse',name:'Plank nghiêng trái nhún hông',pose:'side-knee-left',area:'Eo',baseSeconds:18,tip:'Tỳ gối và cẳng tay trái; hạ hông rất nhẹ rồi nâng lên chậm, không xoay thân.'},
  sideRightPulse:{id:'side-right-pulse',name:'Plank nghiêng phải nhún hông',pose:'side-knee-right',area:'Eo',baseSeconds:18,tip:'Tỳ gối và cẳng tay phải; hạ hông rất nhẹ rồi nâng lên chậm, không xoay thân.'},
  heel:{id:'heel',name:'Chạm gót hai bên',pose:'heel-taps',area:'Eo',baseSeconds:25,tip:'Nằm co gối, nghiêng thân sang từng bên để chạm gót, không giật cổ.'},
  heelSlow:{id:'heel-slow',name:'Chạm gót nhịp chậm',pose:'heel-taps',area:'Eo',baseSeconds:26,tip:'Mỗi bên giữ 1 nhịp trước khi chuyển hướng; giữ vai thả lỏng.'},
  birdDog:{id:'bird-dog',name:'Bird dog đối bên',pose:'bird-dog',area:'Lưng',baseSeconds:25,tip:'Duỗi tay và chân đối diện, không xoay hông hay ưỡn thắt lưng.'},
  birdDogHold:{id:'bird-dog-hold',name:'Bird dog giữ 3 nhịp',pose:'bird-dog',area:'Lưng',baseSeconds:25,tip:'Giữ tay/chân đối diện 3 nhịp, siết mông nhẹ rồi đổi bên.'},
  birdDogTouch:{id:'bird-dog-touch',name:'Bird dog thu khuỷu về gối',pose:'bird-dog',area:'Lưng',baseSeconds:25,tip:'Duỗi tay/chân đối diện, thu khuỷu và gối gần nhau rồi duỗi ra, lưng trung lập.'},
  bridge:{id:'bridge',name:'Cầu mông',pose:'glute-bridge',area:'Lưng',baseSeconds:25,tip:'Đẩy bằng gót, siết mông, không ưỡn lưng quá mức.'},
  bridgeHold:{id:'bridge-hold',name:'Cầu mông giữ đỉnh',pose:'glute-bridge',area:'Lưng',baseSeconds:25,tip:'Nâng hông và giữ 3 nhịp, bụng siết nhẹ, không nín thở.'},
  bridgeMarch:{id:'bridge-march',name:'Cầu mông nhấc chân luân phiên',pose:'glute-bridge',area:'Lưng',baseSeconds:20,tip:'Giữ hông ngang khi lần lượt nhấc một chân thật thấp; nếu khó hãy đổi sang cầu mông thường.'},
  proneW:{id:'prone-w',name:'Nằm sấp siết bả vai chữ W',pose:'prone-w',area:'Lưng',baseSeconds:20,tip:'Nằm sấp, gập khuỷu thành chữ W, nhấc tay/ngực rất nhẹ và kéo hai bả vai về nhau; không ngửa cổ.'},
  proneLift:{id:'prone-lift',name:'Nằm sấp nâng ngực thấp',pose:'prone-lift',area:'Lưng',baseSeconds:18,tip:'Tay xuôi thân, chỉ nhấc ngực rất nhẹ bằng cơ lưng, mắt nhìn xuống; dừng nếu đau thắt lưng.'},

  plankTap:{id:'plank-tap',name:'Plank chống gối chạm vai',pose:'straight-knee',area:'Bụng',baseSeconds:25,tip:'Giữ hông cân bằng, nhấc lần lượt một tay chạm vai bên kia; giảm tốc nếu thân xoay.'},
  deadBugLong:{id:'dead-bug-long',name:'Dead bug duỗi chân thấp có kiểm soát',pose:'dead-bug',area:'Bụng',baseSeconds:27,tip:'Duỗi chân thấp trong biên độ lưng vẫn sát sàn; nếu bị ưỡn lưng, giữ chân cao hơn.'},
  proneWHold:{id:'prone-w-hold',name:'Siết bả vai chữ W giữ 3 nhịp',pose:'prone-w',area:'Lưng',baseSeconds:24,tip:'Nằm sấp, khuỷu hình chữ W; nhấc tay/ngực rất nhẹ và giữ 3 nhịp, không ngửa cổ.'},
  sideLeftFull:{id:'side-left-full',name:'Plank nghiêng trái chân thẳng',pose:'side-full-left',area:'Eo',baseSeconds:20,tip:'Tỳ cẳng tay trái và mép ngoài bàn chân trái, giữ thân thẳng; nếu khó, hạ gối.'},
  sideRightFull:{id:'side-right-full',name:'Plank nghiêng phải chân thẳng',pose:'side-full-right',area:'Eo',baseSeconds:20,tip:'Tỳ cẳng tay phải và mép ngoài bàn chân phải, giữ thân thẳng; nếu khó, hạ gối.'},
  cobra:{id:'cobra',name:'Giãn nhẹ kiểu rắn hổ mang',pose:'cobra',area:'Thả lỏng',baseSeconds:22,tip:'Chống tay nâng ngực trong biên độ dễ chịu; không ép lưng hoặc nín thở.'}
}

// Mỗi mẫu luôn có: bụng trước, eo trái và phải, lưng và kết thúc bằng giãn nhẹ.
// Đổi mẫu theo buổi; sau một chu kỳ 10 buổi lặp lại với thời lượng và độ khó mới.
const TEMPLATES:readonly (readonly string[])[]=[
  ['deadBug','sideLeft','birdDog','knee','sideRight','bridge','heel','proneW'],
  ['straightKnee','sideRight','bridgeHold','reverse','sideLeft','birdDogHold','heelSlow','proneLift'],
  ['deadBugHold','sideLeftPulse','proneW','knee','sideRightPulse','bridgeMarch','heel','birdDog'],
  ['reverseSlow','sideRight','birdDogTouch','deadBug','sideLeft','bridge','heelSlow','proneLift'],
  ['knee','sideLeft','proneLift','deadBugHold','sideRight','birdDogHold','heel','bridgeHold'],
  ['reverse','sideRightPulse','bridge','straightKnee','sideLeftPulse','proneW','heelSlow','birdDogTouch'],
  ['deadBug','sideLeft','birdDogHold','reverseSlow','sideRight','bridgeMarch','heel','proneW'],
  ['straightKnee','sideRight','proneLift','deadBugHold','sideLeft','bridgeHold','heelSlow','birdDog'],
  ['reverse','sideLeftPulse','birdDogTouch','knee','sideRightPulse','proneW','heel','bridge'],
  ['deadBugHold','sideRight','bridgeMarch','reverseSlow','sideLeft','birdDog','heelSlow','proneLift']
]
const FINISHERS:readonly (readonly string[])[]=[
  ['deadBug','heelSlow','bridge'],
  ['reverse','heel','birdDog'],
  ['knee','heelSlow','bridgeHold'],
  ['deadBugHold','heel','birdDogHold'],
  ['reverseSlow','heelSlow','bridge']
]


const NEXT_TEMPLATES:readonly (readonly string[])[]=[
  ['deadBugHold','sideLeftFull','birdDogHold','plank','sideRightFull','bridgeMarch','heelSlow','proneWHold'],
  ['reverseSlow','sideRightPulse','proneW','plankTap','sideLeftPulse','birdDogTouch','deadBugLong','bridgeHold'],
  ['deadBugLong','sideLeft','proneLift','plank','sideRight','bridgeMarch','heelSlow','birdDogHold'],
  ['plankTap','sideRightFull','birdDogHold','reverseSlow','sideLeftFull','proneWHold','heel','bridgeMarch'],
  ['reverse','sideLeftPulse','proneWHold','deadBugLong','sideRightPulse','bridgeHold','heelSlow','birdDogTouch'],
  ['deadBugHold','sideRight','bridgeMarch','plank','sideLeft','proneW','heel','birdDogHold'],
  ['plankTap','sideLeftFull','birdDogTouch','reverse','sideRightFull','proneLift','heelSlow','bridge'],
  ['deadBugLong','sideRightPulse','proneW','straightKnee','sideLeftPulse','bridgeMarch','heel','birdDogHold'],
  ['reverseSlow','sideLeftFull','proneWHold','plank','sideRightFull','birdDogTouch','heelSlow','bridgeHold'],
  ['plankTap','sideRight','birdDogHold','deadBugLong','sideLeft','proneLift','heel','bridgeMarch']
]
const NEXT_FINISHERS:readonly (readonly string[])[]=[
  ['plankTap','heelSlow','birdDogHold'],
  ['reverse','heel','bridgeMarch'],
  ['deadBugLong','heelSlow','proneW'],
  ['plank','heel','bridgeHold'],
  ['reverseSlow','heelSlow','birdDogTouch']
]

const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n))
function profileFactor(profile:UserProfile){
  const plank=profile.benchmarks?.plank
  if(plank!==undefined){if(plank<=20)return .78;if(plank<=40)return .9;if(plank<=70)return 1;return 1.05}
  return profile.experience==='new'?.78:profile.experience==='beginner'?.9:1
}

export function buildCoreDay(day:number,profile:UserProfile,progress:CoreProgress):CoreDayPlan{
  const safeDay=clamp(Math.round(day),1,60),stageTwo=safeDay>30
  const stageDay=stageTwo?safeDay-30:safeDay
  const cycle=Math.min(4,Math.floor((stageDay-1)/6)),slot=(stageDay-1)%6
  if(slot===5)return {day:safeDay,restDay:true,title:'Buổi hồi phục',subtitle:'Đi bộ nhẹ và để cơ bụng, eo, lưng hồi phục. Không cần tập bù.',items:[],restSeconds:0,totalSeconds:0}
  const index=cycle*5+slot
  const template=(stageTwo?NEXT_TEMPLATES:TEMPLATES)[index%10]
  const hasBackConcern=(profile.injuries??[]).some(x=>/lưng|back|cột sống|thắt lưng/i.test(x))
  const advancedPlank=(profile.benchmarks?.plank??0)>=30&&(cycle>=2||stageTwo)&&progress.difficultyScale>=.82
  const fullSidePlank=stageTwo&&(profile.benchmarks?.plank??0)>=40&&progress.difficultyScale>=.85&&!hasBackConcern
  const factor=clamp(profileFactor(profile)*(progress.difficultyScale||1),.65,1.1)
  const keys=[...template,...(stageTwo?NEXT_FINISHERS:FINISHERS)[(index+cycle)%5],'cobra']
  const items=keys.map(key=>{
    let id=key
    if(id==='knee'&&advancedPlank)id='plank'
    if(id==='sideLeftFull'&&!fullSidePlank)id='sideLeft'
    if(id==='sideRightFull'&&!fullSidePlank)id='sideRight'
    if(hasBackConcern){
      if(id==='proneW'||id==='proneWHold'||id==='proneLift')id='birdDog'
      if(id==='bridgeMarch')id='bridge'
      if(id==='reverse'||id==='reverseSlow')id='deadBug'
    }
    const base=LIB[id],add=cycle*2+(slot>=3?2:0)+(stageTwo?4:0)
    const maximum=stageTwo?base.pose==='side-full-left'||base.pose==='side-full-right'?30:base.pose==='prone-lift'?25:40:35
    const seconds=clamp(Math.round((base.baseSeconds+add)*factor/5)*5,10,maximum)
    return {...base,seconds}
  })
  const restSeconds=stageTwo?22:clamp(22-cycle,18,22)
  const totalSeconds=3+items.reduce((sum,item)=>sum+item.seconds,0)+restSeconds*Math.max(0,items.length-1)
  const titles=stageTwo
    ?['Vững thân giữa','Chống xoay và giữ thăng bằng','Củng cố lưng và hông','Tăng kiểm soát hai bên','Duy trì sức bền ba vùng']
    :['Nền tảng ba vùng','Phối hợp ổn định','Kiểm soát hai bên','Sức bền thân giữa','Củng cố toàn diện']
  return {
    day:safeDay,restDay:false,title:titles[cycle],
    subtitle:stageTwo?'Giai đoạn 2 · Bụng + eo trái/phải + lưng · biến thể khó hơn nhưng luôn tùy sức':'Bụng + Eo trái/phải + Lưng trong cùng buổi · luân phiên 10 mẫu · tối đa 35 giây/bài',
    items,restSeconds,totalSeconds
  }
}
