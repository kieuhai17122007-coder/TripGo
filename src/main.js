import './style.css'

document.querySelector('#app').innerHTML = `
  <header class="header">
    <div class="container nav">
      <a class="logo" href="#top"><span aria-hidden="true">✈</span> TripGo</a>
      <nav aria-label="Điều hướng chính">
        <a href="#top">Đặt vé</a><a href="#search">Chuyến bay</a><a href="#services">Dịch vụ</a><a href="#support">Tra cứu</a><a href="#support">Check-in</a>
      </nav>
      <a class="login-btn" href="#support">Đăng nhập</a>
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
          <label class="field"><span>Hạng vé</span><select id="classType"><option>Phổ thông</option><option>Thương gia</option></select></label>
        </div>
        <button class="primary-btn search-btn" type="submit">TÌM CHUYẾN BAY</button>
      </form>
    </div></div></section>

    <section class="section" id="services"><div class="container">
      <div class="section-heading"><span class="eyebrow dark">TRIPGO SERVICES</span><h2>Dịch vụ hàng không</h2><p>Mọi tiện ích cần thiết cho chuyến bay của bạn.</p></div>
      <div class="service-grid"><a class="service-card" href="#search"><span>✈️</span><h3>Đặt vé máy bay</h3><p>Tìm và chọn chuyến bay phù hợp.</p></a><a class="service-card" href="#support"><span>📋</span><h3>Tra cứu đặt chỗ</h3><p>Kiểm tra thông tin hành trình.</p></a><a class="service-card" href="#support"><span>✓</span><h3>Check-in trực tuyến</h3><p>Làm thủ tục nhanh chóng.</p></a><a class="service-card" href="#search"><span>💺</span><h3>Chọn ghế</h3><p>Chọn vị trí yêu thích trên máy bay.</p></a></div>
    </div></section>

    <section class="promo"><div class="container"><div class="section-heading"><span class="eyebrow dark">ƯU ĐÃI</span><h2>Khám phá những hành trình mới</h2></div><div class="promo-grid">
      <article class="promo-card p1"><div><small>ĐƯỜNG BAY NỘI ĐỊA</small><h3>Hà Nội - Đà Nẵng</h3><p>Khám phá thành phố biển xinh đẹp.</p></div></article><article class="promo-card p2"><div><small>ĐƯỜNG BAY NỘI ĐỊA</small><h3>TP. Hồ Chí Minh - Phú Quốc</h3><p>Chạm tới thiên đường đảo ngọc.</p></div></article><article class="promo-card p3"><div><small>ĐƯỜNG BAY NỘI ĐỊA</small><h3>Hà Nội - TP. Hồ Chí Minh</h3><p>Hành trình kết nối hai miền.</p></div></article>
    </div></div></section>

    <section class="section benefits"><div class="container benefit-grid"><div><span>01</span><h3>Đơn giản</h3><p>Quy trình đặt vé rõ ràng, dễ sử dụng.</p></div><div><span>02</span><h3>Nhanh chóng</h3><p>Tìm kiếm và lựa chọn chuyến bay trong vài bước.</p></div><div><span>03</span><h3>Thuận tiện</h3><p>Lưu thông tin đặt vé ngay trên trình duyệt.</p></div></div></section>
  </main>

  <footer class="footer" id="support"><div class="container footer-grid"><div><a class="logo footer-logo" href="#top"><span>✈</span> TripGo</a><p>Website mô phỏng đặt vé máy bay nội địa.</p></div><div><h4>TripGo</h4><a href="#top">Về chúng tôi</a><a href="#top">Điều khoản</a><a href="#top">Chính sách</a></div><div><h4>Hỗ trợ</h4><a href="#search">Tra cứu đặt vé</a><a href="#search">Check-in</a><a href="#top">Câu hỏi thường gặp</a></div><div><h4>Liên hệ</h4><p>support@tripgo.vn</p><p>1900 0000</p></div></div><div class="copyright">© 2026 TripGo. Front-end project.</div></footer>
`

const departure = document.querySelector('#departure')
const returnDate = document.querySelector('#returnDate')
const today = new Date().toISOString().split('T')[0]
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
  const search = { from: document.querySelector('#from').value, to: document.querySelector('#to').value, departure: departure.value, returnDate: returnDate.disabled ? '' : returnDate.value, passengers: document.querySelector('#passengers').value, classType: document.querySelector('#classType').value }
  localStorage.setItem('tripgo_search', JSON.stringify(search))
  window.location.hash = `search-results?${new URLSearchParams(search).toString()}`
})
updateReturnDate()