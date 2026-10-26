import { getBookings } from "./auth.js";

const checkinForm = document.getElementById("checkinForm");
const errorMsg = document.getElementById("errorMsg");
const formContainer = document.getElementById("formContainer");
const boardingPass = document.getElementById("boardingPass");

// Xử lý khi bấm nút "Làm thủ tục Check-in"
checkinForm.addEventListener("submit", (e) => {
  e.preventDefault();
  errorMsg.style.display = "none";

  const codeInput = document
    .getElementById("bookingCode")
    .value.trim()
    .toUpperCase();
  const docInput = document.getElementById("document").value.trim();

  // 1. Lấy toàn bộ danh sách vé đã đặt
  const allBookings = getBookings();

  // 2. Tìm vé khớp với mã đặt chỗ
  const booking = allBookings.find((b) => b.bookingCode === codeInput);

  if (!booking) {
    showError(
      "Không tìm thấy mã đặt chỗ này trên hệ thống. Vui lòng kiểm tra lại.",
    );
    return;
  }

  // 3. Kiểm tra xem vé đã thanh toán chưa (dựa vào paymentState của bạn)
  if (booking.paymentState !== "paid" && booking.status !== "Đã đặt vé") {
    showError(
      "Vé này chưa được thanh toán hoặc chưa được xác nhận. Không thể check-in.",
    );
    return;
  }

  // 4. Kiểm tra thông tin xác minh (Số điện thoại hoặc số CCCD)
  const passenger = booking.passenger;
  const isMatch =
    (passenger.phone && passenger.phone === docInput) ||
    (passenger.document && passenger.document === docInput);

  if (!isMatch) {
    showError(
      "Số điện thoại/CCCD không khớp với thông tin hành khách của vé này.",
    );
    return;
  }

  // 5. Nếu mọi thứ hợp lệ -> Hiển thị Thẻ lên máy bay
  formContainer.style.display = "none"; // Ẩn form
  renderBoardingPass(booking); // Vẽ thẻ
});

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.style.display = "block";
}

function renderBoardingPass(booking) {
  const flight = booking.flight;
  const passenger = booking.passenger;

  // Tạo mã QR (Sử dụng API tạo QR miễn phí)
  const qrData = `MA VE: ${booking.bookingCode} | KHACH: ${passenger.fullName} | GHE: ${booking.seat}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;

  boardingPass.style.display = "block";
  boardingPass.innerHTML = `
    <div class="bp-header">
      <h2>THẺ LÊN MÁY BAY (BOARDING PASS)</h2>
      <span class="badge">ĐÃ CHECK-IN</span>
    </div>
    
    <div class="bp-body">
      <div class="bp-info">
        <p><span>Hành khách:</span> <strong>${passenger.fullName}</strong></p>
        <p><span>Mã đặt chỗ:</span> <strong>${booking.bookingCode}</strong></p>
        <p><span>Chuyến bay:</span> <strong>${flight.airline || "TripGo"} - ${flight.flightNumber || flight.id}</strong></p>
        <p><span>Hành trình:</span> <strong>${flight.from} → ${flight.to}</strong></p>
        <p><span>Ngày bay:</span> <strong>${flight.date}</strong></p>
        <p><span>Giờ khởi hành:</span> <strong>${flight.departure}</strong></p>
        <p><span>Số ghế:</span> <strong class="seat-highlight">${booking.seat}</strong></p>
        <p><span>Cửa ra (Gate):</span> <strong>A12</strong> (Dự kiến)</p>
      </div>
      
      <div class="bp-qr">
        <img src="${qrImageUrl}" alt="Mã QR Check-in" />
        <small>Quét mã tại cửa khởi hành</small>
      </div>
    </div>

    <div class="bp-footer">
      <button class="btn-back" onclick="window.location.href='/'">Về trang chủ</button>
      <button class="btn-print" onclick="window.print()">In vé / Lưu PDF</button>
    </div>
  `;
}
