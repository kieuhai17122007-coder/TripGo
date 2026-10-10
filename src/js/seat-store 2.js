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
  return groupError(seats,unavailable,true) || adjacentGroupError(seats,n.passengers,unavailable);
}
// Find compact layouts. Prefer the fewest 3-seat clusters, then the shortest
// row span, then the smallest gaps within a row. Fixed selections must be
// extendable to an equally compact layout; occupied/locked seats are exceptions.
export function planGroup(count, unavailable=new Set(), fixed=[]) {
  if(!Number.isInteger(count) || count<1 || count>ALL_SEATS.length || fixed.length>count || new Set(fixed).size!==fixed.length || fixed.some(s=>!ALL_SEATS.includes(s)||unavailable.has(s)))return null;
  const required=new Set(fixed), options=[];
  for(let row=1;row<=ROWS;row++) {
    const halves=[['A','B','C'],['D','E','F']].map(cols=>{
      const ids=cols.map(c=>`${row}${c}`), must=ids.filter(s=>required.has(s)), parts=must.length?[]:[[]];
      for(let size=1;size<=3;size++)for(let i=0;i+size<=3;i++) {
        const part=ids.slice(i,i+size);
        if(part.every(s=>!unavailable.has(s)) && must.every(s=>part.includes(s)) && !groupError(part,unavailable,true))parts.push(part);
      }
      return parts;
    });
    const choices=[];
    for(const a of halves[0])for(const b of halves[1]) {
      const seats=[...a,...b],blocks=Number(a.length>0)+Number(b.length>0);
      const gap=a.length&&b.length ? LETTERS.indexOf(b[0].slice(-1))-LETTERS.indexOf(a.at(-1).slice(-1))-1 : 0;
      if(seats.length<=count)choices.push({seats,blocks,gap});
    }
    options.push(choices);
  }
  function solve(first,last) {
    if(fixed.some(s=>parseInt(s)<first+1 || parseInt(s)>last+1))return null;
    let dp=new Map([[0,{seats:[],blocks:0,gap:0}]]);
    for(let row=first;row<=last;row++) {
      const next=new Map();
      for(const [used,prev] of dp)for(const o of options[row]) {
        const n=used+o.seats.length;if(n>count)continue;
        const candidate={seats:[...prev.seats,...o.seats],blocks:prev.blocks+o.blocks,gap:prev.gap+o.gap},old=next.get(n);
        if(!old || candidate.blocks<old.blocks || (candidate.blocks===old.blocks && candidate.gap<old.gap))next.set(n,candidate);
      }
      dp=next;if(!dp.size)return null;
    }
    return dp.get(count)||null;
  }
  const full=solve(0,ROWS-1);if(!full)return null;
  for(let span=1;span<=ROWS;span++) {
    let best=null;
    for(let first=0;first+span<=ROWS;first++) {
      const result=solve(first,first+span-1);
      if(result && result.blocks===full.blocks && (!best || result.gap<best.gap))best=result;
    }
    if(best)return {...best,span};
  }
  return null;
}
export function adjacentGroupError(seats,count,unavailable=new Set()) {
  if(count<=1)return '';
  const optimal=planGroup(count,unavailable), constrained=planGroup(count,unavailable,seats);
  if(!optimal)return 'Không còn đủ ghế phù hợp cho nhóm khách. Hãy đổi chuyến bay hoặc giảm số khách.';
  if(!constrained || constrained.blocks!==optimal.blocks || constrained.span!==optimal.span || constrained.gap!==optimal.gap)
    return 'Nhóm khách phải ngồi cạnh nhau khi còn đủ chỗ. Chỉ được tách sang cụm hoặc hàng khác khi các cụm gần nhau không còn đủ ghế. Hãy chọn ghế sát nhau hoặc dùng Tự xếp ghế.';
  return '';
}
export function suggestSeats(count,unavailable) { return planGroup(count,unavailable)?.seats || []; }
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
