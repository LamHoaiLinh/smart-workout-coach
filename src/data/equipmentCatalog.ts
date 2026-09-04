import type { TrainingType } from '../types'

export type EquipmentInfo = {
  key: string
  vi: string
  en: string
  desc: string
  group: 'bodyweight' | 'home' | 'gym' | 'cardio'
  types: TrainingType[]
  icon: string
}

const E = (key:string,vi:string,desc:string,group:EquipmentInfo['group'],types:TrainingType[],icon:string,en=key):EquipmentInfo => ({key,vi,en,desc,group,types,icon})

export const equipmentCatalog: EquipmentInfo[] = [
  E('Pull-up Bar','Xà đơn','Thanh xà để kéo người lên khi tập Pull-up, Chin-up và các bài treo người.','bodyweight',['calisthenics','home','gym'],'▰'),
  E('Neutral Pull-up Bar','Xà đơn tay cầm song song','Xà có tay cầm để lòng bàn tay hướng vào nhau, thường dễ chịu cho cổ tay hơn.','bodyweight',['calisthenics','home','gym'],'▰'),
  E('Dip Bar','Xà kép','Hai thanh song song dùng để tập Dip, giữ người và một số bài kéo ngang.','bodyweight',['calisthenics','home','gym'],'Ⅱ'),
  E('Dumbbell','Tạ đơn','Tạ cầm bằng một tay; có thể là tạ cố định hoặc thay đổi bánh tạ.','home',['home','gym'],'●'),
  E('Adjustable Bench','Ghế tập tạ điều chỉnh','Ghế có thể chỉnh nằm ngang hoặc dựng lưng để đẩy/ngồi tập tạ.','home',['home','gym'],'▱'),
  E('Bench','Ghế tập tạ','Ghế nằm hoặc ngồi dùng khi đẩy tạ và nhiều bài Dumbbell/Barbell.','gym',['gym'],'▱'),
  E('Resistance Band','Dây kháng lực','Dây cao su tạo lực cản, dùng hỗ trợ kéo xà hoặc tập các nhóm cơ nhỏ.','home',['home','gym'],'∿'),
  E('Barbell','Thanh đòn + bánh tạ','Thanh tạ dài dùng cho Squat, Bench Press, Deadlift và nhiều bài sức mạnh.','gym',['gym'],'━'),
  E('Squat Rack','Khung tập Squat','Khung đỡ thanh đòn ở độ cao phù hợp để Squat hoặc Press an toàn hơn.','gym',['gym'],'▥'),
  E('Smith Machine','Máy Smith','Thanh đòn chạy cố định trên hai ray; thường dùng Squat, Press và nhiều bài chân.','gym',['gym'],'▥'),
  E('Cable Machine','Máy kéo cáp','Máy có dây cáp, tay cầm và chồng tạ; tập được rất nhiều nhóm cơ.','gym',['gym'],'⌁'),
  E('Lat Pulldown','Máy kéo xô từ trên xuống','Ngồi kéo thanh từ trên xuống để tập lưng xô, giống chuyển động Pull-up nhưng điều chỉnh được mức tạ.','gym',['gym'],'⇣'),
  E('Row Machine','Máy kéo lưng ngồi','Ngồi kéo tay cầm về thân người để tập lưng giữa và lưng xô.','gym',['gym'],'⇠'),
  E('Chest Press','Máy ép ngực','Ngồi đẩy tay cầm ra phía trước để tập ngực và tay sau.','gym',['gym'],'⇢'),
  E('Shoulder Press Machine','Máy đẩy vai','Ngồi đẩy tay cầm lên cao để tập vai và tay sau.','gym',['gym'],'⇡'),
  E('Pec Deck','Máy ép ngực cánh bướm','Khép hai tay/cánh máy vào trước ngực để tập cơ ngực.','gym',['gym'],'◖◗'),
  E('Leg Press','Máy đạp chân','Ngồi hoặc nằm đẩy bàn đạp bằng chân để tập đùi trước và mông.','gym',['gym'],'◩'),
  E('Leg Extension','Máy duỗi chân','Ngồi duỗi gối nâng đệm tạ để tập chủ yếu đùi trước.','gym',['gym'],'⌝'),
  E('Leg Curl','Máy gập chân sau','Gập gối kéo đệm tạ để tập gân kheo phía sau đùi.','gym',['gym'],'⌞'),
  E('Hack Squat','Máy Hack Squat','Máy Squat theo ray, lưng tựa vào đệm; tập đùi trước và mông.','gym',['gym'],'▤'),
  E('Hip Abduction','Máy mở đùi','Đẩy hai đầu gối ra ngoài để tập nhóm cơ mông bên.','gym',['gym'],'↔'),
  E('Hip Adduction','Máy khép đùi','Khép hai đầu gối vào trong để tập nhóm cơ mặt trong đùi.','gym',['gym'],'→←'),
  E('Calf Machine','Máy tập bắp chân','Máy hỗ trợ động tác nhón gót với tải trọng điều chỉnh.','gym',['gym'],'⌃'),
  E('Seated Calf Machine','Máy bắp chân ngồi','Ngồi nhón gót với tải đặt lên đùi để tập bắp chân.','gym',['gym'],'⌃'),
  E('Back Extension Bench','Ghế tập lưng dưới','Ghế cố định thân/chân để tập Back Extension cho lưng dưới và chuỗi sau.','gym',['gym'],'⌒'),
  E('Cardio Machine','Máy Cardio','Máy chạy bộ, xe đạp, máy chèo hoặc máy elip dùng cho conditioning/cardio.','cardio',['gym'],'♥')
]

export const equipmentByKey = new Map(equipmentCatalog.map(x=>[x.key,x]))

export function equipmentInfo(key:string):EquipmentInfo{
  return equipmentByKey.get(key) ?? {key,vi:key,en:key,desc:'Dụng cụ hỗ trợ bài tập này. Nếu chưa rõ, bạn có thể bỏ chọn và app sẽ không dùng các bài cần dụng cụ đó.',group:'gym',types:['gym'],icon:'•'}
}

export function equipmentFor(type:TrainingType){ return equipmentCatalog.filter(x=>x.types.includes(type)) }
