import QRCode from "qrcode";
import {
  ALL_SEATS,
  getSeatState,
  renderCabin,
  MAP_KEY,
} from "./seat-store.js";
import {
  findBookingForCheckIn,
  getBookingIssue,
  getCheckInRecord,
  getCheckInWindow,
  getFlightIssue,
  getPassengers,
  matchesSurname,
  passengerCount,
} from "./checkin-logic.js";
import "./auth.js";

const auth = window.TripGoAuth;
if (!auth.requireLogin()) throw new Error("Đăng nhập để làm thủ tục check-in.");
auth.updateAuthUI();

const elements = {
  lookupForm: document.getElementById("lookupForm"),
  bookingCode: document.getElementById("bookingCode"),
  surname: document.getElementById("surname"),
  lookupButton: document.getElementById("lookupButton"),
  statusMessage: document.getElementById("statusMessage"),
  lookupSection: document.getElementById("lookupSection"),
  bookingSection: document.getElementById("bookingSection"),
  bookingSummary: document.getElementById("bookingSummary"),
  passengerChoices: document.getElementById("passengerChoices"),
  passengerDataWarning: document.getElementById("passengerDataWarning"),
  continueToSeat: document.getElementById("continueToSeat"),
  seatSection: document.getElementById("seatSection"),
  selectedPassengerSummary: document.getElementById(
    "selectedPassengerSummary",
  ),
  seatSelectionHint: document.getElementById("seatSelectionHint"),
  seatCabin: document.getElementById("seatCabin"),
  seatStatus: document.getElementById("seatStatus"),
  continueToConfirm: document.getElementById("continueToConfirm"),
  confirmSection: document.getElementById("confirmSection"),
  confirmationSummary: document.getElementById("confirmationSummary"),
  confirmationError: document.getElementById("confirmationError"),
  confirmCheckin: document.getElementById("confirmCheckin"),
  boardingPass: document.getElementById("boardingPass"),
  boardingRoute: document.getElementById("boardingRoute"),
  boardingDetails: document.getElementById("boardingDetails"),
  checkinQr: document.getElementById("checkinQr"),
  checkinReference: document.getElementById("checkinReference"),
  downloadBoardingPass: document.getElementById("downloadBoardingPass"),
};

const AIRPORTS = {
  HAN: { city: "Hà Nội", airport: "Sân bay Nội Bài" },
  SGN: { city: "TP. Hồ Chí Minh", airport: "Sân bay Tân Sơn Nhất" },
  DAD: { city: "Đà Nẵng", airport: "Sân bay Đà Nẵng" },
  CXR: { city: "Nha Trang", airport: "Sân bay Cam Ranh" },
  PQC: { city: "Phú Quốc", airport: "Sân bay Phú Quốc" },
  HPH: { city: "Hải Phòng", airport: "Sân bay Cát Bi" },
  HUI: { city: "Huế", airport: "Sân bay Phú Bài" },
  VCA: { city: "Cần Thơ", airport: "Sân bay Cần Thơ" },
  UIH: { city: "Quy Nhơn", airport: "Sân bay Phù Cát" },
  VDO: { city: "Vân Đồn", airport: "Sân bay Vân Đồn" },
};

let bookingContext = null;
let selectedPassengerIndex = null;
let selectedSeat = "";
let checkinSaving = false;

const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character],
  );

function showMessage(message, type = "info") {
  elements.statusMessage.textContent = message;
  elements.statusMessage.dataset.type = type;
  elements.statusMessage.hidden = !message;
}

function showInlineMessage(element, message, type = "warning") {
  element.textContent = message;
  element.className = type === "error" ? "inline-error" : "inline-warning";
  element.hidden = !message;
}

function setProgress(step) {
  document.querySelectorAll("[data-progress-step]").forEach((item) => {
    const currentStep = Number(item.dataset.progressStep);
    item.classList.toggle("active", currentStep === step);
    item.classList.toggle("done", currentStep < step);
    if (currentStep === step) item.setAttribute("aria-current", "step");
    else item.removeAttribute("aria-current");
  });
}

function readBookings() {
  const raw = localStorage.getItem(auth.BOOKINGS_KEY);
  if (raw === null) return auth.getBookings();
  let bookings;
  try {
    bookings = JSON.parse(raw);
  } catch {
    throw new Error("Dữ liệu đặt chỗ bị lỗi định dạng. Vui lòng liên hệ TripGo.");
  }
  if (!Array.isArray(bookings)) {
    throw new Error("Danh sách đặt chỗ không hợp lệ. Vui lòng liên hệ TripGo.");
  }
  return bookings;
}

