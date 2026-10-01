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
                autocomplete="email"
              >
              <small id="loginEmailError"></small>
            </label>

            <label class="field">
              <span>Mật khẩu</span>
              <input
                type="password"
                id="loginPassword"
                placeholder="Nhập mật khẩu"
                autocomplete="current-password"
              >
              <small id="loginPasswordError"></small>
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
  const emailInput = document.querySelector('#loginEmail')
  const passwordInput = document.querySelector('#loginPassword')
  const emailError = document.querySelector('#loginEmailError')
  const passwordError = document.querySelector('#loginPasswordError')
  const message = document.querySelector('#loginMessage')

  if (!form || !emailInput || !passwordInput) return

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    emailError.textContent = ''
    passwordError.textContent = ''
    message.textContent = ''

    const email = emailInput.value.trim().toLowerCase()
    const password = passwordInput.value
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!email) {
      emailError.textContent = 'Vui lòng nhập email.'
      return
    }

    if (!emailPattern.test(email)) {
      emailError.textContent = 'Email không hợp lệ.'
      return
    }

    if (!password) {
      passwordError.textContent = 'Vui lòng nhập mật khẩu.'
      return
    }

    const users = JSON.parse(
      localStorage.getItem('tripgo_users') || '[]'
    )

    const user = users.find(item => item.email === email)

    if (!user) {
      emailError.textContent = 'Email chưa được đăng ký.'
      return
    }

    if (user.password !== password) {
      passwordError.textContent = 'Mật khẩu không chính xác.'
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
      form.reset()
      setTimeout(() => {
        window.location.hash = '#top'
      }, 500)
  })
}