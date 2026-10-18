import { normalizeFlight, validateSelection, flightKey } from "./seat-store.js";
import {
  paymentConfig,
  paymentAvailable,
  manualQrAvailable,
} from "./payment-config.js";
import "./auth.js";

const auth = window.TripGoAuth;
auth.updateAuthUI();

const result = document.getElementById("result");
const payButton = document.getElementById("payBtn");
const paymentChoice = document.getElementById("paymentChoice");
const summary = document.getElementById("summary");
const paymentPanel = document.getElementById("paymentPanel");
const params = new URLSearchParams(window.location.search);
const requestedBookingCode = params.get("bookingCode");
const currentUser = auth.getCurrentUser();
const selectedFlight = normalizeFlight(
  JSON.parse(localStorage.getItem("tripgo_selected_flight") || "{}"),
);
const selectedSeats = JSON.parse(
  localStorage.getItem("tripgo_selected_seats") || "[]",
);
const passenger = JSON.parse(
  localStorage.getItem("tripgo_passenger") || "null",
);
const passengerCount = Math.max(1, Number(selectedFlight.passengers || 1));
const unitPrice = Number(selectedFlight.price || 0);
const totalPrice = unitPrice * passengerCount;
let activeBooking = requestedBookingCode
  ? auth
      .getBookings()
      .find(
        (booking) =>
          booking.bookingCode === requestedBookingCode &&
          booking.userEmail?.toLowerCase() ===
            currentUser?.email?.toLowerCase(),
      )
  : null;
let paymentState = activeBooking?.paymentState || "pending";
let providerPaymentId = activeBooking?.providerPaymentId || "";
let statusTimer;
const hasVerifiedPayment = (booking) =>
  booking?.paymentState === "paid" &&
  !/demo|mô phỏng/i.test(booking.paymentStatus || "");
const paymentMethods = {
  "domestic-card": {
    label: "Thẻ nội địa",
  },
  "international-card": {
    label: "Thẻ quốc tế",
  },
  ewallet: {
    label: "Ví điện tử",
  },
};

function formatPrice(value) {
  return `${Number(value).toLocaleString("vi-VN")} ₫`;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("vi-VN");
}

function showError(message) {
  result.textContent = message;
  result.className = "error";
}

function showPaymentMessage(message, state = "info") {
  const box = document.getElementById("paymentMessage");
  box.textContent = message;
  box.dataset.state = state;
}

function setText(id, value) {
  document.getElementById(id).textContent = value || "—";
}

function renderSummary(booking = activeBooking) {
  const flight = booking?.flight || selectedFlight;
  const count = Number(booking?.passengerCount || passengerCount);
  const price = Number(booking?.totalPrice ?? totalPrice);
  const seatList = booking?.seats || booking?.seat || selectedSeats;
  const seats = Array.isArray(seatList) ? seatList.join(", ") : seatList || "—";
  const passengerName = booking?.passenger?.fullName || passenger?.name || "—";
  const route = document.createElement("div");
  route.className = "payment-route";
  route.innerHTML =
    '<div><small></small><strong></strong></div><span aria-hidden="true">→</span><div><small></small><strong></strong></div>';
  route.querySelectorAll("small")[0].textContent = flight.from || "—";
  route.querySelectorAll("strong")[0].textContent = flight.departure || "—";
  route.querySelectorAll("small")[1].textContent = flight.to || "—";
  route.querySelectorAll("strong")[1].textContent = flight.arrival || "—";

  const lines = document.createElement("div");
  lines.className = "payment-lines";
  for (const [label, value] of [
    ["Mã đơn hàng", booking?.bookingCode || "Tạo sau khi tiếp tục"],
    [
      "Hãng / chuyến bay",
      [flight.airline, flight.flightNumber || flight.id]
        .filter(Boolean)
        .join(" · ") || "—",
    ],
    [
      "Ngày bay",
      formatDate(booking?.date || booking?.departureDate || flight.date),
    ],
    ["Hành khách", `${passengerName} · ${count} người`],
    ["Ghế", seats],
    ["Loại vé / hạng", booking?.ticketType || flight.classType || "Phổ thông"],
    ["Tổng tiền", formatPrice(price)],
  ]) {
    const line = document.createElement("p");
    const name = document.createElement("span");
    const content = document.createElement(
      label === "Tổng tiền" ? "strong" : "b",
    );
    if (label === "Tổng tiền") line.className = "total-line";
    name.textContent = label;
    content.textContent = value;
    line.append(name, content);
    lines.append(line);
  }
  summary.replaceChildren(route, lines);
}

