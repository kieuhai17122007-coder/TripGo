import { flights } from './flights.js'

export function renderFlightResults() {
  const search = JSON.parse(localStorage.getItem('tripgo_search'))

const [minPrice, maxPrice] = search.priceRange
  ? search.priceRange.split('-').map(Number)
  : [0, Infinity]
 const matchesTime = (flight) => {
  if (search.departureTime === '') return true

  const hour = Number(flight.departure.split(':')[0])

  if (search.departureTime === 'morning') {
    return hour < 12
  }

  if (search.departureTime === 'afternoon') {
    return hour >= 12 && hour < 18
  }

  if (search.departureTime === 'evening') {
    return hour >= 18
  }

  return true
}
const filteredFlights = flights.filter(flight =>
  flight.from === search.from &&
  flight.to === search.to &&
  flight.date === search.departure &&
  flight.seats >= Number(search.passengers) &&
  flight.price >= minPrice &&
  flight.price <= maxPrice &&
  (search.airline === '' || flight.airline === search.airline) &&
  matchesTime(flight)
)
  if (search.sortBy === 'priceAsc') {
  filteredFlights.sort((a, b) => a.price - b.price)
}

if (search.sortBy === 'priceDesc') {
  filteredFlights.sort((a, b) => b.price - a.price)
}

if (search.sortBy === 'timeAsc') {
  filteredFlights.sort((a, b) =>
    a.departure.localeCompare(b.departure)
  )
}

if (search.sortBy === 'timeDesc') {
  filteredFlights.sort((a, b) =>
    b.departure.localeCompare(a.departure)
  )
}
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
         <span>Còn ${flight.seats} chỗ</span>
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