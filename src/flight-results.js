import { flights } from './flights.js'
import { generateBookingCode, saveBooking } from './booking.js'

export function renderFlightResults() {
  const search = JSON.parse(localStorage.getItem('tripgo_search'))
  const getPrice = (flight) => {
  return search.classType === 'Thương gia'
    ? flight.businessPrice
    : flight.economyPrice
}

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
  getPrice(flight) >= minPrice &&
  getPrice(flight) <= maxPrice && 
  (search.airline === '' || flight.airline === search.airline) &&
  matchesTime(flight)
)
  if (search.sortBy === 'priceAsc') {
  filteredFlights.sort((a, b) =>
  getPrice(a) - getPrice(b)
)
}

if (search.sortBy === 'priceDesc') {
  filteredFlights.sort((a, b) =>
    getPrice(b) - getPrice(a)
  )
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
        <span class="price">${getPrice(flight).toLocaleString()} VNĐ</span>
        <button onclick="viewFlight('${flight.id}')">
             Xem chi tiết
        </button>
          <button onclick="bookFlight('${flight.id}')">
             Đặt vé
        </button>
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

window.bookFlight = function (id) {
  const flight = flights.find(f => f.id === id)
  const search = JSON.parse(localStorage.getItem('tripgo_search') || '{}')

  if (!flight) return

  const price =
    search.classType === 'Thương gia'
      ? flight.businessPrice
      : flight.economyPrice

  const bookingCode = generateBookingCode()
  const passengers = Number(search.passengers || 1)

  saveBooking({
    bookingCode,
    flightId: flight.id,
    airline: flight.airline,
    from: flight.from,
    to: flight.to,
    date: flight.date,
    departure: flight.departure,
    arrival: flight.arrival,
    price: price,
    passengers,
    totalPrice: price * passengers,
    classType: search.classType || 'Phổ thông',
    status: 'Đã đặt',
    createdAt: new Date().toISOString()
  })

  alert(`Đặt vé thành công!\nMã đặt vé: ${bookingCode}`)
  window.location.hash = ''
  location.reload()
}

window.viewFlight = function (id) {
  const flight = flights.find(f => f.id === id)
  const search = JSON.parse(localStorage.getItem('tripgo_search') || '{}')

  if (!flight) return

  const price =
    search.classType === 'Thương gia'
      ? flight.businessPrice
      : flight.economyPrice

  alert(`
Mã chuyến bay: ${flight.id}
Hãng: ${flight.airline}
Tuyến: ${flight.from} → ${flight.to}
Ngày bay: ${flight.date}
Giờ khởi hành: ${flight.departure}
Giờ hạ cánh: ${flight.arrival}
Hạng vé: ${search.classType || 'Phổ thông'}
Giá vé: ${price.toLocaleString()} VNĐ
Số ghế còn lại: ${flight.seats}
  `)
}