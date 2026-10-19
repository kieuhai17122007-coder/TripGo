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
