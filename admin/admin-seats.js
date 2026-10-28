import {
  MAP_KEY,
  read,
  normalizeFlight,
  getMap,
  getSeatState,
  groupError,
  adjacentGroupError,
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
  const selectedSeats = new Set();
  content.innerHTML = `<section class="seat-admin card p-4 sm:p-6"><div class="flex flex-wrap gap-4 items-end"><label class="label">Chuyến bay<select id="seatFlight" class="field">${flights.map((x) => `<option value="${safe(x.id)}" ${x.id === f.id ? "selected" : ""}>${safe(x.id)} · ${safe(x.from)} → ${safe(x.to)}</option>`).join("")}</select></label><label class="label">Ngày bay<input id="seatDate" class="field" type="date" value="${safe(chosenDate)}" ${f.date ? "disabled" : ""}></label><label class="label">Thao tác ghế<select id="seatMode" class="field"><option value="block">Khóa / mở khóa ghế</option><option value="demo">Đặt / bỏ ghế demo</option></select></label></div><div class="grid lg:grid-cols-2 gap-6 mt-6"><div><div class="seat-legend"><span><i class="legend-free"></i>Trống</span><span><i class="legend-booked"></i>Đã đặt</span><span><i class="legend-blocked"></i>Khóa</span></div><div class="aircraft-2d"><div class="cockpit">BUỒNG LÁI • DEMO 3 + 3</div><div id="adminSeatCabin"></div><div class="cabin-tail">CUỐI KHOANG • 120 GHẾ</div></div></div><div class="space-y-4"><div class="seat-summary"><h2 class="font-bold text-xl">Tình trạng khoang</h2><p id="adminSeatStats" class="mt-3"></p><p class="text-sm text-slate-500 mt-3">Sơ đồ mô phỏng 20 hàng. A–B–C và D–E–F cách nhau bởi lối đi. Số chỗ bán trong danh mục chuyến bay được quản lý riêng.</p></div><div class="seat-summary"><h2 class="font-bold">Chi tiết ghế</h2><p id="seatDetail" class="mt-3 whitespace-pre-wrap" role="status">Bấm một ghế để xem thông tin hoặc áp dụng thao tác đang chọn.</p></div><div class="seat-summary space-y-3"><h2 class="font-bold">Dữ liệu thử nghiệm</h2><p class="text-sm text-slate-500">Tạo ghế đã đặt giả lập để trình bày. Vé thật trong demo vẫn lấy từ danh sách vé và chỉ được giải phóng khi hủy vé.</p><button id="seatSeed" class="secondary">Tạo mẫu ghế đã đặt</button><button id="seatReset" class="secondary">Xóa ghế demo</button></div><p class="text-sm text-slate-500">Thay đổi được lưu theo chuyến bay và ngày, cập nhật sang trang chọn ghế trên cùng trình duyệt. Sao lưu & khôi phục bao gồm dữ liệu ghế.</p></div></div></section>`;
  document.getElementById("seatDate").disabled = false;
  document.getElementById("seatDetail").insertAdjacentHTML(
    "afterend",
    `<div id="seatBookingConfirm" class="seat-booking-confirm" hidden>
      <h3 class="font-bold">Thông tin người đặt</h3>
      <p class="text-sm mt-1">Thông tin được lưu trong dữ liệu demo trên trình duyệt này; đây không phải vé thật.</p>
      <form id="seatBookingForm" class="seat-booking-form">
        <label class="label">Họ và tên<input class="field" name="name" autocomplete="name" required minlength="2"></label>
        <label class="label">Gmail<input class="field" name="email" type="email" autocomplete="email" required></label>
        <label class="label">Số điện thoại<input class="field" name="phone" type="tel" autocomplete="tel" inputmode="tel" pattern="(0|[+]84)[0-9]{9}" title="Nhập số điện thoại dạng 0xxxxxxxxx hoặc +84xxxxxxxxx" required></label>
        <label class="label">CCCD<input class="field" name="document" inputmode="numeric" pattern="[0-9]{9}|[0-9]{12}" title="CCCD gồm 9 hoặc 12 chữ số" required></label>
      </form>
      <p id="seatBookingSummary" class="mt-3"></p>
      <div class="seat-booking-actions">
        <button id="seatBookingConfirmButton" class="primary" type="button">Xác nhận đặt ghế</button>
        <button id="seatBookingCancelButton" class="secondary" type="button">Hủy bỏ</button>
      </div>
    </div>`,
  );
  function save(map, bookingToAdd = null) {
    if (!window.TripGoAuth.isAdmin()) return false;
    const previousMaps = localStorage.getItem(MAP_KEY);
    const previousBookings = localStorage.getItem("tripgo_bookings");
    try {
      const maps = read(MAP_KEY).filter((m) => m.id !== map.id);
      maps.push(map);
      const bookings = read("tripgo_bookings");
      const demoBookings = new Map(
        (Array.isArray(map.demoBookings) ? map.demoBookings : []).map(
          (booking) => [booking.bookingCode, booking],
        ),
      );
      const updatedBookings = bookings.map((booking) => {
        if (
          !booking.isSeatDemoBooking ||
          booking.seatMapId !== map.id
        )
          return booking;
        const demoBooking = demoBookings.get(booking.bookingCode);
        if (!demoBooking) {
          if (["Đã hủy", "cancelled"].includes(booking.status)) return booking;
          return {
            ...booking,
            status: "Đã hủy",
            cancelledAt: new Date().toISOString(),
          };
        }
        const passengerCount = demoBooking.seats.length;
        const totalPrice = Number(demoBooking.unitPrice) * passengerCount;
        const previousSeats = Array.isArray(booking.seats) ? booking.seats : [];
        const seatsChanged =
          previousSeats.length !== demoBooking.seats.length ||
          previousSeats.some((seat, index) => seat !== demoBooking.seats[index]);
        if (
          !seatsChanged &&
          booking.seat === demoBooking.seats.join(", ") &&
          Number(booking.totalPrice) === totalPrice &&
          Number(booking.passengerCount) === passengerCount
        )
          return booking;
        return {
          ...booking,
          seats: demoBooking.seats,
          seat: demoBooking.seats.join(", "),
          passengerCount,
          totalPrice,
        };
      });
      if (bookingToAdd) updatedBookings.push(bookingToAdd);
      if (
        bookingToAdd ||
        updatedBookings.some(
          (booking, index) => booking !== bookings[index],
        )
      )
        write("tripgo_bookings", updatedBookings);
      write(MAP_KEY, maps);
      return true;
    } catch (error) {
      try {
        if (previousMaps === null) localStorage.removeItem(MAP_KEY);
        else localStorage.setItem(MAP_KEY, previousMaps);
        if (previousBookings === null)
          localStorage.removeItem("tripgo_bookings");
        else localStorage.setItem("tripgo_bookings", previousBookings);
      } catch (rollbackError) {
        console.error("Could not roll back seat booking data", rollbackError);
      }
      console.error("Could not save seat booking data", error);
      alertMessage("Không lưu được sơ đồ ghế hoặc vé đặt demo.", true);
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
      selectedSeats,
      (id) => {
        if (!window.TripGoAuth.isAdmin()) return;
        const latest = getSeatState(current),
          map = getMap(current),
          detail = document.getElementById("seatDetail");
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
          selectedSeats.delete(id);
          map.demoBooked = map.demoBooked.filter((seat) => seat !== id);
          map.demoBookings = (Array.isArray(map.demoBookings)
            ? map.demoBookings
            : []
          )
            .map((booking) => ({
              ...booking,
              seats: (Array.isArray(booking.seats) ? booking.seats : []).filter(
                (seat) => seat !== id,
              ),
            }))
            .filter((booking) => booking.seats.length);
          if (save(map)) {
            draw();
            document.getElementById("seatBookingConfirm").hidden =
              selectedSeats.size === 0;
            if (selectedSeats.size) updateBookingSummary();
            else document.getElementById("seatBookingForm").reset();
            document.getElementById("seatDetail").textContent =
              `Ghế ${id}: đã bỏ đặt demo.`;
          }
          return;
        }
        if (mode === "demo") {
          if (selectedSeats.has(id)) selectedSeats.delete(id);
          else selectedSeats.add(id);
          document.getElementById("seatBookingConfirm").hidden =
            selectedSeats.size === 0;
          if (!selectedSeats.size)
            document.getElementById("seatBookingForm").reset();
          updateBookingSummary(latest);
          detail.textContent = selectedSeats.size
            ? `${selectedSeats.size} ghế đang chọn. Kiểm tra tính liền kề và nhập thông tin người đặt trước khi xác nhận.`
            : "Đã bỏ chọn ghế; chưa ghi nhận đặt ghế.";
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
  function updateBookingSummary(state = getSeatState(current)) {
    const seats = [...selectedSeats].sort((a, b) => {
      const row = Number.parseInt(a) - Number.parseInt(b);
      return row || a.localeCompare(b);
    });
    const unavailable = new Set([...state.booked, ...state.blocked]);
    const issue =
      groupError(seats, unavailable, true) ||
      adjacentGroupError(seats, seats.length, unavailable);
    const total = current.price * seats.length;
    document.getElementById("seatBookingSummary").textContent = seats.length
      ? `Ghế đã chọn: ${seats.join(", ")} · ${seats.length} ghế · Tổng giá tham khảo: ${total.toLocaleString("vi-VN")} ₫${issue ? ` · ${issue}` : ""}`
      : "";
    document.getElementById("seatBookingConfirmButton").disabled =
      seats.length === 0 || Boolean(issue);
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
    if (!selectedSeats.size) return;
    selectedSeats.clear();
    document.getElementById("seatBookingConfirm").hidden = true;
    document.getElementById("seatBookingForm").reset();
    draw();
    document.getElementById("seatDetail").textContent =
      "Đã bỏ chọn các ghế do thay đổi chế độ ghế.";
  };
  document.getElementById("seatBookingConfirmButton").onclick = () => {
    if (!selectedSeats.size || !window.TripGoAuth.isAdmin()) return;
    const form = document.getElementById("seatBookingForm"),
      nameInput = form.querySelector('input[name="name"]');
    nameInput.setCustomValidity(
      nameInput.value.trim().length >= 2 ? "" : "Vui lòng nhập họ và tên.",
    );
    if (!form.reportValidity()) return;
    const latest = getSeatState(current),
      map = getMap(current);
    const seats = [...selectedSeats];
    if (seats.some((seat) => latest.booked.has(seat) || latest.blocked.has(seat))) {
      selectedSeats.clear();
      document.getElementById("seatBookingConfirm").hidden = true;
      draw();
      document.getElementById("seatDetail").textContent =
        "Một hoặc nhiều ghế không còn trống. Vui lòng chọn lại.";
      return;
    }
    const unavailable = new Set([...latest.booked, ...latest.blocked]);
    const issue =
      groupError(seats, unavailable, true) ||
      adjacentGroupError(seats, seats.length, unavailable);
    if (issue) {
      document.getElementById("seatDetail").textContent = issue;
      return;
    }
    const formData = new FormData(form),
      passenger = {
        name: String(formData.get("name")).trim(),
        email: String(formData.get("email")).trim(),
        phone: String(formData.get("phone")).trim(),
        document: String(formData.get("document")).trim(),
      };
    const bookingCode = `TG2D${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;
    const createdAt = new Date().toISOString();
    const totalPrice = current.price * seats.length;
    const ticketBooking = {
      bookingCode,
      userEmail: passenger.email,
      email: passenger.email,
      passenger: {
        fullName: passenger.name,
        name: passenger.name,
        email: passenger.email,
        phone: passenger.phone,
        document: passenger.document,
      },
      flightId: current.id,
      date: current.date,
      departureDate: current.date,
      flight: {
        airline: current.airline || "",
        date: current.date,
        flightNumber: current.id,
        id: current.id,
        from: current.from,
        to: current.to,
        departure: current.departure,
        arrival: current.arrival,
      },
      seat: seats.join(", "),
      seats,
      passengerCount: seats.length,
      price: current.price,
      totalPrice,
      status: "Đã đặt vé",
      paymentStatus: "paid",
      paymentState: "paid",
      paymentMethod: "2D · Mô phỏng",
      createdAt,
      paidAt: createdAt,
      confirmedAt: createdAt,
      isSeatDemoBooking: true,
      seatMapId: map.id,
    };
    map.demoBookings = [
      ...(Array.isArray(map.demoBookings) ? map.demoBookings : []),
      {
        bookingCode,
        seats,
        passenger,
        unitPrice: current.price,
        price: totalPrice,
        createdAt,
      },
    ];
    if (save(map, ticketBooking)) {
      selectedSeats.clear();
      draw();
      document.getElementById("seatBookingConfirm").hidden = true;
      document.getElementById("seatDetail").textContent =
        `Đã lưu vé demo ${bookingCode} cho ${passenger.name}; doanh thu mô phỏng ${totalPrice.toLocaleString("vi-VN")} ₫ đã được ghi nhận.`;
      form.reset();
    }
  };
  document.getElementById("seatBookingCancelButton").onclick = () => {
    selectedSeats.clear();
    document.getElementById("seatBookingConfirm").hidden = true;
    document.getElementById("seatBookingForm").reset();
    draw();
    document.getElementById("seatDetail").textContent =
      "Đã hủy thao tác; sơ đồ ghế chưa thay đổi.";
  };
  document.getElementById("seatSeed").onclick = () => {
    selectedSeats.clear();
    document.getElementById("seatBookingConfirm").hidden = true;
    document.getElementById("seatBookingForm").reset();
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
    selectedSeats.clear();
    document.getElementById("seatBookingConfirm").hidden = true;
    document.getElementById("seatBookingForm").reset();
    const map = getMap(current);
    map.demoBooked = [];
    map.demoBookings = [];
    if (save(map)) {
      draw();
      alertMessage("Đã xóa ghế demo.");
    }
  };
  draw();
}
