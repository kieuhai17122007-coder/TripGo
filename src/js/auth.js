const USERS_KEY = 'tripgo_users';
const CURRENT_USER_KEY = 'tripgo_current_user';
const BOOKINGS_KEY = 'tripgo_bookings';

function readJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function getUsers() {
  const users = readJson(USERS_KEY, []);
  return Array.isArray(users) ? users : [];
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getCurrentUser() {
  return readJson(CURRENT_USER_KEY, null);
}

function isLoggedIn() {
  return !!getCurrentUser();
}

function isAdmin() {
  return getCurrentUser()?.role === 'admin';
}

function getBookings() {
  const bookings = readJson(BOOKINGS_KEY, []);
  if (Array.isArray(bookings)) return bookings;

  const oldBooking = readJson('tripgo_booking', null);
  return oldBooking ? [oldBooking] : [];
}

function saveBookings(bookings) {
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
  if (bookings.length) {
    localStorage.setItem('tripgo_booking', JSON.stringify(bookings[bookings.length - 1]));
  }
}

function seedAdmin() {
  const users = getUsers();
  const adminEmail = 'admin@tripgo.vn';
  if (!users.some(user => user.email === adminEmail)) {
    users.push({
      id: 'ADMIN001',
      name: 'TripGo Admin',
      email: adminEmail,
      phone: '0900000000',
      password: 'admin123',
      role: 'admin',
      createdAt: new Date().toISOString()
    });
    saveUsers(users);
  }
}

function requireLogin(returnUrl = location.pathname + location.search) {
  if (isLoggedIn()) return true;
  const target = returnUrl || '/';
  location.replace(`/src/pages/login.html?returnUrl=${encodeURIComponent(target)}`);
  return false;
}

function requireAdmin() {
  if (isAdmin()) return true;
  if (!isLoggedIn()) {
    location.replace('/src/pages/login.html?returnUrl=/src/pages/admin.html');
    return false;
  }
  location.replace('/');
  return false;
}

function logout() {
  localStorage.removeItem(CURRENT_USER_KEY);
  location.replace('/');
}

function updateAuthUI() {
  const user = getCurrentUser();
  const currentPath = location.pathname;
  const currentHash = location.hash;

  document.querySelectorAll('[data-nav]').forEach(link => {
    const key = link.dataset.nav;
    let active = false;
    if (key === 'home') active = currentPath === '/' && !currentHash;
    if (key === 'flights') active = currentPath.endsWith('/search.html');
    if (key === 'services') active = currentPath === '/' && currentHash === '#services';
    if (key === 'booking') active = currentPath.endsWith('/booking.html');
    if (key === 'checkin') active = currentPath.endsWith('/checkin.html');
    link.classList.toggle('active', active);
  });

  document.querySelectorAll('[data-auth-link]').forEach(link => {
    if (!user) {
      link.textContent = 'Đăng nhập';
      link.href = '/src/pages/login.html';
      return;
    }
    if (link.closest('.account-menu')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'account-menu';
    wrapper.innerHTML = `
      <button class="account-trigger" type="button" aria-expanded="false">
        <span class="account-avatar">${String(user.name || 'U').charAt(0).toUpperCase()}</span>
        <span class="account-name">${String(user.role === 'admin' ? 'Quản trị' : user.name || 'Tài khoản')}</span>
        <span class="account-chevron" aria-hidden="true"></span>
      </button>
      <div class="account-dropdown">
        ${user.role === 'admin'
          ? '<a href="/src/pages/admin.html">⚙ Quản trị</a>'
          : '<a href="/src/pages/history.html">✈ Lịch sử đặt vé</a>'}
        <a href="/src/pages/booking.html">⌕ Tra cứu đặt chỗ</a>
        <button type="button" data-logout>↪ Đăng xuất</button>
      </div>`;
    link.replaceWith(wrapper);
    const trigger=wrapper.querySelector('.account-trigger');
    trigger.addEventListener('click', e=>{
      e.stopPropagation();
      document.querySelectorAll('.account-menu.open').forEach(x=>x!==wrapper&&x.classList.remove('open'));
      wrapper.classList.toggle('open');
      trigger.setAttribute('aria-expanded', wrapper.classList.contains('open'));
    });
    wrapper.querySelector('[data-logout]').onclick=logout;
  });
}

seedAdmin();

window.TripGoAuth = {
  getUsers,
  saveUsers,
  getCurrentUser,
  getBookings,
  saveBookings,
  isLoggedIn,
  isAdmin,
  requireLogin,
  requireAdmin,
  logout,
  updateAuthUI,
  USERS_KEY,
  CURRENT_USER_KEY,
  BOOKINGS_KEY
};

export {
  getUsers,
  saveUsers,
  getCurrentUser,
  getBookings,
  saveBookings,
  isLoggedIn,
  isAdmin,
  requireLogin,
  requireAdmin,
  logout,
  updateAuthUI
};
