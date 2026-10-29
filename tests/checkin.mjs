import test from "node:test";
import assert from "node:assert/strict";
import {
  CHECKIN_RULES,
  findBookingForCheckIn,
  getBookingIssue,
  getCheckInRecord,
  getCheckInWindow,
  getFlightIssue,
  getPassengers,
  matchesSurname,
} from "../src/js/checkin-logic.js";

const paidBooking = (overrides = {}) => ({
  bookingCode: "TG123456",
  userEmail: "traveler@example.com",
  passenger: {
    fullName: "Nguyễn Văn An",
    email: "traveler@example.com",
  },
  passengerCount: 1,
  status: "Đã đặt vé",
  paymentState: "paid",
  paymentMode: "provider",
  ...overrides,
});

test("looks up the booking only for the owner and matching Vietnamese surname", () => {
  const booking = paidBooking();
  assert.equal(
    findBookingForCheckIn(
      [booking],
      "tg123456",
      "NGUYEN",
      { email: "traveler@example.com" },
    ),
    booking,
  );
  assert.equal(
    findBookingForCheckIn(
      [booking],
      "TG123456",
      "TRAN",
      { email: "traveler@example.com" },
    ),
    null,
  );
  assert.equal(
    findBookingForCheckIn(
      [booking],
      "TG123456",
      "NGUYEN",
      { email: "other@example.com" },
    ),
    null,
  );
});

test("supports explicit passenger details without inventing travelers", () => {
  const booking = paidBooking({
    passengerCount: 2,
    passengerDetails: [
      { fullName: "Nguyễn Văn An" },
      { fullName: "Trần Thị Bình" },
    ],
  });
  assert.deepEqual(
    getPassengers(booking).map((passenger) => passenger.fullName),
    ["Nguyễn Văn An", "Trần Thị Bình"],
  );
  assert.equal(matchesSurname(getPassengers(booking)[1], "Tran"), true);
  assert.equal(getPassengers(paidBooking({ passengerCount: 3 })).length, 1);
  const legacy = paidBooking({
    userEmail: "",
    passenger: undefined,
    passengerCount: 1,
    passengerDetails: [
      {
        fullName: "Trần Thị Bình",
        email: "traveler@example.com",
      },
    ],
  });
  assert.equal(
    findBookingForCheckIn(
      [legacy],
      "TG123456",
      "TRAN",
      { email: "traveler@example.com" },
    ),
    legacy,
  );
});

test("blocks cancelled, unpaid, simulated and unconfirmed bookings", () => {
  assert.match(getBookingIssue(paidBooking({ status: "Đã hủy" })), /hủy/);
  assert.match(getBookingIssue(paidBooking({ paymentState: "pending" })), /Thanh toán/);
  assert.match(
    getBookingIssue(paidBooking({ paymentMode: "demo" })),
    /Thanh toán/,
  );
  assert.match(
    getBookingIssue(paidBooking({ status: "Chờ thanh toán" })),
    /chưa được xác nhận/,
  );
  assert.equal(getBookingIssue(paidBooking()), "");
});

test("simulated check-in window opens 24 hours and closes 2 hours before departure", () => {
  const departure = new Date("2026-11-10T12:00:00");
  const openAt = new Date(
    departure.getTime() - CHECKIN_RULES.opensHoursBefore * 60 * 60 * 1000,
  );
  const closeAt = new Date(
    departure.getTime() - CHECKIN_RULES.closesHoursBefore * 60 * 60 * 1000,
  );
  const date = "2026-11-10";
  assert.equal(
    getCheckInWindow(date, "12:00", new Date(openAt.getTime() - 1)).state,
    "too-early",
  );
  assert.equal(getCheckInWindow(date, "12:00", openAt).state, "open");
  assert.equal(getCheckInWindow(date, "12:00", closeAt).state, "closed");
  assert.equal(getCheckInWindow("not-a-date", "12:00").state, "unknown");
});

test("blocks unavailable flights and recognizes completed check-ins", () => {
  assert.match(getFlightIssue({ status: "cancelled" }), /không đủ điều kiện/);
  assert.equal(getFlightIssue({ status: "active" }), "");
  const booking = paidBooking({
    checkIns: [{ id: "ref-1", passengerIndex: 0 }],
  });
  assert.equal(getCheckInRecord(booking, 0).id, "ref-1");
  assert.equal(getCheckInRecord(booking, 1), null);
  assert.equal(
    getCheckInRecord(paidBooking({ status: "Đã check-in" }), 0).legacy,
    true,
  );
  assert.equal(
    getCheckInRecord(
      paidBooking({
        status: "Đã check-in",
        checkIns: [{ id: "partial-ref", passengerIndex: 1 }],
      }),
      0,
    ).legacy,
    true,
  );
});
