# Cập nhật quản trị TripGo

- Danh sách chuyến bay hiện 10 mục ban đầu. Nếu có hơn 10, nút Xem thêm 10 chuyến bay xuất hiện. Mỗi lần bấm thêm 10, tự ẩn khi đã hiện hết.
- Tìm kiếm hoặc cập nhật lại danh sách sẽ đặt giới hạn về 10 chuyến.
- Nút Lên đầu cố định góc phải dưới, xuất hiện sau khi cuộn xuống 400px. Bấm để cuộn mượt lên đầu và đưa focus về tiêu đề trang.
- Hiệu ứng xuất hiện của thẻ/bảng, hover nâng thẻ và nút. Tự giảm chuyển động nếu hệ điều hành bật Reduce Motion.
- Hỗ trợ cả trang /admin/ và /src/pages/admin.html. Phiên bản trong dist/admin cũng được cập nhật.

## Chạy

Tại thư mục TripGo, chạy npm install rồi npm run dev. Mở /admin/ tại địa chỉ Vite thông báo.
Bản ZIP đầu vào thiếu thư mục admin/ mà vite.config.js trỏ tới. Thư mục này đã được khôi phục từ chính bản dist/admin trong ZIP đầu vào. admin/admin.js là runtime đã build của bản đó; mã tính năng mới được tách rõ trong admin/admin-enhancements.js và admin/admin-effects.css.
Đăng nhập /admin/: admin@tripgo.com / Admin@123 (giữ nguyên bản runtime).
Trang /src/pages/admin.html giữ nguyên cơ chế đăng nhập của src/js/auth.js.

Các thay đổi không sửa dữ liệu chuyến bay, vé hoặc trang khách hàng.
Kiểm tra tự động bằng DOM: 10/11/25 chuyến, xem thêm, đặt lại giới hạn khi lọc/render, trạng thái danh sách trống, nút lên đầu và focus; kiểm tra kết hợp runtime admin đăng nhập và tìm kiếm. Chưa kiểm tra trực quan trong trình duyệt.
