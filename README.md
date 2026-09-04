# Smart Workout Coach V4

PWA tập luyện local-first cho Calisthenics, tạ đơn tại nhà và phòng Gym. V4 là bản core rewrite sạch: không mang migration V1–V3, dùng schema dữ liệu mới và gom sức mạnh + đi bộ/chạy/nhảy dây vào cùng một kế hoạch tuần.

## Điểm chính
- Không tài khoản, không backend, dữ liệu nằm trong IndexedDB trên thiết bị.
- 190 bài tập seed, lọc theo môi trường tập, dụng cụ và hạn chế vận động.
- Chu kỳ 6 tuần: xây nền → tăng dần → tuần nhẹ; có thể vào tuần nhẹ sớm khi nhiều buổi gần đây quá mệt.
- Progressive overload cho bài trọng lượng cơ thể và bài có tạ.
- Phát hiện bài chững sau nhiều lần lặp mà không có tiến bộ rõ.
- Người dùng có thể đánh dấu bài **Ưu tiên** hoặc **Không hợp**; lịch sau dùng lựa chọn này khi xếp bài.
- Lịch linh hoạt: buổi gần nhất bị lỡ có thể được gợi ý dời sang ngày kế tiếp.
- Ghép đi bộ, chạy bộ, nhảy dây vào cùng lịch; ưu tiên tránh chạy/nhảy dây vào ngày chân nếu đã bật tùy chọn.
- GPS web cho đi/chạy: thời gian, quãng đường, pace; có nhập quãng đường thủ công khi GPS yếu.
- Nhảy dây: timer + số lần.
- Readiness trước buổi tập, quick workout theo thời gian thực tế, rest timer, Smart Swap.
- Báo cáo 7 ngày, PR, bài đang chững, tiến độ Calisthenics, chỉ số cơ thể và thời gian đồng hành.
- Backup/Restore JSON V4.
- PWA offline sau lần tải đầu.

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

## Deploy
Workflow `.github/workflows/deploy-pages.yml` kiểm tra branch `v4-core-rewrite` nhưng chỉ deploy khi code được đưa vào `main`.

Trang Pages: `https://lamhoailinh.github.io/smart-workout-coach/`
