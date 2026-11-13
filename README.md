# Smart Workout Coach 1.0

PWA tập luyện local-first cho Calisthenics, tạ đơn tại nhà và phòng Gym. Bản 1.0 dùng một cấu trúc dữ liệu sạch và gom sức mạnh + đi bộ/chạy bộ/nhảy dây vào cùng một kế hoạch tuần.

## Điểm chính
- Không tài khoản, không backend; dữ liệu nằm trong IndexedDB trên thiết bị.
- 190 bài tập seed, lọc theo môi trường tập, dụng cụ và hạn chế vận động.
- Chu kỳ 6 tuần: xây nền → tăng dần → tuần nhẹ; có thể vào tuần nhẹ sớm khi nhiều buổi gần đây quá mệt.
- Tăng tiến cho bài trọng lượng cơ thể và bài có tạ.
- Phát hiện bài chững sau nhiều lần lặp mà không có tiến bộ rõ.
- Người dùng có thể đánh dấu bài **Ưu tiên** hoặc **Không hợp**.
- Lịch tuần linh hoạt: đánh dấu ngày bận ở Hôm nay hoặc Giáo án, phần còn lại của tuần tự xếp lại.
- Lịch tránh dồn tải chân khi có thể, đặc biệt chuỗi Lower → chạy nặng → Lower.
- Ghép đi bộ, chạy bộ, nhảy dây vào cùng lịch.
- GPS web cho đi/chạy: thời gian, quãng đường, pace; có nhập quãng đường thủ công khi GPS yếu.
- Nhảy dây: timer + số lần.
- Readiness trước buổi tập, quick workout theo thời gian thực tế, rest timer, đổi bài tương đương.
- Chức năng **Bụng · Eo · Lưng – 60 chặng (2 giai đoạn)**: mỗi buổi kết hợp bụng trước, eo trái/phải, lưng và giãn nhẹ; 10 mẫu luân phiên, 12 động tác/buổi, tăng độ khó theo khả năng và phản hồi, có chặng phục hồi; minh hoạ bài tập, giọng đọc Việt, đếm giờ và nghỉ tự động. Giai đoạn 2 (31–60) được hiển thị mờ/khóa cho đến khi hoàn thành đủ giai đoạn 1; luân phiên 10 mẫu nâng cao hơn, có lựa chọn theo khả năng plank và lưu ý lưng. Có thể tập 3 buổi/tuần, không buộc liên tục 60 ngày.
- Trong lúc tập có thể nhập số lần/thời gian/mức tạ bằng bàn phím số kiểu máy tính; có phản hồi nhấn phím khi thiết bị hỗ trợ rung.
- Báo cáo 7 ngày, PR, bài đang chững, tiến độ Calisthenics và chỉ số cơ thể.
- Backup/Restore JSON 1.0.
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
GitHub Actions kiểm tra mọi branch nhưng chỉ deploy GitHub Pages khi code nằm trên `main`.

Trang Pages: `https://lamhoailinh.github.io/smart-workout-coach/`
