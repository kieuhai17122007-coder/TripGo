import { getFlights, escapeHTML } from './flight-store.js'
import { generateBookingCode, saveBooking } from './booking.js'

const format = amount => Number(amount).toLocaleString('vi-VN') + ' VNĐ'

const readSearch = () => {
  try {
    return JSON.parse(localStorage.getItem('tripgo_search')) || {}
  } catch {
    return {}
  }
}

const getAvailableFlights = () => getFlights().filter(flight => flight.status !== 'inactive')

export function renderFlightResults() {
  const search = readSearch()

  if (!search.from || !search.to || !search.departure) {
    return `
      <main class="section">
        <div class="container">
          <a class="back-link" href="#top">← Về trang chủ</a>
          <h1>Chưa có thông tin tìm kiếm</h1>
          <p>Hãy chọn điểm đi, điểm đến và ngày bay.</p>
        </div>
      </main>
    `
  }

  const [minPrice, maxPrice] = search.priceRange
    ? search.priceRange.split('-').map(Number)
    : [0, Infinity]

  const matchesTime = (flight) => {
    if (!search.departureTime) return true

    const hour = Number(flight.departure.split(':')[0])

    if (search.departureTime === 'morning') return hour < 12
    if (search.departureTime === 'afternoon') return hour >= 12 && hour < 18
    if (search.departureTime === 'evening') return hour >= 18
    return true
  }

  const matches = getAvailableFlights().filter((flight) => {
    if (flight.from !== search.from || flight.to !== search.to || flight.date !== search.departure) return false
    if (Number(flight.seats ?? 99) < Number(search.passengers || 1)) return false
    if (search.airline && flight.airline !== search.airline) return false
    if (flight.price < minPrice || flight.price > maxPrice) return false
    if (!matchesTime(flight)) return false

    return true
  })

  const sorters = {
    priceAsc: (a, b) => a.price - b.price,
    priceDesc: (a, b) => b.price - a.price,
    timeAsc: (a, b) => a.departure.localeCompare(b.departure),
    timeDesc: (a, b) => b.departure.localeCompare(a.departure),
  }

  if (sorters[search.sortBy]) matches.sort(sorters[search.sortBy])

  return `
    <main class="section">
      <div class="container results-wrap">
        <a class="back-link" href="#top">← Về trang chủ</a>
        <div class="section-heading">
          <span class="eyebrow dark">CHUYẾN BAY</span>
          <h1>Kết quả tìm kiếm</h1>
          <p>${escapeHTML(search.from)} → ${escapeHTML(search.to)} · ${escapeHTML(search.departure)} · ${Number(search.passengers || 1)} hành khách</p>
        </div>

        ${matches.length
          ? matches.map((flight) => `
            <article class="result-card">
              <div>
                <span class="eyebrow dark">${escapeHTML(flight.airline)}</span>
                <h2>${escapeHTML(flight.from)} → ${escapeHTML(flight.to)}</h2>
                <p>${escapeHTML(flight.date)} · ${escapeHTML(flight.departure)} – ${escapeHTML(flight.arrival)}</p>
                <p>${Number(flight.seats ?? 99)} chỗ còn lại</p>
              </div>
              <div class="result-actions">
                <strong>${format(flight.price)}</strong>
                <button class="primary-btn" data-book="${escapeHTML(flight.id)}">Chọn vé</button>
              </div>
            </article>
          `).join('')
          : '<div class="result-card">Không tìm thấy chuyến bay phù hợp. Bạn có thể đổi ngày hoặc bộ lọc.</div>'}

        <div id="bookingStep" aria-live="polite"></div>
      </div>
    </main>
  `
}

