import { getBookings, getFlights, escapeHTML } from './flight-store.js'

export function renderBookingSearch() {
  return `<main class="section"><div class="container lookup-wrap"><a class="back-link" href="/">← Về trang chủ</a><div class="section-heading"><span class="eyebrow dark">TRA CỨU</span><h1>Tra cứu đặt vé</h1><p>Nhập mã đặt vé để xem chi tiết hoặc hủy đặt chỗ.</p></div><form class="search-box" id="bookingLookupForm" novalidate><label class="field"><span>Mã đặt vé</span><input id="bookingCode" maxlength="20" placeholder="Ví dụ: TG123456" required autocomplete="off"></label><button class="primary-btn" type="submit">Tra cứu vé</button></form><div id="bookingLookupResult" aria-live="polite"></div></div></main>`
}
export function initBookingSearch() {
  const form = document.querySelector('#bookingLookupForm')
  const result = document.querySelector('#bookingLookupResult')
  if (!form || !result) return
  let currentCode = ''
  const show = code => {
    currentCode = code
    const booking = getBookings().find(item => String(item.bookingCode || item.code || '').toUpperCase() === code)
    if (!booking) { result.innerHTML = '<div class="booking-panel">Không tìm thấy vé. Hãy kiểm tra lại mã đặt vé.</div>'; return }
    const cancelled = booking.status === 'cancelled' || booking.status === 'Đã hủy'
    const passengerList = booking.passengerDetails?.map(p => p.name).join(', ') || booking.passenger?.name || 'Chưa có thông tin'
    result.innerHTML = `<div class="booking-panel"><h2>Thông tin vé ${escapeHTML(code)}</h2><div class="lookup-grid"><p>Trạng thái: <b>${cancelled ? 'Đã hủy' : booking.status === 'pending' ? 'Chờ thanh toán' : 'Đã đặt'}</b></p><p>Hãng: <b>${escapeHTML(booking.airline || booking.flight?.airline || '-')}</b></p><p>Hành trình: <b>${escapeHTML(booking.from || booking.flight?.from || '-')} → ${escapeHTML(booking.to || booking.flight?.to || '-')}</b></p><p>Ngày bay: <b>${escapeHTML(booking.date || booking.departureDate || '-')}</b></p><p>Giờ bay: <b>${escapeHTML(booking.departure || booking.flight?.departure || '-')} – ${escapeHTML(booking.arrival || booking.flight?.arrival || '-')}</b></p><p>Hành khách: <b>${escapeHTML(passengerList)}</b></p><p>Số lượng: <b>${Number(booking.passengers || 1)}</b></p><p>Hạng vé: <b>${escapeHTML(booking.classType || 'Phổ thông')}</b></p><p>Tổng tiền: <b>${Number(booking.totalPrice ?? booking.total ?? 0).toLocaleString('vi-VN')} VNĐ</b></p></div>${cancelled ? '' : '<button class="secondary-btn" id="cancelBooking">Hủy vé</button>'}</div>`
    result.querySelector('#cancelBooking')?.addEventListener('click', () => {
      if (!confirm(`Bạn có chắc muốn hủy vé ${code}?`)) return
      const bookings = getBookings(), index = bookings.findIndex(b => String(b.bookingCode || b.code).toUpperCase() === code)
      if (index < 0 || bookings[index].status === 'cancelled') return
      bookings[index].status = 'cancelled'; bookings[index].cancelledAt = new Date().toISOString()
      localStorage.setItem('tripgo_bookings', JSON.stringify(bookings))
      const all = getFlights(), flightIndex = all.findIndex(f => f.id === bookings[index].flightId)
      if (flightIndex >= 0 && Number.isFinite(Number(all[flightIndex].seats))) { all[flightIndex].seats = Number(all[flightIndex].seats) + Number(bookings[index].passengers || 1); localStorage.setItem('tripgo_flights', JSON.stringify(all)) }
      show(code)
    })
  }
  form.addEventListener('submit', event => { event.preventDefault(); const code = document.querySelector('#bookingCode').value.trim().toUpperCase(); if (!code) { result.textContent = 'Vui lòng nhập mã đặt vé.'; return } show(code) })
}
