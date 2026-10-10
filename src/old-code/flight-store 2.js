import { flights as defaults } from './flights.js'

export function getFlights() {
  try {
    const saved = JSON.parse(localStorage.getItem('tripgo_flights'))
    if (Array.isArray(saved)) return saved
  } catch { /* Ignore damaged local data and show sample flights. */ }
  return defaults
}
export function saveFlights(flights) {
  localStorage.setItem('tripgo_flights', JSON.stringify(flights))
}
export const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
export function getBookings() {
  try {
    const saved = JSON.parse(localStorage.getItem('tripgo_bookings'))
    return Array.isArray(saved) ? saved : []
  } catch { return [] }
}
