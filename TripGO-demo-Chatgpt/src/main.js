import './style.css'

const airports = [
  { code:'HAN', city:'Hà Nội', airport:'Nội Bài' }, { code:'SGN', city:'TP. Hồ Chí Minh', airport:'Tân Sơn Nhất' },
  { code:'DAD', city:'Đà Nẵng', airport:'Đà Nẵng' }, { code:'PQC', city:'Phú Quốc', airport:'Phú Quốc' },
  { code:'CXR', city:'Nha Trang', airport:'Cam Ranh' }, { code:'DLI', city:'Đà Lạt', airport:'Liên Khương' }
]
const carriers = {
  VN:{name:'Vietnam Airlines', color:'#155e75', mark:'VN'}, VJ:{name:'Vietjet Air', color:'#d7263d', mark:'VJ'},
  QH:{name:'Bamboo Airways', color:'#168c70', mark:'QH'}, VU:{name:'Vietravel Airlines', color:'#f28c28', mark:'VU'}
}
const flights = [
  {id:'VN213',carrier:'VN',from:'HAN',to:'SGN',depart:'06:10',arrive:'08:20',duration:'2h 10m',price:1459000,tag:'Bán chạy'},
  {id:'VJ129',carrier:'VJ',from:'HAN',to:'SGN',depart:'08:35',arrive:'10:45',duration:'2h 10m',price:1069000,tag:'Giá tốt'},
  {id:'QH201',carrier:'QH',from:'HAN',to:'SGN',depart:'11:20',arrive:'13:30',duration:'2h 10m',price:1279000},
  {id:'VU787',carrier:'VU',from:'HAN',to:'SGN',depart:'14:15',arrive:'16:25',duration:'2h 10m',price:1189000},
  {id:'VN263',carrier:'VN',from:'HAN',to:'SGN',depart:'18:05',arrive:'20:15',duration:'2h 10m',price:1639000},
  {id:'VJ159',carrier:'VJ',from:'HAN',to:'SGN',depart:'21:10',arrive:'23:20',duration:'2h 10m',price:989000,tag:'Rẻ nhất'}
]
const state = { searched:false, results:[...flights], selected:null, step:1, trip:'oneway', passengers:1 }
const money = n => new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(n)
const dateISO = d => d.toISOString().slice(0,10)
const tomorrow = new Date(Date.now()+86400000)
const city = code => airports.find(a=>a.code===code)?.city || code
const icon = (path, cls='w-5 h-5') => `<svg class="${cls}" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="${path}"/></svg>`

