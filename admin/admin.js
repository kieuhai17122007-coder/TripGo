(() => {
  "use strict";
  const KEYS = {
    users: "tripgo_users",
    session: "tripgo_session",
    flights: "tripgo_flights",
    bookings: "tripgo_bookings",
  };
  const ADMIN_EMAIL = "admin@tripgo.com",
    ADMIN_PASSWORD = "Admin@123";
  const AIRPORTS = {
    HAN: "Hà Nội",
    SGN: "TP. Hồ Chí Minh",
    DAD: "Đà Nẵng",
    PQC: "Phú Quốc",
    CXR: "Nha Trang",
    HPH: "Hải Phòng",
  };
  const AIRLINES = [
    "TripGo Airlines",
    "VietJet Air",
    "Vietnam Airlines",
    "Bamboo Airways",
  ];
  const AIRCRAFTS = ["Airbus A320", "Airbus A321", "Boeing 737"];
  const $ = (id) => document.getElementById(id),
    safe = (v) =>
      String(v ?? "").replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[c],
      );
  const read = (key, fallback) => {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return Array.isArray(fallback)
        ? Array.isArray(value)
          ? value
          : fallback
        : (value ?? fallback);
    } catch {
      return fallback;
    }
  };
  const write = (key, value) =>
    localStorage.setItem(key, JSON.stringify(value));
  const money = (value) => Number(value || 0).toLocaleString("vi-VN") + " ₫";
  const date = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return "-";
    const [y, m, d] = value.split("-");
    return `${d}/${m}/${y}`;
  };
  let page = "overview",
    editing = null,
    flights = [],
    bookings = [];
  function ensureAdmin() {
    const users = read(KEYS.users, []);
    const existing = users.find(
      (u) => String(u.email).toLowerCase() === ADMIN_EMAIL,
    );
    if (!existing) {
      users.push({
        id: "USR-TRIPGO-ADMIN",
        name: "TripGo Admin",
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: "admin",
        createdAt: new Date().toISOString(),
      });
      write(KEYS.users, users);
    }
  }
  function authenticated() {
    const session = read(KEYS.session, null);
    const user = read(KEYS.users, []).find((u) => u.id === session?.userId);
    return !!(
      user &&
      String(user.email).toLowerCase() === ADMIN_EMAIL &&
      user.password === ADMIN_PASSWORD &&
      user.role === "admin"
    );
  }
  function showAuth() {
    const logged = authenticated();
    $("loginView").classList.toggle("hidden", logged);
    $("appView").classList.toggle("hidden", !logged);
    if (logged) {
      render();
      load().then(render);
    }
  }
  function alertMessage(message, error = false) {
    const el = $("notice");
    el.textContent = message;
    el.className = `mb-4 rounded-xl p-3 text-sm ${error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-800"}`;
    setTimeout(() => el.classList.add("hidden"), 5000);
  }
  async function load() {
    flights = read(KEYS.flights, []);
    bookings = read(KEYS.bookings, []);
    if (localStorage.getItem(KEYS.flights) !== null) return;
    try {
      const response = await fetch("flights.json");
      if (!response.ok) throw Error("HTTP");
      const defaults = await response.json();
      if (
        localStorage.getItem(KEYS.flights) === null &&
        Array.isArray(defaults)
      ) {
        flights = defaults.map((f) => ({
          ...f,
          date: f.date || new Date().toISOString().slice(0, 10),
          status: f.status || "active",
        }));
        saveFlights();
      }
    } catch {
      alertMessage(
        "Không tải được chuyến bay mẫu. Bạn vẫn có thể thêm chuyến bay mới. Hãy chạy bằng Live Server để nạp dữ liệu JSON.",
        true,
      );
    }
  }
  function saveFlights() {
    write(KEYS.flights, flights);
  }
  function status(s) {
    return s === "cancelled"
      ? "Đã hủy"
      : s === "pending"
        ? "Chờ thanh toán"
        : "Đã xác nhận";
  }
  function header() {
    const titles = {
      overview: ["Tổng quan", "Theo dõi dữ liệu đặt vé và chuyến bay."],
      flights: ["Quản lý chuyến bay", "Thêm, cập nhật và quản lý lịch bay."],
      bookings: ["Vé đã đặt", "Theo dõi danh sách vé và trạng thái đặt chỗ."],
    };
    $("pageTitle").textContent = titles[page][0];
    $("pageDescription").textContent = titles[page][1];
    $("newFlight").classList.toggle("hidden", page !== "flights");
    document
      .querySelectorAll(".nav")
      .forEach((item) =>
        item.classList.toggle("active", item.dataset.page === page),
      );
  }
  function render() {
    if (!authenticated()) {
      showAuth();
      return;
    }
    flights = read(KEYS.flights, flights);
    bookings = read(KEYS.bookings, []);
    header();
    if (page === "overview") renderOverview();
    if (page === "flights") renderFlights();
    if (page === "bookings") renderBookings();
  }
  function renderOverview() {
    const active = flights.filter((f) => f.status !== "deleted");
    const confirmed = bookings.filter((b) => b.status === "confirmed");
    $("content").innerHTML =
      `<div class="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">${[
        ["Chuyến bay", active.length, "✈"],
        ["Vé đã đặt", bookings.length, "▤"],
        ["Vé xác nhận", confirmed.length, "✓"],
        [
          "Doanh thu mô phỏng",
          money(confirmed.reduce((n, b) => n + Number(b.total || 0), 0)),
          "₫",
        ],
      ]
        .map(
          ([label, value, icon]) =>
            `<div class="card p-6"><div class="text-blue-700 text-xl">${icon}</div><p class="text-slate-500 text-sm mt-4">${label}</p><p class="text-2xl font-bold mt-2">${value}</p></div>`,
        )
        .join(
          "",
        )}</div><div class="card mt-6 p-6"><h2 class="font-bold text-lg">Hoạt động gần đây</h2>${
        bookings.length
          ? `<div class="mt-4 space-y-3">${bookings
              .slice(-5)
              .reverse()
              .map(
                (b) =>
                  `<div class="border-b pb-3 text-sm flex flex-wrap justify-between gap-2"><span>Vé <b>${safe(b.code)}</b> · ${safe(b.passenger?.name || "Hành khách")}</span><span>${money(b.total)}</span></div>`,
              )
              .join("")}</div>`
          : '<p class="text-slate-500 mt-4">Chưa có vé được đặt.</p>'
      }</div>`;
  }
  function renderFlights() {
    let query = ($("flightSearch")?.value || "").trim().toLowerCase();
    $("content").innerHTML =
      `<div class="card"><div class="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3"><h2 class="font-bold">Danh sách chuyến bay <span class="text-slate-400 font-normal">(${flights.filter((f) => f.status !== "deleted").length})</span></h2><input id="flightSearch" class="field max-w-xs" aria-label="Tìm chuyến bay" placeholder="Tìm mã, hãng, điểm đi/đến" value="${safe(query)}"></div><div class="table-scroll"><table class="data-table"><thead><tr><th>Mã / Hãng</th><th>Hành trình</th><th>Ngày / Giờ</th><th>Giá</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody id="flightRows"></tbody></table></div></div>`;
    $("flightSearch").addEventListener("input", () =>
      fillFlights($("flightSearch").value),
    );
    fillFlights(query);
  }
  function fillFlights(query) {
    const matches = flights.filter(
      (f) =>
        f.status !== "deleted" &&
        [f.id, f.airline, f.from, f.to, AIRPORTS[f.from], AIRPORTS[f.to]].some(
          (v) =>
            String(v || "")
              .toLowerCase()
              .includes(query.toLowerCase()),
        ),
    );
    $("flightRows").innerHTML = matches.length
      ? matches
          .map(
            (f) =>
              `<tr><td><b>${safe(f.id)}</b><br><span class="text-slate-500">${safe(f.airline)}</span></td><td>${safe(AIRPORTS[f.from] || f.from)} → ${safe(AIRPORTS[f.to] || f.to)}</td><td>${date(f.date)}<br><span class="text-slate-500">${safe(f.departure)} – ${safe(f.arrival)}</span></td><td>${money(f.price)}</td><td><span class="badge ${f.status === "inactive" ? "off" : ""}">${f.status === "inactive" ? "Tạm dừng" : "Đang bán"}</span></td><td><button class="action" data-action="edit" data-id="${safe(f.id)}">Sửa</button><button class="action danger" data-action="delete" data-id="${safe(f.id)}">Xóa</button></td></tr>`,
          )
          .join("")
      : '<tr><td colspan="6" class="empty">Không tìm thấy chuyến bay nào.</td></tr>';
  }
  function renderBookings() {
    const rows = bookings.slice().reverse();
    $("content").innerHTML =
      `<div class="card"><div class="p-5"><h2 class="font-bold">Danh sách vé đã đặt <span class="text-slate-400 font-normal">(${rows.length})</span></h2></div><div class="table-scroll"><table class="data-table"><thead><tr><th>Mã vé</th><th>Hành khách</th><th>Chuyến bay</th><th>Ngày đi</th><th>Tổng tiền</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>${rows.length ? rows.map((b) => `<tr><td><b>${safe(b.code)}</b></td><td>${safe(b.passenger?.name || "-")}</td><td>${safe(b.flight?.from || "-")} → ${safe(b.flight?.to || "-")}</td><td>${date(b.departureDate)}</td><td>${money(b.total)}</td><td><span class="badge ${b.status === "cancelled" ? "cancel" : b.status === "pending" ? "off" : ""}">${status(b.status)}</span></td><td>${b.status === "cancelled" ? "-" : `<button class="action danger" data-action="cancel" data-id="${safe(b.code)}">Hủy vé</button>`}</td></tr>`).join("") : '<tr><td colspan="7" class="empty">Chưa có vé được đặt.</td></tr>'}</tbody></table></div></div>`;
  }
  function options(select, entries, value) {
    select.innerHTML = entries
      .map(([v, label]) => `<option value="${safe(v)}">${safe(label)}</option>`)
      .join("");
    if (value) select.value = value;
  }
  function openModal(f = null) {
    editing = f?.id || null;
    const form = $("flightForm");
    form.reset();
    options(
      form.elements.airline,
      AIRLINES.map((v) => [v, v]),
      f?.airline,
    );
    options(
      form.elements.from,
      Object.entries(AIRPORTS).map(([v, label]) => [v, `${label} (${v})`]),
      f?.from,
    );
    options(
      form.elements.to,
      Object.entries(AIRPORTS).map(([v, label]) => [v, `${label} (${v})`]),
      f?.to,
    );
    options(
      form.elements.aircraft,
      AIRCRAFTS.map((v) => [v, v]),
      f?.aircraft,
    );
    for (const key of [
      "id",
      "date",
      "departure",
      "arrival",
      "duration",
      "price",
      "baggage",
      "status",
    ])
      form.elements[key].value =
        f?.[key] ??
        {
          date: new Date().toISOString().slice(0, 10),
          baggage: 7,
          status: "active",
        }[key] ??
        "";
    form.elements.id.disabled = !!editing;
    $("modalTitle").textContent = editing
      ? "Sửa chuyến bay"
      : "Thêm chuyến bay";
    $("formError").textContent = "";
    $("modal").classList.remove("hidden");
    form.elements[editing ? "date" : "id"].focus();
  }
  function closeModal() {
    $("modal").classList.add("hidden");
    editing = null;
  }
  function saveFlight(event) {
    event.preventDefault();
    const f = event.currentTarget.elements;
    const data = {
      id: f.id.value.trim().toUpperCase(),
      airline: f.airline.value,
      from: f.from.value,
      to: f.to.value,
      date: f.date.value,
      departure: f.departure.value,
      arrival: f.arrival.value,
      duration: f.duration.value.trim(),
      aircraft: f.aircraft.value,
      price: Number(f.price.value),
      baggage: Number(f.baggage.value),
      status: f.status.value,
    };
    let error = "";
    if (!/^[A-Z0-9-]{2,20}$/.test(data.id))
      error =
        "Mã chuyến bay cần 2–20 ký tự, chỉ dùng chữ in hoa, số hoặc dấu gạch ngang.";
    else if (!editing && flights.some((x) => x.id.toUpperCase() === data.id))
      error = "Mã chuyến bay đã tồn tại.";
    else if (data.from === data.to)
      error = "Điểm đi và điểm đến phải khác nhau.";
    else if (
      !/^\d{4}-\d{2}-\d{2}$/.test(data.date) ||
      !data.departure ||
      !data.arrival
    )
      error = "Vui lòng nhập đủ ngày và giờ bay.";
    else if (data.departure === data.arrival)
      error = "Giờ đi và giờ đến không được trùng nhau.";
    else if (!data.duration || !data.airline || !data.aircraft)
      error = "Vui lòng nhập đủ hãng, máy bay và thời gian bay.";
    else if (
      !Number.isFinite(data.price) ||
      data.price < 100000 ||
      data.price > 100000000
    )
      error = "Giá vé phải từ 100.000 đến 100.000.000 ₫.";
    else if (
      !Number.isInteger(data.baggage) ||
      data.baggage < 0 ||
      data.baggage > 100
    )
      error = "Hành lý phải là số nguyên từ 0 đến 100 kg.";
    if (error) {
      $("formError").textContent = error;
      return;
    }
    if (editing) {
      const index = flights.findIndex((x) => x.id === editing);
      if (index < 0) {
        $("formError").textContent = "Chuyến bay không còn tồn tại.";
        return;
      }
      flights[index] = { ...flights[index], ...data };
    } else flights.push(data);
    saveFlights();
    closeModal();
    render();
    alertMessage("Đã lưu chuyến bay.");
  }
  function handleAction(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const { action, id } = button.dataset;
    if (action === "edit") {
      const f = flights.find((x) => x.id === id);
      if (f) openModal(f);
    }
    if (action === "delete") {
      if (!confirm(`Xóa chuyến bay ${id}?`)) return;
      flights = flights.filter((x) => x.id !== id);
      saveFlights();
      render();
      alertMessage("Đã xóa chuyến bay.");
    }
    if (action === "cancel") {
      if (!confirm(`Hủy vé ${id}?`)) return;
      const index = bookings.findIndex((x) => x.code === id);
      if (index < 0) return;
      bookings[index] = {
        ...bookings[index],
        status: "cancelled",
        cancelledAt: new Date().toISOString(),
      };
      write(KEYS.bookings, bookings);
      render();
      alertMessage("Đã hủy vé.");
    }
  }
  $("loginForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget.elements;
    const email = form.email.value.trim().toLowerCase(),
      password = form.password.value;
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      $("loginError").textContent = "Email hoặc mật khẩu không chính xác.";
      return;
    }
    ensureAdmin();
    const user = read(KEYS.users, []).find((u) => u.email === ADMIN_EMAIL);
    if (!user || user.role !== "admin" || user.password !== ADMIN_PASSWORD) {
      $("loginError").textContent = "Tài khoản admin không hợp lệ.";
      return;
    }
    write(KEYS.session, {
      userId: user.id,
      loggedAt: new Date().toISOString(),
    });
    $("loginError").textContent = "";
    event.currentTarget.reset();
    showAuth();
  });
  $("logout").addEventListener("click", () => {
    localStorage.removeItem(KEYS.session);
    showAuth();
  });
  document.querySelectorAll(".nav").forEach((item) =>
    item.addEventListener("click", () => {
      page = item.dataset.page;
      render();
    }),
  );
  $("newFlight").addEventListener("click", () => openModal());
  $("closeModal").addEventListener("click", closeModal);
  $("cancelModal").addEventListener("click", closeModal);
  $("modal").addEventListener("click", (event) => {
    if (event.target === $("modal")) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !$("modal").classList.contains("hidden"))
      closeModal();
  });
  $("flightForm").addEventListener("submit", saveFlight);
  $("content").addEventListener("click", handleAction);
  window.addEventListener("storage", (event) => {
    if (Object.values(KEYS).includes(event.key)) showAuth();
  });
  ensureAdmin();
  showAuth();
})();
