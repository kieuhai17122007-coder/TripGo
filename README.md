# TripGo — Demo quản lý ghế 2D

## Chạy dự án

Yêu cầu Node.js 22.12+ (hoặc phiên bản đáp ứng Vite 8).

```sh
npm install
npm run dev
```

Mở địa chỉ Vite hiển thị. Bản build đã nằm trong `dist/`:

```sh
npm run build
npm run preview
```

## Thử tính năng ghế

1. Đăng ký/đăng nhập tài khoản thường. Tìm chuyến bay và chọn 2–6 hành khách.
2. Nhập thông tin hành khách, tiếp tục đến **Chọn ghế**.
3. Chọn **1A → 1C**: hệ thống chặn vì bỏ trống 1B. Chọn **1A → 1B** thì hợp lệ.
4. Dùng **Tự xếp ghế liền nhau** để xếp nhóm. Ghế trong từng cụm ABC hoặc DEF phải liền nhau. Nhóm đông có thể chọn các cụm liền nhau ở những hàng khác nhau, không bắt buộc sát hàng. Tự xếp ghế vẫn ưu tiên các hàng gần nhau.
5. Xác nhận và thanh toán demo. Đặt lần tiếp theo trên cùng chuyến/ngày sẽ thấy ghế vừa đặt màu xám.
6. Hủy vé trong lịch sử hoặc admin: ghế được giải phóng. Tải lại trang vẫn giữ vé/ghế đã đặt.

## Quản trị

Tài khoản demo: `admin@tripgo.vn` / `admin123`.

Danh mục mẫu trong `admin/flights.json` có lịch bay 14 ngày cho toàn bộ cặp điểm đi/đến trong biểu mẫu tìm kiếm, với nhiều hãng, giờ bay, giá và số ghế. Admin và trang tìm chuyến dùng chung danh mục này; chuyến đã lưu trong trình duyệt được giữ nguyên khi bổ sung các mã mẫu mới.

Trong dashboard chọn **Quản lý ghế 2D**:

- Chọn chuyến/ngày bay; ngày cố định nếu chuyến đã có lịch cụ thể.
- Chọn chế độ **Khóa / mở khóa ghế**, rồi bấm ghế trống.
- Chọn chế độ **Đặt / bỏ ghế demo** để tạo từng ghế đã đặt giả lập.
- **Tạo mẫu ghế đã đặt** thêm một số ghế giả lập; **Xóa ghế demo** xóa riêng ghế giả lập, giữ vé đã đặt và ghế khóa.
- Bấm ghế có vé để xem mã đặt chỗ. Muốn giải phóng phải hủy vé ở **Vé đã đặt**.
- **Sao lưu & khôi phục** xuất/nhập cả sơ đồ ghế. Bản sao lưu cũ không có sơ đồ ghế vẫn được hỗ trợ.

Mục **Thanh toán** theo dõi từng vé với các trạng thái **Cần xác nhận thanh toán**, **Đang xử lý** và **Đã thanh toán**. Vé thanh toán demo thành công được ghi nhận là đã thanh toán; admin có thể cập nhật trạng thái cho vé chưa bị hủy.

## Quy tắc và phạm vi demo

Sơ đồ cố định 20 hàng × 6 ghế = 120 vị trí, lối đi ở giữa C và D. Đây là mô hình minh họa; số chỗ bán trong danh mục chuyến bay là hạn mức riêng. Ghế chưa chọn không được giữ chỗ; chỉ ghi nhận khi thanh toán demo thành công. Hệ thống kiểm tra lại ghế lúc xác nhận chọn ghế và thanh toán, chặn ghế trùng/khóa và chặn tạo một ghế trống ở giữa hai ghế đã chiếm. Lỗ trống vốn có từ trước không chặn những lựa chọn ở hàng khác.

Dữ liệu lưu trong localStorage theo mã chuyến + ngày bay, dùng chung giữa các trang/tài khoản trên cùng trình duyệt và địa chỉ web. Không đồng bộ qua Git hoặc máy khác; chuyển dữ liệu bằng JSON sao lưu. Đây là frontend demo, chưa có cơ chế giữ ghế/giao dịch đồng thời của hệ thống thật. Vé cũ không có ngày được xem là chiếm ghế trên mọi ngày của cùng mã chuyến để tránh đặt trùng.

## Kiểm tra quy tắc

```sh
node tests/seat-rules.mjs
node tests/group-adjacency.mjs
node tests/seat-interaction.mjs
node tests/large-group-interaction.mjs
```

Các tệp giao diện khác được giữ lại. Build được cập nhật để bao gồm cả các trang tìm chuyến, hành khách, ghế, xác nhận và thanh toán.

## Quy tắc nhóm đã điều chỉnh

- Hai hoặc ba khách phải chọn một cụm ghế liền nhau nếu khoang còn cụm đủ chỗ.
- Nhóm đông được chọn nhiều cụm ở các hàng khác nhau; không bắt buộc các hàng sát nhau.
- Ví dụ 9 khách: 1A–1F + 3A–3C hoặc 1A–1C + 2A–2C + 5D–5F đều hợp lệ khi ghế trống.
- Ví dụ 15 khách: 1A–1F + 2A–2F + 5A–5C hợp lệ.
- Giữ số cụm ít nhất có thể để tránh chọn rải thành ghế đơn khi vẫn đủ cụm liền nhau. Không bỏ trống ghế giữa.
- Nếu khoang chỉ còn ghế đơn, cho phép tách nhóm theo chỗ còn trống.
- Tự xếp ghế vẫn ưu tiên các hàng gần nhau; đây là gợi ý, không phải giới hạn cho chọn thủ công.
- Cùng quy tắc được kiểm tra khi bấm ghế, xác nhận và thanh toán demo.
