import "./auth.js";
import flightCatalog from "../data/flights.json";
import {
  buildRouteFlightOptions,
  matchesFlightSearch,
  mergeFlightCatalog,
  normalizeFlight,
} from "./flight-data.js";

if (window.TripGoAuth.requireLogin()) {
  window.TripGoAuth.updateAuthUI();

  const defaultFlights = flightCatalog.map(normalizeFlight).filter(Boolean);
  let flights = defaultFlights;

  function readFlights() {
    try {
      const savedFlights = localStorage.getItem("tripgo_flights");

      if (savedFlights === null) {
        flights = defaultFlights;
        return;
      }

      const parsedFlights = JSON.parse(savedFlights);

      if (!Array.isArray(parsedFlights)) {
        throw new TypeError("Danh sách chuyến bay không hợp lệ.");
      }

      const saved = parsedFlights
        .map((flight, index) => {
          const normalized = normalizeFlight(flight);
          if (!normalized) {
            console.warn(
              `Bỏ qua dữ liệu chuyến bay không hợp lệ ở vị trí ${index}.`,
            );
          }
          return normalized;
        })
        .filter(Boolean);
      flights = mergeFlightCatalog(defaultFlights, saved);
    } catch (error) {
      console.error("Không thể đọc dữ liệu chuyến bay:", error);
      flights = defaultFlights;
    }
  }

  const fromInput = document.getElementById("from");
  const toInput = document.getElementById("to");
  const departureInput = document.getElementById("departure");
  const returnInput = document.getElementById("returnDate");
  const returnGroup = document.getElementById("returnGroup");
  const passengersInput = document.getElementById("passengers");
  const ticketClassInput = document.getElementById("ticketClass");
  const searchButton = document.getElementById("searchButton");
  const errorBox = document.getElementById("error");
  const resultTitle = document.getElementById("resultTitle");
  const flightResults = document.getElementById("flightResults");

  const tripTypeInputs = document.querySelectorAll('input[name="tripType"]');

  returnGroup.style.display = "none";

  readFlights();

  const searchParams = new URLSearchParams(window.location.search);

  if (searchParams.has("from")) {
    fromInput.value = searchParams.get("from");
  }

  if (searchParams.has("to")) {
    toInput.value = searchParams.get("to");
  }

  if (searchParams.has("departure")) {
    departureInput.value = searchParams.get("departure");
  }

  if (searchParams.has("returnDate")) {
    returnInput.value = searchParams.get("returnDate");
  }

  if (searchParams.has("passengers")) {
    passengersInput.value = searchParams.get("passengers");
  }

  if (searchParams.has("ticketClass")) {
    ticketClassInput.value = searchParams.get("ticketClass");
  }

  function getToday() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function updateDateLimits() {
    const today = getToday();

    departureInput.min = today;

    if (!departureInput.value || departureInput.value < today) {
      departureInput.value = today;
    }

    returnInput.min = departureInput.value;

    if (returnInput.value && returnInput.value < returnInput.min) {
      returnInput.value = "";
    }
  }

  function updateTripType() {
    const selectedTripType = document.querySelector(
      'input[name="tripType"]:checked',
    );

    if (selectedTripType && selectedTripType.value === "roundtrip") {
      returnGroup.style.display = "flex";
    } else {
      returnGroup.style.display = "none";
      returnInput.value = "";
    }

    updateDateLimits();
  }

  tripTypeInputs.forEach(function (radio) {
    radio.addEventListener("change", updateTripType);
  });

  if (searchParams.has("tripType")) {
    const tripType = Array.from(tripTypeInputs).find(
      (radio) => radio.value === searchParams.get("tripType"),
    );

    if (tripType) {
      tripType.checked = true;
    }
  }

  updateTripType();

  departureInput.addEventListener("change", function () {
    updateDateLimits();
    clearError();
  });

  returnInput.addEventListener("change", function () {
    const returnDate = returnInput.value;
    if (returnDate && returnDate < getToday()) {
      returnInput.value = "";
      showError("Ngày về không được ở trong quá khứ.");
      returnInput.focus();
      return;
    }

    if (returnDate && returnDate < departureInput.value) {
      returnInput.value = "";
      showError("Ngày về phải từ ngày đi trở đi.");
      returnInput.focus();
      return;
    }

    clearError();
  });

  searchButton.addEventListener("click", searchFlights);

  if (searchParams.has("departure")) {
    searchFlights();
  }

  function searchFlights() {
    clearError();
    updateDateLimits();

    const from = fromInput.value;
    const to = toInput.value;
    const departure = departureInput.value;
    const returnDate = returnInput.value;
    const passengers = Number(passengersInput.value);
    const ticketClass = ticketClassInput.value;

    const selectedTripType = document.querySelector(
      'input[name="tripType"]:checked',
    );

    if (!selectedTripType) {
      showError("Vui lòng chọn loại vé.");
      return;
    }

    const tripType = selectedTripType.value;
    const today = getToday();

    if (!from) {
      showError("Vui lòng chọn điểm đi.");
      return;
    }

    if (!to) {
      showError("Vui lòng chọn điểm đến.");
      return;
    }

    if (from === to) {
      showError("Điểm đi và điểm đến không được giống nhau.");
      return;
    }

    if (!departure) {
      showError("Vui lòng chọn ngày đi.");
      return;
    }

    if (departure < today) {
      showError("Ngày đi không được ở trong quá khứ.");
      return;
    }

    if (tripType === "roundtrip" && !returnDate) {
      showError("Vui lòng chọn ngày về.");
      return;
    }

    if (tripType === "roundtrip" && returnDate < today) {
      showError("Ngày về không được ở trong quá khứ.");
      return;
    }

    if (tripType === "roundtrip" && returnDate < departure) {
      showError("Ngày về phải từ ngày đi trở đi.");
      return;
    }

    const result = buildRouteFlightOptions(flights, {
      from,
      to,
      departure,
      passengers,
    });

    displayFlights(
      result,
      passengers,
      ticketClass,
      departure,
      returnDate,
      tripType,
    );
  }

  function displayFlights(
    result,
    passengers,
    ticketClass,
    departure,
    returnDate,
    tripType,
  ) {
    if (result.length === 0) {
      resultTitle.textContent = "Không tìm thấy chuyến bay";

      flightResults.innerHTML = `
            <div class="empty-result">
                <div class="empty-icon">✈</div>
                <h3>Không có chuyến bay</h3>
                <p>
                    Lịch bay demo chỉ có một số tuyến và ngày nhất định; website chưa kết nối API chuyến bay trực tiếp.
                    Hãy thử ngày/tuyến khác hoặc nhờ quản trị viên thêm lịch bay.
                </p>
            </div>
        `;

      return;
    }

    resultTitle.textContent = `Tìm thấy ${result.length} chuyến bay`;
    flightResults.innerHTML = "";

    result.forEach(function (flight) {
      let className = "Phổ thông";
      let classMultiplier = 1;

      if (ticketClass === "business") {
        className = "Thương gia";
        classMultiplier = 1.8;
      }

      const totalPrice = flight.price * classMultiplier * passengers;
      const card = document.createElement("div");

      card.className = "flight-card";

      const duration =
        flight.duration || getFlightDuration(flight.departure, flight.arrival);

      card.innerHTML = `
            <div class="flight-top">
                <div>
                    <div class="airline">${escapeHtml(flight.airline)}</div>
                    <div class="flight-number">
                        Chuyến bay ${escapeHtml(flight.id)}
                    </div>
                </div>
            </div>

            <div class="flight-content">
                <div>
                    <div class="flight-time">
                        ${escapeHtml(flight.departure)}
                    </div>
                    <div class="airport">
                        ${escapeHtml(getAirportName(flight.from))}
                    </div>
                </div>

                <div class="route">
                    <div class="duration">${escapeHtml(duration)}</div>
                    <div class="route-line"></div>
                    <div class="direct">Bay thẳng</div>
                </div>

                <div>
                    <div class="flight-time">
                        ${escapeHtml(flight.arrival)}
                    </div>
                    <div class="airport">
                        ${escapeHtml(getAirportName(flight.to))}
                    </div>
                </div>

                <div class="flight-price">
                    <div class="price">${formatPrice(totalPrice)}</div>
                    <div class="price-note">${passengers} hành khách</div>
                    <div class="class-name">${className}</div>
                    <button type="button" class="select-button">
                        CHỌN CHUYẾN BAY
                    </button>
                </div>
            </div>
        `;

      const selectButton = card.querySelector(".select-button");

      selectButton.addEventListener("click", function () {
        selectFlight(
          flight,
          passengers,
          ticketClass,
          departure,
          returnDate,
          tripType,
          totalPrice,
        );
      });

      flightResults.appendChild(card);
    });
  }

  function selectFlight(
    flight,
    passengers,
    ticketClass,
    departure,
    returnDate,
    tripType,
    totalPrice,
  ) {
    const selectedFlight = {
      flightId: flight.id,
      airline: flight.airline,
      from: flight.from,
      to: flight.to,
      departureDate: departure,
      returnDate: tripType === "roundtrip" ? returnDate : "",
      tripType: tripType,
      departureTime: flight.departure,
      arrivalTime: flight.arrival,
      duration:
        flight.duration || getFlightDuration(flight.departure, flight.arrival),
      passengers: passengers,
      ticketClass: ticketClass,
      basePrice: flight.price,
      totalPrice: totalPrice,
    };

    localStorage.setItem(
      "tripgo_selected_flight",
      JSON.stringify({
        ...selectedFlight,
        id: flight.id,
        date: departure,
        departure: flight.departure,
        arrival: flight.arrival,
        price: totalPrice / passengers,
        search: {
          passengers: passengers,
          departure: departure,
          classType: ticketClass === "business" ? "Thương gia" : "Phổ thông",
        },
      }),
    );

    localStorage.removeItem("tripgo_selected_seats");
    localStorage.removeItem("tripgo_selected_seat");
    localStorage.removeItem("tripgo_selected_seat_flight");

    window.location.href = "/src/pages/passenger.html";
  }

  function getFlightDuration(departure, arrival) {
    if (!departure || !arrival) {
      return "Thời gian chưa cập nhật";
    }

    const [departureHour, departureMinute] = departure.split(":").map(Number);

    const [arrivalHour, arrivalMinute] = arrival.split(":").map(Number);

    let minutes =
      arrivalHour * 60 + arrivalMinute - (departureHour * 60 + departureMinute);

    if (minutes < 0) {
      minutes += 24 * 60;
    }

    return `${Math.floor(minutes / 60)} giờ ${minutes % 60} phút`;
  }

  function getAirportName(code) {
    const airports = {
      HAN: "Hà Nội",
      SGN: "TP. Hồ Chí Minh",
      DAD: "Đà Nẵng",
      PQC: "Phú Quốc",
      CXR: "Nha Trang",
      HPH: "Hải Phòng",
      HUI: "Huế",
      VCA: "Cần Thơ",
      UIH: "Quy Nhơn",
      VDO: "Vân Đồn",
    };

    return airports[code] || code;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[character],
    );
  }

  window.addEventListener("storage", function (event) {
    if (event.key === "tripgo_flights") {
      readFlights();

      if (departureInput.value) {
        searchFlights();
      }
    }
  });

  function formatPrice(price) {
    return new Intl.NumberFormat("vi-VN").format(price) + " VNĐ";
  }

  function showError(message) {
    errorBox.textContent = message;
  }

  function clearError() {
    errorBox.textContent = "";
  }
}
