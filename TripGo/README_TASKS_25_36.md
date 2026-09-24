# TripGo - Website đặt vé máy bay nội địa

Đồ án Front-end dùng **HTML + CSS + Vanilla JavaScript**, dữ liệu mô phỏng bằng **JSON + LocalStorage**, không dùng framework và không cần backend phức tạp.

## Tài khoản demo
- Admin: `admin@tripgo.vn`
- Mật khẩu: `admin123`

## Luồng chính
Trang chủ → Tìm chuyến → Danh sách chuyến → Chi tiết/hạng vé → Nhập hành khách → Chọn ghế → Xác nhận → Thanh toán → Tạo mã đặt vé → Lưu LocalStorage → Tra cứu / Vé của tôi / Hủy vé.

## 50 task đã triển khai
1. Trang chủ + khu vực tìm kiếm chuyến bay.
2. Form điểm đi, điểm đến, ngày đi/về, hành khách, hạng vé.
3. Giao diện danh sách kết quả chuyến bay.
4. Dữ liệu chuyến bay mẫu tại `data/flights.json`.
5. Đọc và hiển thị JSON bằng JavaScript.
6. Lọc theo điểm đi/đến.
7. Lọc theo ngày khởi hành.
8. Xử lý số lượng hành khách.
9. Lọc khoảng giá.
10. Lọc hãng hàng không.
11. Lọc giờ khởi hành.
12. Sắp xếp theo giá/giờ/thời gian bay.
13. Trang chi tiết chuyến bay.
14. Chọn hạng/loại vé.
15. Tính giá theo số hành khách.
16. Tính hạng vé và hành lý.
17. Trang nhập hành khách.
18. Form người đặt và hành khách.
19. Validation họ tên, ngày sinh, giới tính, giấy tờ.
20. Validation email/số điện thoại.
21. Validation số hành khách và dữ liệu đặt vé.
22. Hiển thị lỗi trực tiếp trên form.
23. Lưu dữ liệu đặt vé tạm thời vào LocalStorage.
24. Trang xác nhận trước khi đặt.
25. Tạo mã đặt vé tự động.
26. Lưu vé hoàn chỉnh vào LocalStorage.
27. Tra cứu bằng mã đặt vé.
28. Hiển thị chi tiết vé.
29. Hủy vé.
30. Cập nhật trạng thái sau hủy.
31. Danh sách vé của người dùng.
32. Đăng ký tài khoản bằng LocalStorage.
33. Đăng nhập tài khoản.
34. Kiểm tra đăng nhập và lỗi.
35. Hiển thị/cập nhật tài khoản.
36. Giao diện đăng nhập + Admin.
37. Dashboard Admin.
38. Quản lý danh sách chuyến bay.
39. Admin thêm chuyến bay.
40. Admin sửa chuyến bay.
41. Admin xóa chuyến bay.
42. Admin quản lý vé.
43. Validation khi thêm/sửa chuyến bay.
44. Header/navigation dùng chung theo các trang.
45. Responsive mobile/tablet/desktop.
46. CSS responsive cho kích thước màn hình.
47. Liên kết và điều hướng giữa các trang.
48. Xử lý lỗi JavaScript/dữ liệu rỗng.
49. Luồng đặt vé hoàn chỉnh từ tìm kiếm đến tra cứu/hủy.
50. README, cấu trúc dự án và sẵn sàng đưa lên GitHub/demo.

## Cấu trúc
```text
TripGo/
├── index.html
├── README.md
├── data/flights.json
├── css/
│   ├── main.css
│   ├── pages.css
│   └── responsive.css
├── js/
│   ├── app.js
│   ├── main.js
│   └── search.js
└── pages/
    ├── search.html
    ├── flight-detail.html
    ├── passenger.html
    ├── seat.html
    ├── confirmation.html
    ├── payment.html
    ├── booking.html
    ├── my-bookings.html
    ├── register.html
    ├── login.html
    ├── profile.html
    ├── checkin.html
    └── admin.html
```

## Chạy dự án
Khuyến nghị chạy bằng Live Server hoặc một HTTP server local để `fetch('../data/flights.json')` hoạt động ổn định.

Ví dụ:
```bash
npx serve .
```
hoặc mở thư mục bằng VS Code và dùng Live Server.
