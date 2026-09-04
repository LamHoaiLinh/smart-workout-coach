# Validation

## Đã kiểm tra trong môi trường dựng source
- TypeScript `strict` cho `types.ts`, thư viện bài tập và `trainingEngine.ts`: đạt.
- Kiểm tra kiểu toàn bộ app bằng stub module cho React/Vite (để bắt lỗi cú pháp/type nội bộ): đạt.
- Thư viện: 51 bài hỗ trợ Calisthenics, 101 bài hỗ trợ Home Dumbbell, 190 bài hỗ trợ Gym; không trùng `exercise.id`.
- Manual engine checks:
  - Full Body ngắn vẫn ưu tiên kéo + đẩy + chân + hinge.
  - 20 phút rút xuống tối đa 3 bài.
  - Negative Pull-up đạt đầu trên khoảng số lần → Chin-up.
  - Bài có tạ đạt đầu trên khoảng số lần → tăng 1 bước tạ.
  - Fatigue nhiều buổi → giảm khối lượng.

## Giới hạn kiểm thử tại môi trường dựng
Registry npm trong sandbox bị timeout nên không thể chạy `npm install`, `vitest` và Vite production build tại đây. Workflow GitHub Pages đã cấu hình chạy `npm install`, `npm test`, `npm run build` trên GitHub Actions; nếu test/build lỗi thì workflow sẽ dừng trước deploy.
