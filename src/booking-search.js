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
      item => item.bookingCode.toUpperCase() === code
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

    result.innerHTML = `
      <div class="flight-card">
        <div>
          <strong>Đã tìm thấy mã đặt vé</strong>
          <p>Mã đặt vé: <strong>${booking.bookingCode}</strong></p>
        </div>
      </div>
    `
  })
}