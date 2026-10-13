// Shared enhancements for both TripGo admin layouts.
const PAGE_SIZE = 10;
const pagination = new WeakMap();
const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");

function enhanceFlights() {
  document.querySelectorAll("#flightRows, #flightsTable").forEach((body) => {
    let state = pagination.get(body);
    if (!state) {
      const footer = document.createElement("div");
      footer.className = "admin-pagination";
      const summary = document.createElement("span");
      summary.setAttribute("aria-live", "polite");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "admin-more-button";
      button.textContent = "Xem thêm 10 chuyến bay";
      button.setAttribute("aria-controls", body.id);
      footer.append(summary, button);
      const table = body.closest("table");
      const anchor = table.parentElement.classList.contains("table-scroll")
        ? table.parentElement
        : table;
      anchor.after(footer);
      state = { limit: PAGE_SIZE, footer, summary, button };
      pagination.set(body, state);
      button.addEventListener("click", () => {
        state.limit += PAGE_SIZE;
        updateRows(body, state);
      });
    }
    updateRows(body, state);
  });
}
function updateRows(body, state) {
  const rows = [...body.rows];
  const empty =
    rows.length === 1 &&
    rows[0].cells.length === 1 &&
    rows[0].cells[0].colSpan > 1;
  const total = empty ? 0 : rows.length;
  rows.forEach((row, index) => {
    row.hidden = !empty && index >= state.limit;
  });
  state.summary.textContent = `Hiển thị ${Math.min(state.limit, total)} / ${total} chuyến bay`;
  state.button.hidden = total <= state.limit;
  state.footer.hidden = total === 0;
}
let scheduled = false;
const observer = new MutationObserver((changes) => {
  changes = changes.filter(
    (change) =>
      !change.target.closest?.(".admin-pagination, .admin-back-to-top"),
  );
  if (!changes.length) return;
  changes.forEach((change) => {
    if (change.target.matches?.("#flightRows, #flightsTable")) {
      const state = pagination.get(change.target);
      if (state) state.limit = PAGE_SIZE;
    }
  });
  if (!scheduled) {
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      enhanceFlights();
      updateTopButton();
    });
  }
});
observer.observe(document.body, { childList: true, subtree: true });

const topButton = document.createElement("button");
topButton.type = "button";
topButton.id = "adminBackToTop";
topButton.className = "admin-back-to-top";
topButton.setAttribute("aria-label", "Lên đầu trang");
topButton.title = "Lên đầu trang";
topButton.innerHTML =
  '<span aria-hidden="true">↑</span><span class="admin-top-label">Lên đầu</span>';
topButton.hidden = true;
document.body.append(topButton);
function updateTopButton() {
  const app = document.getElementById("appView");
  topButton.hidden =
    window.scrollY < 400 || Boolean(app?.classList.contains("hidden"));
}
window.addEventListener("scroll", updateTopButton, { passive: true });
window.addEventListener("resize", updateTopButton);
topButton.addEventListener("click", () => {
  const heading =
    document.getElementById("pageTitle") ||
    document.querySelector(".admin-head h1");
  if (heading) {
    heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
  }
  window.scrollTo({
    top: 0,
    behavior: reducedMotion?.matches ? "instant" : "smooth",
  });
});
enhanceFlights();
updateTopButton();


