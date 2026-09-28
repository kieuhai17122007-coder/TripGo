export function renderFlightResults() {
  return `
    <section class="section">
      <div class="container">
        <h2>Kết quả tìm kiếm chuyến bay</h2>

        <div class="flight-card">
          <div class="airline">Vietnam Airlines</div>

          <div class="info">
            <span>Hà Nội → Đà Nẵng</span>
            <span>06:30 - 07:55</span>
          </div>

          <div class="info">
            <span class="price">1.250.000 VNĐ</span>
            <button onclick="bookFlight()">Đặt vé</button>
          </div>
        </div>

        <div class="flight-card">
          <div class="airline">VietJet Air</div>

          <div class="info">
            <span>Hà Nội → TP.HCM</span>
            <span>08:00 - 10:10</span>
          </div>

          <div class="info">
            <span class="price">1.450.000 VNĐ</span>
            <button onclick="bookFlight()">Đặt vé</button>
          </div>
        </div>
      </div>
    }
    </section>
  `
}
  window.bookFlight = function () {
      alert('Đặt vé thành công!')
      window.location.hash = ''
      location.reload()
  }
    