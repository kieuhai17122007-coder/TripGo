import './style.css'
import { renderFlightResults, initFlightResults } from './flight-results'
import { renderBookingSearch, initBookingSearch } from './booking-search'
import { getServices } from './service-store'

document.querySelector('#app').innerHTML = `
  <header class="header">
    <div class="container nav">
      <a class="logo" href="#top"><span aria-hidden="true">✈</span> TripGo</a>
      <nav aria-label="Điều hướng chính">
        <a href="#top">Đặt vé</a>
        <a href="#search">Chuyến bay</a>
        <a href="#services">Dịch vụ</a>
        <a href="#booking-search">Tra cứu</a>
        <a href="#support">Check-in</a>
      </nav>
      <a class="login-btn" id="adminPanelLink" href="/admin/">Admin Panel</a>
    </div>
  </header>

  <main id="top">
    <section class="hero"><div class="hero-overlay"><div class="container hero-content">
      <p class="eyebrow">KHÁM PHÁ VIỆT NAM CÙNG TRIPGO</p>
      <h1>Hành trình của bạn,<br>khởi đầu từ đây</h1>
      <p>Đặt vé máy bay nội địa nhanh chóng và thuận tiện.</p>
      <form class="search-box" id="search" novalidate>
        <div class="trip-type"><label><input type="radio" name="tripType" value="roundtrip" checked> Khứ hồi</label><label><input type="radio" name="tripType" value="oneway"> Một chiều</label></div>
        <div class="search-grid">
          <label class="field"><span>Điểm đi</span><select id="from"><option value="HAN">Hà Nội (HAN)</option><option value="SGN">TP. Hồ Chí Minh (SGN)</option><option value="DAD">Đà Nẵng (DAD)</option><option value="PQC">Phú Quốc (PQC)</option></select></label>
          <button class="swap" id="swapBtn" type="button" title="Đổi điểm đi/đến" aria-label="Đổi điểm đi và điểm đến">⇄</button>
          <label class="field"><span>Điểm đến</span><select id="to"><option value="SGN">TP. Hồ Chí Minh (SGN)</option><option value="HAN">Hà Nội (HAN)</option><option value="DAD">Đà Nẵng (DAD)</option><option value="PQC">Phú Quốc (PQC)</option></select></label>
          <label class="field"><span>Ngày đi</span><input type="date" id="departure" required></label>
          <label class="field return-field"><span>Ngày về</span><input type="date" id="returnDate"></label>
          <label class="field"><span>Hành khách</span><select id="passengers"><option value="1">1 hành khách</option><option value="2">2 hành khách</option><option value="3">3 hành khách</option><option value="4">4 hành khách</option></select></label>
          <label class="field">
            <span>Khoảng giá</span>
            <select id="priceRange">
            <option value="">Tất cả</option>
            <option value="0-1300000">Dưới 1.300.000 VNĐ</option>
            <option value="1300000-1600000">1.300.000 - 1.600.000 VNĐ</option>
            <option value="1600000-99999999">Trên 1.600.000 VNĐ</option>
            </select>
          </label>
          <label class="field"><span>Hạng vé</span><select id="classType"><option>Phổ thông</option><option>Thương gia</option></select></label>
          <label class="field">
              <span>Hãng hàng không</span>
             <select id="airline">
               <option value="">Tất cả</option>
               <option value="Vietnam Airlines">Vietnam Airlines</option>
               <option value="VietJet Air">VietJet Air</option>
               <option value="Bamboo Airways">Bamboo Airways</option>
               <option value="Vietravel Airlines">Vietravel Airlines</option>
             </select>
           </label>
           <label class="field">
               <span>Giờ khởi hành</span>
                <select id="departureTime">
                <option value="">Tất cả</option>
                <option value="morning">Sáng (00:00 - 11:59)</option>
                <option value="afternoon">Chiều (12:00 - 17:59)</option>
                <option value="evening">Tối (18:00 - 23:59)</option>
                </select>
            </label>
            <label class="field">
                <span>Sắp xếp</span>
                 <select id="sortBy">
                 <option value="">Mặc định</option>
                 <option value="priceAsc">Giá tăng dần</option>
                 <option value="priceDesc">Giá giảm dần</option>
                 <option value="timeAsc">Giờ bay sớm nhất</option>
                 <option value="timeDesc">Giờ bay muộn nhất</option>
                </select>
            </label>
import { renderMyBookings } from './my-bookings'
import { renderRegister, initRegister } from './register.js'
import { renderLogin, initLogin } from './login.js'
import { renderAccount } from './account.js'

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('tripgo_current_user') || 'null')
  } catch {
    return null
  }
}

function renderHeader() {
  const user = getCurrentUser()
  const authLink = user
  ? `<span class="auth-user">
      <a href="#account">${user.name || user.email}</a> ·
      <a href="#logout">Đăng xuất</a>
    </span>`
  : `<a class="login-btn" href="#login">Đăng nhập</a>`

  return `
    <header class="header">
      <div class="container nav">
        <a class="logo" href="#top">✈ TripGo</a>
        <nav>
          <a href="#top">Đặt vé</a>
          <a href="#search">Chuyến bay</a>
          <a href="#services">Dịch vụ</a>
          <a href="#booking-search">Tra cứu</a>
          <a href="#my-bookings">Vé của tôi</a>
        </nav>
        ${authLink}
      </div>
    </header>
  `
}

function renderHome() {
  return `
    <main id="top">
      <section class="hero">
        <div class="hero-overlay">
          <div class="container hero-content">
            <p class="eyebrow">KHÁM PHÁ VIỆT NAM CÙNG TRIPGO</p>
            <h1>Hành trình của bạn,<br>khởi đầu từ đây</h1>
            <p>Đặt vé máy bay nội địa nhanh chóng và thuận tiện.</p>

            <form class="search-box" id="search">
              <div class="trip-type">
                <label><input type="radio" name="tripType" value="roundtrip" checked> Khứ hồi</label>
                <label><input type="radio" name="tripType" value="oneway"> Một chiều</label>
              </div>

              <div class="search-grid">
                <label class="field">
                  <span>Điểm đi</span>
                  <select id="from">
                    <option value="HAN">Hà Nội (HAN)</option>
                    <option value="SGN">TP. Hồ Chí Minh (SGN)</option>
                    <option value="DAD">Đà Nẵng (DAD)</option>
                    <option value="PQC">Phú Quốc (PQC)</option>
                  </select>
                </label>
                <button class="swap" id="swapBtn" type="button" title="Đổi điểm đi/đến" aria-label="Đổi điểm đi và điểm đến">⇄</button>
                <label class="field">
                  <span>Điểm đến</span>
                  <select id="to">
                    <option value="SGN">TP. Hồ Chí Minh (SGN)</option>
                    <option value="HAN">Hà Nội (HAN)</option>
                    <option value="DAD">Đà Nẵng (DAD)</option>
                    <option value="PQC">Phú Quốc (PQC)</option>
                  </select>
                </label>
                <label class="field">
                  <span>Ngày đi</span>
                  <input type="date" id="departure" required>
                </label>
                <label class="field return-field">
                  <span>Ngày về</span>
                  <input type="date" id="returnDate">
                </label>
                <label class="field">
                  <span>Hành khách</span>
                  <select id="passengers">
                    <option value="1">1 hành khách</option>
                    <option value="2">2 hành khách</option>
                    <option value="3">3 hành khách</option>
                    <option value="4">4 hành khách</option>
                  </select>
                </label>
                <label class="field">
                  <span>Khoảng giá</span>
                  <select id="priceRange">
                    <option value="">Tất cả</option>
                    <option value="0-1300000">Dưới 1.300.000 VNĐ</option>
                    <option value="1300000-1600000">1.300.000 - 1.600.000 VNĐ</option>
                    <option value="1600000-99999999">Trên 1.600.000 VNĐ</option>
                  </select>
                </label>
                <label class="field">
                  <span>Hạng vé</span>
                  <select id="classType">
                    <option>Phổ thông</option>
                    <option>Thương gia</option>
                  </select>
                </label>
                <label class="field">
                  <span>Hãng hàng không</span>
                  <select id="airline">
                    <option value="">Tất cả</option>
                    <option value="Vietnam Airlines">Vietnam Airlines</option>
                    <option value="VietJet Air">VietJet Air</option>
                    <option value="Bamboo Airways">Bamboo Airways</option>
                    <option value="Vietravel Airlines">Vietravel Airlines</option>
                  </select>
                </label>
                <label class="field">
                  <span>Giờ khởi hành</span>
                  <select id="departureTime">
                    <option value="">Tất cả</option>
                    <option value="morning">Sáng (00:00 - 11:59)</option>
                    <option value="afternoon">Chiều (12:00 - 17:59)</option>
                    <option value="evening">Tối (18:00 - 23:59)</option>
                  </select>
                </label>
                <label class="field">
                  <span>Sắp xếp</span>
                  <select id="sortBy">
                    <option value="">Mặc định</option>
                    <option value="priceAsc">Giá tăng dần</option>
                    <option value="priceDesc">Giá giảm dần</option>
                    <option value="timeAsc">Giờ bay sớm nhất</option>
                    <option value="timeDesc">Giờ bay muộn nhất</option>
                  </select>
                </label>
              </div>

              <button class="primary-btn search-btn" type="submit">TÌM CHUYẾN BAY</button>
            </form>
          </div>
        </div>
      </section>

      <section class="section" id="services">
        <div class="container">
          <div class="section-heading">
            <span class="eyebrow dark">TRIPGO SERVICES</span>
            <h2>Dịch vụ hàng không</h2>
            <p>Mọi tiện ích cần thiết cho chuyến bay của bạn.</p>
          </div>
          <div class="service-grid">
            <a class="service-card" href="#search"><span>✈️</span><h3>Đặt vé máy bay</h3><p>Tìm và chọn chuyến bay phù hợp.</p></a>
            <a class="service-card" href="#booking-search"><span>📋</span><h3>Tra cứu đặt chỗ</h3><p>Kiểm tra thông tin hành trình.</p></a>
            <a class="service-card" href="#support"><span>✓</span><h3>Check-in trực tuyến</h3><p>Làm thủ tục nhanh chóng.</p></a>
            <a class="service-card" href="#search"><span>💺</span><h3>Chọn ghế</h3><p>Chọn vị trí yêu thích trên máy bay.</p></a>
          </div>
        </div>
      </section>

      <section class="promo">
        <div class="container">
          <div class="section-heading">
            <span class="eyebrow dark">ƯU ĐÃI</span>
            <h2>Khám phá những hành trình mới</h2>
          </div>
          <div class="promo-grid">
            <article class="promo-card p1"><div><small>ĐƯỜNG BAY NỘI ĐỊA</small><h3>Hà Nội - Đà Nẵng</h3><p>Khám phá thành phố biển xinh đẹp.</p></div></article>
            <article class="promo-card p2"><div><small>ĐƯỜNG BAY NỘI ĐỊA</small><h3>TP. Hồ Chí Minh - Phú Quốc</h3><p>Chạm tới thiên đường đảo ngọc.</p></div></article>
            <article class="promo-card p3"><div><small>ĐƯỜNG BAY NỘI ĐỊA</small><h3>Hà Nội - TP. Hồ Chí Minh</h3><p>Hành trình kết nối hai miền.</p></div></article>
          </div>
        </div>
      </section>

      <section class="section benefits">
        <div class="container benefit-grid">
          <div><span>01</span><h3>Đơn giản</h3><p>Quy trình đặt vé rõ ràng, dễ sử dụng.</p></div>
          <div><span>02</span><h3>Nhanh chóng</h3><p>Tìm kiếm và lựa chọn chuyến bay trong vài bước.</p></div>
          <div><span>03</span><h3>Thuận tiện</h3><p>Lưu thông tin đặt vé ngay trên trình duyệt.</p></div>
        </div>
      </section>
    </main>

    <footer class="footer" id="support">
      <div class="container footer-grid">
        <div><a class="logo footer-logo" href="#top"><span>✈</span> TripGo</a><p>Website mô phỏng đặt vé máy bay nội địa.</p></div>
        <div><h4>TripGo</h4><a href="#top">Về chúng tôi</a><a href="#top">Điều khoản</a><a href="#top">Chính sách</a></div>
        <div><h4>Hỗ trợ</h4><a href="#booking-search">Tra cứu đặt vé</a><a href="#support">Check-in</a><a href="#top">Câu hỏi thường gặp</a></div>
        <div><h4>Liên hệ</h4><p>support@tripgo.vn</p><p>1900 0000</p></div>
      </div>
      <div class="service-grid">
      <a class="service-card" href="#search">
      <span>✈️</span>
      <h3>Đặt vé máy bay</h3>
      <p>Tìm và chọn chuyến bay phù hợp.</p></a>
      <a class="service-card" href="#booking-search">
      <span>📋</span>
      <h3>Tra cứu đặt chỗ</h3>
      <p>Kiểm tra thông tin hành trình.</p>
      </a><a class="service-card" href="#support"><span>✓</span><h3>Check-in trực tuyến</h3><p>Làm thủ tục nhanh chóng.</p></a><a class="service-card" href="#search"><span>💺</span><h3>Chọn ghế</h3><p>Chọn vị trí yêu thích trên máy bay.</p></a></div>
    </div></section>

    <section class="promo"><div class="container"><div class="section-heading"><span class="eyebrow dark">ƯU ĐÃI</span><h2>Khám phá những hành trình mới</h2></div><div class="promo-grid">
      <article class="promo-card p1"><div><small>ĐƯỜNG BAY NỘI ĐỊA</small><h3>Hà Nội - Đà Nẵng</h3><p>Khám phá thành phố biển xinh đẹp.</p></div></article><article class="promo-card p2"><div><small>ĐƯỜNG BAY NỘI ĐỊA</small><h3>TP. Hồ Chí Minh - Phú Quốc</h3><p>Chạm tới thiên đường đảo ngọc.</p></div></article><article class="promo-card p3"><div><small>ĐƯỜNG BAY NỘI ĐỊA</small><h3>Hà Nội - TP. Hồ Chí Minh</h3><p>Hành trình kết nối hai miền.</p></div></article>
    </div></div></section>

    <section class="section benefits"><div class="container benefit-grid"><div><span>01</span><h3>Đơn giản</h3><p>Quy trình đặt vé rõ ràng, dễ sử dụng.</p></div><div><span>02</span><h3>Nhanh chóng</h3><p>Tìm kiếm và lựa chọn chuyến bay trong vài bước.</p></div><div><span>03</span><h3>Thuận tiện</h3><p>Lưu thông tin đặt vé ngay trên trình duyệt.</p></div></div></section>
  </main>

  <footer class="footer" id="support"><div class="container footer-grid"><div><a class="logo footer-logo" href="#top"><span>✈</span> TripGo</a><p>Website mô phỏng đặt vé máy bay nội địa.</p></div><div><h4>TripGo</h4><a href="#top">Về chúng tôi</a><a href="#top">Điều khoản</a><a href="#top">Chính sách</a></div><div><h4>Hỗ trợ</h4><a href="#booking-search">Tra cứu đặt vé</a><a href="#search">Check-in</a><a href="#top">Câu hỏi thường gặp</a></div><div><h4>Liên hệ</h4><p>support@tripgo.vn</p><p>1900 0000</p></div></div><div class="copyright">© 2026 TripGo. Front-end project.</div></footer>
