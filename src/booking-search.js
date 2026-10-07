import { getBookings, getFlights, escapeHTML } from './flight-store.js'
=======
export function renderBookingSearch() {
  return `
    <main>
      <section class="section">
        <div class="container">
          <a href="#top">← Về trang chủ</a>

          <div class="section-heading">
            <span class="eyebrow dark">TRA CỨU</span>
            <h2>Tra cứu đặt vé</h2>
            <p>Nhập mã đặt vé để kiểm tra vé của bạn.</p>
          </div>

          <form class="search-box" id="bookingLookupForm" novalidate>
            <label class="field">
              <span>Mã đặt vé</span>
              <input
                type="text"
                id="bookingCode"
                maxlength="8"
                placeholder="Ví dụ: TG123456"
                autocomplete="off"
                required
              >
            </label>

            <button class="primary-btn search-btn" type="submit">
              TRA CỨU VÉ
            </button>
          </form>

export function renderBookingSearch() {
  return `<main class="section"><div class="container lookup-wrap"><a class="back-link" href="/">← Về trang chủ</a><div class="section-heading"><span class="eyebrow dark">TRA CỨU</span><h1>Tra cứu đặt vé</h1><p>Nhập mã đặt vé để xem chi tiết hoặc hủy đặt chỗ.</p></div><form class="search-box" id="bookingLookupForm" novalidate><label class="field"><span>Mã đặt vé</span><input id="bookingCode" maxlength="20" placeholder="Ví dụ: TG123456" required autocomplete="off"></label><button class="primary-btn" type="submit">Tra cứu vé</button></form><div id="bookingLookupResult" aria-live="polite"></div></div></main>`
}

function renderBookingDetails(result, booking) {
  const createdAt = booking.createdAt
    ? new Date(booking.createdAt).toLocaleString('vi-VN')
    : 'Chưa có thông tin'

  const canceledAt = booking.canceledAt
    ? new Date(booking.canceledAt).toLocaleString('vi-VN')
    : ''

  const cancelButton = booking.status !== 'Đã hủy'
    ? `
      <button
        class="primary-btn"
        type="button"
        onclick="cancelBooking('${booking.bookingCode}')"
      >
        HỦY VÉ
      </button>
    `
    : ''

  result.innerHTML = `
    <div class="flight-card" style="display:block">
      <h3>Thông tin vé</h3>

      <p>Mã đặt vé:
        <strong>${booking.bookingCode}</strong>
      </p>

      <p>Trạng thái:
        <strong>${booking.status || 'Đã đặt'}</strong>
      </p>

      <p>Hãng hàng không:
        <strong>${booking.airline || 'Chưa có thông tin'}</strong>
      </p>

      <p>Hành trình:
        <strong>${booking.from || ''} → ${booking.to || ''}</strong>
      </p>

      <p>Ngày bay:
        <strong>${booking.date || 'Chưa có thông tin'}</strong>
      </p>

      <p>Giờ bay:
        <strong>${booking.departure || ''} - ${booking.arrival || ''}</strong>
      </p>

      <p>Hạng vé:
        <strong>${booking.classType || 'Phổ thông'}</strong>
      </p>

      <p>Số hành khách:
        <strong>${booking.passengers || 1}</strong>
      </p>

      <p>Giá mỗi vé:
        <strong>
          ${Number(booking.price || 0).toLocaleString('vi-VN')} VNĐ
        </strong>
      </p>

      <p>Tổng tiền:
        <strong>
          ${Number(booking.totalPrice || 0).toLocaleString('vi-VN')} VNĐ
        </strong>
      </p>

      <p>Ngày đặt:
        <strong>${createdAt}</strong>
      </p>

      ${
        canceledAt
          ? `<p>Ngày hủy: <strong>${canceledAt}</strong></p>`
          : ''
      }

      ${cancelButton}
    </div>
  `
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

  if (!form || !input || !result) return

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const code = input.value.trim().toUpperCase()

    if (!code) {
      result.innerHTML = `
        <div class="flight-card">
          <div>
            <strong>Vui lòng nhập mã đặt vé.</strong>
          </div>
        </div>
      `
      return
    }

    const bookings = JSON.parse(
      localStorage.getItem('tripgo_bookings') || '[]'
    )

    const booking = bookings.find(
      item => item.bookingCode?.toUpperCase() === code
    )

    if (!booking) {
      result.innerHTML = `
        <div class="flight-card">
          <div>
            <strong>Không tìm thấy vé.</strong>
            <p>
              Mã đặt vé <strong>${code}</strong> không tồn tại.
            </p>
          </div>
        </div>
      `
      return
    }

    renderBookingDetails(result, booking)
  })
}

window.cancelBooking = function (bookingCode) {
  const confirmed = window.confirm(
    `Bạn có chắc muốn hủy vé ${bookingCode}?`
  )

  if (!confirmed) return

  const bookings = JSON.parse(
    localStorage.getItem('tripgo_bookings') || '[]'
  )

  const index = bookings.findIndex(
    item =>
      item.bookingCode?.toUpperCase() === bookingCode.toUpperCase()
  )

  if (index === -1) {
    alert('Không tìm thấy vé.')
    return
  }

  if (bookings[index].status === 'Đã hủy') {
    alert('Vé này đã được hủy.')
    return
  }

  bookings[index].status = 'Đã hủy'
  bookings[index].canceledAt = new Date().toISOString()

  localStorage.setItem(
    'tripgo_bookings',
    JSON.stringify(bookings)
  )

  const result = document.querySelector('#bookingLookupResult')

  if (result) {
    renderBookingDetails(result, bookings[index])
  }

  alert('Hủy vé thành công.')
}
