# Rà soát TripGo Admin — 12/10/2026

## Giao diện và phạm vi thay đổi

Giao diện được sửa lại theo bản gốc TripGo(2).zip: màu xanh–trắng, header có thương hiệu TripGo, sidebar trắng và cỡ chữ đọc rõ. Bỏ bộ màu tím than/lavender và các thiết lập chữ nhỏ của phiên bản thiết kế trước. Chỉ giữ cách chia nhóm menu, bảng/thẻ bo góc và tiện ích dashboard. Dùng Tailwind hiện có cùng CSS gốc, icon SVG cục bộ và font hệ thống hỗ trợ tiếng Việt.

Cỡ chữ chính: nội dung 16px, menu 15px, bảng và ô nhập 15px, nút 14px, tiêu đề trang 28–30px. Đã sửa bảng Top tuyến phổ biến không còn áp chiều rộng tối thiểu của bảng quản lý; chú giải biểu đồ tròn tự xuống dòng khi thẻ hẹp. Điện thoại dùng menu drawer; bảng cuộn ngang bên trong thay vì làm tràn toàn trang.

12 mục quản trị được giữ: Tổng quan, Báo cáo, Chuyến bay, Vé đã đặt, Ghế 2D, Lịch bay, Khách hàng, Dịch vụ, Hỗ trợ, Cấm bay, Sao lưu & khôi phục, Nhật ký. Không tạo bản tệp có hậu tố số.

Bổ sung khối chuyến bay sắp khởi hành / xem tất cả ngay trong dashboard, phân bố hãng bay theo dữ liệu, tìm nhanh mục quản lý và sidebar dạng drawer trên điện thoại. Chuyển mục đưa trang về đầu để tránh mất tiêu đề. Icon, bảng, biểu mẫu và các hộp thoại dùng cùng bộ màu sáng/tối.

Sửa một lỗi có sẵn trong `src/css/responsive.css`: `x@media` làm Vite build thất bại. Không thay giao diện trang khách ngoài việc sửa ký tự CSS sai này.

## Các chức năng đã có và được giữ

| Mục | Chức năng |
| --- | --- |
| Tổng quan | Thống kê chuyến/vé/doanh thu/tỷ lệ hủy/khách, tuyến phổ biến, hoạt động mới, truy cập nhanh; bổ sung lịch bay xem tại chỗ |
| Chuyến bay | Thêm/sửa, kiểm tra biểu mẫu, tìm mã/hãng/tuyến, xem thêm 10, lưu trữ/khôi phục; chặn lưu trữ khi còn vé hoặc đang bay |
| Vé | Tìm/lọc, xem thêm 10, chi tiết, ghi chú, xác nhận thanh toán demo, hủy, CSV |
| Ghế 2D | Chọn chuyến/ngày, khóa/mở ghế, tạo/xóa ghế demo, xem mã vé; ghế có vé không được mở trực tiếp |
| Lịch bay | Lọc ngày/trạng thái, xem tất cả ngày, xem thêm 10, mở sửa chuyến |
| Khách hàng | Tìm/lọc theo vai trò, chi tiết và lịch sử đặt vé, tổng chi tiêu, CSV |
| Báo cáo | Doanh thu/số vé/trạng thái theo 6 tháng, biểu đồ và CSV |
| Dịch vụ | Thêm/sửa, ẩn/hiện; đồng bộ danh mục sang trang khách trên cùng trình duyệt |
| Hỗ trợ | Tạo yêu cầu, tìm/lọc, phản hồi, mẫu phản hồi nhanh, cập nhật trạng thái; lưu nội bộ |
| Cấm bay | Thêm/sửa, tìm tên/giấy tờ, thời hạn, gỡ cấm; hồ sơ nội bộ |
| Sao lưu | Xuất/nhập JSON 6 nhóm dữ liệu, kiểm tra tệp, xác nhận thay thế, bản trước khôi phục |
| Nhật ký | Ghi cập nhật admin, tìm, xem thêm, xuất JSON; giữ tối đa 500 mục |
| Tiện ích | Đăng xuất, kiểm tra phiên admin, sáng/tối có lưu lựa chọn, lên đầu trang, giao diện điện thoại |

So với admin của bản V1, các chức năng chính thêm/sửa chuyến, xử lý vé, tìm kiếm, xem lịch tại dashboard và menu điện thoại đều đã có. Bản hiện tại còn có thêm ghế, hỗ trợ, dịch vụ, cấm bay, báo cáo, sao lưu và nhật ký. Thao tác xóa chuyến dùng lưu trữ/khôi phục để bảo toàn dữ liệu thay vì xóa vĩnh viễn.

