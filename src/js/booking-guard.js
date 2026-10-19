import './auth.js';

const path = location.pathname;
const protectedPages = new Set([
  '/src/pages/passenger.html',
  '/src/pages/seat.html',
  '/src/pages/confirm.html',
  '/src/pages/payment.html'
]);

if (protectedPages.has(path) && !window.TripGoAuth.requireLogin()) {
  // requireLogin performs the redirect.
}

if (window.TripGoAuth.isLoggedIn() && path.endsWith('/seat.html') && !localStorage.getItem('tripgo_selected_flight')) {
  location.replace('/src/pages/search.html');
}

if (window.TripGoAuth.isLoggedIn() && path.endsWith('/confirm.html') &&
    (!localStorage.getItem('tripgo_selected_flight') || !localStorage.getItem('tripgo_passenger') || !(localStorage.getItem('tripgo_selected_seats') || localStorage.getItem('tripgo_selected_seat')))) {
  location.replace('/src/pages/search.html');
}

if (window.TripGoAuth.isLoggedIn() && path.endsWith('/payment.html') &&
    (!localStorage.getItem('tripgo_selected_flight') || !localStorage.getItem('tripgo_passenger') || !(localStorage.getItem('tripgo_selected_seats') || localStorage.getItem('tripgo_selected_seat')))) {
  location.replace('/src/pages/search.html');
}
