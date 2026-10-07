import './auth.js';
import '../css/main.css';
import '../css/pages.css';

if (!window.TripGoAuth.requireAdmin()) throw new Error('Admin access required');
window.TripGoAuth.updateAuthUI();
document.getElementById('adminUser').textContent = window.TripGoAuth.getCurrentUser()?.email || '';

const FLIGHTS_KEY = 'tripgo_flights';
const state = {
  users: window.TripGoAuth.getUsers(),
  bookings: window.TripGoAuth.getBookings(),
  flights: []
};

const $ = selector => document.querySelector(selector);
const money = value => `${Number(value || 0).toLocaleString('vi-VN')} ₫`;

async function loadFlights() {
  const saved = localStorage.getItem(FLIGHTS_KEY);
  if (saved) {
    try {
      state.flights = JSON.parse(saved);
      if (!Array.isArray(state.flights)) throw new Error();
      return;
    } catch {}
  }

  try {
    const response = await fetch('/src/data/flights.json');
    state.flights = await response.json();
  } catch {
    state.flights = [];
  }
}

function saveFlights() {
  localStorage.setItem(FLIGHTS_KEY, JSON.stringify(state.flights));
}

function renderStats() {
  $('#statUsers').textContent = state.users.filter(user => user.role !== 'admin').length;
  $('#statBookings').textContent = state.bookings.length;
  $('#statRevenue').textContent = money(state.bookings.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0));
  $('#statFlights').textContent = state.flights.length;
}

function renderUsers() {
  $('#usersTable').innerHTML = state.users.map(user => `
    <tr>
      <td>${escapeHtml(user.id)}</td>
      <td>${escapeHtml(user.name)}</td>
      <td>${escapeHtml(user.email)}</td>
      <td>${escapeHtml(user.phone || '-')}</td>
      <td><span class="status ${user.role === 'admin' ? 'status-admin' : ''}">${user.role === 'admin' ? 'Admin' : 'Khách hàng'}</span></td>
      <td>${formatDate(user.createdAt)}</td>
    </tr>
  `).join('');
}

function renderBookings() {
  $('#bookingsTable').innerHTML = state.bookings.length
    ? state.bookings.map(booking => `
      <tr>
        <td><b>${escapeHtml(booking.bookingCode)}</b></td>
        <td>${escapeHtml(booking.passenger?.fullName || '-')}<br><small>${escapeHtml(booking.passenger?.email || '')}</small></td>
        <td>${escapeHtml(booking.flight?.flightNumber || '-')}<br>${escapeHtml(booking.flight?.from || '')} → ${escapeHtml(booking.flight?.to || '')}</td>
        <td>${escapeHtml(booking.seat || '-')}</td>
        <td>${money(booking.totalPrice)}</td>
        <td>
          <select class="booking-status" data-code="${escapeHtml(booking.bookingCode)}">
            ${['Đã đặt vé', 'Đã check-in', 'Đã hủy'].map(status => `<option ${booking.status === status ? 'selected' : ''}>${status}</option>`).join('')}
          </select>
        </td>
      </tr>
    `).join('')
    : '<tr><td colspan="6" class="empty">Chưa có đặt vé.</td></tr>';

  document.querySelectorAll('.booking-status').forEach(select => {
    select.addEventListener('change', () => {
      const booking = state.bookings.find(item => item.bookingCode === select.dataset.code);
      if (!booking) return;
      booking.status = select.value;
      window.TripGoAuth.saveBookings(state.bookings);
      renderStats();
    });
  });
}

function renderFlights() {
  $('#flightsTable').innerHTML = state.flights.map(flight => `
    <tr>
      <td>${escapeHtml(flight.id)}</td>
      <td>${escapeHtml(flight.airline || 'TripGo Airlines')}</td>
      <td>${escapeHtml(flight.from)} → ${escapeHtml(flight.to)}</td>
      <td>${escapeHtml(flight.departure)} - ${escapeHtml(flight.arrival)}</td>
      <td>${money(flight.price)}</td>
      <td><button class="table-btn danger" data-delete-flight="${escapeHtml(flight.id)}">Xóa</button></td>
    </tr>
  `).join('') || '<tr><td colspan="6" class="empty">Chưa có chuyến bay.</td></tr>';

  document.querySelectorAll('[data-delete-flight]').forEach(button => {
    button.addEventListener('click', () => {
      if (!confirm(`Xóa chuyến ${button.dataset.deleteFlight}?`)) return;
      state.flights = state.flights.filter(flight => flight.id !== button.dataset.deleteFlight);
      saveFlights();
      renderFlights();
      renderStats();
    });
  });
}

$('#flightForm').addEventListener('submit', event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  if (state.flights.some(flight => flight.id === data.id)) {
    return showAdminMessage('Mã chuyến bay đã tồn tại.', 'error');
  }

  state.flights.push({
    id: data.id.trim().toUpperCase(),
    airline: data.airline.trim() || 'TripGo Airlines',
    from: data.from.trim().toUpperCase(),
    to: data.to.trim().toUpperCase(),
    departure: data.departure,
    arrival: data.arrival,
    price: Number(data.price),
    aircraft: data.aircraft.trim() || 'A320'
  });

  saveFlights();
  event.currentTarget.reset();
  renderFlights();
  renderStats();
  showAdminMessage('Đã thêm chuyến bay.', 'notice');
});

$('#logoutAdmin').addEventListener('click', () => window.TripGoAuth.logout());

async function init() {
  await loadFlights();
  renderStats();
  renderUsers();
  renderBookings();
  renderFlights();
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('vi-VN');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;'
  }[char]));
}

function showAdminMessage(message, type) {
  const element = $('#adminMessage');
  element.className = type;
  element.textContent = message;
}

init();