`

function renderServices() {
  const serviceGrid = document.querySelector('.service-grid')
  if (!serviceGrid) return
  const icons = {
    'fa-plane': 'fa-solid fa-plane',
    'fa-ticket': 'fa-solid fa-ticket',
    'fa-qrcode': 'fa-solid fa-qrcode',
    'fa-chair': 'fa-solid fa-chair',
    'fa-suitcase-rolling': 'fa-solid fa-suitcase-rolling',
    'fa-headset': 'fa-solid fa-headset',
    'fa-bolt': 'fa-solid fa-bolt',
    'fa-circle-info': 'fa-solid fa-circle-info',
  }
  const escapeHTML = value =>
    String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    })[char])
  const services = getServices().filter(service => service.enabled !== false)
  serviceGrid.innerHTML = services.length
    ? services.map(service => `
      <a class="service-card" href="${escapeHTML(service.href)}">
        <span><i class="${icons[service.icon] || icons['fa-circle-info']}" aria-hidden="true"></i></span>
        <h3>${escapeHTML(service.title)}</h3>
        <p>${escapeHTML(service.description)}</p>
      </a>
    `).join('')
    : '<p class="service-empty">Hiện chưa có dịch vụ nào. Vui lòng quay lại sau.</p>'
}

renderServices()
window.addEventListener('storage', event => {
  if (event.key === 'tripgo_services') renderServices()
})

const departure = document.querySelector('#departure')
const returnDate = document.querySelector('#returnDate')
const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]
departure.min = today
returnDate.min = today
departure.value = today

function updateReturnDate() {
  const isRoundTrip = document.querySelector('input[name="tripType"]:checked').value === 'roundtrip'
  returnDate.disabled = !isRoundTrip
  returnDate.closest('.return-field').style.opacity = isRoundTrip ? '1' : '.5'
}

document.querySelectorAll('input[name="tripType"]').forEach((input) => input.addEventListener('change', updateReturnDate))
departure.addEventListener('change', () => { returnDate.min = departure.value })
document.querySelector('#swapBtn').addEventListener('click', () => {
  const from = document.querySelector('#from')
  const to = document.querySelector('#to')
  ;[from.value, to.value] = [to.value, from.value]
})
document.querySelector('#search').addEventListener('submit', (event) => {
  event.preventDefault()
  const search = { from: document.querySelector('#from').value, to: document.querySelector('#to').value, departure: departure.value, returnDate: returnDate.disabled ? '' : returnDate.value, passengers: document.querySelector('#passengers').value,priceRange: document.querySelector('#priceRange').value,airline: document.querySelector('#airline').value,departureTime: document.querySelector('#departureTime').value,sortBy: document.querySelector('#sortBy').value, classType: document.querySelector('#classType').value }
  if (search.from === search.to || !search.departure || search.departure < today || (!returnDate.disabled && search.returnDate && search.returnDate < search.departure)) { alert('Vui lòng kiểm tra điểm đi, điểm đến và ngày bay.'); return }
  localStorage.setItem('tripgo_search', JSON.stringify(search))
  window.location.hash = `search-results?${new URLSearchParams(search).toString()}`
  location.reload()
})
window.addEventListener('hashchange', () => { if (window.location.hash === '#booking-search' || window.location.hash.startsWith('#search-results')) location.reload() })
const sharedHeader = document.querySelector('.header').outerHTML
const sharedFooter = document.querySelector('.footer').outerHTML
if (window.location.hash === '#booking-search') {
  document.querySelector('#app').innerHTML = sharedHeader + renderBookingSearch() + sharedFooter
  initBookingSearch()
}

if (window.location.hash.startsWith('#search-results')) {
  document.querySelector('#app').innerHTML = sharedHeader + renderFlightResults() + sharedFooter
  initFlightResults()
}
const session = (() => { try { return JSON.parse(localStorage.getItem('tripgo_session')) } catch { return null } })()
const admin = (() => { try { return JSON.parse(localStorage.getItem('tripgo_users') || '[]').find(u => u.id === session?.userId && u.email === 'admin@tripgo.com' && u.role === 'admin') } catch { return null } })()
const adminLink = document.querySelector('#adminPanelLink')
if (adminLink) { if (admin) adminLink.textContent = 'Admin Panel'; else { adminLink.textContent = 'Đăng nhập'; adminLink.href = '/admin/' } }
updateReturnDate()
=======
      <div class="copyright">© 2026 TripGo. Front-end project.</div>
    </footer>
  `
}