function readSavedFlights() {
  const raw = localStorage.getItem("tripgo_flights");
  if (raw === null) return [];
  let flights;
  try {
    flights = JSON.parse(raw);
  } catch {
    throw new Error(
      "Dữ liệu chuyến bay bị lỗi định dạng. Tạm thời chưa thể check-in.",
    );
  }
  if (
    !Array.isArray(flights) ||
    flights.some((flight) => !flight || typeof flight !== "object")
  ) {
    throw new Error(
      "Danh sách chuyến bay không hợp lệ. Tạm thời chưa thể check-in.",
    );
  }
  return flights;
}

function readSeatMap() {
  const raw = localStorage.getItem(MAP_KEY);
  if (raw === null) return;
  let maps;
  try {
    maps = JSON.parse(raw);
  } catch {
    throw new Error("Sơ đồ ghế bị lỗi định dạng. Vui lòng tải lại trang.");
  }
  if (
    !Array.isArray(maps) ||
    maps.some(
      (map) =>
        !map ||
        typeof map !== "object" ||
        (map.blocked !== undefined && !Array.isArray(map.blocked)) ||
        (map.demoBooked !== undefined && !Array.isArray(map.demoBooked)),
    )
  ) {
    throw new Error("Dữ liệu sơ đồ ghế không hợp lệ. Vui lòng tải lại trang.");
  }
}

function flightDate(booking, snapshot) {
  return booking.date || booking.departureDate || snapshot.date || "";
}

function lookupFlight(booking, savedFlights) {
  const snapshot = booking.flight && typeof booking.flight === "object"
    ? booking.flight
    : {};
  const id =
    booking.flightId || snapshot.id || snapshot.flightNumber || "";
  const date = flightDate(booking, snapshot);
  const matches = (flight) =>
    String(flight.id || flight.flightId || flight.flightNumber || "") ===
      String(id) &&
    (!flight.date || !date || flight.date === date);
  const saved = savedFlights.find(matches);
  const source = saved || {};
  return {
    ...source,
    ...snapshot,
    id: snapshot.id || snapshot.flightNumber || id,
    flightNumber:
      snapshot.flightNumber || snapshot.id || source.flightNumber || id,
    date: date || source.date || "",
    departure:
      snapshot.departure || snapshot.departureTime || source.departure || "",
    arrival: snapshot.arrival || snapshot.arrivalTime || source.arrival || "",
    from: snapshot.from || booking.from || source.from || "",
    to: snapshot.to || booking.to || source.to || "",
    airline: snapshot.airline || source.airline || "",
    status: saved?.status || snapshot.status || "",
  };
}

function flightMeta(booking, flight) {
  const date = flightDate(booking, flight);
  const from = String(flight.from || "").toUpperCase();
  const to = String(flight.to || "").toUpperCase();
  const duration = getDuration(flight.departure, flight.arrival);
  const flightStatus = flight.status
    ? getFlightIssue(flight)
      ? "Không đủ điều kiện"
      : flight.status === "active" || flight.status === "available"
        ? "Đang khai thác"
        : String(flight.status)
    : "Chưa có cập nhật";
  const baggage =
    booking.baggage ??
    (flight.baggage === undefined || flight.baggage === null
      ? ""
      : `${flight.baggage} kg`);
  const services = booking.services || booking.addons;
  const serviceText = Array.isArray(services)
    ? services
        .map((service) =>
          typeof service === "string"
            ? service
            : service?.name || service?.label || "",
        )
        .filter(Boolean)
        .join(", ")
    : typeof services === "string"
      ? services
      : "";
  return {
    date,
    from,
    to,
    fromCity: AIRPORTS[from]?.city || "Chưa có dữ liệu thành phố",
    toCity: AIRPORTS[to]?.city || "Chưa có dữ liệu thành phố",
    fromAirport: AIRPORTS[from]?.airport || "Chưa có dữ liệu sân bay",
    toAirport: AIRPORTS[to]?.airport || "Chưa có dữ liệu sân bay",
    flightNumber: flight.flightNumber || flight.id || booking.flightId || "",
    airline: flight.airline || "",
    departure: flight.departure || "",
    arrival: flight.arrival || "",
    duration,
    flightStatus,
    baggage: baggage === "Không có" ? "Chưa có hành lý ký gửi" : baggage,
    serviceText,
  };
}

function getDuration(departure, arrival) {
  const timeToMinutes = (value) => {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(value || ""));
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
  };
  const start = timeToMinutes(departure);
  const end = timeToMinutes(arrival);
  if (start === null || end === null) return "";
  let minutes = end - start;
  if (minutes < 0) minutes += 24 * 60;
  if (minutes === 0) return "";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return [hours ? `${hours} giờ` : "", remainingMinutes ? `${remainingMinutes} phút` : ""]
    .filter(Boolean)
    .join(" ");
}

function formatDate(value) {
  if (!value) return "Chưa có dữ liệu";
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? String(value)
    : parsed.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
}

