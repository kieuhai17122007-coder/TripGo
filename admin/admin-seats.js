import {
  MAP_KEY,
  read,
  normalizeFlight,
  flightKey,
  getMap,
  getSeatState,
  renderCabin,
} from "../src/js/seat-store.js";
let selection = "",
  chosenDate = "";
export function renderSeatManagement(ctx) {
  const { safe, write, alertMessage } = ctx,
    content = document.getElementById("content");
  const flights = read("tripgo_flights").filter((f) => f.status !== "deleted");
  if (!flights.length) {
    content.innerHTML =
      '<div class="card p-6">Thêm chuyến bay trước khi quản lý ghế.</div>';
    return;
  }
  const f = flights.find((f) => f.id === selection) || flights[0];
  selection = f.id;
  const today = new Date().toLocaleDateString("en-CA");
  chosenDate = chosenDate || f.date || today;
  const current = normalizeFlight({ ...f, date: chosenDate });
  let pendingSeat = "";
  content.innerHTML = `<section class="seat-admin card p-4 sm:p-6"><div class="flex flex-wrap gap-4 items-end"><label class="label">Chuyến bay<select id="seatFlight" class="field">${flights.map((x) => `<option value="${safe(x.id)}" ${x.id === f.id ? "selected" : ""}>${safe(x.id)} · ${safe(x.from)} → ${safe(x.to)}</option>`).join("")}</select></label><label class="label">Ngày bay<input id="seatDate" class="field" type="date" value="${safe(chosenDate)}" ${f.date ? "disabled" : ""}></label><label class="label">Thao tác ghế<select id="seatMode" class="field"><option value="block">Khóa / mở khóa ghế</option><option value="demo">Đặt / bỏ ghế demo</option></select></label></div><div class="grid lg:grid-cols-2 gap-6 mt-6"><div><div class="seat-legend"><span><i class="legend-free"></i>Trống</span><span><i class="legend-booked"></i>Đã đặt</span><span><i class="legend-blocked"></i>Khóa</span></div><div class="aircraft-2d"><div class="cockpit">BUỒNG LÁI • DEMO 3 + 3</div><div id="adminSeatCabin"></div><div class="cabin-tail">CUỐI KHOANG • 120 GHẾ</div></div></div><div class="space-y-4"><div class="seat-summary"><h2 class="font-bold text-xl">Tình trạng khoang</h2><p id="adminSeatStats" class="mt-3"></p><p class="text-sm text-slate-500 mt-3">Sơ đồ mô phỏng 20 hàng. A–B–C và D–E–F cách nhau bởi lối đi. Số chỗ bán trong danh mục chuyến bay được quản lý riêng.</p></div><div class="seat-summary"><h2 class="font-bold">Chi tiết ghế</h2><p id="seatDetail" class="mt-3 whitespace-pre-wrap" role="status">Bấm một ghế để xem thông tin hoặc áp dụng thao tác đang chọn.</p></div><div class="seat-summary space-y-3"><h2 class="font-bold">Dữ liệu thử nghiệm</h2><p class="text-sm text-slate-500">Tạo ghế đã đặt giả lập để trình bày. Vé thật trong demo vẫn lấy từ danh sách vé và chỉ được giải phóng khi hủy vé.</p><button id="seatSeed" class="secondary">Tạo mẫu ghế đã đặt</button><button id="seatReset" class="secondary">Xóa ghế demo</button></div><p class="text-sm text-slate-500">Thay đổi được lưu theo chuyến bay và ngày, cập nhật sang trang chọn ghế trên cùng trình duyệt. Sao lưu & khôi phục bao gồm dữ liệu ghế.</p></div></div></section>`;
  document.getElementById("seatDate").disabled = false;
  document.getElementById("seatDetail").insertAdjacentHTML(
    "afterend",
    '<div id="seatBookingConfirm" class="seat-booking-confirm" hidden><p id="seatBookingSummary"></p><div class="seat-booking-actions"><button id="seatBookingConfirmButton" class="primary" type="button">Xác nhận đặt ghế</button><button id="seatBookingCancelButton" class="secondary" type="button">Hủy bỏ</button></div></div>',
  );
  function save(map) {
    if (!window.TripGoAuth.isAdmin()) return false;
    try {
      const maps = read(MAP_KEY).filter((m) => m.id !== map.id);
      maps.push(map);
      write(MAP_KEY, maps);
      return true;
    } catch {
      alertMessage("Không lưu được sơ đồ ghế.", true);
      return false;
    }
  }
  function draw() {
    const state = getSeatState(current);
    document.getElementById("adminSeatStats").textContent =
      `Trống: ${120 - new Set([...state.booked, ...state.blocked]).size} / 120 • Đã đặt: ${state.booked.size} • Khóa: ${state.blocked.size}`;
    renderCabin(
      document.getElementById("adminSeatCabin"),
      state,
      new Set(pendingSeat ? [pendingSeat] : []),
      (id) => {
        if (!window.TripGoAuth.isAdmin()) return;
        const latest = getSeatState(current),
          map = getMap(current),
          detail = document.getElementById("seatDetail");
        const previousPendingSeat = pendingSeat;
        pendingSeat = "";
        document.getElementById("seatBookingConfirm").hidden = true;
        if (previousPendingSeat) draw();
        if (latest.owners.has(id)) {
          detail.textContent = `Ghế ${id} • Vé ${latest.owners.get(id)}. Hủy vé trong Quản lý vé để giải phóng ghế.`;
          return;
        }
        const mode = document.getElementById("seatMode").value;
        if (mode === "block" && latest.booked.has(id)) {
          detail.textContent = `Ghế ${id} đã đặt demo. Chọn Đặt / bỏ ghế demo để bỏ đặt trước khi khóa.`;
          return;
        }
        if (mode === "demo" && latest.blocked.has(id)) {
          detail.textContent = `Ghế ${id} đang khóa. Mở khóa trước khi đặt demo.`;
          return;
        }
        if (mode === "demo" && latest.booked.has(id)) {
          map.demoBooked = map.demoBooked.filter((seat) => seat !== id);
          if (save(map)) {
            draw();
            document.getElementById("seatDetail").textContent =
              `Ghế ${id}: đã bỏ đặt demo.`;
          }
          return;
        }
        if (mode === "demo") {
          pendingSeat = id;
          document.getElementById("seatBookingSummary").textContent =
            `Bạn sắp đặt ghế ${id} cho chuyến ${current.id} ngày ${chosenDate}. Giá vé tham khảo: ${current.price.toLocaleString("vi-VN")} ₫.`;
          document.getElementById("seatBookingConfirm").hidden = false;
          detail.textContent =
            `Ghế ${id} đang chờ xác nhận. Giá hiển thị là giá vé tham khảo cho một hành khách; chưa ghi nhận đặt ghế.`;
          draw();
          return;
        }
        const key = mode === "block" ? "blocked" : "demoBooked";
        map[key] = map[key].includes(id)
          ? map[key].filter((s) => s !== id)
          : [...map[key], id];
        if (save(map)) {
          draw();
          detail.textContent = `Ghế ${id}: ${map[key].includes(id) ? "đã khóa" : "đã mở khóa"}.`;
        }
      },
    );
    document
      .getElementById("adminSeatCabin")
      .querySelectorAll(".cabin-seat")
      .forEach((seat) => {
        seat.disabled = false;
      });
  }
  document.getElementById("seatFlight").onchange = (e) => {
    selection = e.target.value;
    chosenDate = "";
    renderSeatManagement(ctx);
  };
  document.getElementById("seatDate").onchange = (e) => {
    if (!e.target.value) return;
    chosenDate = e.target.value;
    renderSeatManagement(ctx);
  };
  document.getElementById("seatMode").onchange = () => {
    if (!pendingSeat) return;
    const seat = pendingSeat;
    pendingSeat = "";
    document.getElementById("seatBookingConfirm").hidden = true;
    draw();
    document.getElementById("seatDetail").textContent =
      `Đã hủy thao tác đặt ghế ${seat} do thay đổi chế độ ghế.`;
  };
  document.getElementById("seatBookingConfirmButton").onclick = () => {
    if (!pendingSeat || !window.TripGoAuth.isAdmin()) return;
    const seat = pendingSeat,
      latest = getSeatState(current),
      map = getMap(current);
    if (latest.booked.has(seat) || latest.blocked.has(seat)) {
      pendingSeat = "";
      document.getElementById("seatBookingConfirm").hidden = true;
      draw();
      document.getElementById("seatDetail").textContent =
        `Ghế ${seat} không còn trống. Vui lòng chọn ghế khác.`;
      return;
    }
    map.demoBooked = [...new Set([...map.demoBooked, seat])];
    if (save(map)) {
      pendingSeat = "";
      draw();
      document.getElementById("seatDetail").textContent =
        `Ghế ${seat}: đã được đặt demo với giá tham khảo ${current.price.toLocaleString("vi-VN")} ₫.`;
    }
  };
  document.getElementById("seatBookingCancelButton").onclick = () => {
    const seat = pendingSeat;
    pendingSeat = "";
    document.getElementById("seatBookingConfirm").hidden = true;
    draw();
    document.getElementById("seatDetail").textContent = seat
      ? `Đã hủy thao tác đặt ghế ${seat}; sơ đồ ghế chưa thay đổi.`
      : "Đã hủy thao tác đặt ghế.";
  };
  document.getElementById("seatSeed").onclick = () => {
    const map = getMap(current),
      state = getSeatState(current);
    map.demoBooked = [
      ...new Set([
        ...map.demoBooked,
        ...["2A", "2B", "4D", "4E", "4F", "7A", "7B", "10E", "10F"].filter(
          (s) => !state.blocked.has(s) && !state.owners.has(s),
        ),
      ]),
    ];
    if (save(map)) {
      draw();
      alertMessage("Đã tạo ghế demo cho chuyến/ngày đang chọn.");
    }
  };
  document.getElementById("seatReset").onclick = () => {
    const map = getMap(current);
    map.demoBooked = [];
    if (save(map)) {
      draw();
      alertMessage("Đã xóa ghế demo.");
    }
  };
  draw();
}
