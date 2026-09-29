import { getFlights, escapeHTML } from './flight-store.js'
import { generateBookingCode, saveBooking } from './booking.js'

const format = amount => Number(amount).toLocaleString('vi-VN') + ' VNĐ'
const readSearch = () => { try { return JSON.parse(localStorage.getItem('tripgo_search')) || {} } catch { return {} } }
const search = readSearch()
const available = () => getFlights().filter(f => f.status !== 'inactive' && f.status !== 'deleted')
const returnLink = '<a class="back-link" href="/">← Về trang chủ</a>'

export function renderFlightResults() {
  if (!search.from || !search.to || !search.departure) return `<main class="section"><div class="container">${returnLink}<h1>Chưa có thông tin tìm kiếm</h1><p>Hãy chọn điểm đi, điểm đến và ngày bay.</p></div></main>`
  const [minPrice, maxPrice] = search.priceRange ? search.priceRange.split('-').map(Number) : [0, Infinity]
  const matchesTime = f => !search.departureTime || (search.departureTime === 'morning' && +f.departure.slice(0, 2) < 12) || (search.departureTime === 'afternoon' && +f.departure.slice(0, 2) >= 12 && +f.departure.slice(0, 2) < 18) || (search.departureTime === 'evening' && +f.departure.slice(0, 2) >= 18)
  const matches = available().filter(f => f.from === search.from && f.to === search.to && f.date === search.departure && Number(f.seats ?? 99) >= Number(search.passengers || 1) && f.price >= minPrice && f.price <= maxPrice && (!search.airline || f.airline === search.airline) && matchesTime(f))
  const sorts = { priceAsc: (a, b) => a.price - b.price, priceDesc: (a, b) => b.price - a.price, timeAsc: (a, b) => a.departure.localeCompare(b.departure), timeDesc: (a, b) => b.departure.localeCompare(a.departure) }
  if (sorts[search.sortBy]) matches.sort(sorts[search.sortBy])
  return `<main class="section"><div class="container results-wrap">${returnLink}<div class="section-heading"><span class="eyebrow dark">CHUYẾN BAY</span><h1>Kết quả tìm kiếm</h1><p>${escapeHTML(search.from)} → ${escapeHTML(search.to)} · ${escapeHTML(search.departure)} · ${Number(search.passengers || 1)} hành khách</p></div>${matches.length ? matches.map(f => `<article class="result-card"><div><span class="eyebrow dark">${escapeHTML(f.airline)}</span><h2>${escapeHTML(f.from)} → ${escapeHTML(f.to)}</h2><p>${escapeHTML(f.date)} · ${escapeHTML(f.departure)} – ${escapeHTML(f.arrival)}</p><p>${Number(f.seats ?? 99)} chỗ còn lại</p></div><div class="result-actions"><strong>${format(f.price)}</strong><button class="primary-btn" data-book="${escapeHTML(f.id)}">Chọn vé</button></div></article>`).join('') : '<div class="result-card">Không tìm thấy chuyến bay phù hợp. Bạn có thể đổi ngày hoặc bộ lọc.</div>'}<div id="bookingStep" aria-live="polite"></div></div></main>`
}

