import {read,normalizeFlight,flightKey,getSeatState,groupError,validateSelection,suggestSeats,renderCabin} from './seat-store.js';
import './booking-guard.js';
const f=normalizeFlight(read('tripgo_selected_flight',{}));
const box=document.getElementById('seats'), error=document.getElementById('seatError');
const selected=new Set(localStorage.getItem('tripgo_selected_seat_flight')===flightKey(f) ? read('tripgo_selected_seats') : []);
const say=message=>{error.textContent=message;error.classList.toggle('show',!!message);};
document.getElementById('seatHelp').textContent=`${f.id || ''} • ${f.date || ''} • ${f.passengers} hành khách. Mô hình demo 20 hàng, mỗi hàng 3 + 3 ghế.`;
function render(){
 const state=getSeatState(f);for(const s of selected)if(state.booked.has(s)||state.blocked.has(s))selected.delete(s);
 renderCabin(box,state,selected,(id,status)=>{
  if(status==='booked'||status==='blocked')return say(`Ghế ${id} ${status==='booked'?'đã được đặt':'đang khóa'}.`);
  const next=new Set(selected);if(next.has(id))next.delete(id);else{if(next.size>=f.passengers)return say(`Chỉ được chọn ${f.passengers} ghế.`);next.add(id);}
  const issue=groupError([...next]);if(issue)return say(issue);
  selected.clear();next.forEach(s=>selected.add(s));say('');render();
 });
 document.getElementById('seatCounter').textContent=`${selected.size}/${f.passengers} ghế`;
 document.getElementById('selectedSeatList').textContent=[...selected].map((s,i)=>`Hành khách ${i+1}: ${s}`).join(' • ');
 document.getElementById('cabinStats').textContent=`Trống: ${120-new Set([...state.booked,...state.blocked]).size} • Đã đặt: ${state.booked.size} • Khóa: ${state.blocked.size}`;
}
document.getElementById('autoSeats').onclick=()=>{const state=getSeatState(f), seats=suggestSeats(f.passengers,new Set([...state.booked,...state.blocked]));if(!seats.length)return say('Không tìm thấy nhóm ghế phù hợp. Hãy đổi chuyến bay hoặc giảm số khách.');selected.clear();seats.forEach(s=>selected.add(s));say('');render();};
document.getElementById('clearSeats').onclick=()=>{selected.clear();say('');render();};
document.getElementById('nextBtn').onclick=()=>{const seats=[...selected],issue=validateSelection(f,seats);if(issue)return say(issue);try{localStorage.setItem('tripgo_selected_seats',JSON.stringify(seats));localStorage.setItem('tripgo_selected_seat',seats.join(', '));localStorage.setItem('tripgo_selected_seat_flight',flightKey(f));location.href='/src/pages/confirm.html';}catch{say('Không lưu được ghế. Kiểm tra dung lượng trình duyệt.');}};
window.addEventListener('storage',e=>{if(['tripgo_bookings','tripgo_seat_maps','tripgo_flights'].includes(e.key)){render();say('Sơ đồ đã cập nhật. Hãy kiểm tra lại ghế trước khi tiếp tục.');}});
render();
