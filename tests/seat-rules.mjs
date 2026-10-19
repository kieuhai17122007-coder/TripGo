import assert from "node:assert/strict";
import * as s from "../src/js/seat-store.js";
const data = new Map();
globalThis.localStorage = {
  getItem: (k) => data.get(k) || null,
  setItem: (k, v) => data.set(k, v),
};
assert.match(s.groupError(["1A", "1C"]), /1B/);
assert.equal(s.groupError(["1A", "1B"]), "");
assert.equal(s.groupError(["1C", "1D"]), "");
assert.match(s.groupError(["1C"], new Set(["1A"]), true), /1B/);
assert.equal(s.groupError(["1A"], new Set(["1C"]), false), "");
assert.equal(s.groupError(["2A", "2B", "3D", "3E"]), "");
const f = { id: "TG101", date: "2026-10-10", passengers: 2 };
localStorage.setItem(
  "tripgo_bookings",
  JSON.stringify([
    {
      flightId: f.id,
      date: f.date,
      seats: ["1A", "1B"],
      status: "confirmed",
      bookingCode: "TEST",
    },
  ]),
);
assert.equal(s.getSeatState(f).booked.has("1A"), true);
assert.equal(
  s.getSeatState({ ...f, date: "2026-10-11" }).booked.has("1A"),
  false,
);
assert.match(s.validateSelection(f, ["1A", "1B"]), /đã được đặt/);
assert.equal(s.validateSelection(f, ["2A", "2B"]), "");
localStorage.setItem(
  "tripgo_bookings",
  JSON.stringify([
    { flightId: f.id, date: f.date, seats: ["1A", "1B"], status: "Đã hủy" },
  ]),
);
assert.equal(s.getSeatState(f).booked.size, 0);
assert.equal(
  s.normalizeFlight({
    flightId: "TG101",
    passengers: 4,
    departureDate: "2026-10-10",
    totalPrice: 6000000,
  }).price,
  1500000,
);
for (let mask = 0; mask < 64; mask++) {
  const unavailable = new Set(
    s.LETTERS.filter((_, i) => mask & (1 << i)).map((c) => "1" + c),
  );
  for (let count = 1; count <= 9; count++) {
    const a = s.suggestSeats(count, unavailable);
    assert.equal(a.length, count);
    assert.equal(new Set(a).size, count);
    assert.equal(
      a.some((x) => unavailable.has(x)),
      false,
    );
    assert.equal(s.groupError(a, unavailable, true), "");
  }
}
assert.deepEqual(s.suggestSeats(1, new Set(s.ALL_SEATS)), []);
assert.equal(s.suggestSeats(120, new Set()).length, 120);
assert.deepEqual(s.suggestSeats(121, new Set()), []);
console.log(
  "Passed: contiguous groups, aisle, occupied/blocked seats, dates, cancellations, 576 automatic seat layouts, full cabin.",
);
