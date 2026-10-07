function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('tripgo_current_user') || 'null')
  } catch {
    return null
  }
}

function getFullUser() {
  const currentUser = getCurrentUser()

  if (!currentUser) return null

  const users = JSON.parse(
    localStorage.getItem('tripgo_users') || '[]'
  )

  return users.find(user =>
    user.id === currentUser.id ||
    user.email === currentUser.email
  ) || currentUser
}

function formatDate(value) {
  if (!value) return 'Chưa có thông tin'

  return new Date(value).toLocaleDateString('vi-VN')
}

export function renderAccount() {
  const user = getFullUser()

  if (!user) {
    return `
      <main>
        <section class="section">
          <div class="container">
            <div class="section-heading">
              <span class="eyebrow dark">TÀI KHOẢN</span>
              <h2>Thông tin tài khoản</h2>
              <p>Bạn chưa đăng nhập.</p>

              <a class="primary-btn" href="#login">
                ĐĂNG NHẬP
              </a>
            </div>
          </div>
        </section>
      </main>
    `
  }

  return `
    <main>
      <section class="section">
        <div class="container">

          <a href="#top">← Về trang chủ</a>

          <div class="section-heading">
            <span class="eyebrow dark">TÀI KHOẢN</span>
            <h2>Thông tin tài khoản</h2>
            <p>Thông tin tài khoản của bạn trên TripGo.</p>
          </div>

          <div class="flight-card" style="display:block">

            <p>Họ và tên</p>
            <h3>${user.name || 'Chưa có thông tin'}</h3>

            <p>Email</p>
            <h3>${user.email || 'Chưa có thông tin'}</h3>

            <p>Ngày đăng ký</p>
            <h3>${formatDate(user.createdAt)}</h3>

            <div style="margin-top:20px">
              <a class="primary-btn" href="#my-bookings">
                XEM VÉ CỦA TÔI
              </a>

              <a class="primary-btn" href="#logout">
                ĐĂNG XUẤT
              </a>
            </div>

          </div>
        </div>
      </section>
    </main>
  `
}