function layout(){
  document.querySelector('#app').innerHTML = `
    <header class="absolute inset-x-0 top-0 z-20 text-white">
      <nav class="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8" aria-label="Điều hướng chính">
        <a href="#" class="flex items-center gap-2 text-2xl font-extrabold"><span class="grid h-9 w-9 place-items-center rounded-xl bg-sun text-ocean">✈</span>TripGo</a>
        <div class="hidden items-center gap-7 text-sm font-medium md:flex"><a href="#search" class="hover:text-sun">Chuyến bay</a><a href="#offers" class="hover:text-sun">Điểm đến</a><button id="lookupBtn" class="hover:text-sun">Tra cứu</button><button id="bookingBtn" class="hover:text-sun">Vé của tôi</button><button id="authBtn" class="rounded-xl border border-white/40 px-4 py-2 hover:bg-white/10">Đăng nhập</button></div>
        <button id="mobileBtn" class="rounded-xl border border-white/30 p-2 md:hidden" aria-label="Mở menu">${icon('M4 6h16M4 12h16M4 18h16')}</button>
      </nav>
      <div id="mobileMenu" class="mx-5 hidden rounded-2xl bg-ocean p-5 shadow-soft md:hidden"><a class="block py-2" href="#search">Chuyến bay</a><a class="block py-2" href="#offers">Điểm đến</a><button id="mobileLookupBtn" class="block py-2">Tra cứu</button><button id="mobileBookingBtn" class="block py-2">Vé của tôi</button><button id="mobileAuthBtn" class="mt-2 rounded-xl border border-white/30 px-4 py-2">Đăng nhập</button></div>
    </header>
    <main>
      <section class="hero min-h-[680px] pb-16 pt-36 text-white">
        <div class="mx-auto max-w-7xl px-5 lg:px-8">
          <div class="max-w-2xl"><p class="mb-4 text-sm font-semibold uppercase tracking-[.28em] text-sun">Hành trình bắt đầu tại đây</p><h1 class="text-4xl font-extrabold leading-tight md:text-6xl">Bay xa hơn.<br><span class="text-sun">Trải nghiệm nhiều hơn.</span></h1><p class="mt-5 max-w-lg text-base leading-7 text-slate-200 md:text-lg">So sánh chuyến bay, chọn lịch trình phù hợp và hoàn tất đặt chỗ chỉ trong vài phút.</p></div>
          <div id="search" class="glass mt-10 rounded-3xl p-4 text-ink shadow-soft md:p-6">
            <div class="mb-5 flex gap-2" role="tablist"><button data-trip="oneway" class="tripTab rounded-full bg-ocean px-5 py-2.5 text-sm font-semibold text-white">Một chiều</button><button data-trip="round" class="tripTab rounded-full px-5 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100">Khứ hồi</button></div>
            <form id="searchForm" class="grid gap-3 lg:grid-cols-[1fr_auto_1fr_1fr_1fr_auto] lg:items-end">
              ${airportField('from','Điểm đi','HAN')}
              <button type="button" id="swapBtn" class="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-ocean shadow-sm transition hover:-rotate-180" aria-label="Đổi điểm đi và điểm đến">${icon('M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4')}</button>
              ${airportField('to','Điểm đến','SGN')}
              ${inputField('depart','Ngày đi','date',dateISO(tomorrow),'M8 7V3m8 4V3M5 11h14M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2')}
              ${inputField('passengers','Hành khách','number','1','M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2m11-10a4 4 0 100-8 4 4 0 000 8zm9 10v-2a4 4 0 00-3-3.87')}
              <button class="h-[58px] rounded-2xl bg-sun px-7 font-bold text-ocean transition hover:-translate-y-0.5 hover:bg-[#ffd56a] focus:outline-none focus:ring-4 focus:ring-sun/30">Tìm chuyến bay</button>
            </form>
          </div>
          <div class="mt-5 flex flex-wrap gap-4 text-sm text-slate-200"><span class="flex items-center gap-2">✓ Không phí ẩn</span><span class="flex items-center gap-2">✓ Giá hiển thị đã gồm thuế</span><span class="flex items-center gap-2">✓ Hỗ trợ 24/7</span></div>
        </div>
      </section>
      <section id="results" class="hidden py-16"><div class="mx-auto max-w-7xl px-5 lg:px-8"><div class="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p class="text-sm font-semibold text-ocean">KẾT QUẢ TÌM KIẾM</p><h2 id="routeTitle" class="mt-2 text-3xl font-bold"></h2><p id="routeMeta" class="mt-2 text-slate-500"></p></div><select id="sortSelect" class="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold"><option value="price">Giá thấp nhất</option><option value="time">Khởi hành sớm</option></select></div><div class="mt-8 grid gap-6 lg:grid-cols-[240px_1fr]"><aside id="filters" class="h-fit rounded-2xl bg-white p-5 shadow-sm"></aside><div id="flightList" class="space-y-4"></div></div></div></section>
      <section id="offers" class="bg-white py-20"><div class="mx-auto max-w-7xl px-5 lg:px-8"><div class="flex items-end justify-between"><div><p class="text-sm font-semibold text-ocean">CẢM HỨNG CHO CHUYẾN ĐI</p><h2 class="mt-2 text-3xl font-bold">Điểm đến được yêu thích</h2></div><span class="hidden text-sm text-slate-500 md:block">Giá tham khảo cho vé một chiều</span></div><div class="mt-8 grid gap-5 md:grid-cols-3">${destination('Đà Nẵng','Thành phố của biển và những cây cầu','890.000 ₫','https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=900&q=80')}${destination('Phú Quốc','Hoàng hôn nhiệt đới giữa đảo ngọc','1.090.000 ₫','https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=900&q=80')}${destination('Đà Lạt','Những ngày se lạnh giữa ngàn thông','790.000 ₫','https://images.unsplash.com/photo-1574236170880-fb8568d487e8?auto=format&fit=crop&w=900&q=80')}</div></div></section>
      <section id="support" class="bg-ocean py-16 text-white"><div class="mx-auto grid max-w-7xl gap-8 px-5 lg:grid-cols-[1.5fr_1fr_1fr] lg:px-8"><div><div class="text-2xl font-extrabold"><span class="text-sun">✈</span> TripGo</div><p class="mt-4 max-w-md text-sm leading-6 text-slate-300">Website mô phỏng đặt vé máy bay phục vụ học tập. Không phát hành vé thật và không thực hiện giao dịch thanh toán.</p></div><div><h3 class="font-bold">Hỗ trợ khách hàng</h3><p class="mt-4 text-sm text-slate-300">Hotline: 1900 6789<br>Email: hello@tripgo.demo</p></div><div><h3 class="font-bold">Thông tin</h3><p class="mt-4 text-sm text-slate-300">Điều khoản sử dụng<br>Chính sách bảo mật<br>Câu hỏi thường gặp</p></div></div></section>
    </main>
    <div id="modalRoot"></div><div id="toast" class="pointer-events-none fixed bottom-5 right-5 z-[70]"></div>`
  bindBase()
}