function saveBooking(updatedBooking) {
  const bookings = auth.getBookings();
  const index = bookings.findIndex(
    (booking) => booking.bookingCode === updatedBooking.bookingCode,
  );
  if (index < 0) throw new Error("Không tìm thấy đơn hàng cần cập nhật.");
  bookings[index] = updatedBooking;
  auth.saveBookings(bookings);
  activeBooking = updatedBooking;
}

function updateBooking(changes) {
  if (!activeBooking) throw new Error("Không tìm thấy đơn hàng.");
  saveBooking({ ...activeBooking, ...changes });
}

function safeQrUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value, window.location.origin);
    return url.origin === window.location.origin || url.protocol === "https:"
      ? url.href
      : "";
  } catch {
    return "";
  }
}

function displayQr(qrImageUrl) {
  const image = document.getElementById("qrImage");
  const placeholder = document.getElementById("qrPlaceholder");
  const url = safeQrUrl(qrImageUrl);
  if (!url) {
    image.hidden = true;
    image.removeAttribute("src");
    placeholder.hidden = false;
    return;
  }
  image.onload = () => {
    image.hidden = false;
    placeholder.hidden = true;
  };
  image.onerror = () => {
    image.hidden = true;
    image.removeAttribute("src");
    placeholder.hidden = false;
    showPaymentMessage(
      "Không thể tải mã QR từ cổng thanh toán. Vui lòng tạo yêu cầu mới hoặc liên hệ hỗ trợ.",
      "error",
    );
  };
  image.src = url;
}

function renderPaymentState() {
  const badge = document.getElementById("paymentBadge");
  const retryButton = document.getElementById("retryPayment");
  const ticketLink = document.getElementById("viewTicket");
  const cancelButton = document.getElementById("cancelPayment");
  const states = {
    pending: [
      "Chờ thanh toán",
      activeBooking?.providerPaymentId
        ? "Hoàn tất thanh toán theo hướng dẫn từ cổng thanh toán. TripGo sẽ cập nhật sau khi giao dịch được xác minh."
        : "Dùng ứng dụng ngân hàng quét mã VietQR, ghi đúng số tiền và nội dung chuyển khoản. Website chưa tự nhận giao dịch; đơn sẽ giữ trạng thái chờ đến khi TripGo đối soát.",
      "info",
    ],
    processing: [
      "Đang xác nhận",
      "TripGo đang kiểm tra giao dịch với cổng thanh toán. Vui lòng không thanh toán lặp lại.",
      "info",
    ],
    cancelling: [
      "Đang hủy yêu cầu",
      "TripGo đang yêu cầu cổng thanh toán hủy giao dịch.",
      "info",
    ],
    paid: ["Thanh toán thành công", "Giao dịch đã được xác nhận.", "success"],
    failed: [
      "Thanh toán thất bại",
      activeBooking?.paymentFailureReason ||
        "Giao dịch chưa được xác nhận. Bạn có thể tạo yêu cầu thanh toán mới.",
      "error",
    ],
    expired: [
      "Đã hết hạn",
      "Yêu cầu thanh toán đã hết hạn. Tạo yêu cầu mới để tiếp tục.",
      "error",
    ],
    cancelled: [
      "Đã hủy",
      "Đơn hàng đã được hủy và chưa được xác nhận thanh toán.",
      "error",
    ],
  };
  const [label, message, messageState] = states[paymentState] || states.pending;
  badge.textContent = label;
  badge.dataset.state = paymentState;
  showPaymentMessage(message, messageState);

  const canRetry = paymentState === "failed" || paymentState === "expired";
  if (paymentState !== "pending" && paymentState !== "processing") {
    displayQr("");
  }
  retryButton.hidden = !canRetry;
  retryButton.disabled = !manualQrAvailable;
  ticketLink.hidden = paymentState !== "paid";
  ticketLink.href = `/src/pages/booking-success.html?bookingCode=${encodeURIComponent(activeBooking.bookingCode)}`;
  cancelButton.hidden = paymentState === "paid" || paymentState === "cancelled";
  cancelButton.disabled =
    paymentState === "processing" || paymentState === "cancelling";
  document.getElementById("copyAccount").disabled =
    !document.getElementById("accountNumber").textContent.trim() ||
    document.getElementById("accountNumber").textContent === "Chưa cấu hình";
}

