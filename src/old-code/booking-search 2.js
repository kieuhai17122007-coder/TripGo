import { getBookings, getFlights, escapeHTML } from './flight-store.js'

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
                maxlength="20"
                placeholder="Ví dụ: TG123456"
                autocomplete="off"
                required
              >
            </label>

            <button class="primary-btn search-btn" type="submit">
              TRA CỨU VÉ
            </button>
          </form>

          <div id="bookingLookupResult" aria-live="polite"></div>
        </div>
      </section>
    </main>
  `
}

function renderBookingDetails(result, booking) {
  const createdAt = booking.createdAt
    ? new Date(booking.createdAt).toLocaleString('vi-VN')
    : 'Chưa có thông tin'

  const canceledAt = booking.canceledAt
    ? new Date(booking.canceledAt).toLocaleString('vi-VN')
    : ''

  const cancelButton = booking.status !== 'Đã hủy'
    ? `<button class="primary-btn" type="button" onclick="cancelBooking('${booking.bookingCode}')">HỦY VÉ</button>`
    : ''

  result.innerHTML = `
    <div class="flight-card" style="display:block">
      <h3>Thông tin vé</h3>

      <p>Mã đặt vé: <strong>${booking.bookingCode}</strong></p>
      <p>Trạng thái: <strong>${booking.status || 'Đã đặt'}</strong></p>
      <p>Hãng hàng không: <strong>${booking.airline || 'Chưa có thông tin'}</strong></p>
      <p>Hành trình: <strong>${booking.from || ''} → ${booking.to || ''}</strong></p>
      <p>Ngày bay: <strong>${booking.date || 'Chưa có thông tin'}</strong></p>
      <p>Giờ bay: <strong>${booking.departure || ''} - ${booking.arrival || ''}</strong></p>
      <p>Hạng vé: <strong>${booking.classType || 'Phổ thông'}</strong></p>
      <p>Số hành khách: <strong>${booking.passengers || 1}</strong></p>
      <p>Giá mỗi vé: <strong>${Number(booking.price || 0).toLocaleString('vi-VN')} VNĐ</strong></p>
      <p>Tổng tiền: <strong>${Number(booking.totalPrice || 0).toLocaleString('vi-VN')} VNĐ</strong></p>
      <p>Ngày đặt: <strong>${createdAt}</strong></p>
      ${canceledAt ? `<p>Ngày hủy: <strong>${canceledAt}</strong></p>` : ''}
      ${cancelButton}
    </div>
  `
}

export function initBookingSearch() {
  const form = document.querySelector('#bookingLookupForm')
  const result = document.querySelector('#bookingLookupResult')

  if (!form || !result) return

  const show = (code) => {
    const normalizedCode = String(code || '').trim().toUpperCase()
    const booking = getBookings().find(
      item => String(item.bookingCode || item.code || '').toUpperCase() === normalizedCode
    )

    if (!booking) {
      result.innerHTML = `
        <div class="flight-card">
          <div>
            <strong>Không tìm thấy vé.</strong>
            <p>Mã đặt vé <strong>${escapeHTML(normalizedCode)}</strong> không tồn tại.</p>
          </div>
        </div>
      `
      return
    }

    renderBookingDetails(result, booking)
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const code = document.querySelector('#bookingCode').value.trim().toUpperCase()

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

    show(code)
  })
}

window.cancelBooking = function cancelBooking(bookingCode) {
  const confirmed = window.confirm(`Bạn có chắc muốn hủy vé ${bookingCode}?`)
  if (!confirmed) return

  const bookings = JSON.parse(localStorage.getItem('tripgo_bookings') || '[]')
  const index = bookings.findIndex(
    item => String(item.bookingCode || item.code || '').toUpperCase() === String(bookingCode).toUpperCase()
  )

  if (index === -1) {
    alert('Không tìm thấy vé.')
    return
  }

  if (bookings[index].status === 'Đã hủy' || bookings[index].status === 'cancelled') {
    alert('Vé này đã được hủy.')
    return
  }

  bookings[index].status = 'Đã hủy'
  bookings[index].canceledAt = new Date().toISOString()
  localStorage.setItem('tripgo_bookings', JSON.stringify(bookings))

  const allFlights = getFlights()
  const flightIndex = allFlights.findIndex(f => f.id === bookings[index].flightId)
  if (flightIndex >= 0 && Number.isFinite(Number(allFlights[flightIndex].seats))) {
    allFlights[flightIndex].seats = Number(allFlights[flightIndex].seats) + Number(bookings[index].passengers || 1)
    localStorage.setItem('tripgo_flights', JSON.stringify(allFlights))
  }

  const result = document.querySelector('#bookingLookupResult')
  if (result) renderBookingDetails(result, bookings[index])

  alert('Hủy vé thành công.')
}
