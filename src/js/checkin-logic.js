export const CHECKIN_RULES = Object.freeze({
  opensHoursBefore: 24,
  closesHoursBefore: 2,
});

const CANCELLED_STATUSES = new Set([
  "cancelled",
  "canceled",
  "đã hủy",
  "đã bị hủy",
]);
const UNAVAILABLE_FLIGHT_STATUSES = new Set([
  "cancelled",
  "canceled",
  "đã hủy",
  "deleted",
  "flying",
  "completed",
  "inactive",
  "suspended",
]);

export function normalizeName(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function getPassengers(booking) {
  if (!booking || typeof booking !== "object") return [];
  const source = Array.isArray(booking.passengerDetails)
    ? booking.passengerDetails
    : Array.isArray(booking.passengers)
      ? booking.passengers
      : booking.passenger && typeof booking.passenger === "object"
        ? [booking.passenger]
        : [];
  return source
    .filter((passenger) => passenger && typeof passenger === "object")
    .map((passenger, index) => ({
      ...passenger,
      fullName: String(passenger.fullName || passenger.name || "").trim(),
      index,
    }))
    .filter((passenger) => passenger.fullName);
}

export function passengerCount(booking, passengers = getPassengers(booking)) {
  const count = Number(booking?.passengerCount);
  return Number.isInteger(count) && count > 0 ? count : passengers.length;
}

export function getPassengerSurname(passenger) {
  const explicitSurname = passenger?.surname || passenger?.familyName;
  return String(explicitSurname || passenger?.fullName || passenger?.name || "")
    .trim()
    .split(/\s+/)[0];
}

export function matchesSurname(passenger, surname) {
  const expected = normalizeName(getPassengerSurname(passenger));
  return !!expected && expected === normalizeName(surname);
}

export function isCancelled(booking) {
  return CANCELLED_STATUSES.has(
    String(booking?.status || "").trim().toLowerCase(),
  );
}

export function isPaymentVerified(booking) {
  return (
    booking?.paymentState === "paid" &&
    booking?.paymentMode !== "demo" &&
    !/demo|mô phỏng/i.test(String(booking?.paymentStatus || ""))
  );
}

export function getBookingIssue(booking) {
  if (!booking || typeof booking !== "object" || Array.isArray(booking)) {
    return "Dữ liệu đặt chỗ không hợp lệ.";
  }
  if (isCancelled(booking)) return "Đặt chỗ này đã bị hủy.";
  if (!["Đã đặt vé", "Đã check-in"].includes(booking.status)) {
    return "Đặt chỗ chưa được xác nhận. Chỉ vé đã xác nhận mới có thể check-in.";
  }
  if (!isPaymentVerified(booking)) {
    return "Thanh toán chưa được xác minh. Đặt chỗ chưa đủ điều kiện check-in.";
  }
  return "";
}

export function getCheckInWindow(
  date,
  departure,
  now = new Date(),
  rules = CHECKIN_RULES,
) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(String(date || "")) ||
    !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(departure || ""))
  ) {
    return { state: "unknown", departureAt: null, opensAt: null, closesAt: null };
  }
  const departureAt = new Date(`${date}T${departure}:00`);
  const [year, month, day] = date.split("-").map(Number);
  if (
    Number.isNaN(departureAt.getTime()) ||
    departureAt.getFullYear() !== year ||
    departureAt.getMonth() + 1 !== month ||
    departureAt.getDate() !== day
  ) {
    return { state: "unknown", departureAt: null, opensAt: null, closesAt: null };
  }
  const opensAt = new Date(
    departureAt.getTime() - rules.opensHoursBefore * 60 * 60 * 1000,
  );
  const closesAt = new Date(
    departureAt.getTime() - rules.closesHoursBefore * 60 * 60 * 1000,
  );
  const state =
    now < opensAt ? "too-early" : now >= closesAt ? "closed" : "open";
  return { state, departureAt, opensAt, closesAt };
}

export function getFlightIssue(flight) {
  if (!flight || typeof flight !== "object") {
    return "Không có dữ liệu chuyến bay để kiểm tra.";
  }
  const status = String(flight.status || "").trim().toLowerCase();
  if (UNAVAILABLE_FLIGHT_STATUSES.has(status)) {
    return "Chuyến bay hiện không đủ điều kiện check-in.";
  }
  return "";
}

export function getCheckInRecord(booking, index) {
  if (Array.isArray(booking?.checkIns)) {
    const record = booking.checkIns.find(
      (item) => Number(item?.passengerIndex) === index && item?.id,
    );
    if (record) return record;
  }
  return booking?.status === "Đã check-in"
    ? { legacy: true, passengerIndex: index }
    : null;
}

export function findBookingForCheckIn(
  bookings,
  bookingCode,
  surname,
  user,
  isAdmin = false,
) {
  if (!Array.isArray(bookings)) return null;
  const code = String(bookingCode || "").trim().toUpperCase();
  const email = String(user?.email || "").toLowerCase();
  return (
    bookings.find((booking) => {
      if (String(booking?.bookingCode || "").toUpperCase() !== code) return false;
      const ownerEmail = String(booking.userEmail || "").toLowerCase();
      const passengers = getPassengers(booking);
      const linkedToUser = passengers.some(
        (passenger) =>
          String(passenger.email || "").toLowerCase() === email ||
          (!!user?.phone &&
            String(passenger.phone || "") === String(user.phone)),
      );
      const belongsToUser =
        isAdmin ||
        ownerEmail === email ||
        linkedToUser;
      return (
        belongsToUser &&
        passengers.some((passenger) => matchesSurname(passenger, surname))
      );
    }) || null
  );
}