function formatDateTime(value) {
  if (!value) return "Chưa có dữ liệu";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? String(value)
    : parsed.toLocaleString("vi-VN");
}

function passengerSeat(booking, index) {
  const seats = Array.isArray(booking.seats)
    ? booking.seats
    : String(booking.seat || "")
        .split(/[,\s]+/)
        .filter(Boolean);
  return String(seats[index] || "");
}

function currentFlightWindow(booking, flight) {
  return getCheckInWindow(
    flightDate(booking, flight),
    flight.departure,
  );
}

function bookingEligibility(booking, flight, passengers, index = null) {
  const bookingIssue = getBookingIssue(booking);
  if (bookingIssue) return bookingIssue;
  const flightIssue = getFlightIssue(flight);
  if (flightIssue) return flightIssue;
  const expectedPassengers = passengerCount(booking, passengers);
  if (expectedPassengers !== passengers.length) {
    return `Đặt chỗ có ${expectedPassengers} hành khách nhưng chỉ lưu được thông tin ${passengers.length}. Cần bổ sung hồ sơ hành khách trước khi check-in.`;
  }
  if (!passengers.length) {
    return "Đặt chỗ chưa có thông tin hành khách để xác nhận.";
  }
  if (index !== null && getCheckInRecord(booking, index)) {
    return "Hành khách này đã hoàn tất check-in.";
  }
  const window = currentFlightWindow(booking, flight);
  if (window.state === "unknown") {
    return "Thiếu ngày bay hoặc giờ khởi hành hợp lệ để xác định thời gian check-in.";
  }
  if (window.state === "too-early") {
    return "Chưa đến thời gian check-in theo quy tắc mô phỏng TripGo.";
  }
  if (window.state === "closed") {
    return "Đã quá thời gian check-in theo quy tắc mô phỏng TripGo.";
  }
  return "";
}

function renderFlightSummary(booking, flight, passengers) {
  const meta = flightMeta(booking, flight);
  const paymentText =
    booking.paymentMode === "demo"
      ? "Thanh toán mô phỏng - chưa xác minh"
      : booking.paymentState === "paid"
        ? "Đã thanh toán"
        : booking.paymentStatus || "Chưa xác nhận thanh toán";
  const bookingStatus = booking.status || "Chưa có trạng thái";
  const seatText = passengers
    .map((passenger, index) => {
      const seat = passengerSeat(booking, index);
      return `${passenger.fullName}: ${seat || "Chưa chọn"}`;
    })
    .join(" · ");
  const extraMeta = [
    ["Hãng hàng không", meta.airline],
    ["Trạng thái chuyến bay", meta.flightStatus],
    ["Hành lý", meta.baggage],
    ["Dịch vụ bổ sung", meta.serviceText],
    ["Ghế đã đặt", seatText],
  ]
    .filter(([, value]) => value)
    .map(
      ([label, value]) => `
        <div class="flight-meta-item">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
        </div>`,
    )
    .join("");

  elements.bookingSummary.innerHTML = `
    <article class="flight-summary">
      <div class="booking-summary-top">
        <span class="booking-summary-code">Mã đặt chỗ: ${escapeHtml(booking.bookingCode || "—")}</span>
        <span class="booking-badges">
          <span class="checkin-badge">${escapeHtml(bookingStatus)}</span>
          <span class="checkin-badge ${booking.paymentState === "paid" && booking.paymentMode !== "demo" ? "success" : "warning"}">${escapeHtml(paymentText)}</span>
        </span>
      </div>
      <div class="flight-route">
        <div class="route-point">
          <small>ĐIỂM ĐI</small>
          <strong class="route-code">${escapeHtml(meta.from || "—")}</strong>
          <span class="route-city">${escapeHtml(meta.fromCity)}</span>
          <span class="route-airport">${escapeHtml(meta.fromAirport)}</span>
        </div>
        <div class="route-center">
          <span class="route-duration">${escapeHtml(meta.duration || "Thời lượng chưa có")}</span>
          <span class="route-line"><span aria-hidden="true">✈</span></span>
          <span>${escapeHtml(meta.flightNumber || "Chưa có số hiệu")}</span>
        </div>
        <div class="route-point">
          <small>ĐIỂM ĐẾN</small>
          <strong class="route-code">${escapeHtml(meta.to || "—")}</strong>
          <span class="route-city">${escapeHtml(meta.toCity)}</span>
          <span class="route-airport">${escapeHtml(meta.toAirport)}</span>
        </div>
      </div>
      <div class="flight-meta">
        <div class="flight-meta-item"><span>Ngày bay</span><strong>${escapeHtml(formatDate(meta.date))}</strong></div>
        <div class="flight-meta-item"><span>Khởi hành</span><strong>${escapeHtml(meta.departure || "Chưa có dữ liệu")}</strong></div>
        <div class="flight-meta-item"><span>Đến nơi</span><strong>${escapeHtml(meta.arrival || "Chưa có dữ liệu")}</strong></div>
        <div class="flight-meta-item"><span>Chuyến bay</span><strong>${escapeHtml(meta.flightNumber || "Chưa có dữ liệu")}</strong></div>
        ${extraMeta}
      </div>
    </article>`;
}

