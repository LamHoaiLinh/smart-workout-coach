# Smart Workout Coach V3

PWA tập luyện **local-first** cho Calisthenics, tạ đơn tại nhà và phòng Gym, có thể ghép thêm đi bộ, chạy bộ hoặc nhảy dây vào cùng giáo án.

## V3
- Người dùng tự chọn có kết hợp **Đi bộ / Chạy bộ / Nhảy dây** hay không.
- Phần vận động được xếp vào các ngày phù hợp trong giáo án sức mạnh, ưu tiên tránh buổi chân khi có lựa chọn tốt hơn.
- Đi bộ/chạy dùng Geolocation của trình duyệt để ghi thời gian, quãng đường và pace.
- Nhảy dây dùng timer và bộ đếm số lần.
- Tiến độ có tổng km, phút vận động, số lần nhảy dây và pace chạy tốt nhất đã lưu.
- Dữ liệu hoạt động cũng nằm trong IndexedDB và đi cùng Backup/Restore JSON.
- Migration schema 3 giữ lại hồ sơ, lịch sử và số đo của V1/V2.

## Điểm chính
- Không tài khoản, không backend, không Supabase/Firebase.
- Mỗi thiết bị/trình duyệt có dữ liệu riêng.
- Giáo án theo mục tiêu, số buổi, thời gian, dụng cụ, hạn chế vận động và lịch sử tập.
- Bodyweight có progression; bài tạ tăng từng nấc khi buổi trước đã đủ tốt.
- Điều chỉnh buổi theo năng lượng, đau mỏi, giấc ngủ, động lực và thời gian thực tế.
- Rest timer, đổi bài tương đương, autosave buổi đang tập.
- Backup/Restore JSON.
- PWA có thể Add to Home Screen và dùng offline sau khi đã tải.
- UI tiếng Việt; tên động tác tiếng Anh; dùng “hiệp” và “lần”.

## GPS trên bản web
GPS chỉ được bật khi người dùng bấm bắt đầu đi bộ/chạy và trình duyệt đã được cấp quyền vị trí. Để đo ổn định hơn trên điện thoại, nên giữ trang hoạt động ở màn hình trước trong lúc chạy/đi bộ.

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
Workflow: `.github/workflows/deploy-pages.yml`.
- `v3-upgrade`: chỉ test + production build.
- `main`: test + build + deploy GitHub Pages.

## Cấu trúc
- `src/core/trainingEngine.ts`: giáo án sức mạnh và điều chỉnh theo lịch sử.
- `src/core/cardioEngine.ts`: ghép vận động vào giáo án, pace và tổng hợp hoạt động.
- `src/components/ActivityTracker.tsx`: GPS đi/chạy và timer nhảy dây.
- `src/storage/`: IndexedDB, migration, backup/restore.
- `public/sw.js`: service worker offline.

## Dữ liệu
Không có đồng bộ cloud. Nếu đổi điện thoại/trình duyệt hoặc xoá dữ liệu website, cần xuất Backup JSON trước.

## An toàn
Ứng dụng không chẩn đoán bệnh. Khi có đau bất thường, nên dừng động tác gây đau; nếu đau mạnh, kéo dài, sưng, yếu hoặc hạn chế vận động thì nên đi kiểm tra chuyên môn.
