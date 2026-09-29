# TripGo — bản tích hợp Admin và đặt vé

## Chạy dự án

```bash
npm install
npm run dev
```

Mở địa chỉ Vite hiển thị (thường là `http://localhost:5173/`). Trang Admin ở `/admin/`. Để đóng gói: `npm run build`; thư mục `dist/` chứa cả trang chủ và `/admin/index.html`.

Tài khoản admin demo: `admin@tripgo.com` / `Admin@123`. Admin dùng Tailwind CDN, cần mạng để hiển thị đầy đủ lớp Tailwind. Trang chính dùng Vite theo cấu trúc ZIP của nhóm. Các thay đổi nằm trong `src/`, `admin/`, `vite.config.js`; `backup/` được giữ nguyên để tham khảo.

## Luồng đã tích hợp

Tìm chuyến → chọn vé → nhập hành khách và email → xem xác nhận → tạo mã đặt vé → tra cứu hoặc hủy vé. Đặt và hủy vé cập nhật số chỗ còn lại. Admin có dashboard, danh sách và tìm chuyến, thêm/sửa/xóa chuyến (kiểm tra dữ liệu), danh sách vé, hủy vé. Trang tìm chuyến đọc `tripgo_flights`; hai phần cùng đọc `tripgo_bookings`. Nếu dữ liệu chưa có, trang chính dùng chuyến bay trong `src/flights.js`, Admin dùng dữ liệu tương ứng trong `admin/flights.json`.

Dữ liệu lưu trong localStorage theo origin, nên các trang phải chạy cùng tên miền và cổng. Xóa localStorage của trang web để thử với dữ liệu mới. Chỉ mô phỏng đặt vé cho bài tập; tài khoản và quyền trong JavaScript/localStorage không an toàn cho giao dịch thật.

## Kiểm tra

`npm run build` thành công. Đã kiểm tra cú pháp JavaScript, kiểm tra tìm chuyến đọc dữ liệu Admin và xử lý dữ liệu vé rỗng/hỏng bằng Node. Cần kiểm thử thao tác thực trên trình duyệt ở điện thoại, tablet và desktop trước khi nộp vì môi trường tạo ZIP không có Chromium để chạy tự động.