## Các điểm còn thiếu hoặc chưa liên thông

Các điểm dưới đây có sẵn trong bản được gửi, chưa được tự động mở rộng trong lần thiết kế giao diện này.

| Ưu tiên | Điểm còn thiếu | Hướng bổ sung |
| --- | --- | --- |
| Cao | Hạn mức `flight.seats` không tự giảm khi luồng thanh toán mới lưu vé. Admin lịch bay vẫn đọc số này, trong khi sơ đồ ghế đọc vị trí ghế đã đặt. Hai cách đếm có thể khác nhau. | Thống nhất tồn chỗ theo chuyến/ngày, ghi nhận đặt/hủy và tránh cộng/trừ hai lần. |
| Cao | Cấm bay chỉ quản lý hồ sơ, chưa kiểm tra giấy tờ ở trang hành khách/đặt vé. | Kiểm tra hiệu lực hồ sơ khi tiếp tục đặt vé và kiểm tra lại lúc xác nhận. |
| Cao | Yêu cầu hỗ trợ chỉ tạo trong admin; trang khách chưa có biểu mẫu dùng chung. Liên kết dịch vụ `#support` hiện đưa tới trang check-in. | Tạo trang/biểu mẫu hỗ trợ và màn hình khách xem phản hồi; sửa đích liên kết. |
| Trung bình | Thay ngày/tuyến của một chuyến có vé chưa được khóa chặt; vé và sơ đồ cũ lưu ngày riêng. | Chặn thay đổi thông tin cốt lõi khi có vé, hoặc có quy trình chuyển lịch và ghế. |
| Trung bình | Khách hàng đang là tra cứu; chưa có khóa/mở tài khoản, chỉnh hồ sơ hoặc đặt lại mật khẩu. | Bổ sung nếu nhóm xác định quản lý tài khoản nằm trong MVP. Giữ tài khoản admin duy nhất. |
| Trung bình | Đăng ký luôn tạo vai trò khách, nhưng chưa chặn tên hiển thị “Admin”. | Chặn tên dành riêng nếu vẫn giữ yêu cầu này của nhóm. |
| Trung bình | Sơ đồ cố định 120 ghế, chưa đổi theo máy bay. | Ánh xạ loại máy bay sang số hàng/cột và sức chứa khi cần demo nhiều cấu hình. |
| Khi triển khai thật | Dữ liệu/phiên quản trị lưu trên trình duyệt; kiểm tra quyền ở frontend; chưa có đồng bộ đa máy, giữ ghế đồng thời, email hoặc thanh toán thật. | Backend/API, xác thực và phân quyền phía máy chủ. Với bài tập hiện tại, chuyển dữ liệu bằng JSON sao lưu. |

Báo cáo là rà soát phạm vi chức năng, không phải đánh giá bảo mật toàn diện. Không có giao dịch hoặc phát hành vé thật.

## Kiểm tra

- Build Vite thành công; `dist` được tạo lại từ mã nguồn.
- Kiểm tra trên Chromium các chiều rộng 320, 390, 768, 1024 và 1440px, cả sáng/tối; kiểm tra trực quan dashboard, bảng và menu.
- Kiểm tra thao tác 12 mục: lịch tại dashboard, tìm nhanh, phân trang/tìm chuyến, thêm/sửa/lưu trữ/khôi phục chuyến, ghi chú/xác nhận/hủy vé/CSV, chi tiết khách, thêm dịch vụ, phản hồi nhanh, tạo/gỡ hồ sơ cấm bay, khóa/mở và tạo/xóa ghế demo, lọc lịch, JSON sao lưu/khôi phục, nhật ký và báo cáo.
- Kiểm tra lựa chọn sáng/tối sau tải lại, menu điện thoại đóng khi chuyển mục, không tràn ngang toàn trang và chuyển tới đăng nhập khi bỏ phiên admin.
- Kiểm tra lại 4 bộ kiểm tra ghế cũ, bao gồm nhóm 9 người chọn 1A–1F + 3A–3C.
- Dữ liệu thử nghiệm của kiểm tra trình duyệt không đưa vào dự án.

## Chạy

```sh
npm install
npm run dev
```

Đăng nhập `admin@tripgo.vn` / `admin123`, hoặc mở `/admin/` sau đăng nhập.

```sh
npm run build
npm run preview
```

Giải nén vào thư mục mới để tránh giữ các tệp dư của phiên bản cũ.
