import "./auth.js";
import flightCatalog from "../data/flights.json";
import {
  buildRouteFlightOptions,
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

      const saved = parsedFlights.map(normalizeFlight).filter(Boolean);

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

  if (
    !fromInput ||
    !toInput ||
    !departureInput ||
    !returnInput ||
    !returnGroup ||
    !passengersInput ||
    !ticketClassInput ||
    !searchButton ||
    !errorBox ||
    !resultTitle ||
    !flightResults
  ) {
    console.error("Không tìm thấy đầy đủ phần tử của trang tìm chuyến bay.");
  } else {
    initializeSearch();
  }

  function initializeSearch() {
    returnGroup.style.display = "none";
    readFlights();

    const searchParams = new URLSearchParams(window.location.search);

    [
      ["from", fromInput],
      ["to", toInput],
      ["departure", departureInput],
      ["returnDate", returnInput],
      ["passengers", passengersInput],
      ["ticketClass", ticketClassInput],
    ].forEach(([key, input]) => {
      if (searchParams.has(key)) {
        input.value = searchParams.get(key);
      }
    });

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

      if (selectedTripType?.value === "roundtrip") {
        returnGroup.style.display = "flex";
      } else {
        returnGroup.style.display = "none";
        returnInput.value = "";
      }

      updateDateLimits();
    }

    tripTypeInputs.forEach((radio) => {
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

    departureInput.addEventListener("change", () => {
      updateDateLimits();
      clearError();
    });

    returnInput.addEventListener("change", () => {
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
              Hãy thử tuyến bay hoặc ngày khác.
              Website chưa kết nối API chuyến bay trực tiếp.
            </p>
          </div>
        `;
        return;
      }

      resultTitle.textContent = `Tìm thấy ${result.length} chuyến bay`;
      flightResults.innerHTML = "";

      result.forEach((flight) => {
        const className =
          ticketClass === "business" ? "Thương gia" : "Phổ thông";
        const classMultiplier = ticketClass === "business" ? 1.8 : 1;
        const totalPrice = Number(flight.price) * classMultiplier * passengers;

        const card = document.createElement("div");
        card.className = "flight-card";

        const duration =
          flight.duration ||
          getFlightDuration(flight.departure, flight.arrival);

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

        card.querySelector(".select-button").addEventListener("click", () => {
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
        tripType,
        departureTime: flight.departure,
        arrivalTime: flight.arrival,
        duration:
          flight.duration ||
          getFlightDuration(flight.departure, flight.arrival),
        passengers,
        ticketClass,
        basePrice: flight.price,
        totalPrice,
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
            passengers,
            departure,
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

      const [dh, dm] = departure.split(":").map(Number);
      const [ah, am] = arrival.split(":").map(Number);

      let minutes = ah * 60 + am - (dh * 60 + dm);

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

    window.addEventListener("storage", (event) => {
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
}
