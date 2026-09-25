const USERS_KEY = 'tripgo_users';

function getUsers() {
  try {
    const users = JSON.parse(localStorage.getItem(USERS_KEY));
    return Array.isArray(users) ? users : [];
  } catch (error) {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function showRegisterMessage(message, type = 'error') {
  const result = document.getElementById('result');
  result.className = type;
  result.textContent = message;
}

function register() {
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim().toLowerCase();
  const phone = document.getElementById('phone').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (!name || !email || !phone || !password || !confirmPassword) {
    showRegisterMessage('Vui lòng nhập đầy đủ thông tin.');
    return;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    showRegisterMessage('Email không hợp lệ.');
    return;
  }

  const phonePattern = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
  if (!phonePattern.test(phone.replace(/\s/g, ''))) {
    showRegisterMessage('Số điện thoại không hợp lệ.');
    return;
  }

  if (password.length < 6) {
    showRegisterMessage('Mật khẩu phải có ít nhất 6 ký tự.');
    return;
  }

  if (password !== confirmPassword) {
    showRegisterMessage('Mật khẩu xác nhận không khớp.');
    return;
  }

  const users = getUsers();
  const existedUser = users.some(user => user.email === email);

  if (existedUser) {
    showRegisterMessage('Email này đã được đăng ký.');
    return;
  }

  const newUser = {
    id: `USR${Date.now()}`,
    name,
    email,
    phone,
    password,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);

  showRegisterMessage('Đăng ký thành công. Bạn có thể đăng nhập ngay.', 'notice');
  document.getElementById('registerForm').reset();
}

function handleRegisterSubmit(event) {
  event.preventDefault();
  register();
}

document.getElementById('registerForm').addEventListener('submit', handleRegisterSubmit);
