export function generateBookingCode() {
  const number = Math.floor(100000 + Math.random() * 900000)
  return `TG${number}`
}

export function saveBooking(booking) {
  const bookings = JSON.parse(localStorage.getItem('tripgo_bookings') || '[]')
  bookings.push(booking)
  localStorage.setItem('tripgo_bookings', JSON.stringify(bookings))
}