function airportField(id,label,value){ return `<label class="field rounded-2xl border border-slate-200 bg-white px-4 py-3 transition"><span class="block text-xs font-semibold text-slate-500">${label}</span><select id="${id}" class="mt-1 w-full bg-transparent text-sm font-bold outline-none">${airports.map(a=>`<option value="${a.code}" ${a.code===value?'selected':''}>${a.city} (${a.code})</option>`).join('')}</select></label>` }
function inputField(id,label,type,value,path){ return `<label class="field rounded-2xl border border-slate-200 bg-white px-4 py-3"><span class="block text-xs font-semibold text-slate-500">${label}</span><span class="mt-1 flex items-center gap-2 text-ocean">${icon(path,'h-4 w-4')}<input id="${id}" type="${type}" value="${value}" min="${type==='number'?'1':dateISO(new Date())}" max="${type==='number'?'9':''}" required class="w-full bg-transparent text-sm font-bold text-ink outline-none"></span></label>` }
function destination(name,desc,price,img){ return `<article class="group relative min-h-[320px] overflow-hidden rounded-3xl"><img src="${img}" alt="${name}" class="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"><div class="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/10"></div><div class="absolute inset-x-0 bottom-0 p-6 text-white"><p class="text-sm text-slate-200">${desc}</p><div class="mt-2 flex items-end justify-between"><h3 class="text-2xl font-bold">${name}</h3><span class="rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur">Từ ${price}</span></div></div></article>` }

function bindBase(){
  document.querySelector('#mobileBtn').onclick=()=>document.querySelector('#mobileMenu').classList.toggle('hidden')
  document.querySelectorAll('.tripTab').forEach(b=>b.onclick=()=>{ state.trip=b.dataset.trip; document.querySelectorAll('.tripTab').forEach(x=>x.className='tripTab rounded-full px-5 py-2.5 text-sm font-semibold '+(x===b?'bg-ocean text-white':'text-slate-500 hover:bg-slate-100')); })
  document.querySelector('#swapBtn').onclick=()=>{ const a=document.querySelector('#from'),b=document.querySelector('#to'); [a.value,b.value]=[b.value,a.value] }
  document.querySelector('#searchForm').onsubmit=e=>{e.preventDefault(); doSearch()}
  document.querySelector('#bookingBtn').onclick=showBookings
  document.querySelector('#mobileBookingBtn').onclick=showBookings
  document.querySelector('#lookupBtn').onclick=showLookup
  document.querySelector('#mobileLookupBtn').onclick=showLookup
  document.querySelector('#authBtn').onclick=showAuth
  document.querySelector('#mobileAuthBtn').onclick=showAuth
  updateAuthButtons()
}