function displayPaymentRequest(payment) {
  setText("orderCode", activeBooking.bookingCode);
  setText("qrAmount", formatPrice(activeBooking.totalPrice));
  setText(
    "bankName",
    payment.bankName || paymentConfig.bankName || "Chưa cấu hình",
  );
  setText(
    "accountName",
    payment.accountName || paymentConfig.accountName || "Chưa cấu hình",
  );
  setText(
    "accountNumber",
    payment.accountNumber || paymentConfig.accountNumber || "Chưa cấu hình",
  );
  setText(
    "transferContent",
    payment.transferContent || `TRIPGO ${activeBooking.bookingCode}`,
  );
  const method = paymentMethods[activeBooking.paymentMethod] || {
    label: activeBooking.paymentMethod === "qr" ? "Chuyển khoản QR" : "",
  };
  document.getElementById("qrTitle").textContent = "Quét mã QR để thanh toán";
  document.getElementById("paymentMethodTitle").textContent =
    payment.qrImageUrl || activeBooking.qrImageUrl || manualQrAvailable
      ? `${method.label ? `${method.label} · ` : ""}quét mã bằng ứng dụng ngân hàng`
      : "Mã QR thanh toán";
  document.getElementById("paymentInstructions").textContent =
    "Quét mã bằng ứng dụng ngân hàng, kiểm tra đúng người nhận, số tiền và nội dung chuyển khoản hiển thị bên cạnh.";
  document.getElementById("qrPaymentContent").hidden = false;
  displayQr(
    payment.qrImageUrl || activeBooking.qrImageUrl || paymentConfig.qrImageUrl,
  );
  paymentChoice.hidden = true;
  paymentPanel.hidden = false;
  renderPaymentState();
  renderSummary(activeBooking);
}

function showPaymentPanel(booking) {
  activeBooking = booking;
  paymentState = booking.paymentState || "pending";
  providerPaymentId = booking.providerPaymentId || "";
  displayPaymentRequest({
    qrImageUrl: booking.qrImageUrl,
    bankName: booking.bankName,
    accountName: booking.accountName,
    accountNumber: booking.accountNumber,
    transferContent: booking.transferContent,
  });
  if (
    paymentAvailable &&
    providerPaymentId &&
    ["pending", "processing"].includes(paymentState)
  ) {
    startPaymentPolling();
  }
}

