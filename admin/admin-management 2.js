// Management tools for the existing Vanilla JS admin; no additional dependencies.
export const AUDIT_KEY = 'tripgo_admin_audit';
export function normalizeBooking(b, flights) {
  const flightId = b.flightId || b.flight?.id || b.flight?.flightNumber;
  const f = flights.find(f => f.id === flightId);
  return {...b, flightId, email: b.email || b.userEmail || b.passenger?.email,
    passenger: {...b.passenger, name: b.passenger?.name || b.passenger?.fullName},
    date: b.date || b.departureDate || b.flight?.date || f?.date,
    passengers: b.passengers || b.passengerCount || b.passengerDetails?.length || 1};
}
export function recordAudit(read, key, count) {
  if (key === AUDIT_KEY) return;
  const labels = {tripgo_seat_maps:'Sơ đồ ghế',tripgo_flights:'Chuyến bay',tripgo_bookings:'Vé đặt',tripgo_services:'Dịch vụ',tripgo_admin_support:'Hỗ trợ',tripgo_banned_passengers:'Cấm bay'};
  if (!labels[key]) return;
  try {
    const entries = read(AUDIT_KEY, []);
    entries.push({id: crypto.randomUUID(), at: new Date().toISOString(), actor: window.TripGoAuth?.getCurrentUser()?.email || 'Admin', area: labels[key], action: 'Cập nhật dữ liệu', count});
    localStorage.setItem(AUDIT_KEY, JSON.stringify(entries.slice(-500)));
  } catch { /* Business writes remain successful when the optional log is full. */ }
}
const BACKUP_LABELS = {tripgo_seat_maps:'Sơ đồ ghế',tripgo_flights:'Chuyến bay',tripgo_bookings:'Vé đã đặt',tripgo_services:'Dịch vụ',tripgo_admin_support:'Hỗ trợ',tripgo_banned_passengers:'Cấm bay'};
const BACKUP_KEYS = ['tripgo_seat_maps','tripgo_flights','tripgo_bookings','tripgo_services','tripgo_admin_support','tripgo_banned_passengers'];
export function validateBackup(value) {
  if (!value || value.app !== 'TripGo' || value.version !== 1 || !value.data) throw Error('Đây không phải bản sao lưu TripGo phiên bản 1.');
  const result = {};
  for (const key of BACKUP_KEYS) {
    const rows = key==='tripgo_seat_maps' ? (value.data[key] ?? []) : value.data[key];
    if (!Array.isArray(rows) || rows.length > 20000 || rows.some(r => !r || typeof r !== 'object' || Array.isArray(r))) throw Error(`Dữ liệu ${key} không hợp lệ.`);
    const ids = new Set();
    for (const r of rows) {
      const id = key === 'tripgo_bookings' ? r.bookingCode || r.code : r.id;
      if (typeof id !== 'string' || !id.trim() || ids.has(id)) throw Error(`Mã rỗng hoặc trùng trong ${key}.`);
      ids.add(id);
      if (key === 'tripgo_seat_maps' && (!Array.isArray(r.blocked) || !Array.isArray(r.demoBooked) || [...r.blocked,...r.demoBooked].some(s=>typeof s!=='string' || !/^([1-9]|1[0-9]|20)[A-F]$/.test(s)) || new Set([...r.blocked,...r.demoBooked]).size!==r.blocked.length+r.demoBooked.length)) throw Error('Sơ đồ ghế không hợp lệ.');
      if (key === 'tripgo_flights' && (!/^[A-Z0-9-]{2,20}$/.test(r.id) || typeof r.from !== 'string' || typeof r.to !== 'string' || r.from === r.to || !/^\d{4}-\d{2}-\d{2}$/.test(r.date || '') || !Number.isFinite(r.price) || r.price < 0 || !Number.isInteger(r.seats) || r.seats < 0 || !['active','flying','cancelled','deleted'].includes(r.status))) throw Error('Thông tin chuyến bay không hợp lệ.');
      if (key === 'tripgo_flights' && (new Date(r.date + 'T12:00:00Z').toISOString().slice(0,10) !== r.date || !/^([01]\d|2[0-3]):[0-5]\d$/.test(r.departure || '') || !/^([01]\d|2[0-3]):[0-5]\d$/.test(r.arrival || ''))) throw Error('Ngày hoặc giờ bay không hợp lệ.');
      if (key === 'tripgo_banned_passengers' && (typeof r.name !== 'string' || typeof r.document !== 'string' || typeof r.reason !== 'string' || !['active','released'].includes(r.status))) throw Error('Hồ sơ cấm bay không hợp lệ.');
      if (key === 'tripgo_bookings' && (!Number.isFinite(Number(r.totalPrice ?? r.total ?? 0)) || Number(r.totalPrice ?? r.total ?? 0) < 0 || (r.passengerDetails !== undefined && !Array.isArray(r.passengerDetails)))) throw Error('Thông tin vé không hợp lệ.');
      if (key === 'tripgo_bookings' && ((r.passengerDetails || []).some(p => !p || typeof p !== 'object') || (r.passenger !== undefined && (!r.passenger || typeof r.passenger !== 'object')) || (r.flight !== undefined && (!r.flight || typeof r.flight !== 'object')))) throw Error('Chi tiết hành khách hoặc chuyến bay không hợp lệ.');
      if (key === 'tripgo_services' && (typeof r.title !== 'string' || typeof r.description !== 'string' || !['#search','#booking-search','#support'].includes(r.href) || !/^fa-[a-z-]+$/.test(r.icon || '') || typeof r.enabled !== 'boolean')) throw Error('Thông tin dịch vụ không hợp lệ.');
      if (key === 'tripgo_admin_support' && (typeof r.name !== 'string' || typeof r.issue !== 'string' || !['open','processing','resolved'].includes(r.status))) throw Error('Thông tin hỗ trợ không hợp lệ.');
    }
    result[key] = rows;
  }
  return result;
}
export function createManagement(ctx) {
  const {read, write, safe, money, date, bookingState, alertMessage, getFlights, getBookings, render, openModal, getServiceCatalog} = ctx;
  const $ = id => document.getElementById(id);
  const download = (name, data) => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    const a = document.createElement('a'); a.href=url; a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const snapshot = () => Object.fromEntries(BACKUP_KEYS.map(k => [k,k === 'tripgo_services' ? getServiceCatalog() : read(k,[])]));
  const closeDetail = () => { $('bookingDetailDialog')?.close(); $('bookingDetailDialog')?.remove(); };
  function showBooking(b) {
    closeDetail();
    const f = getFlights().find(f=>f.id===b.flightId);
    const rows = [['Mã vé',b.bookingCode || b.code],['Hành khách',(b.passengerDetails || []).map(p=>p.name || p.fullName).join(', ') || b.passenger?.name],['Email',b.email],['Điện thoại',b.passenger?.phone],['Chuyến bay',b.flightId],['Hành trình',`${b.from || b.flight?.from || '-'} → ${b.to || b.flight?.to || '-'}`],['Ngày / giờ',`${date(b.date)} · ${b.flight?.departure || f?.departure || '-'}`],['Số hành khách',b.passengers],['Ghế',Array.isArray(b.seats)?b.seats.join(', '):b.seat],['Hạng vé',b.ticketType || b.classType],['Tổng tiền',money(b.totalPrice ?? b.total)],['Trạng thái',bookingState(b)==='pending'?'Chờ thanh toán':bookingState(b)==='cancelled'?'Đã hủy':'Đã xác nhận'],['Thanh toán',b.paymentMethod],['Ghi chú nội bộ',b.adminNote]];
    const dialog=document.createElement('dialog'); dialog.id='bookingDetailDialog'; dialog.className='card p-6 w-full max-w-2xl'; dialog.setAttribute('aria-labelledby','bookingDetailTitle');
    dialog.innerHTML=`<div class="flex justify-between gap-4 mb-5"><h2 id="bookingDetailTitle" class="text-xl font-bold">Chi tiết vé</h2><button class="secondary" data-close-detail aria-label="Đóng chi tiết vé">Đóng</button></div><dl class="grid sm:grid-cols-2 gap-4">${rows.map(([l,v])=>`<div><dt class="text-sm text-slate-500">${safe(l)}</dt><dd class="font-semibold break-words whitespace-pre-wrap">${safe(v || '-')}</dd></div>`).join('')}</dl><form id="bookingNoteForm" class="mt-5 space-y-3"><label class="label">Ghi chú nội bộ<textarea name="note" class="field" rows="3" maxlength="1000">${safe(b.adminNote || '')}</textarea></label><button class="primary">Lưu ghi chú</button></form><p class="text-sm text-slate-500 mt-4">Trạng thái thanh toán là dữ liệu mô phỏng của bài tập.</p>`;
    document.body.append(dialog); dialog.querySelector('[data-close-detail]').onclick=closeDetail;
    dialog.addEventListener('click',e=>{if(e.target===dialog)closeDetail();});
    dialog.querySelector('form').onsubmit=e=>{e.preventDefault(); if(!window.TripGoAuth.isAdmin())return; const all=getBookings(); const target=all.find(x=>(x.bookingCode||x.code)===(b.bookingCode||b.code)); if(!target)return; target.adminNote=e.target.elements.note.value.trim(); try{write('tripgo_bookings',all);closeDetail();render();alertMessage('Đã lưu ghi chú vé.');}catch{alertMessage('Không thể lưu ghi chú.',true);}};
    dialog.showModal();
  }
  function renderSchedule() {
    $('content').innerHTML=`<div class="card p-5"><div class="flex flex-wrap gap-4 mb-5"><label class="label">Ngày bay<input id="scheduleDate" class="field" type="date"></label><label class="label">Trạng thái<select id="scheduleStatus" class="field"><option value="all">Tất cả</option><option value="active">Đang hoạt động</option><option value="flying">Đang bay</option><option value="cancelled">Đã hủy</option></select></label><button id="scheduleAll" class="secondary self-end">Tất cả ngày</button></div><p id="scheduleSummary" class="text-sm text-slate-500 mb-4" aria-live="polite"></p><div class="table-scroll"><table class="data-table"><thead><tr><th>Ngày / Giờ</th><th>Chuyến bay</th><th>Hành trình</th><th>Chỗ còn lại</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody id="scheduleRows"></tbody></table></div><button id="scheduleMore" class="secondary mt-4" hidden>Xem thêm 10 chuyến</button></div>`;
    let limit=10;
    const fill=()=>{
      const rows=getFlights().filter(f=>f.status!=='deleted' && (!$('scheduleDate').value || f.date===$('scheduleDate').value) && ($('scheduleStatus').value==='all' || f.status===$('scheduleStatus').value)).sort((a,b)=>`${a.date} ${a.departure}`.localeCompare(`${b.date} ${b.departure}`));
      $('scheduleSummary').textContent=`Hiển thị ${Math.min(limit,rows.length)} / ${rows.length} chuyến bay · ${rows.reduce((s,f)=>s+Number(f.seats||0),0)} chỗ còn lại`;
      $('scheduleRows').innerHTML=rows.slice(0,limit).map(f=>`<tr><td>${date(f.date)} · ${safe(f.departure)}</td><td>${safe(f.id)}<br>${safe(f.airline)}</td><td>${safe(f.from)} → ${safe(f.to)}</td><td>${safe(f.seats)}</td><td>${safe(ctx.flightStatusLabel(f.status))}</td><td><button class="action" data-action="edit" data-id="${safe(f.id)}">Sửa</button></td></tr>`).join('') || '<tr><td colspan="6" class="empty">Không có chuyến bay phù hợp.</td></tr>';
      $('scheduleMore').hidden=rows.length<=limit;
    };
    $('scheduleDate').value=ctx.localToday();
    ['scheduleDate','scheduleStatus'].forEach(id=>$(id).onchange=()=>{limit=10;fill();});
    $('scheduleAll').onclick=()=>{$('scheduleDate').value='';limit=10;fill();};
    $('scheduleMore').onclick=()=>{limit+=10;fill();}; fill();
  }
  function renderAudit() {
    const entries=read(AUDIT_KEY,[]).slice().reverse(); let limit=50;
    $('content').innerHTML=`<div class="card p-5"><div class="flex flex-wrap gap-3 mb-4"><input id="auditSearch" class="field max-w-xs" placeholder="Tìm người thao tác, mục quản lý" aria-label="Tìm nhật ký"><button id="auditExport" class="secondary">Xuất nhật ký JSON</button></div><p class="text-sm text-slate-500 mb-4">Giữ tối đa 500 lần cập nhật từ admin trên trình duyệt này. Không lưu nội dung mật khẩu hay dữ liệu vé trong nhật ký.</p><div class="table-scroll"><table class="data-table"><thead><tr><th>Thời gian</th><th>Người thao tác</th><th>Mục quản lý</th><th>Thao tác</th><th>Số bản ghi sau cập nhật</th></tr></thead><tbody id="auditRows"></tbody></table></div><button id="auditMore" class="secondary mt-4" hidden>Xem thêm 50</button></div>`;
    const fill=()=>{const q=$('auditSearch').value.toLowerCase();const rows=entries.filter(e=>`${e.actor} ${e.area} ${e.action}`.toLowerCase().includes(q));$('auditRows').innerHTML=rows.slice(0,limit).map(e=>`<tr><td>${safe(new Date(e.at).toLocaleString('vi-VN'))}</td><td>${safe(e.actor)}</td><td>${safe(e.area)}</td><td>${safe(e.action)}</td><td>${safe(e.count)}</td></tr>`).join('')||'<tr><td colspan="5" class="empty">Chưa có thao tác phù hợp.</td></tr>';$('auditMore').hidden=rows.length<=limit;};
    $('auditSearch').oninput=()=>{limit=50;fill();};$('auditMore').onclick=()=>{limit+=50;fill();};$('auditExport').onclick=()=>download('tripgo-nhat-ky.json',entries);fill();
  }
  function renderData() {
    let pending=null;
    const data=snapshot();
    $('content').innerHTML=`<div class="grid lg:grid-cols-2 gap-6"><section class="card p-6 space-y-4"><h2 class="text-xl font-bold">Sao lưu dữ liệu quản lý</h2><p class="text-sm text-slate-500">Xuất chuyến bay, vé, dịch vụ, hỗ trợ và danh sách cấm bay. Tài khoản, mật khẩu và phiên đăng nhập không được xuất.</p><ul>${BACKUP_KEYS.map(k=>`<li>${safe(BACKUP_LABELS[k])}: <b>${data[k].length}</b> bản ghi</li>`).join('')}</ul><button id="backupExport" class="primary">Tải bản sao lưu JSON</button><p class="text-sm text-slate-500">Chuyển tệp sang máy khác rồi nhập tại đây. Git pull không tự mang dữ liệu localStorage sang máy khác.</p></section><section class="card p-6 space-y-4"><h2 class="text-xl font-bold">Khôi phục dữ liệu</h2><p class="text-sm text-slate-500">Chọn bản sao lưu TripGo (tối đa 10 MB). Kiểm tra số lượng trước khi áp dụng; thao tác thay thế 6 nhóm dữ liệu quản lý hiện có.</p><input id="backupFile" class="field" type="file" accept=".json,application/json" aria-label="Chọn bản sao lưu JSON"><div id="backupPreview" class="text-sm whitespace-pre-wrap" role="status"></div><label class="flex gap-3 items-center"><input id="backupAccept" type="checkbox">Tôi đồng ý thay thế dữ liệu quản lý hiện có</label><button id="backupRestore" class="primary" disabled>Khôi phục dữ liệu</button></section></div>`;
    $('backupExport').onclick=()=>download(`tripgo-backup-${ctx.localToday()}.json`,{app:'TripGo',version:1,createdAt:new Date().toISOString(),data:snapshot()});
    const update=()=>{$('backupRestore').disabled=!pending || !$('backupAccept').checked;};
    $('backupAccept').onchange=update;
    $('backupFile').onchange=async e=>{
      pending=null; const chosen=e.target.files[0];$('backupAccept').checked=false;update();if(!chosen)return;
      try{if(chosen.size>10*1024*1024)throw Error('Tệp vượt quá 10 MB.');const candidate=validateBackup(JSON.parse(await chosen.text()));if(e.target.files[0]!==chosen)return;pending=candidate;$('backupPreview').textContent=BACKUP_KEYS.map(k=>`${BACKUP_LABELS[k]}: ${pending[k].length} bản ghi`).join('\n');}
      catch(err){$('backupPreview').textContent=`Không thể nhập: ${err.message}`;}update();
    };
    $('backupRestore').onclick=()=>{
      if(!pending || !$('backupAccept').checked || !window.TripGoAuth.isAdmin())return;
      const original=Object.fromEntries(BACKUP_KEYS.map(k=>[k,localStorage.getItem(k)]));const originalLog=localStorage.getItem(AUDIT_KEY);
      try{
        // Save an automatic rollback copy before replacing any group.
        localStorage.setItem('tripgo_admin_pre_restore',JSON.stringify({app:'TripGo',version:1,createdAt:new Date().toISOString(),data:snapshot()}));
        for(const k of BACKUP_KEYS)write(k,pending[k]);
        render();alertMessage('Đã khôi phục dữ liệu. Bản trước khi khôi phục được giữ trên trình duyệt này.');
      }catch{
        let rollbackOK=true;try{for(const k of BACKUP_KEYS){if(original[k]===null)localStorage.removeItem(k);else localStorage.setItem(k,original[k]);}if(originalLog===null)localStorage.removeItem(AUDIT_KEY);else localStorage.setItem(AUDIT_KEY,originalLog);}catch{rollbackOK=false;}
        alertMessage(rollbackOK?'Không đủ dung lượng hoặc không thể ghi dữ liệu; dữ liệu cũ đã được giữ lại.':'Khôi phục bị gián đoạn; tải bản trước khôi phục để phục hồi dữ liệu.',true);
      }
    };
    const previous=read('tripgo_admin_pre_restore',null);
    if(previous){const b=document.createElement('button');b.className='secondary';b.textContent='Tải bản trước khôi phục';b.onclick=()=>download('tripgo-truoc-khoi-phuc.json',previous);$('backupExport').after(b);}
  }
  function handleAction(action,id) {
    if(!window.TripGoAuth.isAdmin())return false;
    if(action==='booking-detail'){const b=getBookings().find(b=>(b.bookingCode||b.code)===id);if(b)showBooking(b);return true;}
    if(action==='confirm-booking'){
      const all=getBookings();const b=all.find(b=>(b.bookingCode||b.code)===id);if(!b || bookingState(b)!=='pending')return true;
      const f=getFlights().find(f=>f.id===b.flightId);
      if(!f || ['cancelled','deleted'].includes(f.status)){alertMessage('Không thể xác nhận vé: chuyến bay không hoạt động.',true);return true;}
      if(!confirm(`Xác nhận thanh toán mô phỏng cho vé ${id}?`))return true;
      b.status='confirmed';b.confirmedAt=new Date().toISOString();try{write('tripgo_bookings',all);render();alertMessage('Đã xác nhận vé trong demo.');}catch{alertMessage('Không thể lưu vé.',true);}return true;
    }
    if(action==='archive-flight'){
      const all=getFlights();const f=all.find(f=>f.id===id);if(!f)return true;
      if(f.status==='flying' || getBookings().some(b=>b.flightId===id && bookingState(b)!=='cancelled')){alertMessage('Không thể lưu trữ chuyến đang bay hoặc còn vé chưa hủy.',true);return true;}
      if(!confirm(`Lưu trữ chuyến ${id}? Chuyến sẽ ẩn khỏi danh sách bán vé.`))return true;
      f.archivedStatus=f.status;f.status='deleted';try{write('tripgo_flights',all);render();alertMessage('Đã lưu trữ chuyến bay.');}catch{alertMessage('Không thể lưu chuyến bay.',true);}return true;
    }
    if(action==='restore-flight'){
      const all=getFlights();const f=all.find(f=>f.id===id && f.status==='deleted');if(!f)return true;
      f.status=f.archivedStatus==='cancelled'?'cancelled':'active';delete f.archivedStatus;try{write('tripgo_flights',all);render();alertMessage('Đã khôi phục chuyến bay.');}catch{alertMessage('Không thể khôi phục.',true);}return true;
    }
    return false;
  }
  return {renderSchedule,renderData,renderAudit,handleAction};
}
