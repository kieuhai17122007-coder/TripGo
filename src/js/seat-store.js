// Shared seat rules for customers and admin. Demo data stays on this browser.
export const MAP_KEY = 'tripgo_seat_maps';
export const ROWS = 20;
export const LETTERS = ['A','B','C','D','E','F'];
export const ALL_SEATS = Array.from({length:ROWS},(_,i)=>LETTERS.map(c=>`${i+1}${c}`)).flat();
export function read(key, fallback=[]) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
export function normalizeFlight(f={}) {
  const count = Number(f.search?.passengers ?? f.passengers ?? 1);
  return {...f, id:f.id || f.flightId, date:f.date || f.departureDate || f.search?.departure,
    departure:f.departure || f.departureTime, arrival:f.arrival || f.arrivalTime,
    passengers:Number.isInteger(count) && count>0 && count<=120 ? count : 1,
    price:Number(f.price ?? ((f.totalPrice && count) ? f.totalPrice/count : f.basePrice) ?? 0),
    classType:f.search?.classType || (f.ticketClass==='business'?'Thương gia':'Phổ thông')};
}
export function flightKey(f) { const n=normalizeFlight(f); return `${n.id}|${n.date || ''}`; }
export function cancelled(b) { return ['cancelled','đã hủy','đã bị hủy'].includes(String(b.status||'').toLowerCase()); }
export function bookingSeats(b) { return (Array.isArray(b.seats) && b.seats.length ? b.seats : String(b.seat||'').split(/[,\s]+/)).filter(s=>ALL_SEATS.includes(s)); }
export function getMap(f) { return read(MAP_KEY).find(m=>m.id===flightKey(f)) || {id:flightKey(f),blocked:[],demoBooked:[]}; }
export function getSeatState(f) {
  const n=normalizeFlight(f), map=getMap(n), booked=new Set(map.demoBooked), owners=new Map();
  for (const b of read('tripgo_bookings')) {
    const id=b.flightId || b.flight?.id || b.flight?.flightNumber;
    const date=b.date || b.departureDate || b.flight?.date;
    // Old bookings without a date are conservatively occupied on this flight.
    if(id===n.id && (!date || date===n.date) && !cancelled(b)) for(const s of bookingSeats(b)) { booked.add(s); owners.set(s,b.bookingCode || b.code || 'Vé đã đặt'); }
  }
  return {booked,blocked:new Set(map.blocked),owners};
}
export function groupError(seats, unavailable=new Set(), final=false) {
  const selected=new Set(seats);
  for(let r=1;r<=ROWS;r++) for(const cols of [['A','B','C'],['D','E','F']]) {
    const ids=cols.map(c=>`${r}${c}`);
    if(selected.has(ids[0]) && selected.has(ids[2]) && !selected.has(ids[1])) return `Hàng ${r}: hãy chọn ghế liền nhau, không bỏ ghế ${ids[1]} ở giữa.`;
    if(final && !selected.has(ids[1]) && !unavailable.has(ids[1]) &&
       (selected.has(ids[0]) || selected.has(ids[2])) &&
       (selected.has(ids[0]) || unavailable.has(ids[0])) && (selected.has(ids[2]) || unavailable.has(ids[2])))
      return `Lựa chọn này để lẻ ghế ${ids[1]} ở giữa. Hãy chọn ghế khác hoặc dùng Tự xếp ghế.`;
  }
  return '';
}
export function validateSelection(f,seats) {
  const n=normalizeFlight(f), state=getSeatState(n), unavailable=new Set([...state.booked,...state.blocked]);
  if(!Array.isArray(seats) || seats.length!==n.passengers || new Set(seats).size!==seats.length) return `Hãy chọn đủ ${n.passengers} ghế khác nhau.`;
  if(seats.some(s=>!ALL_SEATS.includes(s) || unavailable.has(s))) return 'Một ghế đã được đặt hoặc khóa. Vui lòng chọn lại ghế.';
  const current=read('tripgo_flights').find(x=>x.id===n.id && (!x.date || x.date===n.date));
  if(current && (['cancelled','deleted','flying'].includes(current.status) || Number(current.seats)<n.passengers)) return 'Chuyến bay không còn đủ chỗ hoặc không còn mở đặt vé.';
  return groupError(seats,unavailable,true);
}
export function suggestSeats(count,unavailable) {
  // Prefer groups on one row (up to 6), then contiguous blocks over adjacent rows.
  const blocks=[];
  for(let r=1;r<=ROWS;r++) for(const cols of [['A','B','C'],['D','E','F']]) {
    const ids=cols.map(c=>`${r}${c}`);
    for(let size=3;size>=1;size--) for(let start=0;start+size<=3;start++) {
      const part=ids.slice(start,start+size);
      if(part.every(s=>!unavailable.has(s)) && !groupError(part,unavailable,true)) blocks.push(part);
    }
  }
  // Dynamic programming prevents exponential searches on fragmented/full cabins.
  const memo=new Set();
  function plan(index,left) {
    if(!left)return [];
    if(index>=40 || memo.has(`${index}:${left}`))return null;
    const row=Math.floor(index/2)+1, side=index%2?'DEF':'ABC';
    for(const b of blocks.filter(b=>parseInt(b[0])===row && side.includes(b[0].slice(-1)) && b.length<=left)) {const tail=plan(index+1,left-b.length);if(tail)return [...b,...tail];}
    const skip=plan(index+1,left);if(skip)return skip;
    memo.add(`${index}:${left}`);return null;
  }
  if(count<=6)for(let r=1;r<=ROWS;r++) {const rowBlocks=blocks.filter(b=>parseInt(b[0])===r);for(const b of rowBlocks) {if(b.length===count)return b;for(const c of rowBlocks)if(b.length+c.length===count && b[0].slice(-1)<'D' && c[0].slice(-1)>='D')return [...b,...c];}}
  return plan(0,count) || [];
}
export function renderCabin(box,state,selected=new Set(),onSeat=()=>{}) {
  box.replaceChildren(); box.className='seat-grid-2d';
  for(let r=1;r<=ROWS;r++) {
    const row=document.createElement('div');row.className='seat-row-2d';
    for(const c of LETTERS) {
      if(c==='D'){const aisle=document.createElement('span');aisle.className='seat-aisle';aisle.textContent=r;row.append(aisle);}
      const id=`${r}${c}`, status=state.booked.has(id)?'booked':state.blocked.has(id)?'blocked':selected.has(id)?'selected':'free';
      const b=document.createElement('button');b.type='button';b.className=`cabin-seat ${status}`;b.textContent=id;b.dataset.seat=id;
      b.setAttribute('aria-label',`Ghế ${id}: ${ {booked:'đã đặt',blocked:'đang khóa',selected:'đang chọn',free:'trống'}[status]}`);b.setAttribute('aria-pressed',String(status==='selected'));b.title=b.getAttribute('aria-label');
      b.onclick=()=>onSeat(id,status);row.append(b);
    }
    box.append(row);
  }
}
