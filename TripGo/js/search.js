const q=getQuery();
const airport=AIRPORTS;
const routeText=document.getElementById('routeText');
routeText.textContent=`${airport[q.from]||q.from||'Hà Nội'} (${q.from||'HAN'}) → ${airport[q.to]||q.to||'Đà Nẵng'} (${q.to||'DAD'}) · ${dateVN(q.departure||todayISO())} · ${q.passengers||1} hành khách`;
let flights=[];
const priceRange=document.getElementById('priceRange'), priceValue=document.getElementById('priceValue');
async function boot(){
 flights=(await initFlights()).filter(f=>f.status!=='deleted');
 const max=Math.max(...flights.map(f=>Number(f.price)||0),3000000); priceRange.max=Math.ceil(max/100000)*100000; priceRange.value=priceRange.max; priceValue.textContent=formatMoney(priceRange.value);
 const airlines=[...new Set(flights.map(f=>f.airline))]; document.getElementById('airlineFilter').innerHTML='<option value="all">Tất cả hãng</option>'+airlines.map(a=>`<option>${escapeHTML(a)}</option>`).join('');
 render();
}
function render(){
 const airline=document.getElementById('airlineFilter').value; const time=document.getElementById('timeFilter').value; const sort=document.getElementById('sort').value; const max=Number(priceRange.value);
 let list=flights.filter(f=>f.from===q.from&&f.to===q.to&&Number(f.price)<=max&&(airline==='all'||f.airline===airline)&&(time==='all'||(time==='morning'?f.departure<'12:00':f.departure>='12:00')));
 if(!list.length){document.getElementById('flightList').innerHTML='<div class="notice">Không tìm thấy chuyến phù hợp. Hãy thay đổi bộ lọc hoặc tìm đường bay khác.</div>';return;}
 list.sort((a,b)=>sort==='price'?a.price-b.price:sort==='duration'?a.duration.localeCompare(b.duration):a.departure.localeCompare(b.departure));
 document.getElementById('flightCount').textContent=`${list.length} chuyến bay phù hợp`;
 document.getElementById('flightList').innerHTML=list.map(f=>`<article class="flight-card">
  <div class="airline-name"><b>${escapeHTML(f.airline)}</b><small>${escapeHTML(f.aircraft)}</small></div>
  <div><div class="flight-time">${escapeHTML(f.departure)}</div><small>${airport[f.from]} (${f.from})</small></div>
  <div class="flight-line">${escapeHTML(f.duration)}<span>────✈────</span></div>
  <div><div class="flight-time">${escapeHTML(f.arrival)}</div><small>${airport[f.to]} (${f.to})</small></div>
  <div><div class="price">${formatMoney(f.price)}</div><small>+ ${f.baggage||7}kg hành lý</small><button class="primary-btn select-flight" data-id="${f.id}">CHỌN</button></div>
 </article>`).join('');
 document.querySelectorAll('.select-flight').forEach(b=>b.addEventListener('click',()=>selectFlight(b.dataset.id)));
}
function selectFlight(id){ const flight=flights.find(f=>f.id===id); write(TG.SELECTED,flight); location.href='flight-detail.html'; }
['airlineFilter','timeFilter','sort'].forEach(id=>document.getElementById(id).addEventListener('change',render));
priceRange.addEventListener('input',()=>{priceValue.textContent=formatMoney(priceRange.value);render();});
boot();
