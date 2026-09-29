export function renderBookingSearch() {
  return `
    <main>
      <section class="section">
        <div class="container">
          <a href="#top" onclick="location.reload()">← Về trang chủ</a>

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

          <div id="bookingLookupResult"></div>
        </div>
      </section>
    </main>
  `
}

export function initBookingSearch() {
  const form = document.querySelector('#bookingLookupForm')
  const input = document.querySelector('#bookingCode')
  const result = document.querySelector('#bookingLookupResult')

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
            <p>Mã đặt vé <strong>${code}</strong> không tồn tại.</p>
          </div>
        </div>
      `
      return
    }

    const createdAt = booking.createdAt
      ? new Date(booking.createdAt).toLocaleString('vi-VN')
      : 'Chưa có thông tin'

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
      </div>
    `
  })
}