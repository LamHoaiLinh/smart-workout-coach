import type { Exercise, MovementPattern, TrainingType } from '../types'

const tips: Record<MovementPattern, {instructions:string[]; mistakes:string[]; breathing:string; safety:string}> = {
  horizontal_push: {instructions:['Giữ thân người ổn định, siết bụng và mông.','Hạ có kiểm soát đến biên độ phù hợp rồi đẩy mạnh nhưng không khóa khớp thô bạo.','Giữ khuỷu tay đi theo hướng tự nhiên, không xoè ngang quá mức.'],mistakes:['Võng lưng','Rút vai lên tai','Thả nhanh ở pha hạ'],breathing:'Hít vào khi hạ, thở ra khi đẩy.',safety:'Dừng nếu đau nhói ở vai, ngực hoặc khuỷu tay.'},
  vertical_push: {instructions:['Siết thân người để tránh ưỡn lưng.','Đẩy theo đường đi tự nhiên lên trên đầu.','Hạ chậm về vị trí kiểm soát.'],mistakes:['Ưỡn lưng quá mức','Đẩy lệch hai bên','Nhún người để lấy đà khi không chủ đích'],breathing:'Hít vào khi hạ, thở ra khi đẩy.',safety:'Không cố vượt biên độ vai gây đau.'},
  horizontal_pull: {instructions:['Giữ ngực mở và cột sống trung lập.','Kéo khuỷu tay về sau, tập trung siết lưng.','Hạ chậm cho đến khi cơ lưng được kéo giãn có kiểm soát.'],mistakes:['Giật tạ','Gù lưng','Kéo bằng cổ tay thay vì khuỷu tay'],breathing:'Thở ra khi kéo, hít vào khi hạ.',safety:'Giảm tải nếu lưng dưới mất ổn định.'},
  vertical_pull: {instructions:['Bắt đầu với vai ổn định, không nhún cổ.','Kéo khuỷu tay xuống và về sau.','Hạ người/tạ chậm đến biên độ kiểm soát.'],mistakes:['Đung đưa lấy đà','Rướn cổ','Thả rơi ở pha hạ'],breathing:'Thở ra khi kéo, hít vào khi hạ.',safety:'Không tập xuyên qua đau nhói vai hoặc khuỷu tay.'},
  squat: {instructions:['Giữ bàn chân bám chắc mặt đất.','Hạ hông và gối theo hướng mũi chân trong biên độ kiểm soát.','Đứng lên bằng cách đạp đều cả bàn chân.'],mistakes:['Gối sụp vào trong','Nhón gót','Mất trung lập cột sống'],breathing:'Hít vào trước khi hạ, thở ra khi đứng lên.',safety:'Giảm biên độ/tải nếu đau gối hoặc lưng.'},
  hinge: {instructions:['Đẩy hông ra sau, giữ cột sống trung lập.','Giữ tải gần thân người.','Siết mông để đưa hông về vị trí đứng.'],mistakes:['Biến thành squat','Cong lưng dưới','Để tải quá xa người'],breathing:'Hít vào và siết bụng trước khi hạ, thở ra khi đứng lên.',safety:'Ưu tiên kỹ thuật hơn mức tạ; dừng nếu đau lưng bất thường.'},
  lunge: {instructions:['Bước đủ dài để giữ thăng bằng.','Hạ thẳng người xuống, gối đi theo hướng mũi chân.','Đẩy qua chân trụ để trở về.'],mistakes:['Bước quá hẹp','Gối sụp vào trong','Nghiêng người mất kiểm soát'],breathing:'Hít vào khi hạ, thở ra khi đứng lên.',safety:'Có thể vịn nhẹ nếu thăng bằng kém.'},
  core: {instructions:['Giữ lồng ngực và xương chậu ổn định.','Siết bụng vừa đủ để giữ tư thế.','Chỉ tăng biên độ khi không mất kiểm soát.'],mistakes:['Nín thở','Ưỡn lưng dưới','Dùng quán tính'],breathing:'Thở đều, không nín thở kéo dài.',safety:'Giảm độ khó nếu lưng dưới bị đau.'},
  carry: {instructions:['Đứng cao, siết thân người.','Đi bước ngắn và chắc.','Giữ tải ổn định, không nghiêng người.'],mistakes:['Nghiêng thân','Bước quá nhanh','Rút vai lên tai'],breathing:'Thở đều khi di chuyển.',safety:'Dừng nếu mất kiểm soát tư thế.'},
  isolation: {instructions:['Giữ phần thân không tham gia ổn định.','Di chuyển có kiểm soát qua biên độ phù hợp.','Tránh lấy đà để hoàn thành lần cuối.'],mistakes:['Vung tạ','Tăng tải quá nhanh','Rút ngắn biên độ quá mức'],breathing:'Thở ra khi co cơ, hít vào khi trở về.',safety:'Không cố qua đau khớp.'},
  mobility: {instructions:['Di chuyển chậm trong biên độ không đau.','Giữ nhịp thở đều.','Không ép khớp vào cảm giác đau nhói.'],mistakes:['Nảy mạnh','Giữ hơi','Ép biên độ quá mức'],breathing:'Thở chậm và đều.',safety:'Cảm giác căng nhẹ là chấp nhận được, đau nhói thì dừng.'},
  conditioning: {instructions:['Giữ nhịp ổn định và kỹ thuật sạch.','Điều chỉnh tốc độ để còn kiểm soát hô hấp.','Giảm nhịp nếu kỹ thuật xuống rõ.'],mistakes:['Bắt đầu quá nhanh','Hi sinh kỹ thuật','Cố vượt mức chóng mặt'],breathing:'Thở đều theo nhịp vận động.',safety:'Dừng nếu chóng mặt, đau ngực hoặc khó thở bất thường.'}
}

export function ex(
  id:string,nameEnglish:string,nameVietnamese:string,types:TrainingType[],category:Exercise['category'],pattern:MovementPattern,
  primary:string[],equipment:string[],difficulty:number, opts:Partial<Exercise>={}
): Exercise {
  const t=tips[pattern]
  return {
    id,nameEnglish,nameVietnamese,trainingTypes:types,category,primaryMuscles:primary,secondaryMuscles:opts.secondaryMuscles||[],equipment,
    difficulty,movementPattern:pattern,instructionsVietnamese:opts.instructionsVietnamese||t.instructions,
    commonMistakesVietnamese:opts.commonMistakesVietnamese||t.mistakes,breathingVietnamese:opts.breathingVietnamese||t.breathing,
    safetyNotesVietnamese:opts.safetyNotesVietnamese||t.safety,easierProgression:opts.easierProgression,harderProgression:opts.harderProgression,
    minReps:opts.minReps??8,maxReps:opts.maxReps??12,holdSeconds:opts.holdSeconds,recommendedRest:opts.recommendedRest??90,
    contraindicationTags:opts.contraindicationTags||[],unilateral:opts.unilateral,weighted:opts.weighted
  }
}

export const C: TrainingType[]=['calisthenics','home','gym']; export const H:TrainingType[]=['home','gym']; export const G:TrainingType[]=['gym']
