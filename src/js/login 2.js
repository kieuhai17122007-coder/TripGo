import './auth.js';
import '../css/main.css';
import '../css/pages.css';

const form = document.getElementById('loginForm');
const result = document.getElementById('result');
const params = new URLSearchParams(location.search);
const returnUrl = params.get('returnUrl') || '/';

if (window.TripGoAuth?.isLoggedIn()) {
  location.replace(window.TripGoAuth.isAdmin() ? '/admin/' : '/');
}

form?.addEventListener('submit', event => {
  event.preventDefault();

  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    result.className = 'error';
    result.textContent = 'Vui lòng nhập email và mật khẩu.';
    return;
  }

  const users = window.TripGoAuth.getUsers();
  const user = users.find(item => item.email === email);

  if (!user || user.password !== password) {
    result.className = 'error';
    result.textContent = 'Email hoặc mật khẩu không chính xác.';
    return;
  }

  localStorage.setItem('tripgo_current_user', JSON.stringify(user));
  result.className = 'notice';
  result.textContent = 'Đăng nhập thành công.';

  const destination = user.role === 'admin'
    ? '/admin/'
    : (returnUrl.startsWith('/') ? returnUrl : '/');

  setTimeout(() => location.replace(destination), 250);
});