function renderPassengers(booking, flight, passengers) {
  const count = passengerCount(booking, passengers);
  const mismatch = count !== passengers.length;
  const bookingIssue = getBookingIssue(booking);
  const flightIssue = getFlightIssue(flight);
  const window = currentFlightWindow(booking, flight);
  const eligibilityIssue =
    bookingIssue ||
    flightIssue ||
    (mismatch
      ? `Đặt chỗ có ${count} hành khách nhưng chỉ lưu được ${passengers.length} hồ sơ. Không thể xác nhận check-in cho những người chưa có thông tin.`
      : !passengers.length
        ? "Đặt chỗ chưa có thông tin hành khách để xác nhận."
        : window.state === "unknown"
          ? "Thiếu ngày bay hoặc giờ khởi hành hợp lệ để xác định thời gian check-in."
          : window.state === "too-early"
            ? "Chưa đến thời gian check-in theo quy tắc mô phỏng TripGo."
            : window.state === "closed"
              ? "Đã quá thời gian check-in theo quy tắc mô phỏng TripGo."
              : "");
  const radios = passengers
    .map((passenger, index) => {
      const checkedIn = getCheckInRecord(booking, index);
      const alreadyChecked = !!checkedIn;
      const seat = passengerSeat(booking, index);
      const paymentOrFlightBlocked = !!bookingIssue || !!flightIssue || mismatch;
      return `
        <label class="passenger-option">
          <input type="radio" name="checkinPassenger" value="${index}" ${alreadyChecked || paymentOrFlightBlocked ? "disabled" : ""} />
          <span class="passenger-option-copy">
            <strong>${escapeHtml(passenger.fullName)}</strong>
            <small>Ghế ${escapeHtml(seat || "chưa chọn")}</small>
          </span>
          <span class="passenger-status ${alreadyChecked ? "" : "pending"}">${alreadyChecked ? "Đã check-in" : "Chưa check-in"}</span>
        </label>`;
    })
    .join("");
  elements.passengerChoices.innerHTML = radios;
  elements.passengerDataWarning.hidden = !mismatch && !eligibilityIssue;
  elements.passengerDataWarning.textContent =
    mismatch || eligibilityIssue
      ? eligibilityIssue
      : "";
  elements.continueToSeat.disabled =
    !!eligibilityIssue || !passengers.length || !!bookingIssue || !!flightIssue;
  elements.passengerChoices
    .querySelectorAll('input[name="checkinPassenger"]')
    .forEach((radio) => {
      radio.addEventListener("change", () => {
        selectedPassengerIndex = Number(radio.value);
        elements.continueToSeat.disabled = false;
        const selectedIssue = bookingEligibility(
          bookingContext.booking,
          bookingContext.flight,
          bookingContext.passengers,
          selectedPassengerIndex,
        );
        elements.continueToSeat.disabled = !!selectedIssue;
        if (selectedIssue) showInlineMessage(elements.passengerDataWarning, selectedIssue);
        else showInlineMessage(elements.passengerDataWarning, "");
      });
    });
}

function findCurrentContext(code, surname) {
  const bookings = readBookings();
  const user = auth.getCurrentUser();
  const booking = findBookingForCheckIn(
    bookings,
    code,
    surname,
    user,
    auth.isAdmin(),
  );
  if (!booking) return null;
  const passengers = getPassengers(booking);
  const flight = lookupFlight(booking, readSavedFlights());
  return { booking, bookings, passengers, flight };
}

function resetFlow() {
  bookingContext = null;
  selectedPassengerIndex = null;
  selectedSeat = "";
  elements.bookingSection.hidden = true;
  elements.seatSection.hidden = true;
  elements.confirmSection.hidden = true;
  elements.boardingPass.hidden = true;
  elements.lookupSection.hidden = false;
  elements.confirmationError.hidden = true;
  showInlineMessage(elements.seatStatus, "");
  setProgress(1);
}

function beginLookup() {
  const code = elements.bookingCode.value.trim().toUpperCase();
  const surname = elements.surname.value.trim();
  if (!code || !surname) {
    showMessage("Vui lòng nhập mã đặt chỗ và họ hành khách.", "error");
    (!code ? elements.bookingCode : elements.surname).focus();
    return false;
  }
  return { code, surname };
}

