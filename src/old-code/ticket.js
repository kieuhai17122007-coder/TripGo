const booking = JSON.parse(
  localStorage.getItem('tripgo_last_booking')
)

const ticket = document.getElementById('ticket')

if (!booking) {
  ticket.innerHTML = '<h2>Không tìm thấy vé</h2>'
} else {
  ticket.innerHTML = `
    <p><strong>Mã đặt vé:</strong> ${booking.bookingCode}</p>

    <p><strong>Hãng:</strong> ${booking.airline}</p>

    <p><strong>Hành trình:</strong>
      ${booking.from} → ${booking.to}
    </p>

    <p><strong>Ngày bay:</strong>
      ${booking.date}
    </p>

    <p><strong>Giờ bay:</strong>
      ${booking.departure} - ${booking.arrival}
    </p>

    <p><strong>Hạng vé:</strong>
      ${booking.classType}
    </p>

    <p><strong>Số hành khách:</strong>
      ${booking.passengers}
    </p>

    <p><strong>Tổng tiền:</strong>
      ${booking.totalPrice.toLocaleString('vi-VN')} VNĐ
    </p>
  `
}