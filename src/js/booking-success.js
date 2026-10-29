import "./auth.js";

const auth = window.TripGoAuth;
if (!auth.requireLogin()) {
  throw new Error("Đăng nhập để xem vé đã đặt.");
}
auth.updateAuthUI();

const ticket = document.getElementById("ticket");
const actions = document.querySelector(".success-actions");
const missing = document.getElementById("missingBooking");
const paymentPending = document.getElementById("paymentPending");
const emailStatus = document.getElementById("emailStatus");
const emailStatusText = document.getElementById("emailStatusText");
const retryEmail = document.getElementById("retryEmail");
const params = new URLSearchParams(window.location.search);
const bookingCode = params.get("bookingCode");
const user = auth.getCurrentUser();
const paymentLabels = {
  qr: "Quét mã QR",
  "domestic-card": "Thẻ nội địa",
  "international-card": "Thẻ quốc tế",
  ewallet: "Ví điện tử",
};
const paymentStatusLabels = {
  awaiting_confirmation: "Cần xác nhận thanh toán",
  processing: "Đang xử lý",
  paid: "Đã thanh toán",
};
const booking = bookingCode
  ? auth
      .getBookings()
      .find(
        (item) =>
          item.bookingCode === bookingCode &&
          item.userEmail?.toLowerCase() === user?.email?.toLowerCase(),
      )
  : null;

const isDemoPayment = booking?.paymentMode === "demo";

