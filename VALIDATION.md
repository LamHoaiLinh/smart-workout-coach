# V4 validation

V4 được kiểm tra theo ba lớp trước khi đưa lên `main`:

1. `npm test`: kiểm tra lịch sức mạnh + cardio, block 6 tuần, tuần nhẹ sớm do mệt, plateau, dời buổi bị lỡ, quick workout và tổng hợp hoạt động.
2. `npm run build`: TypeScript strict + Vite production build.
3. GitHub Pages workflow: branch `v4-core-rewrite` chỉ chạy test/build; chỉ `main` mới upload và deploy Pages.

Dữ liệu V4 dùng database IndexedDB riêng `smart-workout-coach-v4`, không cố gắng migrate schema cũ.