function doSearch(){
  const from=document.querySelector('#from').value, to=document.querySelector('#to').value
  if(from===to) return toast('Điểm đi và điểm đến phải khác nhau','error')
  state.passengers=+document.querySelector('#passengers').value
  state.results=flights.map(f=>({...f,from,to}))
  document.querySelector('#routeTitle').textContent=`${city(from)} → ${city(to)}`
  document.querySelector('#routeMeta').textContent=`${formatDate(document.querySelector('#depart').value)} · ${state.passengers} hành khách · Bay thẳng`
  document.querySelector('#results').classList.remove('hidden')
  renderFilters(); renderFlights(); document.querySelector('#results').scrollIntoView({behavior:'smooth'})
  document.querySelector('#sortSelect').onchange=renderFlights
}
function formatDate(v){ return new Intl.DateTimeFormat('vi-VN',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(v+'T00:00:00')) }
function renderFilters(){ document.querySelector('#filters').innerHTML=`<h3 class="font-bold">Bộ lọc</h3><div class="mt-5 border-t pt-5"><p class="text-sm font-semibold">Hãng bay</p>${Object.entries(carriers).map(([k,c])=>`<label class="mt-3 flex cursor-pointer items-center gap-3 text-sm"><input type="checkbox" class="carrierFilter h-4 w-4 accent-ocean" value="${k}" checked>${c.name}</label>`).join('')}</div><div class="mt-6 border-t pt-5"><p class="text-sm font-semibold">Khởi hành</p><label class="mt-3 flex items-center gap-3 text-sm"><input id="morning" type="checkbox" class="h-4 w-4 accent-ocean">Trước 12:00</label></div>`; document.querySelectorAll('#filters input').forEach(i=>i.onchange=renderFlights) }
function renderFlights(){
  const enabled=[...document.querySelectorAll('.carrierFilter:checked')].map(x=>x.value), morning=document.querySelector('#morning')?.checked
  let list=state.results.filter(f=>enabled.includes(f.carrier)&&(!morning||+f.depart.slice(0,2)<12))
  list.sort(document.querySelector('#sortSelect')?.value==='time'?(a,b)=>a.depart.localeCompare(b.depart):(a,b)=>a.price-b.price)
  document.querySelector('#flightList').innerHTML=list.length?list.map((f,i)=>flightCard(f,i)).join(''):`<div class="rounded-2xl bg-white p-12 text-center"><p class="text-lg font-bold">Không tìm thấy chuyến bay</p><p class="mt-2 text-sm text-slate-500">Hãy thay đổi bộ lọc để xem thêm lựa chọn.</p></div>`
  document.querySelectorAll('[data-book]').forEach(b=>b.onclick=()=>openBooking(state.results.find(f=>f.id===b.dataset.book)))
}
function flightCard(f,i){ const c=carriers[f.carrier]; return `<article class="fade-up rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft" style="animation-delay:${i*50}ms"><div class="grid items-center gap-5 md:grid-cols-[180px_1fr_170px]"><div class="flex items-center gap-3"><span class="grid h-11 w-11 place-items-center rounded-xl text-sm font-extrabold text-white" style="background:${c.color}">${c.mark}</span><div><p class="text-sm font-bold">${c.name}</p><p class="text-xs text-slate-500">${f.id} · Economy</p></div></div><div class="grid grid-cols-[1fr_1.2fr_1fr] items-center text-center"><div><strong class="text-xl">${f.depart}</strong><p class="text-xs text-slate-500">${f.from}</p></div><div class="relative"><p class="text-xs text-slate-500">${f.duration}</p><div class="route-line relative my-2"><span class="relative z-10 inline-block bg-white px-2 text-ocean">✈</span></div><p class="text-[11px] text-emerald-600">Bay thẳng</p></div><div><strong class="text-xl">${f.arrive}</strong><p class="text-xs text-slate-500">${f.to}</p></div></div><div class="text-right"><div class="flex items-center justify-end gap-2">${f.tag?`<span class="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">${f.tag}</span>`:''}<strong class="text-lg text-ocean">${money(f.price)}</strong></div><p class="mb-3 text-xs text-slate-400">/ hành khách</p><button data-book="${f.id}" class="rounded-xl bg-ocean px-5 py-2.5 text-sm font-bold text-white hover:bg-ink">Chọn chuyến</button></div></div><div class="mt-4 flex flex-wrap gap-4 border-t pt-4 text-xs text-slate-500"><span>🧳 Hành lý xách tay 7kg</span><span>💺 Chọn chỗ có phí</span><span>↻ Đổi vé có điều kiện</span></div></article>` }