export function initFlightResults() {
  const step = document.querySelector('#bookingStep')
  if (!step) return
  document.querySelectorAll('[data-book]').forEach(button => button.addEventListener('click', () => {
    const flight = available().find(f => f.id === button.dataset.book)
    if (!flight) { step.textContent = 'Chuyến bay không còn mở bán.'; return }
    const count = Number(search.passengers || 1)
    step.innerHTML = `<div class="booking-panel"><h2>Thông tin hành khách</h2><p>${escapeHTML(flight.id)} · ${escapeHTML(flight.from)} → ${escapeHTML(flight.to)} · ${format(flight.price)} / khách</p><form id="passengerForm" novalidate>${Array.from({ length: count }, (_, index) => `<div class="passenger-row"><label class="field"><span>Họ tên hành khách ${index + 1}</span><input name="name${index}" required maxlength="70" placeholder="Nguyễn Văn A"></label><label class="field"><span>Số điện thoại ${index + 1}</span><input name="phone${index}" type="tel" required inputmode="numeric" maxlength="11" placeholder="0901234567"></label></div>`).join('')}<label class="field"><span>Email liên hệ</span><input name="email" type="email" required placeholder="email@example.com"></label><p class="form-error" role="alert"></p><button class="primary-btn" type="submit">Xem xác nhận</button></form></div>`
    step.scrollIntoView({ behavior: 'smooth', block: 'start' })
    step.querySelector('form').addEventListener('submit', event => {
      event.preventDefault()
      const form = event.currentTarget, passengers = []
      for (let index = 0; index < count; index++) {
        const name = form.elements[`name${index}`].value.trim()
        const phone = form.elements[`phone${index}`].value.trim()
        if (name.length < 2 || !/^(0|\+84)\d{9}$/.test(phone)) { form.querySelector('.form-error').textContent = 'Kiểm tra họ tên và số điện thoại của từng hành khách.'; return }
        passengers.push({ name, phone })
      }
      const email = form.elements.email.value.trim()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { form.querySelector('.form-error').textContent = 'Email liên hệ không hợp lệ.'; return }
      const latest = available().find(f => f.id === flight.id)
      if (!latest || Number(latest.seats ?? 99) < count) { form.querySelector('.form-error').textContent = 'Chuyến bay không còn đủ chỗ.'; return }
      step.innerHTML = `<div class="booking-panel"><h2>Xác nhận đặt vé</h2><p><b>${escapeHTML(latest.airline)}</b> · ${escapeHTML(latest.from)} → ${escapeHTML(latest.to)}</p><p>${escapeHTML(latest.date)} · ${escapeHTML(latest.departure)} – ${escapeHTML(latest.arrival)}</p><p>Hành khách: ${passengers.map(p => escapeHTML(p.name)).join(', ')}</p><p>Email: ${escapeHTML(email)}</p><p><b>Tổng tiền mô phỏng: ${format(latest.price * count)}</b></p><p>Đây là bài tập, không có thanh toán thật.</p><button class="primary-btn" id="confirmBooking">Xác nhận đặt vé</button> <button class="secondary-btn" id="editPassengers">Sửa thông tin</button></div>`
      step.querySelector('#editPassengers').addEventListener('click', () => button.click())
      step.querySelector('#confirmBooking').addEventListener('click', () => {
        const current = available().find(f => f.id === latest.id)
        if (!current || Number(current.seats ?? 99) < count) { step.innerHTML = '<div class="booking-panel">Chuyến bay đã hết chỗ. Vui lòng tìm chuyến khác.</div>'; return }
        const bookingCode = generateBookingCode()
        saveBooking({ bookingCode, flightId: current.id, airline: current.airline, from: current.from, to: current.to, date: current.date, departure: current.departure, arrival: current.arrival, price: Number(current.price), passengers: count, passengerDetails: passengers, email, totalPrice: Number(current.price) * count, classType: search.classType || 'Phổ thông', status: 'confirmed', createdAt: new Date().toISOString() })
        const all = getFlights(), index = all.findIndex(f => f.id === current.id)
        if (index >= 0 && Number.isFinite(Number(all[index].seats))) { all[index].seats = Number(all[index].seats) - count; localStorage.setItem('tripgo_flights', JSON.stringify(all)) }
        step.innerHTML = `<div class="booking-panel"><h2>Đặt vé thành công</h2><p>Mã đặt vé: <b>${escapeHTML(bookingCode)}</b></p><p>Lưu mã này để tra cứu hoặc hủy vé.</p><a class="primary-btn" href="/#booking-search">Tra cứu vé</a></div>`
      }, { once: true })
    })
  }))
}
