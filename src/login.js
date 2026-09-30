export function renderLogin() {
  return `
    <main>
      <section class="section">
        <div class="container">
          <a href="#top">← Về trang chủ</a>

          <div class="section-heading">
            <span class="eyebrow dark">TÀI KHOẢN</span>
            <h2>Đăng nhập</h2>
            <p>Đăng nhập vào tài khoản TripGo của bạn.</p>
          </div>

          <form class="search-box" id="loginForm" novalidate>
            <label class="field">
              <span>Email</span>
              <input
                type="email"
                id="loginEmail"
                placeholder="Nhập email"
                required
              >
            </label>

            <label class="field">
              <span>Mật khẩu</span>
              <input
                type="password"
                id="loginPassword"
                placeholder="Nhập mật khẩu"
                required
              >
            </label>

            <button class="primary-btn search-btn" type="submit">
              ĐĂNG NHẬP
            </button>

            <p>Chưa có tài khoản? <a href="#register">Đăng ký</a></p>
            <p id="loginMessage"></p>
          </form>
        </div>
      </section>
    </main>
  `
}

export function initLogin() {
  const form = document.querySelector('#loginForm')
  const message = document.querySelector('#loginMessage')

  if (!form || !message) return

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const email = document
      .querySelector('#loginEmail')
      .value
      .trim()
      .toLowerCase()

    const password = document.querySelector('#loginPassword').value

    if (!email || !password) {
      message.textContent = 'Vui lòng nhập email và mật khẩu.'
      return
    }

    const users = JSON.parse(
      localStorage.getItem('tripgo_users') || '[]'
    )

    const user = users.find(
      item => item.email === email && item.password === password
    )

    if (!user) {
      message.textContent = 'Thông tin đăng nhập không chính xác.'
      return
    }

    const currentUser = {
      id: user.id,
      name: user.name,
      email: user.email
    }

    localStorage.setItem(
      'tripgo_current_user',
      JSON.stringify(currentUser)
    )

    message.textContent = 'Đăng nhập thành công.'

    setTimeout(() => {
      window.location.hash = 'top'
      location.reload()
    }, 500)
  })
}