function openBooking(f){ state.selected=f; state.step=1; renderBookingModal() }
function renderBookingModal(){
  const f=state.selected, total=f?f.price*state.passengers:0
  document.body.classList.add('modal-open')
  document.querySelector('#modalRoot').innerHTML=`<div class="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-0 backdrop-blur-sm md:items-center md:p-5" role="dialog" aria-modal="true"><div class="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white md:rounded-3xl"><div class="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-5"><div><p class="text-xs font-semibold text-ocean">BƯỚC ${state.step}/3</p><h2 class="text-xl font-bold">${['Thông tin chuyến bay','Thông tin hành khách','Xác nhận đặt chỗ'][state.step-1]}</h2></div><button id="closeModal" class="rounded-full p-2 hover:bg-slate-100" aria-label="Đóng">${icon('M6 18L18 6M6 6l12 12')}</button></div><div class="p-6">${state.step===1?summaryStep(f,total):state.step===2?passengerStep():confirmStep(f,total)}</div></div></div>`
  document.querySelector('#closeModal').onclick=closeModal
  document.querySelector('#backStep')?.addEventListener('click',()=>{state.step--;renderBookingModal()})
  document.querySelector('#nextStep')?.addEventListener('click',()=>{state.step++;renderBookingModal()})
  document.querySelector('#passengerForm')?.addEventListener('submit',e=>{e.preventDefault(); state.passenger=Object.fromEntries(new FormData(e.target)); state.step=3; renderBookingModal()})
  document.querySelector('#confirmBook')?.addEventListener('click',saveBooking)
}
function summaryStep(f,total){ const c=carriers[f.carrier]; return `<div class="rounded-2xl bg-mist p-5"><div class="flex items-center justify-between"><div class="flex items-center gap-3"><span class="grid h-11 w-11 place-items-center rounded-xl text-sm font-bold text-white" style="background:${c.color}">${c.mark}</span><div><b>${c.name}</b><p class="text-xs text-slate-500">${f.id}</p></div></div><span class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Bay thẳng</span></div><div class="mt-7 grid grid-cols-[1fr_auto_1fr] items-center text-center"><div><b class="text-2xl">${f.depart}</b><p class="text-sm text-slate-500">${city(f.from)} (${f.from})</p></div><span class="px-5 text-2xl text-ocean">✈</span><div><b class="text-2xl">${f.arrive}</b><p class="text-sm text-slate-500">${city(f.to)} (${f.to})</p></div></div></div>${priceBox(total)}<button id="nextStep" class="mt-6 w-full rounded-xl bg-ocean py-3.5 font-bold text-white">Tiếp tục</button>` }
function passengerStep(){ const p=state.passenger||{}; return `<form id="passengerForm" class="space-y-4"><div class="grid gap-4 md:grid-cols-2">${formInput('name','Họ và tên',p.name||'','Nguyễn Văn An')}${formInput('phone','Số điện thoại',p.phone||'','0901234567','tel')}${formInput('email','Email',p.email||'','an@example.com','email')}${formInput('idNumber','CCCD/Hộ chiếu',p.idNumber||'','012345678901')}</div><label class="flex gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900"><input required type="checkbox" class="mt-1 accent-ocean">Tôi xác nhận thông tin trên là chính xác và đồng ý với điều khoản đặt chỗ demo.</label><div class="flex gap-3"><button type="button" id="backStep" class="flex-1 rounded-xl border border-slate-200 py-3.5 font-bold">Quay lại</button><button class="flex-[2] rounded-xl bg-ocean py-3.5 font-bold text-white">Kiểm tra thông tin</button></div></form>` }
function formInput(name,label,value,placeholder,type='text'){return `<label><span class="mb-2 block text-sm font-semibold">${label}</span><input name="${name}" type="${type}" value="${value}" placeholder="${placeholder}" required class="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-ocean focus:ring-4 focus:ring-ocean/10"></label>`}
function confirmStep(f,total){return `<div class="rounded-2xl border border-slate-200 p-5"><div class="flex justify-between"><div><p class="text-xs text-slate-500">Hành khách</p><b>${state.passenger.name}</b><p class="mt-1 text-sm text-slate-500">${state.passenger.email} · ${state.passenger.phone}</p></div><span class="text-2xl">🎫</span></div><div class="my-5 border-t border-dashed"></div><div class="flex justify-between text-sm"><span>${city(f.from)} → ${city(f.to)}</span><b>${f.depart} · ${f.id}</b></div></div>${priceBox(total)}<p class="mt-4 rounded-xl bg-blue-50 p-4 text-sm text-blue-800">Đây là website mô phỏng. Nút xác nhận không thực hiện thanh toán và không phát hành vé thật.</p><div class="mt-6 flex gap-3"><button id="backStep" class="flex-1 rounded-xl border border-slate-200 py-3.5 font-bold">Quay lại</button><button id="confirmBook" class="flex-[2] rounded-xl bg-sun py-3.5 font-bold text-ocean">Xác nhận đặt chỗ</button></div>`}
function priceBox(total){return `<div class="mt-5 space-y-3 text-sm"><div class="flex justify-between"><span>Vé máy bay × ${state.passengers}</span><span>${money(total)}</span></div><div class="flex justify-between"><span>Thuế và phí</span><span>Đã bao gồm</span></div><div class="flex justify-between border-t pt-3 text-lg font-bold"><span>Tổng cộng</span><span class="text-ocean">${money(total)}</span></div></div>`}
function saveBooking(){ const bookings=JSON.parse(localStorage.getItem('tripgoBookings')||'[]'); const booking={code:'TG'+Math.random().toString(36).slice(2,8).toUpperCase(),flight:state.selected,passenger:state.passenger,count:state.passengers,createdAt:new Date().toISOString()}; bookings.unshift(booking); localStorage.setItem('tripgoBookings',JSON.stringify(bookings)); document.querySelector('#modalRoot').innerHTML=`<div class="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-5 backdrop-blur-sm"><div class="w-full max-w-md rounded-3xl bg-white p-8 text-center"><div class="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-3xl">✓</div><h2 class="mt-5 text-2xl font-bold">Đặt chỗ thành công!</h2><p class="mt-2 text-slate-500">Mã đặt chỗ của bạn</p><p class="mt-3 rounded-xl bg-mist py-4 text-2xl font-extrabold tracking-widest text-ocean">${booking.code}</p><button id="doneBtn" class="mt-6 w-full rounded-xl bg-ocean py-3.5 font-bold text-white">Hoàn tất</button></div></div>`; document.querySelector('#doneBtn').onclick=()=>{closeModal();toast('Đã lưu đặt chỗ trên thiết bị')} }
function showBookings(){ const bookings=JSON.parse(localStorage.getItem('tripgoBookings')||'[]'); document.body.classList.add('modal-open'); document.querySelector('#modalRoot').innerHTML=`<div class="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-0 backdrop-blur-sm md:items-center md:p-5"><div class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-6 md:rounded-3xl"><div class="flex items-center justify-between"><div><p class="text-xs font-semibold text-ocean">CHUYẾN ĐI CỦA BẠN</p><h2 class="text-2xl font-bold">Đặt chỗ của tôi</h2></div><button id="closeModal" class="rounded-full p-2 hover:bg-slate-100">${icon('M6 18L18 6M6 6l12 12')}</button></div><div class="mt-6 space-y-4">${bookings.length?bookings.map(b=>`<div class="rounded-2xl border p-5"><div class="flex items-start justify-between"><div><span class="text-xs text-slate-500">Mã đặt chỗ</span><p class="font-extrabold tracking-wider text-ocean">${b.code}</p></div><span class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Đã xác nhận</span></div><div class="mt-4 flex items-center justify-between"><div><b>${city(b.flight.from)} → ${city(b.flight.to)}</b><p class="text-sm text-slate-500">${b.flight.id} · ${b.flight.depart} · ${b.passenger.name}</p></div><b>${money(b.flight.price*b.count)}</b></div></div>`).join(''):`<div class="py-12 text-center"><div class="text-4xl">🎫</div><p class="mt-3 font-bold">Chưa có đặt chỗ nào</p><p class="mt-2 text-sm text-slate-500">Các chuyến bay đã đặt sẽ xuất hiện tại đây.</p></div>`}</div></div></div>`; document.querySelector('#closeModal').onclick=closeModal }
function showLookup(){
  document.body.classList.add('modal-open')
  document.querySelector('#modalRoot').innerHTML=`<div class="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-5 backdrop-blur-sm"><div class="w-full max-w-lg rounded-3xl bg-white p-6"><div class="flex items-center justify-between"><div><p class="text-xs font-semibold text-ocean">TRA CỨU NHANH</p><h2 class="text-2xl font-bold">Thông tin hành trình</h2></div><button id="closeModal" class="rounded-full p-2 hover:bg-slate-100">${icon('M6 18L18 6M6 6l12 12')}</button></div><div class="mt-6 flex gap-2"><button data-mode="booking" class="lookupTab flex-1 rounded-xl bg-ocean px-3 py-2.5 text-sm font-bold text-white">Mã đặt chỗ</button><button data-mode="flight" class="lookupTab flex-1 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-500">Số hiệu chuyến bay</button></div><form id="lookupForm" class="mt-5"><label class="label" id="lookupLabel">Nhập mã đặt chỗ</label><input id="lookupValue" class="field uppercase" placeholder="Ví dụ: TGABC123" required><button class="btn-primary mt-4 w-full">Tra cứu</button></form><div id="lookupResult" class="mt-5"></div></div></div>`
  let mode='booking'; document.querySelector('#closeModal').onclick=closeModal
  document.querySelectorAll('.lookupTab').forEach(btn=>btn.onclick=()=>{mode=btn.dataset.mode;document.querySelectorAll('.lookupTab').forEach(x=>x.className='lookupTab flex-1 rounded-xl px-3 py-2.5 text-sm font-bold '+(x===btn?'bg-ocean text-white':'text-slate-500'));document.querySelector('#lookupLabel').textContent=mode==='booking'?'Nhập mã đặt chỗ':'Nhập số hiệu chuyến bay';document.querySelector('#lookupValue').placeholder=mode==='booking'?'Ví dụ: TGABC123':'Ví dụ: VN213';document.querySelector('#lookupResult').innerHTML=''})
  document.querySelector('#lookupForm').onsubmit=e=>{e.preventDefault();const q=document.querySelector('#lookupValue').value.trim().toUpperCase();const item=mode==='booking'?JSON.parse(localStorage.getItem('tripgoBookings')||'[]').find(b=>b.code===q):flights.find(f=>f.id===q);document.querySelector('#lookupResult').innerHTML=item?lookupCard(item,mode):`<p class="rounded-xl bg-red-50 p-4 text-sm text-red-700">Không tìm thấy thông tin phù hợp. Hãy kiểm tra lại mã.</p>`}
}
function lookupCard(item,mode){const f=mode==='booking'?item.flight:item;return `<div class="rounded-2xl bg-mist p-5"><div class="flex items-center justify-between"><div><p class="text-xs text-slate-500">${mode==='booking'?'Mã đặt chỗ':'Chuyến bay'}</p><b class="text-lg text-ocean">${mode==='booking'?item.code:f.id}</b></div><span class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Đúng giờ</span></div><div class="mt-5 flex items-center justify-between text-center"><div><b class="text-xl">${f.depart}</b><p class="text-sm">${city(f.from)}</p></div><span class="text-2xl text-ocean">✈</span><div><b class="text-xl">${f.arrive}</b><p class="text-sm">${city(f.to)}</p></div></div>${mode==='booking'?`<p class="mt-4 border-t pt-4 text-sm text-slate-600">Hành khách: <b>${item.passenger.name}</b></p>`:''}</div>`}

