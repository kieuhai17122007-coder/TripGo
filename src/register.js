export function renderRegister() {
  return `
    <main>
      <section class="section">
        <div class="container">
          <a href="#top">← Về trang chủ</a>

          <div class="section-heading">
            <span class="eyebrow dark">TÀI KHOẢN</span>
            <h2>Đăng ký tài khoản</h2>
            <p>Tạo tài khoản TripGo để sử dụng các tiện ích.</p>
          </div>

          <form class="search-box" id="registerForm" novalidate>
            <label class="field">
              <span>Họ và tên</span>
              <input type="text" id="registerName" placeholder="Nhập họ và tên" required>
            </label>

            <label class="field">
              <span>Email</span>
              <input type="email" id="registerEmail" placeholder="Nhập email" required>
            </label>

            <label class="field">
              <span>Mật khẩu</span>
              <input type="password" id="registerPassword" placeholder="Nhập mật khẩu" required>
            </label>

            <label class="field">
              <span>Xác nhận mật khẩu</span>
              <input type="password" id="registerConfirmPassword" placeholder="Nhập lại mật khẩu" required>
            </label>

            <button class="primary-btn search-btn" type="submit">
              ĐĂNG KÝ
            </button>

            <p id="registerMessage"></p>
          </form>
        </div>
      </section>
    </main>
  `
}

export function initRegister() {
  const form = document.querySelector('#registerForm')
  const message = document.querySelector('#registerMessage')

  if (!form || !message) return

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const name = document.querySelector('#registerName').value.trim()
    const email = document.querySelector('#registerEmail').value.trim().toLowerCase()
    const password = document.querySelector('#registerPassword').value
    const confirmPassword = document.querySelector('#registerConfirmPassword').value

    if (!name || !email || !password || !confirmPassword) {
      message.textContent = 'Vui lòng nhập đầy đủ thông tin.'
      return
    }

    if (password.length < 6) {
      message.textContent = 'Mật khẩu phải có ít nhất 6 ký tự.'
      return
    }

    if (password !== confirmPassword) {
      message.textContent = 'Mật khẩu xác nhận không khớp.'
      return
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailPattern.test(email)) {
      message.textContent = 'Email không hợp lệ.'
      return
    }

    const users = JSON.parse(
      localStorage.getItem('tripgo_users') || '[]'
    )

    const exists = users.some(user => user.email === email)

    if (exists) {
      message.textContent = 'Email này đã được đăng ký.'
      return
    }

    const user = {
      id: Date.now(),
      name,
      email,
      password,
      createdAt: new Date().toISOString()
    }

    users.push(user)

    localStorage.setItem(
      'tripgo_users',
      JSON.stringify(users)
    )

    message.textContent = 'Đăng ký thành công.'
    form.reset()
  })
}