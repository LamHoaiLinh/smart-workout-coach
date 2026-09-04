# Smart Workout Coach 1.0 validation

Bản 1.0 được kiểm tra theo ba lớp trước khi đưa lên `main`:

1. `npm test`: kiểm tra giáo án sức mạnh + vận động, block 6 tuần, tuần nhẹ, plateau, lịch tuần linh hoạt, ngày bận, tránh dồn tải chân, quick workout và tổng hợp hoạt động.
2. `npm run build`: TypeScript strict + Vite production build.
3. GitHub Pages workflow: mọi branch đều chạy test/build; chỉ `main` mới upload và deploy Pages.

Bản 1.0 dùng IndexedDB riêng `smart-workout-coach-1-0` và schema `1`.