function bindHomeEvents() {
  const form = document.querySelector('#search')
  if (!form) return

  const departure = document.querySelector('#departure')
  const returnDate = document.querySelector('#returnDate')
  const today = new Date()
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')
  ].join('-')

  departure.min = todayString
  returnDate.min = todayString
  departure.value = todayString

  const updateReturnDate = () => {
    const isRoundTrip = document.querySelector('input[name="tripType"]:checked').value === 'roundtrip'
    returnDate.disabled = !isRoundTrip
    returnDate.closest('.return-field').style.opacity = isRoundTrip ? '1' : '.5'
  }

  document.querySelectorAll('input[name="tripType"]').forEach((input) => {
    input.addEventListener('change', updateReturnDate)
  })

  departure.addEventListener('change', () => {
    returnDate.min = departure.value
  })

  document.querySelector('#swapBtn').addEventListener('click', () => {
    const from = document.querySelector('#from')
    const to = document.querySelector('#to')
    ;[from.value, to.value] = [to.value, from.value]
  })

  updateReturnDate()

  form.addEventListener('submit', (e) => {
    e.preventDefault()

    const search = {
      from: document.querySelector('#from').value,
      to: document.querySelector('#to').value,
      departure: departure.value,
      returnDate: returnDate.disabled ? '' : returnDate.value,
      passengers: document.querySelector('#passengers').value,
      priceRange: document.querySelector('#priceRange').value,
      airline: document.querySelector('#airline').value,
      departureTime: document.querySelector('#departureTime').value,
      sortBy: document.querySelector('#sortBy').value,
      classType: document.querySelector('#classType').value
    }

    localStorage.setItem('tripgo_search', JSON.stringify(search))
    window.location.hash = `search-results?${new URLSearchParams(search).toString()}`
  })
}

function renderApp() {
  const hash = window.location.hash || '#top'
  const app = document.querySelector('#app')

  if (hash === '#logout') {
    localStorage.removeItem('tripgo_current_user')
    window.location.hash = '#top'
    return
  }

  if (hash === '#login') {
    app.innerHTML = renderHeader() + renderLogin()
    initLogin()
    return
  }

  if (hash === '#register') {
    app.innerHTML = renderHeader() + renderRegister()
    initRegister()
    return
  }

  if (hash === '#booking-search') {
    app.innerHTML = renderHeader() + renderBookingSearch()
    initBookingSearch()
    return
  }

  if (hash === '#my-bookings') {
    app.innerHTML = renderHeader() + renderMyBookings()
    return
  }

  if (hash === '#account') {
    app.innerHTML = renderHeader() + renderAccount()
    return
  }

  if (hash.startsWith('#search-results')) {
    app.innerHTML = renderHeader() + renderFlightResults()
    return
  }

  // mặc định: trang chủ
  app.innerHTML = renderHeader() + renderHome()
  bindHomeEvents()
}

window.addEventListener('hashchange', renderApp)
renderApp()
