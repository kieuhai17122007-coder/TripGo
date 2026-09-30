function getBookings() {
  return JSON.parse(localStorage.getItem('tripgo_bookings') || '[]')
}

function formatPrice(price) {
  return Number(price || 0).toLocaleString('vi-VN') + ' VNĐ'
}

function formatDateTime(value) {
  if (!value) return 'Chưa có thông tin'
  return new Date(value).toLocaleString('vi-VN')
}

function renderBooking(booking) {
  return `
    <article class="flight-card" style="display:block">
      <h3>${booking.bookingCode || 'Chưa có mã'}</h3>

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

      <p>Số hành khách:
        <strong>${booking.passengers || 1}</strong>
      </p>

      <p>Tổng tiền:
        <strong>${formatPrice(booking.totalPrice)}</strong>
      </p>

      <p>Ngày đặt:
        <strong>${formatDateTime(booking.createdAt)}</strong>
      </p>

      ${
        booking.canceledAt
          ? `<p>Ngày hủy:
              <strong>${formatDateTime(booking.canceledAt)}</strong>
             </p>`
          : ''
      }
    </article>
  `
}

export function renderMyBookings() {
  const bookings = getBookings()

  if (bookings.length === 0) {
    return `
      <main>
        <section class="section">
          <div class="container">
            <a href="#top" onclick="location.reload()">← Về trang chủ</a>

            <div class="section-heading">
              <span class="eyebrow dark">VÉ CỦA TÔI</span>
              <h2>Danh sách vé</h2>
              <p>Bạn chưa có vé nào được lưu trên trình duyệt này.</p>
            </div>
          </div>
        </section>
      </main>
    `
  }

  return `
    <main>
      <section class="section">
        <div class="container">
          <a href="#top" onclick="location.reload()">← Về trang chủ</a>

          <div class="section-heading">
            <span class="eyebrow dark">VÉ CỦA TÔI</span>
            <h2>Danh sách vé</h2>
            <p>Các vé đang được lưu trong LocalStorage.</p>
          </div>

          <div class="flight-list">
            ${bookings.map(renderBooking).join('')}
          </div>
        </div>
      </section>
    </main>
  `
}