// Local outline icons keep the workspace usable without third-party icon fonts.
const ICON_PATHS={
 'plane':'M22 12l-8-4V3a2 2 0 0 0-4 0v5l-8 4v2l8-2v5l-3 2v2l5-1 5 1v-2l-3-2v-5l8 2z',
 'house':'M3 10 12 3 21 10 M5 9v12h14V9 M9 21v-7h6v7',
 'ticket':'M4 5h16v5a2 2 0 0 0 0 4v5H4v-5a2 2 0 0 0 0-4V5 M15 5v3 M15 11v2 M15 16v3',
 'chart-column':'M4 20h17 M7 16V9 M12 16V4 M17 16v-5',
 'chair':'M6 13V5h12v8 M4 13h16v4H4z M6 17v4 M18 17v4',
 'calendar-days':'M5 4h14v17H5z M8 2v5 M16 2v5 M5 9h14 M8 13h1 M12 13h1 M16 13h1 M8 17h1 M12 17h1',
 'users':'M15 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M5 21v-3a7 7 0 0 1 14 0v3 M19 5a3 3 0 0 1 0 6 M21 15v5',
 'bag-shopping':'M5 8h14l1 13H4L5 8 M9 8V5a3 3 0 0 1 6 0v3',
 'headset':'M4 13v-1a8 8 0 0 1 16 0v5a4 4 0 0 1-4 4h-3 M4 12H2v6h4v-6H4 M20 12h2v6h-4v-6h2',
 'database':'M3 6c0-5 18-5 18 0s-18 5-18 0 M3 6v12c0 5 18 5 18 0V6 M3 12c0 5 18 5 18 0',
 'clock-rotate-left':'M3 11a9 9 0 1 1 3 8 M3 4v7h7 M12 7v5l3 2',
 'clock':'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18 M12 7v5l3 2',
 'ban':'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18 M6 6l12 12',
 'magnifying-glass':'M10 3a7 7 0 1 1 0 14 7 7 0 0 1 0-14 M15 15l6 6',
 'bars':'M4 6h16 M4 12h16 M4 18h16',
 'moon':'M21 13a9 9 0 1 1-10-10 7 7 0 0 0 10 10',
 'sun':'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8 M12 2v2 M12 20v2 M2 12h2 M20 12h2 M5 5l1 1 M18 18l1 1 M19 5l-1 1 M6 18l-1 1',
 'right-from-bracket':'M9 4H4v16h5 M8 12h13 M17 8l4 4-4 4',
 'arrow-left':'M20 12H4 M9 7l-5 5 5 5',
 'circle-check':'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18 M7 12l3 3 6-6',
 'plus':'M12 5v14 M5 12h14',
 'money-bill-wave':'M3 6h18v12H3z M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6 M6 10v4 M18 10v4',
 'eye':'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7 M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6',
 'eye-slash':'M2 2l20 20 M3 9s4-4 9-4c6 0 10 7 10 7s-2 3-4 4 M2 12s4 7 10 7c1 0 3 0 4-1',
 'pen-to-square':'M13 6l5 5 M4 20l1-6L17 2l5 5L10 19l-6 1 M20 14v7H3V4h7',
 'circle-info':'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18 M12 11v6 M12 7v1',
 'arrow-trend-up':'M3 17l6-6 4 4 8-10 M15 5h6v6',
 'qrcode':'M3 3h6v6H3z M15 3h6v6h-6z M3 15h6v6H3z M15 15h3v3h3v3h-6z'
};
ICON_PATHS['bolt']='M13 2 4 14h7l-1 8 10-12h-7l0-8';ICON_PATHS['suitcase-rolling']='M8 7V3h8v4 M5 7h14v14H5z M8 10v7 M16 10v7 M8 21v1 M16 21v1';
ICON_PATHS['plane-up']=ICON_PATHS.plane;ICON_PATHS['rotate-left']=ICON_PATHS['clock-rotate-left'];
export function adminIcon(name){return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICON_PATHS[name] || ICON_PATHS['circle-info']}"/></svg>`;}
function applyIcons(){document.querySelectorAll('i.fa-solid').forEach(el=>{const name=[...el.classList].find(c=>c.startsWith('fa-')&&c!=='fa-solid')?.slice(3)||'circle-info';if(el.dataset.outlineIcon!==name){el.innerHTML=adminIcon(name);el.dataset.outlineIcon=name;el.setAttribute('aria-hidden','true');}});}
const iconObserver=new MutationObserver(()=>applyIcons());iconObserver.observe(document.body,{childList:true,subtree:true});applyIcons();

const menuToggle=document.getElementById('sidebarToggle'),backdrop=document.getElementById('sidebarBackdrop');
function closeSidebar(){document.body.classList.remove('sidebar-open');backdrop.hidden=true;menuToggle.setAttribute('aria-expanded','false');}
menuToggle?.addEventListener('click',()=>{const open=!document.body.classList.contains('sidebar-open');document.body.classList.toggle('sidebar-open',open);backdrop.hidden=!open;menuToggle.setAttribute('aria-expanded',String(open));if(open)document.querySelector('.admin-sidebar .nav.active')?.focus();});
backdrop?.addEventListener('click',()=>{closeSidebar();menuToggle.focus();});
document.querySelectorAll('.admin-sidebar .nav').forEach(b=>b.addEventListener('click',()=>{closeSidebar();requestAnimationFrame(()=>window.scrollTo({top:0,behavior:'instant'}));document.getElementById('headerPageName').textContent=b.textContent.trim();}));
window.addEventListener('resize',()=>{if(innerWidth>=1024)closeSidebar();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeSidebar();document.getElementById('adminSearchResults').hidden=true;}const modal=document.querySelector('.modal-backdrop:not(.hidden)');if(e.key==='Tab'&&modal){const items=[...modal.querySelectorAll('button,input,select,textarea,a[href]')].filter(x=>!x.disabled&&x.offsetParent!==null);if(!items.length)return;const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
const search=document.getElementById('adminNavSearch'),results=document.getElementById('adminSearchResults');
const fold=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase();
search?.addEventListener('input',()=>{const q=fold(search.value.trim());results.replaceChildren();results.hidden=!q;if(!q)return;const matches=[...document.querySelectorAll('.admin-sidebar .nav')].filter(b=>fold(b.textContent).includes(q));for(const nav of matches){const b=document.createElement('button');b.type='button';b.textContent=nav.textContent.trim();b.onclick=()=>{nav.click();results.hidden=true;search.value='';document.getElementById('pageTitle').setAttribute('tabindex','-1');document.getElementById('pageTitle').focus();};results.append(b);}if(!matches.length){const message=document.createElement('p');message.textContent='Không tìm thấy mục quản lý.';results.append(message);}});
search?.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();results.querySelector('button')?.focus();}if(e.key==='Enter'){e.preventDefault();results.querySelector('button')?.click();}});
document.addEventListener('click',e=>{if(!e.target.closest('.admin-search-wrap'))results.hidden=true;});
