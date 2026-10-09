# TripGo Admin — Bản hợp nhất

Dùng tệp TripGo-Flight-Effects(1).zip làm nền; bổ sung chức năng từ TripGo-Admin-Updated(1).zip. Các tệp khách hàng, dữ liệu JSON và Git của tệp nền được giữ nguyên.

## Chạy

Mở terminal trong TripGo, chạy `npm install` và `npm run dev`. Truy cập địa chỉ Vite thông báo rồi thêm `/admin/`.
Đăng nhập demo: admin@tripgo.com / Admin@123.
Đường dẫn quản trị cũ `/src/pages/admin.html` tự chuyển đến dashboard chung `/admin/`.

## Đã hợp nhất

- Dashboard chọn nhanh và sidebar; Tailwind cục bộ; chế độ sáng/tối nhớ lựa chọn.
- Vé: 10 mục ban đầu, xem thêm từng 10, lọc/tìm kiếm và CSV.
- Chuyến bay: tìm kiếm, quản lý và xem thêm từng 10.
- Khách hàng, báo cáo và quản lý dịch vụ.
- Hỗ trợ: tạo yêu cầu, tìm kiếm/lọc, ghi chú phản hồi, trạng thái xử lý.
- Hồ sơ hành khách bị cấm bay: thêm, sửa, gỡ cấm, ngày hết hạn và tìm kiếm; chống trùng giấy tờ.
- Nút lên đầu cố định và hiệu ứng chuyển động của tệp 2 được giữ lại.

## Phản hồi nhanh

1. Vào Hỗ trợ và tạo yêu cầu nếu danh sách đang trống.
2. Bấm Phản hồi nhanh ở đầu danh sách hoặc trên yêu cầu cụ thể.
3. Chọn yêu cầu, dùng mẫu trả lời hoặc tự nhập nội dung.
4. Chọn trạng thái và bấm Lưu phản hồi.
5. Nội dung và trạng thái lưu vào localStorage, còn sau khi đổi mục hoặc tải lại trang.

Có 3 mẫu: xác nhận tiếp nhận, bổ sung thông tin, đã xử lý. Không chấp nhận nội dung chỉ có khoảng trắng. Hủy/đóng/Escape không ghi thay đổi. Đây là phản hồi được lưu trong demo, không gửi email thực.

## Phạm vi

Dữ liệu lưu tại trình duyệt cùng origin. Không dùng đăng nhập localStorage để bảo vệ dữ liệu thật. Hồ sơ cấm bay phục vụ quản trị, chưa tự chặn đặt vé ở frontend.
admin/admin.js là mã nguồn đọc được từ tệp 1. admin/admin-enhancements.js và admin/admin-effects.css giữ các tính năng của tệp 2. dist/admin được đồng bộ theo dashboard hợp nhất.

## Kiểm tra

Kiểm tra chức năng qua DOM: đăng nhập, dashboard, vé 10/20/25 và lọc, chuyến bay xem thêm và tìm kiếm, theme lưu lựa chọn, dịch vụ thêm/ẩn, chuyến bay thêm, hỗ trợ tạo/cập nhật, hồ sơ cấm bay thêm/sửa/gỡ/chống trùng, đăng xuất.
Kiểm tra phản hồi nhanh: danh sách trống, chọn đúng yêu cầu, mẫu trả lời, nội dung tự nhập, trạng thái, nội dung trắng, hủy, Escape và lưu khi đổi trang. Chưa kiểm tra trực quan trong trình duyệt.
