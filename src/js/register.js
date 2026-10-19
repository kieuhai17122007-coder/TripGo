import './auth.js';
import '../css/main.css';
import '../css/pages.css';

const form = document.getElementById('registerForm');
const result = document.getElementById('result');

form?.addEventListener('submit', event => {
  event.preventDefault();

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim().toLowerCase();
  const phone = document.getElementById('phone').value.replace(/\s/g, '');
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (!name || !email || !phone || !password || !confirmPassword) {
    return show('Vui lòng nhập đầy đủ thông tin.', 'error');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return show('Email không hợp lệ.', 'error');
  }
  if (!/^(0|\+84)(3|5|7|8|9)[0-9]{8}$/.test(phone)) {
    return show('Số điện thoại không hợp lệ.', 'error');
  }
  if (password.length < 6) {
    return show('Mật khẩu phải có ít nhất 6 ký tự.', 'error');
  }
  if (password !== confirmPassword) {
    return show('Mật khẩu xác nhận không khớp.', 'error');
  }

  const users = window.TripGoAuth.getUsers();
  if (users.some(user => user.email === email)) {
    return show('Email này đã được đăng ký.', 'error');
  }

  users.push({
    id: `USR${Date.now()}`,
    name,
    email,
    phone,
    password,
    role: 'customer',
    createdAt: new Date().toISOString()
  });

  window.TripGoAuth.saveUsers(users);
  form.reset();
  show('Đăng ký thành công. Đang chuyển tới trang đăng nhập...', 'notice');
  setTimeout(() => location.replace('/src/pages/login.html'), 700);
});

function show(message, type) {
  result.className = type;
  result.textContent = message;
}