function createBookingCode(bookings) {
  const knownCodes = new Set(bookings.map((booking) => booking.bookingCode));
  let code;
  do {
    code = `TG${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
  } while (knownCodes.has(code));
  return code;
}

function validateDraft() {
  if (!selectedFlight.id || !passenger || !auth.isLoggedIn()) {
    return "Thiếu thông tin đặt vé hoặc phiên đăng nhập đã hết hạn.";
  }
  if (!Number.isFinite(totalPrice) || totalPrice <= 0) {
    return "Tổng tiền chuyến bay không hợp lệ. Vui lòng chọn lại chuyến bay.";
  }
  if (
    localStorage.getItem("tripgo_selected_seat_flight") !==
    flightKey(selectedFlight)
  ) {
    return "Vui lòng quay lại chọn ghế cho chuyến bay này.";
  }
  return validateSelection(selectedFlight, selectedSeats);
}

function createBooking(method) {
  const issue = validateDraft();
  if (issue) throw new Error(issue);
  const bookings = auth.getBookings();
  const bookingCode = createBookingCode(bookings);
  const booking = {
    bookingCode,
    userEmail: auth.getCurrentUser()?.email || passenger.email,
    passenger: {
      fullName: passenger.name,
      email: passenger.email,
      phone: passenger.phone,
      document: passenger.document,
    },
    flightId: selectedFlight.id,
    date: selectedFlight.date,
    departureDate: selectedFlight.date,
    flight: {
      airline: selectedFlight.airline || "",
      date: selectedFlight.date,
      flightNumber: selectedFlight.id,
      id: selectedFlight.id,
      from: selectedFlight.from,
      to: selectedFlight.to,
      departure: selectedFlight.departure,
      arrival: selectedFlight.arrival,
    },
    seat: selectedSeats.join(", "),
    seats: selectedSeats,
    passengerCount,
    ticketType: selectedFlight.classType || "Phổ thông",
    baggage: "Không có",
    price: unitPrice,
    fee: 0,
    totalPrice,
    status: "Chờ thanh toán",
    paymentStatus: "Chờ thanh toán",
    paymentState: "pending",
    paymentMethod: method,
    paymentAttemptId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  auth.saveBookings([...bookings, booking]);
  activeBooking = booking;
  return booking;
}

function statusUrl() {
  return paymentConfig.statusEndpoint.replace(
    "{paymentId}",
    encodeURIComponent(providerPaymentId),
  );
}

async function checkProviderPayment() {
  if (
    !providerPaymentId ||
    !paymentConfig.statusEndpoint ||
    !["pending", "processing"].includes(paymentState)
  )
    return;
  try {
    const response = await fetch(statusUrl(), {
      headers: { Accept: "application/json" },
    });
    if (!response.ok)
      throw new Error(
        `Không kiểm tra được giao dịch (HTTP ${response.status}).`,
      );
    const payment = await response.json();
    if (paymentState === "cancelling" || paymentState === "cancelled") return;
    if (
      payment.amount !== undefined &&
      Number(payment.amount) !== Number(activeBooking.totalPrice)
    ) {
      throw new Error("Số tiền giao dịch không khớp với đơn hàng.");
    }
    if (
      payment.status === "paid" &&
      Number(payment.amount) !== Number(activeBooking.totalPrice)
    ) {
      throw new Error(
        "Cổng thanh toán chưa xác nhận chính xác số tiền đã thanh toán.",
      );
    }
    if (
      !["pending", "processing", "paid", "failed", "expired"].includes(
        payment.status,
      )
    ) {
      throw new Error("Trạng thái giao dịch từ cổng thanh toán không hợp lệ.");
    }
    paymentState = payment.status;
    if (paymentState === "paid") {
      updateBooking({
        status: "Đã đặt vé",
        paymentStatus: "Đã thanh toán",
        paymentState,
        paidAt: new Date().toISOString(),
      });
      clearInterval(statusTimer);
      localStorage.removeItem("tripgo_selected_seats");
      localStorage.removeItem("tripgo_selected_seat");
      localStorage.removeItem("tripgo_selected_seat_flight");
    } else {
      updateBooking({
        paymentState,
        paymentStatus:
          paymentState === "failed"
            ? "Thanh toán thất bại"
            : paymentState === "expired"
              ? "Yêu cầu thanh toán hết hạn"
              : "Đang xác nhận",
        paymentFailureReason: payment.reason || "",
      });
      if (["failed", "expired"].includes(paymentState))
        clearInterval(statusTimer);
    }
    renderPaymentState();
  } catch (error) {
    console.error("Không thể xác minh trạng thái thanh toán:", error);
    showPaymentMessage(
      "Chưa kiểm tra được trạng thái giao dịch. TripGo sẽ thử lại; vui lòng không thanh toán lần nữa.",
      "error",
    );
  }
}

function startPaymentPolling() {
  clearInterval(statusTimer);
  if (!paymentAvailable || !providerPaymentId) return;
  statusTimer = setInterval(checkProviderPayment, 5000);
  checkProviderPayment();
}

async function retryPayment() {
  if (!manualQrAvailable) return;
  document.getElementById("retryPayment").disabled = true;
  try {
    paymentState = "pending";
    updateBooking({
      paymentState,
      paymentStatus: "Chờ thanh toán",
      paymentFailureReason: "",
      providerPaymentId: "",
      paymentAttemptId: crypto.randomUUID(),
      qrImageUrl: "",
      checkoutUrl: "",
      bankName: "",
      accountName: "",
      accountNumber: "",
      transferContent: `TRIPGO ${activeBooking.bookingCode}`,
    });
    providerPaymentId = "";
    displayPaymentRequest({});
  } catch (error) {
    console.error("Không thể tạo lại yêu cầu thanh toán QR:", error);
    showPaymentMessage(error.message, "error");
  } finally {
    document.getElementById("retryPayment").disabled = false;
  }
}

async function cancelPayment() {
  if (!activeBooking || paymentState === "paid") return;
  if (
    !window.confirm(
      "Hủy đơn hàng này? Đơn hàng sẽ không được xác nhận là đã thanh toán.",
    )
  )
    return;
  const button = document.getElementById("cancelPayment");
  const previousState = paymentState;
  clearInterval(statusTimer);
  paymentState = "cancelling";
  renderPaymentState();
  button.disabled = true;
  if (providerPaymentId) {
    try {
      if (!paymentConfig.cancelEndpoint) {
        throw new Error(
          "Cổng thanh toán chưa hỗ trợ API hủy giao dịch. Đơn hàng chưa bị thay đổi.",
        );
      }
      const response = await fetch(
        paymentConfig.cancelEndpoint.replace(
          "{paymentId}",
          encodeURIComponent(providerPaymentId),
        ),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingCode: activeBooking.bookingCode }),
        },
      );
      if (!response.ok)
        throw new Error(
          `Cổng thanh toán không thể hủy giao dịch (HTTP ${response.status}).`,
        );
      const payment = await response.json();
      if (payment.status !== "cancelled") {
        throw new Error(
          "Cổng thanh toán chưa xác nhận hủy giao dịch. Đơn hàng chưa bị thay đổi.",
        );
      }
    } catch (error) {
      console.error("Không thể hủy giao dịch thanh toán:", error);
      paymentState = previousState;
      renderPaymentState();
      showPaymentMessage(error.message, "error");
      if (paymentAvailable) startPaymentPolling();
      return;
    }
  }
  paymentState = "cancelled";
  updateBooking({
    status: "Đã hủy",
    paymentStatus: "Đã hủy bởi khách hàng — chưa thanh toán",
    paymentState,
  });
  localStorage.removeItem("tripgo_selected_seats");
  localStorage.removeItem("tripgo_selected_seat");
  localStorage.removeItem("tripgo_selected_seat_flight");
  clearInterval(statusTimer);
  renderPaymentState();
}

async function copyValue(value, label) {
  if (!value || value === "Chưa cấu hình") return;
  try {
    await navigator.clipboard.writeText(value);
    showPaymentMessage(`Đã sao chép ${label}.`, "success");
  } catch (error) {
    console.error("Không thể sao chép thông tin thanh toán:", error);
    showPaymentMessage(
      "Trình duyệt không cho phép sao chép. Vui lòng chọn và sao chép nội dung thủ công.",
      "error",
    );
  }
}

const paymentAvailability = document.getElementById("paymentAvailability");
if (manualQrAvailable) {
  paymentAvailability.textContent =
    "Cả ba phương thức đều thanh toán bằng mã VietQR. TripGo sẽ xác nhận sau khi đối soát giao dịch.";
  paymentAvailability.hidden = false;
} else {
  paymentAvailability.textContent =
    "Thanh toán QR hiện chưa khả dụng. Vui lòng thử lại sau hoặc liên hệ TripGo để được hỗ trợ.";
  paymentAvailability.hidden = false;
}
payButton.disabled =
  !manualQrAvailable ||
  !document.querySelector('input[name="paymentMethod"]:checked');

if (!requestedBookingCode) {
  const issue = validateDraft();
  if (issue) {
    showError(issue);
    paymentChoice.hidden = true;
    payButton.disabled = true;
  }
}

renderSummary();

if (requestedBookingCode) {
  if (
    !activeBooking ||
    !["Chờ thanh toán", "Đã hủy", "Đã đặt vé"].includes(activeBooking.status)
  ) {
    showError(
      "Không tìm thấy đơn hàng đang chờ thanh toán thuộc tài khoản của bạn.",
    );
    paymentChoice.hidden = true;
    payButton.disabled = true;
  } else if (activeBooking.status === "Đã hủy") {
    showError("Đơn hàng này đã bị hủy và không thể tiếp tục thanh toán.");
    paymentChoice.hidden = true;
    payButton.disabled = true;
  } else if (
    activeBooking.status === "Đã đặt vé" &&
    !hasVerifiedPayment(activeBooking)
  ) {
    showError("Đơn hàng chưa có xác nhận thanh toán từ cổng thanh toán.");
    paymentChoice.hidden = true;
    payButton.disabled = true;
  } else {
    showPaymentPanel(activeBooking);
  }
}

payButton.addEventListener("click", async () => {
  if (payButton.disabled) return;
  result.textContent = "";
  result.className = "";
  payButton.disabled = true;
  try {
    const method = document.querySelector(
      'input[name="paymentMethod"]:checked',
    )?.value;
    if (!method || !paymentMethods[method])
      throw new Error("Vui lòng chọn phương thức thanh toán.");
    if (!manualQrAvailable)
      throw new Error(
        "Thanh toán QR hiện chưa khả dụng. Vui lòng thử lại sau.",
      );
    if (activeBooking) {
      updateBooking({ paymentMethod: method });
    } else {
      createBooking(method);
    }
    window.history.replaceState(
      {},
      "",
      `/src/pages/payment.html?bookingCode=${encodeURIComponent(activeBooking.bookingCode)}`,
    );
    showPaymentPanel(activeBooking);
  } catch (error) {
    console.error("Không thể tạo đơn hàng thanh toán:", error);
    showError(error.message || "Không thể tạo đơn hàng. Vui lòng thử lại.");
    payButton.disabled = false;
  }
});

document.getElementById("retryPayment").addEventListener("click", retryPayment);
document
  .getElementById("cancelPayment")
  .addEventListener("click", cancelPayment);
document
  .getElementById("copyAccount")
  .addEventListener("click", () =>
    copyValue(
      document.getElementById("accountNumber").textContent,
      "số tài khoản",
    ),
  );
document
  .getElementById("copyTransfer")
  .addEventListener("click", () =>
    copyValue(
      document.getElementById("transferContent").textContent,
      "nội dung chuyển khoản",
    ),
  );

document.querySelectorAll('input[name="paymentMethod"]').forEach((input) => {
  input.addEventListener("change", () => {
    document.querySelectorAll(".payment-option").forEach((option) => {
      option.classList.toggle(
        "active",
        option.contains(input) && input.checked,
      );
    });
    payButton.disabled = !manualQrAvailable;
    if (input.checked && activeBooking && !paymentChoice.hidden) {
      try {
        updateBooking({ paymentMethod: input.value });
      } catch (error) {
        console.error("Không thể lưu phương thức thanh toán đã chọn:", error);
        showError(
          error.message || "Không thể lưu phương thức thanh toán đã chọn.",
        );
      }
    }
  });
});

window.addEventListener("storage", (event) => {
  const bookingCode = activeBooking?.bookingCode || requestedBookingCode;
  if (event.key !== auth.BOOKINGS_KEY || !bookingCode || !event.newValue) {
    return;
  }

  let bookings;
  try {
    bookings = JSON.parse(event.newValue);
  } catch (error) {
    console.error("Không thể đọc cập nhật vé từ admin:", error);
    return;
  }
  if (!Array.isArray(bookings)) return;

  const updatedBooking = bookings.find(
    (booking) =>
      booking.bookingCode === bookingCode &&
      booking.userEmail?.toLowerCase() === currentUser?.email?.toLowerCase(),
  );
  if (
    updatedBooking?.status !== "Đã đặt vé" ||
    !hasVerifiedPayment(updatedBooking)
  ) {
    return;
  }

  clearInterval(statusTimer);
  window.location.replace(
    `/src/pages/booking-success.html?bookingCode=${encodeURIComponent(updatedBooking.bookingCode)}`,
  );
});