function showAuth(){
  const current=JSON.parse(localStorage.getItem('tripgoSession')||'null'); if(current){if(confirm(`Đang đăng nhập với ${current.email}. Bạn muốn đăng xuất?`)){localStorage.removeItem('tripgoSession');updateAuthButtons();toast('Đã đăng xuất')}return}
  document.body.classList.add('modal-open');document.querySelector('#modalRoot').innerHTML=`<div class="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-5 backdrop-blur-sm"><div class="w-full max-w-md rounded-3xl bg-white p-6"><div class="flex items-center justify-between"><div><p class="text-xs font-semibold text-ocean">TÀI KHOẢN TRIPGO</p><h2 id="authTitle" class="text-2xl font-bold">Đăng nhập</h2></div><button id="closeModal" class="rounded-full p-2 hover:bg-slate-100">${icon('M6 18L18 6M6 6l12 12')}</button></div><form id="authForm" class="mt-6 space-y-4"><div id="nameWrap" class="hidden">${formInput('name','Họ và tên','','Nguyễn Văn An')}</div>${formInput('email','Email','','ban@example.com','email')}${formInput('password','Mật khẩu','','Tối thiểu 6 ký tự','password')}<button class="btn-primary w-full">Đăng nhập</button></form><button id="toggleAuth" class="mt-4 w-full text-sm font-semibold text-ocean">Chưa có tài khoản? Đăng ký</button><p class="mt-5 text-center text-xs text-slate-400">Tài khoản demo chỉ được lưu trên trình duyệt này.</p></div></div>`
  let register=false;document.querySelector('#closeModal').onclick=closeModal;document.querySelector('#toggleAuth').onclick=()=>{register=!register;document.querySelector('#authTitle').textContent=register?'Đăng ký':'Đăng nhập';document.querySelector('#nameWrap').classList.toggle('hidden',!register);document.querySelector('#nameWrap input').required=register;document.querySelector('#authForm button').textContent=register?'Tạo tài khoản':'Đăng nhập';document.querySelector('#toggleAuth').textContent=register?'Đã có tài khoản? Đăng nhập':'Chưa có tài khoản? Đăng ký'}
  document.querySelector('#authForm').onsubmit=e=>{e.preventDefault();const v=Object.fromEntries(new FormData(e.target));if(v.password.length<6)return toast('Mật khẩu cần ít nhất 6 ký tự','error');const users=JSON.parse(localStorage.getItem('tripgoUsers')||'[]');if(register){if(users.some(u=>u.email===v.email))return toast('Email này đã được đăng ký','error');users.push(v);localStorage.setItem('tripgoUsers',JSON.stringify(users));localStorage.setItem('tripgoSession',JSON.stringify({name:v.name,email:v.email}))}else{const u=users.find(u=>u.email===v.email&&u.password===v.password);if(!u)return toast('Email hoặc mật khẩu chưa đúng','error');localStorage.setItem('tripgoSession',JSON.stringify({name:u.name,email:u.email}))}closeModal();updateAuthButtons();toast(register?'Đăng ký thành công':'Đăng nhập thành công')}
}
function updateAuthButtons(){const s=JSON.parse(localStorage.getItem('tripgoSession')||'null');['authBtn','mobileAuthBtn'].forEach(id=>{const el=document.querySelector('#'+id);if(el)el.textContent=s?(s.name||s.email).split(' ')[0]:'Đăng nhập'})}
function closeModal(){ document.querySelector('#modalRoot').innerHTML=''; document.body.classList.remove('modal-open') }
function toast(message,type='success'){ const el=document.querySelector('#toast'); el.innerHTML=`<div class="fade-up rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-soft ${type==='error'?'bg-red-600':'bg-ink'}">${message}</div>`; setTimeout(()=>el.innerHTML='',3000) }

layout()

if (document.modelContext?.registerTool) {
  document.modelContext.registerTool({
    name:'search_flights', title:'Tìm chuyến bay',
    description:'Tìm các chuyến bay demo theo mã sân bay đi và đến.',
    inputSchema:{type:'object',properties:{from:{type:'string'},to:{type:'string'}},required:['from','to'],additionalProperties:false},
    annotations:{readOnlyHint:true,untrustedContentHint:false},
    execute:({from,to})=>flights.filter(f=>f.from===String(from).toUpperCase()&&f.to===String(to).toUpperCase()).map(({id,depart,arrive,duration,price})=>({id,depart,arrive,duration,price}))
  })
  document.modelContext.registerTool({
    name:'lookup_booking', title:'Tra cứu đặt chỗ',
    description:'Tra cứu đặt chỗ demo đã lưu trên trình duyệt bằng mã đặt chỗ.',
    inputSchema:{type:'object',properties:{code:{type:'string'}},required:['code'],additionalProperties:false},
    annotations:{readOnlyHint:true,untrustedContentHint:false},
    execute:({code})=>JSON.parse(localStorage.getItem('tripgoBookings')||'[]').find(b=>b.code===String(code).toUpperCase())||{found:false}
  })
}
