
const TEMP_BOOKING_KEY = 'tripgo_temp_booking'
const BOOKINGS_KEY = 'tripgo_bookings'

export function generateBookingCode() {
  const number = Math.floor(100000 + Math.random() * 900000)
  return `TG${number}`
}

export function saveBooking(booking) {
  const bookings = JSON.parse(
    localStorage.getItem(BOOKINGS_KEY) || '[]'
  )

  bookings.push(booking)

  localStorage.setItem(
    BOOKINGS_KEY,
    JSON.stringify(bookings)
  )
}

export function saveTempBooking(booking) {
  localStorage.setItem(
    TEMP_BOOKING_KEY,
    JSON.stringify(booking)
  )
}

export function getTempBooking() {
  return JSON.parse(
    localStorage.getItem(TEMP_BOOKING_KEY) || 'null'
  )
}

export function clearTempBooking() {
  localStorage.removeItem(TEMP_BOOKING_KEY)
}

export function confirmBooking() {
  const tempBooking = getTempBooking()

  if (!tempBooking) {
    return null
  }

  const booking = {
    ...tempBooking,
    bookingCode: generateBookingCode(),
    status: 'Đã đặt',
    createdAt: new Date().toISOString()
  }

  saveBooking(booking)
  clearTempBooking()

  return booking
}

