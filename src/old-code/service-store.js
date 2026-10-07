export const SERVICE_STORAGE_KEY = 'tripgo_services'

export const DEFAULT_SERVICES = [
  {
    id: 'booking',
    title: 'Đặt vé máy bay',
    description: 'Tìm và chọn chuyến bay phù hợp.',
    icon: 'fa-plane',
    href: '#search',
    enabled: true,
  },
  {
    id: 'booking-lookup',
    title: 'Tra cứu đặt chỗ',
    description: 'Kiểm tra thông tin hành trình.',
    icon: 'fa-ticket',
    href: '#booking-search',
    enabled: true,
  },
  {
    id: 'check-in',
    title: 'Check-in trực tuyến',
    description: 'Làm thủ tục nhanh chóng, thuận tiện.',
    icon: 'fa-qrcode',
    href: '#support',
    enabled: true,
  },
  {
    id: 'seat-selection',
    title: 'Chọn ghế',
    description: 'Chọn vị trí yêu thích trên máy bay.',
    icon: 'fa-chair',
    href: '#search',
    enabled: true,
  },
]

export function getServices() {
  try {
    const saved = localStorage.getItem(SERVICE_STORAGE_KEY)
    if (saved === null) {
      localStorage.setItem(SERVICE_STORAGE_KEY, JSON.stringify(DEFAULT_SERVICES))
      return DEFAULT_SERVICES
    }
    const services = JSON.parse(saved)
    return Array.isArray(services) ? services : DEFAULT_SERVICES
  } catch {
    return DEFAULT_SERVICES
  }
}

export function saveServices(services) {
  localStorage.setItem(SERVICE_STORAGE_KEY, JSON.stringify(services))
}
