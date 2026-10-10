import { getBookings } from './flight-store.js'

export function generateBookingCode() {
  const bookings = getBookings()
  let code
  do { code = `TG${Math.floor(100000 + Math.random() * 900000)}` } while (bookings.some(b => b.bookingCode === code))
  return code
}
export function saveBooking(booking) {
  const bookings = getBookings()
  bookings.push(booking)
  localStorage.setItem('tripgo_bookings', JSON.stringify(bookings))
}
