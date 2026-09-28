import { flights } from './flights.js'

export function renderFlightResults() {
  const search = JSON.parse(localStorage.getItem('tripgo_search'))

  const filteredFlights = flights.filter(flight =>
  flight.from === search.from &&
  flight.to === search.to
)
  if (filteredFlights.length === 0) {
  return `
    <section class="section">
      <div class="container">
        <h2>Không tìm thấy chuyến bay phù hợp</h2>
      </div>
    </section>
  `
 }
  const flightList = filteredFlights.map(flight => `
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