if (!booking) {
  missing.hidden = false;
} else if (
  booking.status !== "Đã đặt vé" ||
  booking.paymentState !== "paid" ||
  (!isDemoPayment && /demo|mô phỏng/i.test(booking.paymentStatus || ""))
) {
  paymentPending.hidden = false;
  const isCancelled = booking.status === "Đã hủy";
  const isUnverified =
    booking.status === "Đã đặt vé" &&
    (booking.paymentState !== "paid" ||
      (!isDemoPayment && /demo|mô phỏng/i.test(booking.paymentStatus || "")));
  document.getElementById("pendingTitle").textContent = isCancelled
    ? "Đơn hàng đã bị hủy"
    : isUnverified
      ? "Chưa xác minh thanh toán"
      : "Đơn hàng chưa hoàn tất";
  document.getElementById("pendingMessage").textContent = isCancelled
    ? "Đơn hàng đã bị hủy và chưa được xác nhận thanh toán."
    : isUnverified
      ? "Chưa nhận được xác nhận đáng tin cậy từ cổng thanh toán. Vui lòng liên hệ TripGo để kiểm tra trước khi sử dụng vé."
      : `Trạng thái thanh toán: ${booking.paymentStatus || "Chờ thanh toán"}. Vé chỉ được xác nhận sau khi thanh toán được xác minh.`;
  if (!isCancelled && !isUnverified) {
    const resumePayment = document.getElementById("resumePayment");
    resumePayment.href = `/src/pages/payment.html?bookingCode=${encodeURIComponent(booking.bookingCode)}`;
    resumePayment.hidden = false;
  }
} else {
  const airports = {
    HAN: "Hà Nội",
    SGN: "TP. Hồ Chí Minh",
    DAD: "Đà Nẵng",
    CXR: "Nha Trang",
    PQC: "Phú Quốc",
    HPH: "Hải Phòng",
    HUI: "Huế",
    VCA: "Cần Thơ",
    UIH: "Quy Nhơn",
    VDO: "Vân Đồn",
  };
  const flight = booking.flight || {};
  const passengerCount = Math.max(1, Number(booking.passengerCount || 1));
  const seats = Array.isArray(booking.seats)
    ? booking.seats.join(", ")
    : booking.seats || booking.seat || "Chưa chọn";
  const unitPrice = Number(booking.price || 0);
  const totalPrice = Number(booking.totalPrice ?? unitPrice * passengerCount);
  const formatPrice = (value) => `${Number(value).toLocaleString("vi-VN")} ₫`;
  const departureDate = booking.date || booking.departureDate || flight.date;
  const bookingDate = booking.createdAt
    ? new Date(booking.createdAt).toLocaleString("vi-VN")
    : "—";

  const values = {
    bookingCode: booking.bookingCode,
    bookingStatus: booking.status || "Đã đặt vé",
    paymentStatus: isDemoPayment
      ? "Đã thanh toán (mô phỏng)"
      : paymentStatusLabels[booking.paymentStatus] ||
        booking.paymentStatus ||
        "Chưa xác nhận thanh toán",
    flightNumber: booking.flightId || flight.flightNumber || flight.id || "—",
    fromCode: flight.from || booking.from || "—",
    fromName: airports[flight.from || booking.from] || "—",
    toCode: flight.to || booking.to || "—",
    toName: airports[flight.to || booking.to] || "—",
    departureTime: flight.departure || "—",
    arrivalTime: flight.arrival || "—",
    departureDate: departureDate
      ? new Date(`${departureDate}T00:00:00`).toLocaleDateString("vi-VN")
      : "—",
    passengerName:
      booking.passenger?.fullName || booking.passenger?.name || "—",
    passengerCount: `${passengerCount} hành khách`,
    ticketClass: booking.ticketType || booking.classType || "Phổ thông",
    seatNumbers: seats,
    ticketCount: `${passengerCount} vé`,
    paymentMethod:
      paymentLabels[booking.paymentMethod] || booking.paymentMethod || "—",
    bookingTime: bookingDate,
    unitPrice: formatPrice(unitPrice),
    priceTicketCount: `${passengerCount} vé`,
    totalPrice: formatPrice(totalPrice),
  };

  for (const [id, value] of Object.entries(values)) {
    document.getElementById(id).textContent = value;
  }
  if (isDemoPayment) {
    document.getElementById("paymentDisclaimer").textContent =
      "Trạng thái này chỉ mô phỏng; TripGo chưa xác minh tiền đã chuyển.";
  }

  ticket.hidden = false;
  actions.hidden = false;
  const downloadTicketPdf = document.getElementById("downloadTicketPdf");
  downloadTicketPdf.addEventListener("click", async () => {
    downloadTicketPdf.disabled = true;
    downloadTicketPdf.textContent = "Đang tạo PDF...";

    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const safeBookingCode = booking.bookingCode.replace(
        /[^a-zA-Z0-9_-]/g,
        "_",
      );
      const canvas = await html2canvas(ticket, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const margin = 10;
      const pageWidth = pdf.internal.pageSize.getWidth() - margin * 2;
      const pageHeight = pdf.internal.pageSize.getHeight() - margin * 2;
      const scale = Math.min(
        pageWidth / canvas.width,
        pageHeight / canvas.height,
      );
      const width = canvas.width * scale;
      const height = canvas.height * scale;
      pdf.addImage(
        canvas.toDataURL("image/jpeg", 0.98),
        "JPEG",
        (pdf.internal.pageSize.getWidth() - width) / 2,
        (pdf.internal.pageSize.getHeight() - height) / 2,
        width,
        height,
      );
      pdf.save(`TripGo_${safeBookingCode}.pdf`);
    } catch (error) {
      console.error("Không thể tạo PDF vé:", error);
      alert("Chưa thể tạo file PDF. Vui lòng thử lại hoặc chọn In vé.");
    } finally {
      downloadTicketPdf.disabled = false;
      downloadTicketPdf.textContent = "Tải vé PDF";
    }
  });
  document
    .getElementById("printTicket")
    .addEventListener("click", () => window.print());

  const emailStorageKey = `tripgo_booking_email_${booking.bookingCode}`;
  let emailSending = false;

  function renderEmailStatus(state, message, canRetry = false) {
    emailStatus.hidden = false;
    emailStatus.dataset.state = state;
    emailStatusText.textContent = message;
    retryEmail.hidden = !canRetry;
  }

  async function sendBookingEmail() {
    if (emailSending) return;
    emailSending = true;
    retryEmail.disabled = true;
    renderEmailStatus("sending", "Đang gửi email xác nhận...");
    localStorage.setItem(emailStorageKey, "sending");

    try {
      const response = await fetch(
        `${(import.meta.env.VITE_API_URL || "").replace(/\/+$/, "")}/api/send-booking-email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingCode: booking.bookingCode,
            email: booking.passenger?.email || booking.userEmail,
            passengerName:
              booking.passenger?.fullName || booking.passenger?.name,
            flightNumber: booking.flightId || flight.flightNumber || flight.id,
            from: flight.from || booking.from,
            to: flight.to || booking.to,
            departureDate,
            departureTime: flight.departure,
            arrivalTime: flight.arrival,
            totalPrice,
          }),
        },
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Chưa gửi được email xác nhận.");
      }
      localStorage.setItem(emailStorageKey, "accepted");
      renderEmailStatus(
        "accepted",
        `${result.message || "Resend đã tiếp nhận yêu cầu gửi email."} Kiểm tra cả thư mục Spam; trạng thái tiếp nhận không đảm bảo email đã được giao.`,
      );
    } catch (error) {
      console.error("Không thể gửi email xác nhận đặt vé:", error);
      localStorage.setItem(emailStorageKey, "failed");
      const message =
        error instanceof TypeError || error instanceof SyntaxError
          ? "Không thể kết nối dịch vụ gửi email. Vui lòng kiểm tra backend rồi thử lại."
          : error.message || "Chưa gửi được email xác nhận.";
      renderEmailStatus(
        "failed",
        `${message} Thông tin đặt vé vẫn được giữ nguyên.`,
        true,
      );
    } finally {
      emailSending = false;
      retryEmail.disabled = false;
    }
  }

  retryEmail.addEventListener("click", () => sendBookingEmail());
  const previousEmailStatus = localStorage.getItem(emailStorageKey);
  if (previousEmailStatus === "accepted") {
    renderEmailStatus(
      "accepted",
      "Resend đã tiếp nhận email trước đó. Việc tiếp nhận không đảm bảo email đã được giao; kiểm tra cả thư mục Spam.",
    );
  } else if (
    previousEmailStatus === "failed" ||
    previousEmailStatus === "sending"
  ) {
    renderEmailStatus(
      "failed",
      previousEmailStatus === "sending"
        ? "Không xác định được kết quả lần gửi trước. Email sẽ không tự gửi lại khi tải lại trang."
        : "Lần gửi email trước chưa thành công. Thông tin đặt vé vẫn được giữ nguyên.",
      true,
    );
  } else {
    sendBookingEmail();
  }
}
