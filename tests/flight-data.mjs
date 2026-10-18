import assert from "node:assert/strict";
import {
  getFlightDuration,
  normalizeFlight,
} from "../src/js/flight-data.js";

assert.equal(getFlightDuration("12:43", "13:23"), "0 giờ 40 phút");
assert.equal(getFlightDuration("22:30", "00:40"), "2 giờ 10 phút");
assert.equal(getFlightDuration("invalid", "13:23"), "Thời gian chưa cập nhật");
assert.equal(
  normalizeFlight({
    id: "DADHUI02",
    departure: "12:43",
    arrival: "13:23",
    duration: "0 gi? 40 ph?t",
  }).duration,
  "0 giờ 40 phút",
);
assert.equal(
  normalizeFlight({
    id: "TG2001",
    departure: "06:53",
    arrival: "08:23",
    duration: "1 giờ 30 phút",
  }).duration,
  "1 giờ 30 phút",
);

console.log("Passed: flight duration calculation and corrupted saved duration recovery.");