function prepareBooking(context) {
  bookingContext = context;
  selectedPassengerIndex = null;
  selectedSeat = "";
  elements.lookupSection.hidden = false;
  elements.bookingSection.hidden = false;
  elements.seatSection.hidden = true;
  elements.confirmSection.hidden = true;
  elements.boardingPass.hidden = true;
  renderFlightSummary(context.booking, context.flight, context.passengers);
  renderPassengers(context.booking, context.flight, context.passengers);
  showMessage("", "info");
  setProgress(2);
  elements.bookingSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function lookup() {
  const input = beginLookup();
  if (!input) return;
  resetFlow();
  elements.lookupButton.disabled = true;
  elements.lookupButton.textContent = "Đang tra cứu...";
  showMessage("Đang kiểm tra dữ liệu đặt chỗ...", "info");
  requestAnimationFrame(() => {
    try {
      const context = findCurrentContext(input.code, input.surname);
      if (!context) {
        showMessage(
          "Không tìm thấy đặt chỗ phù hợp. Hãy kiểm tra mã, họ hành khách và tài khoản đang đăng nhập.",
          "error",
        );
        return;
      }
      prepareBooking(context);
    } catch (error) {
      console.error("Không thể tra cứu đặt chỗ check-in:", error);
      showMessage(
        error instanceof Error
          ? error.message
          : "Không thể đọc dữ liệu đặt chỗ. Vui lòng thử lại.",
        "error",
      );
    } finally {
      elements.lookupButton.disabled = false;
      elements.lookupButton.textContent = "Tra cứu đặt chỗ";
    }
  });
}

function setPassengerSeat(booking, index, seat) {
  const seats = Array.isArray(booking.seats)
    ? [...booking.seats]
    : String(booking.seat || "")
        .split(/[,\s]+/)
        .filter(Boolean);
  while (seats.length <= index) seats.push("");
  seats[index] = seat;
  const assignedSeats = seats.filter(Boolean);
  return {
    seats,
    seat: assignedSeats.join(", "),
  };
}

function stateForPassengerSeat(booking, flight, index) {
  readSeatMap();
  const state = getSeatState(flight);
  const storedSeat = passengerSeat(booking, index);
  const currentSeat = ALL_SEATS.includes(storedSeat) ? storedSeat : "";
  const seats = Array.isArray(booking.seats)
    ? booking.seats
    : String(booking.seat || "")
        .split(/[,\s]+/)
        .filter(Boolean);
  const duplicatedInBooking = seats.some(
    (seat, seatIndex) => seat === currentSeat && seatIndex !== index,
  );
  if (
    currentSeat &&
    !duplicatedInBooking &&
    state.owners.get(currentSeat) === booking.bookingCode
  ) {
    state.booked.delete(currentSeat);
    state.owners.delete(currentSeat);
  }
  return { state, currentSeat, duplicatedInBooking };
}

function drawSeatMap(state, selected) {
  renderCabin(elements.seatCabin, state, selected, (seat, status) => {
    if (status === "booked" || status === "blocked") {
      showInlineMessage(
        elements.seatStatus,
        `Ghế ${seat} đã được đặt hoặc khóa. Vui lòng chọn ghế khác.`,
      );
      return;
    }
    selectedSeat = seat;
    showInlineMessage(elements.seatStatus, `Đã chọn ghế ${seat}.`, "info");
    drawSeatMap(state, new Set([seat]));
    elements.continueToConfirm.disabled = false;
  });
}

function renderSeatSelection() {
  const { booking, flight, passengers } = bookingContext;
  const passenger = passengers[selectedPassengerIndex];
  if (!passenger) throw new Error("Không tìm thấy hành khách đã chọn.");
  const issue = bookingEligibility(
    booking,
    flight,
    passengers,
    selectedPassengerIndex,
  );
  if (issue) throw new Error(issue);
  const { state, currentSeat, duplicatedInBooking } = stateForPassengerSeat(
    booking,
    flight,
    selectedPassengerIndex,
  );
  selectedSeat = currentSeat;
  drawSeatMap(state, new Set(selectedSeat ? [selectedSeat] : []));
  elements.selectedPassengerSummary.innerHTML = `
    <strong>${escapeHtml(passenger.fullName)}</strong>
    · Ghế hiện tại: <strong>${escapeHtml(currentSeat || "Chưa chọn")}</strong>`;
  elements.seatSelectionHint.textContent = currentSeat
    ? `Ghế ${currentSeat} đang được giữ cho hành khách này. Có thể giữ nguyên hoặc chọn ghế khác còn trống.`
    : "Chọn một ghế còn trống trên sơ đồ để tiếp tục.";
  if (duplicatedInBooking) {
    showInlineMessage(
      elements.seatStatus,
      `Dữ liệu hiện có gán ghế ${currentSeat} cho nhiều hành khách. Hãy chọn một ghế khác để sửa xung đột.`,
    );
  } else if (currentSeat) {
    showInlineMessage(elements.seatStatus, `Ghế ${currentSeat} đã được đặt cho hành khách này.`, "info");
  } else {
    showInlineMessage(elements.seatStatus, "");
  }
  elements.continueToConfirm.disabled = !selectedSeat;
}

function getConfirmationItems(booking, flight, passenger, seat) {
  const meta = flightMeta(booking, flight);
  return [
    ["Hành khách", passenger.fullName],
    ["Mã đặt chỗ", booking.bookingCode],
    ["Chuyến bay", [meta.airline, meta.flightNumber].filter(Boolean).join(" · ")],
    ["Hành trình", `${meta.from || "—"} → ${meta.to || "—"}`],
    ["Ngày bay", formatDate(meta.date)],
    ["Giờ khởi hành", meta.departure || "Chưa có dữ liệu"],
    ["Ghế ngồi", seat || "Chưa chọn"],
  ];
}

function renderConfirmation() {
  const { booking, flight, passengers } = bookingContext;
  const passenger = passengers[selectedPassengerIndex];
  const items = getConfirmationItems(
    booking,
    flight,
    passenger,
    selectedSeat,
  );
  elements.confirmationSummary.innerHTML = items
    .map(
      ([label, value]) => `
        <div class="confirmation-item">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value || "Chưa có dữ liệu")}</strong>
        </div>`,
    )
    .join("");
  elements.confirmationError.hidden = true;
  elements.seatSection.hidden = true;
  elements.confirmSection.hidden = false;
  setProgress(3);
  elements.confirmSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function validateSeatStillAvailable(booking, flight, index, seat) {
  if (!seat) return "Cần chọn ghế trước khi xác nhận check-in.";
  if (!ALL_SEATS.includes(seat)) {
    return `Ghế ${seat} không có trong sơ đồ ghế. Vui lòng chọn ghế hợp lệ.`;
  }
  readSeatMap();
  const state = getSeatState(flight);
  if (state.blocked.has(seat)) return `Ghế ${seat} hiện đang bị khóa.`;
  const seats = Array.isArray(booking.seats)
    ? booking.seats
    : String(booking.seat || "")
        .split(/[,\s]+/)
        .filter(Boolean);
  const ownSeatForPassenger = seats[index] === seat;
  if (seats.some((value, seatIndex) => value === seat && seatIndex !== index)) {
    return `Ghế ${seat} đang được gán cho hành khách khác trong cùng đặt chỗ.`;
  }
  if (
    state.booked.has(seat) &&
    !(ownSeatForPassenger && state.owners.get(seat) === booking.bookingCode)
  ) {
    return `Ghế ${seat} vừa được đặt bởi một đặt chỗ khác. Vui lòng chọn lại.`;
  }
  return "";
}

function createCheckinId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  if (typeof crypto.getRandomValues !== "function") {
    throw new Error("Trình duyệt không hỗ trợ tạo mã tham chiếu check-in an toàn.");
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}

function renderBoardingPass(booking, flight, passenger, checkinRecord) {
  const meta = flightMeta(booking, flight);
  const seat = checkinRecord.seat || "Chưa chọn";
  const optionalDetails = [
    ["Ngày bay", formatDate(meta.date)],
    ["Giờ khởi hành", meta.departure],
    ["Hãng hàng không", meta.airline],
    ["Cổng khởi hành", flight.gate || booking.gate],
    ["Giờ lên máy bay", flight.boardingTime || booking.boardingTime],
  ].filter(([, value]) => value);
  elements.boardingRoute.innerHTML = `
    <div class="boarding-route-point">
      <small>${escapeHtml(meta.from || "ĐIỂM ĐI")}</small>
      <strong>${escapeHtml(meta.from || "—")}</strong>
      <span>${escapeHtml(meta.fromCity)}</span>
    </div>
    <span class="boarding-route-plane" aria-hidden="true">✈</span>
    <div class="boarding-route-point">
      <small>${escapeHtml(meta.to || "ĐIỂM ĐẾN")}</small>
      <strong>${escapeHtml(meta.to || "—")}</strong>
      <span>${escapeHtml(meta.toCity)}</span>
    </div>`;
  elements.boardingDetails.innerHTML = `
    <div class="boarding-detail"><span>Hành khách</span><strong>${escapeHtml(passenger.fullName)}</strong></div>
    <div class="boarding-detail"><span>Mã đặt chỗ</span><strong>${escapeHtml(booking.bookingCode)}</strong></div>
    <div class="boarding-detail"><span>Số hiệu chuyến bay</span><strong>${escapeHtml(meta.flightNumber || "Chưa có dữ liệu")}</strong></div>
    <div class="boarding-detail seat-detail"><span>Ghế ngồi</span><strong>${escapeHtml(seat)}</strong></div>
    ${optionalDetails
      .map(
        ([label, value]) => `
          <div class="boarding-detail"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`,
      )
      .join("")}`;
  elements.checkinReference.textContent = checkinRecord.id;
  elements.boardingPass.hidden = false;
  setProgress(4);
  elements.boardingPass.scrollIntoView({ behavior: "smooth", block: "start" });
}

function showConfirmationError(message) {
  elements.confirmationError.textContent = message;
  elements.confirmationError.hidden = false;
}

async function confirmCheckIn() {
  if (checkinSaving) return;
  checkinSaving = true;
  elements.confirmCheckin.disabled = true;
  elements.confirmCheckin.textContent = "Đang lưu check-in...";
  elements.confirmationError.hidden = true;
  try {
    const latest = findCurrentContext(
      elements.bookingCode.value.trim().toUpperCase(),
      elements.surname.value.trim(),
    );
    if (!latest) throw new Error("Đặt chỗ không còn tồn tại hoặc thông tin không còn khớp.");
    const currentPassenger = latest.passengers[selectedPassengerIndex];
    const selectedPassenger = bookingContext.passengers[selectedPassengerIndex];
    if (
      !currentPassenger ||
      currentPassenger.fullName !== selectedPassenger?.fullName
    ) {
      throw new Error("Thông tin hành khách vừa thay đổi. Hãy tra cứu lại đặt chỗ.");
    }
    const issue = bookingEligibility(
      latest.booking,
      latest.flight,
      latest.passengers,
      selectedPassengerIndex,
    );
    if (issue) throw new Error(issue);
    if (
      !matchesSurname(currentPassenger, elements.surname.value.trim())
    ) {
      throw new Error("Họ hành khách không còn khớp với dữ liệu đặt chỗ.");
    }
    const seatIssue = validateSeatStillAvailable(
      latest.booking,
      latest.flight,
      selectedPassengerIndex,
      selectedSeat,
    );
    if (seatIssue) throw new Error(seatIssue);
    if (
      latest.booking.checkIns !== undefined &&
      !Array.isArray(latest.booking.checkIns)
    ) {
      throw new Error("Dữ liệu check-in của đặt chỗ không hợp lệ.");
    }

    const checkinId = createCheckinId();
    const qrData = `TRIPGO-CHECKIN:${checkinId}`;
    const qrDataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 256,
      color: { dark: "#12324f", light: "#ffffff" },
    });
    const checkinAt = new Date().toISOString();
    const newRecord = {
      id: checkinId,
      passengerIndex: selectedPassengerIndex,
      checkInAt: checkinAt,
      seat: selectedSeat,
    };
    const updatedBooking = {
      ...latest.booking,
      ...setPassengerSeat(latest.booking, selectedPassengerIndex, selectedSeat),
      checkIns: [...(latest.booking.checkIns || []), newRecord],
    };
    const allCheckedIn = latest.passengers.every(
      (_, index) =>
        index === selectedPassengerIndex ||
        !!getCheckInRecord(updatedBooking, index),
    );
    if (allCheckedIn) updatedBooking.status = "Đã check-in";
    const updatedBookings = latest.bookings.map((item) =>
      item === latest.booking ? updatedBooking : item,
    );
    try {
      auth.saveBookings(updatedBookings);
    } catch (error) {
      const persisted = readBookings().some((item) =>
        item.bookingCode === updatedBooking.bookingCode &&
        Array.isArray(item.checkIns) &&
        item.checkIns.some((record) => record.id === checkinId),
      );
      if (!persisted) throw error;
      console.warn(
        "Check-in đã được ghi vào danh sách đặt chỗ nhưng không thể cập nhật bản sao tương thích:",
        error,
      );
    }
    const savedBooking = readBookings().find(
      (item) => item.bookingCode === updatedBooking.bookingCode,
    );
    if (
      !savedBooking?.checkIns?.some((record) => record.id === checkinId)
    ) {
      throw new Error("Không xác nhận được dữ liệu check-in sau khi lưu.");
    }

    elements.confirmSection.hidden = true;
    elements.seatSection.hidden = true;
    elements.bookingSection.hidden = true;
    elements.lookupSection.hidden = true;
    elements.checkinQr.src = qrDataUrl;
    renderBoardingPass(savedBooking, latest.flight, currentPassenger, newRecord);
    showMessage(
      `Check-in đã được lưu thành công lúc ${formatDateTime(checkinAt)}.`,
      "success",
    );
    bookingContext = { ...latest, booking: savedBooking };
  } catch (error) {
    console.error("Không thể xác nhận check-in:", error);
    showConfirmationError(
      error instanceof Error
        ? error.message
        : "Không thể lưu check-in. Vui lòng thử lại.",
    );
  } finally {
    checkinSaving = false;
    elements.confirmCheckin.disabled = false;
    elements.confirmCheckin.textContent = "Xác nhận check-in";
  }
}

