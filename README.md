# Smart Workout Coach

PWA HLV tập luyện **local-first** cho 3 nhóm: Calisthenics, tạ đơn tại nhà và phòng Gym.

## Điểm chính
- Không tài khoản, không backend, không Supabase/Firebase.
- Hồ sơ, giáo án, lịch sử và buổi đang tập lưu bằng IndexedDB trên chính trình duyệt.
- Điện thoại khác mở cùng URL sẽ có dữ liệu riêng.
- Training Engine sinh lịch theo mục tiêu, số buổi, thời gian, dụng cụ, chấn thương đã khai báo và lịch sử tập.
- Progressive overload: bodyweight có progression tree; bài tạ có tăng mức tạ một bước khi đạt đầu trên khoảng số lần.
- Auto-regulation theo năng lượng, đau mỏi, giấc ngủ, động lực và thời gian thực tế.
- Fatigue management giảm hiệp khi nhiều buổi gần đây quá mệt.
- Rest timer, Smart Swap, autosave buổi đang tập.
- Backup/Restore JSON.
- PWA cài Add to Home Screen và chạy offline sau lần tải đầu.
- UI tiếng Việt; tên động tác tiếng Anh; dùng “hiệp” và “lần”.

## Chạy local
```bash
npm install
npm run dev
```

## Kiểm thử
```bash
npm test
npm run build
```

## Deploy GitHub Pages
Repo đã có `.github/workflows/deploy-pages.yml`.
1. Push source lên nhánh `main`.
2. GitHub → Settings → Pages.
3. Source chọn **GitHub Actions**.
4. Vào Actions kiểm tra workflow `Deploy GitHub Pages`.

Vite dùng `base: './'` nên có thể chạy ở project page dạng `https://<user>.github.io/<repo>/`.

## Cấu trúc
- `src/core/trainingEngine.ts`: sinh giáo án, thích nghi, fatigue, quick workout, smart swap, PR.
- `src/data/exercises.ts`: thư viện động tác và metadata.
- `src/storage/`: IndexedDB, migration, backup/restore.
- `src/components/`: onboarding, hôm nay, live workout, giáo án, tiến độ, thư viện, cài đặt.
- `public/sw.js`: service worker offline.

## Quy tắc dữ liệu
Không có đồng bộ cloud. Nếu đổi điện thoại/trình duyệt hoặc xoá dữ liệu website, phải xuất Backup JSON trước.

## An toàn
App không chẩn đoán bệnh. Khi người dùng báo đau bất thường, app nhắc dừng động tác gây đau và cân nhắc đánh giá chuyên môn nếu đau mạnh/kéo dài, sưng, yếu hoặc hạn chế vận động.
