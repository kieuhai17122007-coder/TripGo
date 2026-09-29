export function generateBookingCode() {
  const number = Math.floor(100000 + Math.random() * 900000)
  return `TG${number}`
}