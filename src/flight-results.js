import { flights } from './flights.js'

export function renderFlightResults() {
  const flightList = flights.map(flight => `
    <div class="flight-card">
      <div class="airline">${flight.airline}</div>

      <div class="info">
        <span>${flight.from} → ${flight.to}</span>
        <span>${flight.departure} - ${flight.arrival}</span>
      </div>

      <div class="info">
        <span class="price">${flight.price.toLocaleString()} VNĐ</span>
        <button onclick="bookFlight()">Đặt vé</button>
      </div>
    </div>
  `).join('')

  return `
    <section class="section">
      <div class="container">
        <h2>Kết quả tìm kiếm chuyến bay</h2>
        ${flightList}
      </div>
    </section>
  `
}

window.bookFlight = function () {
  alert('Đặt vé thành công!')
  window.location.hash = ''
  location.reload()
}