export function initFlightResults() {
  const step = document.querySelector('#bookingStep')
  if (!step) return

  document.querySelectorAll('[data-book]').forEach((button) => {
    button.addEventListener('click', () => {
      const search = readSearch()
      const flight = getAvailableFlights().find(item => item.id === button.dataset.book)

      if (!flight) {
        step.textContent = 'Chuyến bay không còn mở bán.'
        return
      }

      const count = Number(search.passengers || 1)

      step.innerHTML = `
        <div class="booking-panel">
          <h2>Thông tin hành khách</h2>
          <p>${escapeHTML(flight.id)} · ${escapeHTML(flight.from)} → ${escapeHTML(flight.to)} · ${format(flight.price)} / khách</p>
          <form id="passengerForm" novalidate>
            ${Array.from({ length: count }, (_, index) => `
              <div class="passenger-row">
                <label class="field">
                  <span>Họ tên hành khách ${index + 1}</span>
                  <input name="name${index}" required maxlength="70" placeholder="Nguyễn Văn A">
                </label>
                <label class="field">
                  <span>Số điện thoại ${index + 1}</span>
                  <input name="phone${index}" type="tel" required inputmode="numeric" maxlength="11" placeholder="0901234567">
                </label>
              </div>
            `).join('')}
            <label class="field">
              <span>Email liên hệ</span>
              <input name="email" type="email" required placeholder="email@example.com">
            </label>
            <p class="form-error" role="alert"></p>
            <button class="primary-btn" type="submit">Xem xác nhận</button>
          </form>
        </div>
      `

      const form = step.querySelector('#passengerForm')
      form.addEventListener('submit', (event) => {
        event.preventDefault()

        const passengers = []
        for (let index = 0; index < count; index += 1) {
          const name = form.elements[`name${index}`].value.trim()
          const phone = form.elements[`phone${index}`].value.trim()

          if (name.length < 2 || !/^(0|\+84)\d{9}$/.test(phone)) {
            form.querySelector('.form-error').textContent = 'Kiểm tra họ tên và số điện thoại của từng hành khách.'
            return
          }

          passengers.push({ name, phone })
        }

        const email = form.elements.email.value.trim()
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          form.querySelector('.form-error').textContent = 'Email liên hệ không hợp lệ.'
          return
        }

        const latest = getAvailableFlights().find(item => item.id === flight.id)
        if (!latest || Number(latest.seats ?? 99) < count) {
          form.querySelector('.form-error').textContent = 'Chuyến bay không còn đủ chỗ.'
          return
        }

        step.innerHTML = `
          <div class="booking-panel">
            <h2>Xác nhận đặt vé</h2>
            <p><b>${escapeHTML(latest.airline)}</b> · ${escapeHTML(latest.from)} → ${escapeHTML(latest.to)}</p>
            <p>${escapeHTML(latest.date)} · ${escapeHTML(latest.departure)} – ${escapeHTML(latest.arrival)}</p>
            <p>Hành khách: ${passengers.map(passenger => escapeHTML(passenger.name)).join(', ')}</p>
            <p>Email: ${escapeHTML(email)}</p>
            <p><b>Tổng tiền mô phỏng: ${format(latest.price * count)}</b></p>
            <p>Đây là bài tập, không có thanh toán thật.</p>
            <button class="primary-btn" id="confirmBooking">Xác nhận đặt vé</button>
            <button class="secondary-btn" id="editPassengers">Sửa thông tin</button>
          </div>
        `

        const editBtn = step.querySelector('#editPassengers')
        const confirmBtn = step.querySelector('#confirmBooking')

        editBtn.addEventListener('click', () => button.click())

        confirmBtn.addEventListener('click', () => {
          const current = getAvailableFlights().find(item => item.id === latest.id)
          if (!current || Number(current.seats ?? 99) < count) {
            step.innerHTML = '<div class="booking-panel">Chuyến bay đã hết chỗ. Vui lòng tìm chuyến khác.</div>'
            return
          }

          const bookingCode = generateBookingCode()
          const booking = {
            bookingCode,
            flightId: current.id,
            airline: current.airline,
            from: current.from,
            to: current.to,
            date: current.date,
            departure: current.departure,
            arrival: current.arrival,
            price: Number(current.price),
            passengers: count,
            passengerDetails: passengers,
            email,
            totalPrice: Number(current.price) * count,
            classType: search.classType || 'Phổ thông',
            status: 'confirmed',
            createdAt: new Date().toISOString(),
          }

          saveBooking(booking)

          const allFlights = getFlights()
          const index = allFlights.findIndex(item => item.id === current.id)
          if (index >= 0 && Number.isFinite(Number(allFlights[index].seats))) {
            allFlights[index].seats = Number(allFlights[index].seats) - count
            localStorage.setItem('tripgo_flights', JSON.stringify(allFlights))
          }

          step.innerHTML = `
            <div class="booking-panel">
              <h2>Đặt vé thành công</h2>
              <p>Mã đặt vé: <b>${escapeHTML(bookingCode)}</b></p>
              <p>Lưu mã này để tra cứu hoặc hủy vé.</p>
              <a class="primary-btn" href="#booking-search">Tra cứu vé</a>
            </div>
          `
        }, { once: true })
      })
    })
  })
}
