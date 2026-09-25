const flights = [
  {
    id: "TG001",
    airline: "Vietnam Airlines",
    from: "HAN",
    to: "DAD",
    departure: "06:30",
    arrival: "07:55",
    price: 1250000
  },
  {
    id: "TG002",
    airline: "Vietjet Air",
    from: "HAN",
    to: "SGN",
    departure: "08:00",
    arrival: "10:10",
    price: 1450000
  },
  {
    id: "TG003",
    airline: "Bamboo Airways",
    from: "HAN",
    to: "PQC",
    departure: "09:30",
    arrival: "11:40",
    price: 1750000
  }
];

const airportNames = {
  HAN: "Hà Nội",
  SGN: "TP. Hồ Chí Minh",
  DAD: "Đà Nẵng",
  PQC: "Phú Quốc"
};

function renderFlights(data) {
  const flightList = document.getElementById("flightList");

  if (!flightList) return;

  flightList.innerHTML = data.map(flight => `
    <div class="flight-card">
      <h3>${flight.airline}</h3>

      <p>
        ${airportNames[flight.from]}
        ➜
        ${airportNames[flight.to]}
      </p>

      <p>
        ${flight.departure}
        -
        ${flight.arrival}
      </p>

      <p>
        Giá:
        ${flight.price.toLocaleString("vi-VN")} VNĐ
      </p>

      <button data-id="${flight.id}">
        Đặt vé
      </button>
    </div>
  `).join("");

  document.querySelectorAll(".flight-card button").forEach(button => {
    button.addEventListener("click", () => {
      const id = button.dataset.id;

      const selectedFlight = flights.find(
        flight => flight.id === id
      );

      localStorage.setItem(
        "selectedFlight",
        JSON.stringify(selectedFlight)
      );

      alert(`Đã chọn chuyến bay ${id}`);
    });
  });
}

renderFlights(flights);