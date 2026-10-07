
function getBookingData() {
  const data = localStorage.getItem("tripgo_booking");

  if (!data) {
    return null;
  }

  try {
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

function formatMoney(value) {
  const number = Number(value) || 0;

  return number.toLocaleString("vi-VN") + " VNĐ";
}

function getValue(object, keys, defaultValue = "Chưa có") {
  if (!object) {
    return defaultValue;
  }

  for (const key of keys) {
    if (
      object[key] !== undefined &&
      object[key] !== null &&
      object[key] !== ""
    ) {
      return object[key];
    }
  }

  return defaultValue;
}

function renderConfirmation() {
  const container = document.getElementById("confirmationContent");

  const booking = getBookingData();

  if (!booking) {
    container.innerHTML = `
      <div class="empty">
        <h2>Không tìm thấy thông tin đặt vé</h2>
        <p>
          Vui lòng quay lại quá trình đặt vé và nhập lại thông tin.
        </p>

        <div class="actions">
          <a href="./index.html" class="btn btn-primary">
            Quay lại đặt vé
          </a>
        </div>
      </div>
    `;

    return;
  }

  const flight = booking.flight || {};
  const passenger = booking.passenger || booking.passengers?.[0] || {};
  const fare = booking.fare || {};
  const baggage = booking.baggage || {};

  const bookingCode = getValue(
    booking,
    ["bookingCode", "code", "reservationCode"],
    "TG000000"
  );

  const from = getValue(
    flight,
    ["from", "departure", "departureAirport", "fromCode"],
    "HAN"
  );

  const to = getValue(
    flight,
    ["to", "arrival", "arrivalAirport", "toCode"],
    "SGN"
  );

  const fromName = getValue(
    flight,
    ["fromName", "departureName", "departureAirportName"],
    ""
  );

  const toName = getValue(
    flight,
    ["toName", "arrivalName", "arrivalAirportName"],
    ""
  );

  const date = getValue(
    flight,
    ["date", "departureDate", "flightDate"],
    "Chưa có"
  );

  const departureTime = getValue(
    flight,
    ["departureTime", "startTime", "time"],
    "Chưa có"
  );

  const arrivalTime = getValue(
    flight,
    ["arrivalTime", "endTime"],
    "Chưa có"
  );

  const airline = getValue(
    flight,
    ["airline", "airlineName", "carrier"],
    "TripGo Airlines"
  );

  const flightNumber = getValue(
    flight,
    ["flightNumber", "code", "flightCode"],
    "TG000"
  );

  const passengerName = getValue(
    passenger,
    ["name", "fullName"],
    "Chưa có"
  );

  const passengerEmail = getValue(
    passenger,
    ["email"],
    "Chưa có"
  );

  const passengerPhone = getValue(
    passenger,
    ["phone", "phoneNumber"],
    "Chưa có"
  );

  const passengerDocument = getValue(
    passenger,
    ["document", "cccd", "passport"],
    "Chưa có"
  );

  const seat = getValue(
    booking,
    ["seat", "selectedSeat"],
    getValue(passenger, ["seat"], "Chưa chọn")
  );

  const fareName = getValue(
    fare,
    ["name", "fareName", "type", "class"],
    getValue(booking, ["fareName", "ticketType", "fareType"], "Chưa chọn")
  );

  const baggageName = getValue(
    baggage,
    ["name", "baggageName", "type"],
    getValue(booking, ["baggageName", "baggageType"], "Không có")
  );

  const basePrice = Number(
    getValue(
      booking,
      ["basePrice", "flightPrice", "ticketPrice", "price"],
      0
    )
  ) || 0;

  const farePrice = Number(
    getValue(
      fare,
      ["price", "surcharge", "extraPrice"],
      getValue(booking, ["farePrice", "fareSurcharge"], 0)
    )
  ) || 0;

  const baggagePrice = Number(
    getValue(
      baggage,
      ["price", "surcharge", "extraPrice"],
      getValue(booking, ["baggagePrice", "baggageSurcharge"], 0)
    )
  ) || 0;

  const totalPrice = Number(
    getValue(
      booking,
      ["totalPrice", "total", "finalPrice"],
      basePrice + farePrice + baggagePrice
    )
  ) || 0;

  container.innerHTML = `

    <div class="success-box">
      <strong>Thông tin đặt vé đã được ghi nhận</strong>

      <div>Mã đặt vé:</div>

      <div class="booking-code">
        ${bookingCode}
      </div>
    </div>

    <div class="section">

      <div class="section-title">
        Thông tin chuyến bay
      </div>

      <div class="section-content">

        <div class="flight-route">

          <div class="airport">
            <div class="airport-code">
              ${from}
            </div>

            <div class="airport-name">
              ${fromName}
            </div>

            <strong>${departureTime}</strong>
          </div>

          <div class="arrow">
            →
          </div>

          <div class="airport">
            <div class="airport-code">
              ${to}
            </div>

            <div class="airport-name">
              ${toName}
            </div>

            <strong>${arrivalTime}</strong>
          </div>

        </div>

        <br>

        <div class="info-grid">

          <div class="info-item">
            <div class="info-label">
              Hãng hàng không
            </div>

            <div class="info-value">
              ${airline}
            </div>
          </div>

          <div class="info-item">
            <div class="info-label">
              Số hiệu chuyến bay
            </div>

            <div class="info-value">
              ${flightNumber}
            </div>
          </div>

          <div class="info-item">
            <div class="info-label">
              Ngày bay
            </div>

            <div class="info-value">
              ${date}
            </div>
          </div>

        </div>

      </div>

    </div>

    <div class="section">

      <div class="section-title">
        Thông tin hành khách
      </div>

      <div class="section-content">

        <div class="info-grid">

          <div class="info-item">
            <div class="info-label">
              Họ và tên
            </div>

            <div class="info-value">
              ${passengerName}
            </div>
          </div>

          <div class="info-item">
            <div class="info-label">
              Email
            </div>

            <div class="info-value">
              ${passengerEmail}
            </div>
          </div>

          <div class="info-item">
            <div class="info-label">
              Số điện thoại
            </div>

            <div class="info-value">
              ${passengerPhone}
            </div>
          </div>

          <div class="info-item">
            <div class="info-label">
              CCCD / Hộ chiếu
            </div>

            <div class="info-value">
              ${passengerDocument}
            </div>
          </div>

        </div>

      </div>

    </div>

    <div class="section">

      <div class="section-title">
        Thông tin vé
      </div>

      <div class="section-content">

        <div class="info-grid">

          <div class="info-item">
            <div class="info-label">
              Hạng vé / Loại vé
            </div>

            <div class="info-value">
              ${fareName}
            </div>
          </div>

          <div class="info-item">
            <div class="info-label">
              Ghế
            </div>

            <div class="info-value">
              ${seat}
            </div>
          </div>

          <div class="info-item">
            <div class="info-label">
              Hành lý
            </div>

            <div class="info-value">
              ${baggageName}
            </div>
          </div>

        </div>

      </div>

    </div>

    <div class="section">

      <div class="section-title">
        Chi tiết thanh toán
      </div>

      <div class="section-content">

        <div class="price-row">
          <span>Giá vé</span>
          <strong>${formatMoney(basePrice)}</strong>
        </div>

        <div class="price-row">
          <span>Phụ thu hạng vé</span>
          <strong>${formatMoney(farePrice)}</strong>
        </div>

        <div class="price-row">
          <span>Phụ thu hành lý</span>
          <strong>${formatMoney(baggagePrice)}</strong>
        </div>

        <div class="total">
          <span>Tổng tiền</span>

          <span class="total-price">
            ${formatMoney(totalPrice)}
          </span>
        </div>

      </div>

    </div>

    <div class="actions">

      <button
        type="button"
        class="btn btn-secondary"
        onclick="goBack()"
      >
        Quay lại
      </button>

      <button
        type="button"
        class="btn btn-primary"
        onclick="confirmBooking()"
      >
        XÁC NHẬN ĐẶT VÉ
      </button>

    </div>
  `;
}

function goBack() {
  window.history.back();
}

function confirmBooking() {
  const booking = getBookingData();

  if (!booking) {
    alert("Không tìm thấy thông tin đặt vé.");
    return;
  }

  booking.status = "confirmed";
  booking.confirmedAt = new Date().toISOString();

  localStorage.setItem(
    "tripgo_booking",
    JSON.stringify(booking)
  );

  const bookingCode =
    booking.bookingCode ||
    booking.code ||
    "TG000000";

  alert(
    "Đặt vé thành công!\n\nMã đặt vé: " +
    bookingCode
  );

  window.location.href = "./booking.html";
}

document.addEventListener("DOMContentLoaded", function () {
  renderConfirmation();
});