elements.lookupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  lookup();
});

document.getElementById("changeBookingButton").addEventListener("click", () => {
  resetFlow();
  showMessage("", "info");
  elements.bookingCode.focus();
});

elements.continueToSeat.addEventListener("click", () => {
  try {
    if (selectedPassengerIndex === null) {
      showInlineMessage(
        elements.passengerDataWarning,
        "Vui lòng chọn hành khách cần check-in.",
      );
      return;
    }
    const issue = bookingEligibility(
      bookingContext.booking,
      bookingContext.flight,
      bookingContext.passengers,
      selectedPassengerIndex,
    );
    if (issue) throw new Error(issue);
    renderSeatSelection();
    elements.bookingSection.hidden = true;
    elements.seatSection.hidden = false;
    elements.seatSection.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    showInlineMessage(
      elements.passengerDataWarning,
      error instanceof Error ? error.message : "Không thể xác nhận hành khách.",
    );
  }
});

document.getElementById("backToPassengers").addEventListener("click", () => {
  elements.seatSection.hidden = true;
  elements.bookingSection.hidden = false;
  setProgress(2);
  elements.bookingSection.scrollIntoView({ behavior: "smooth", block: "start" });
});

elements.continueToConfirm.addEventListener("click", () => {
  try {
    const issue = bookingEligibility(
      bookingContext.booking,
      bookingContext.flight,
      bookingContext.passengers,
      selectedPassengerIndex,
    );
    if (issue) throw new Error(issue);
    const seatIssue = validateSeatStillAvailable(
      bookingContext.booking,
      bookingContext.flight,
      selectedPassengerIndex,
      selectedSeat,
    );
    if (seatIssue) throw new Error(seatIssue);
    elements.seatSection.hidden = true;
    elements.confirmSection.hidden = false;
    renderConfirmation();
  } catch (error) {
    showInlineMessage(
      elements.seatStatus,
      error instanceof Error ? error.message : "Không thể xác nhận ghế.",
    );
  }
});

