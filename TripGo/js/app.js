const TG = {
  USERS: 'tripgo_users', SESSION: 'tripgo_session', BOOKINGS: 'tripgo_bookings',
  FLIGHTS: 'tripgo_flights', SEARCH: 'tripgo_search', SELECTED: 'tripgo_selected_flight',
  PASSENGERS: 'tripgo_passengers', SEAT: 'tripgo_selected_seat', FARE: 'tripgo_fare', DRAFT: 'tripgo_booking_draft'
};

const AIRPORTS = {
  HAN: 'Hà Nội', SGN: 'TP. Hồ Chí Minh', DAD: 'Đà Nẵng', PQC: 'Phú Quốc', CXR: 'Nha Trang', HPH: 'Hải Phòng'
};
const AIRLINES = ['TripGo Airlines', 'VietJet Air', 'Vietnam Airlines', 'Bamboo Airways'];
const AIRCRAFTS = ['Airbus A320', 'Airbus A321', 'Boeing 737'];

function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; } }
function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function getUsers(){ return read(TG.USERS, []); }
function saveUsers(v){ write(TG.USERS,v); }
function getSession(){ return read(TG.SESSION,null); }
function getCurrentUser(){ const s=getSession(); return s ? getUsers().find(u=>u.id===s.userId)||null : null; }
function setSession(user){ write(TG.SESSION,{userId:user.id,loggedAt:new Date().toISOString()}); }
function logout(){ localStorage.removeItem(TG.SESSION); location.href='login.html'; }
function getBookings(){ return read(TG.BOOKINGS,[]); }
function saveBookings(v){ write(TG.BOOKINGS,v); }
function getFlights(){ return read(TG.FLIGHTS,[]); }
function saveFlights(v){ write(TG.FLIGHTS,v); }
function formatMoney(v){ return Number(v||0).toLocaleString('vi-VN')+' ₫'; }
function escapeHTML(v){ return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
function todayISO(){ return new Date().toISOString().slice(0,10); }
function makeId(prefix='ID'){ return prefix+'-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,6).toUpperCase(); }
function bookingCode(){ return 'TG'+Date.now().toString().slice(-8)+Math.floor(Math.random()*10); }
function requireLogin(){ if(!getCurrentUser()){ location.href='login.html?next='+encodeURIComponent(location.pathname.split('/').pop()); return false;} return true; }
function requireAdmin(){ const u=getCurrentUser(); if(!u||u.role!=='admin'){ location.href='login.html'; return false;} return true; }
function statusLabel(s){ return s==='cancelled'?'Đã hủy':s==='pending'?'Chờ thanh toán':'Đã xác nhận'; }
function dateVN(d){ if(!d) return '-'; const [y,m,day]=d.split('-'); return `${day}/${m}/${y}`; }
function getQuery(){ return Object.fromEntries(new URLSearchParams(location.search)); }

function seedAdmin(){
  const users=getUsers();
  if(!users.some(u=>u.email==='admin@tripgo.vn')) users.push({id:'USR-ADMIN',name:'TripGo Admin',email:'admin@tripgo.vn',phone:'1900000000',password:'admin123',role:'admin',createdAt:new Date().toISOString()});
  saveUsers(users);
}

const DEFAULT_FLIGHTS = [
  {id:'TG101',airline:'TripGo Airlines',from:'HAN',to:'SGN',date:todayISO(),departure:'06:30',arrival:'08:40',duration:'2 giờ 10 phút',aircraft:'Airbus A321',price:1590000,baggage:7,status:'active'},
  {id:'TG102',airline:'TripGo Airlines',from:'HAN',to:'SGN',date:todayISO(),departure:'10:15',arrival:'12:25',duration:'2 giờ 10 phút',aircraft:'Airbus A320',price:1790000,baggage:7,status:'active'},
  {id:'TG103',airline:'VietJet Air',from:'HAN',to:'SGN',date:todayISO(),departure:'14:20',arrival:'16:30',duration:'2 giờ 10 phút',aircraft:'Airbus A321',price:1390000,baggage:7,status:'active'},
  {id:'TG201',airline:'Vietnam Airlines',from:'HAN',to:'DAD',date:todayISO(),departure:'07:00',arrival:'08:25',duration:'1 giờ 25 phút',aircraft:'Airbus A321',price:990000,baggage:10,status:'active'},
  {id:'TG202',airline:'TripGo Airlines',from:'HAN',to:'DAD',date:todayISO(),departure:'13:10',arrival:'14:35',duration:'1 giờ 25 phút',aircraft:'Airbus A320',price:890000,baggage:7,status:'active'},
  {id:'TG301',airline:'Vietnam Airlines',from:'SGN',to:'DAD',date:todayISO(),departure:'08:20',arrival:'09:50',duration:'1 giờ 30 phút',aircraft:'Airbus A321',price:1090000,baggage:10,status:'active'},
  {id:'TG302',airline:'VietJet Air',from:'SGN',to:'PQC',date:todayISO(),departure:'09:15',arrival:'10:15',duration:'1 giờ',aircraft:'Airbus A320',price:790000,baggage:7,status:'active'},
  {id:'TG401',airline:'Bamboo Airways',from:'DAD',to:'PQC',date:todayISO(),departure:'11:20',arrival:'13:00',duration:'1 giờ 40 phút',aircraft:'Airbus A320',price:1190000,baggage:7,status:'active'},
  {id:'TG501',airline:'TripGo Airlines',from:'SGN',to:'HAN',date:todayISO(),departure:'17:30',arrival:'19:40',duration:'2 giờ 10 phút',aircraft:'Airbus A321',price:1490000,baggage:7,status:'active'}
];

async function initFlights(){
  const current=getFlights();
  if(current.length) return current;
  try { const r=await fetch('../data/flights.json'); if(r.ok){ const data=await r.json(); const normalized=data.map((f,i)=>({...f,date:f.date||todayISO(),airline:f.airline||'TripGo Airlines',duration:f.duration||'1 giờ 30 phút',baggage:f.baggage??7,status:'active'})); saveFlights(normalized); return normalized; } } catch(e){}
  saveFlights(DEFAULT_FLIGHTS); return DEFAULT_FLIGHTS;
}
seedAdmin();