document.getElementById("backToSeat").addEventListener("click", () => {
  elements.confirmSection.hidden = true;
  elements.seatSection.hidden = false;
  setProgress(2);
  elements.seatSection.scrollIntoView({ behavior: "smooth", block: "start" });
});

elements.confirmCheckin.addEventListener("click", confirmCheckIn);
document
  .getElementById("printBoardingPass")
  .addEventListener("click", () => window.print());

elements.downloadBoardingPass.addEventListener("click", async () => {
  const button = elements.downloadBoardingPass;
  button.disabled = true;
  button.textContent = "Đang tạo tệp...";
  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);
    const card = elements.boardingPass.querySelector(".boarding-pass-main");
    const canvas = await html2canvas(card, {
      scale: 2,
      backgroundColor: "#ffffff",
    });
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const margin = 12;
    const pageWidth = pdf.internal.pageSize.getWidth() - margin * 2;
    const pageHeight = pdf.internal.pageSize.getHeight() - margin * 2;
    const scale = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
    const width = canvas.width * scale;
    const height = canvas.height * scale;
    pdf.addImage(
      canvas.toDataURL("image/png"),
      "PNG",
      (pdf.internal.pageSize.getWidth() - width) / 2,
      (pdf.internal.pageSize.getHeight() - height) / 2,
      width,
      height,
    );
    const code = String(bookingContext?.booking?.bookingCode || "checkin").replace(
      /[^a-zA-Z0-9_-]/g,
      "_",
    );
    pdf.save(`TripGo_BoardingPass_${code}.pdf`);
    showMessage("Đã tải thẻ check-in TripGo dạng PDF.", "success");
  } catch (error) {
    console.error("Không thể tạo PDF thẻ check-in:", error);
    showMessage(
      "Không thể tạo PDF. Hãy thử lại hoặc dùng chức năng In thẻ.",
      "error",
    );
  } finally {
    button.disabled = false;
    button.textContent = "Tải thẻ lên máy bay";
  }
});

window.addEventListener("storage", (event) => {
  if (
    bookingContext &&
    (event.key === auth.BOOKINGS_KEY ||
      event.key === "tripgo_flights" ||
      event.key === MAP_KEY)
  ) {
    resetFlow();
    showMessage(
      "Đặt chỗ, chuyến bay hoặc sơ đồ ghế vừa thay đổi ở nơi khác. Hãy tra cứu lại để tiếp tục.",
      "warning",
    );
  }
});
