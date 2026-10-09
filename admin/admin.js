(() => {
  "use strict";
  const SERVICE_KEY = "tripgo_services";
  const DEFAULT_SERVICES = [
    {
      id: "booking",
      title: "Đặt vé máy bay",
      description: "Tìm và chọn chuyến bay phù hợp.",
      icon: "fa-plane",
      href: "#search",
      enabled: true,
    },
    {
      id: "booking-lookup",
      title: "Tra cứu đặt chỗ",
      description: "Kiểm tra thông tin hành trình.",
      icon: "fa-ticket",
      href: "#booking-search",
      enabled: true,
    },
    {
      id: "check-in",
      title: "Check-in trực tuyến",
      description: "Làm thủ tục nhanh chóng, thuận tiện.",
      icon: "fa-qrcode",
      href: "#support",
      enabled: true,
    },
    {
      id: "seat-selection",
      title: "Chọn ghế",
      description: "Chọn vị trí yêu thích trên máy bay.",
      icon: "fa-chair",
      href: "#search",
      enabled: true,
    },
  ];
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
  function getServiceCatalog() {
    try {
      const value = localStorage.getItem(SERVICE_KEY);
      if (value === null) {
        write(SERVICE_KEY, DEFAULT_SERVICES);
        return DEFAULT_SERVICES.map((service) => ({ ...service }));
      }
      const services = JSON.parse(value);
      return Array.isArray(services)
        ? services
        : DEFAULT_SERVICES.map((service) => ({ ...service }));
    } catch {
      return DEFAULT_SERVICES.map((service) => ({ ...service }));
    }
  }
  function saveServiceCatalog(services) {
    write(SERVICE_KEY, services);
  }
  const money = (value) => Number(value || 0).toLocaleString("vi-VN") + " ₫";
  const THEME_KEY = "tripgo_admin_theme";
  const date = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return "-";
    const [y, m, d] = value.split("-");
    return `${d}/${m}/${y}`;
  };
  const localToday = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  };
  const validDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
    const [year, month, day] = value.split("-").map(Number);
    const parsed = new Date(year, month - 1, day);
    return (
      parsed.getFullYear() === year &&
      parsed.getMonth() === month - 1 &&
      parsed.getDate() === day
    );
  };
  const bookingState = (booking) => {
    const value = String(booking.status || "").toLowerCase();
    if (value === "cancelled" || value === "đã hủy") return "cancelled";
    if (value === "pending" || value === "chờ thanh toán") return "pending";
    return "confirmed";
  };
  let bookingLimit = 10;
  let page = "overview",
    editing = null,
    editingServiceId = null,
    flights = [],
    bookings = [],
    selectedCustomerEmail = null;
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
  function setTheme(theme) {
    const isDark = theme === "dark";
    document.body.classList.toggle("admin-dark", isDark);
    document.documentElement.classList.toggle("dark", isDark);
    $("themeToggle").setAttribute(
      "aria-label",
      isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối",
    );
    $("themeToggle").title = isDark
      ? "Chuyển sang giao diện sáng"
      : "Chuyển sang giao diện tối";
    $("themeIcon").className = `fa-solid ${isDark ? "fa-sun" : "fa-moon"}`;
    $("themeToggle").querySelector("span").textContent = isDark
      ? "Giao diện sáng"
      : "Giao diện tối";
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
    return s === "cancelled" || s === "đã hủy" || s === "đã bị hủy"
      ? "Đã bị huỷ"
      : s === "pending" || s === "chờ thanh toán"
        ? "Chờ thanh toán"
        : "Đã xác nhận";
  }
  function flightStatusLabel(s) {
    return s === "cancelled" || s === "đã bị hủy"
      ? "Đã bị huỷ"
      : s === "flying" || s === "đang bay"
        ? "Đang bay"
        : "Đang hoạt động";
  }
  function flightStatusClass(s) {
    return s === "cancelled" ? "cancel" : s === "flying" ? "off" : "";
  }
  function header() {
    const titles = {
      banned: ["Hành khách bị cấm bay", "Quản lý hồ sơ, lý do và thời hạn cấm bay trong bản demo."],
      overview: ["Tổng quan", "Theo dõi dữ liệu đặt vé và chuyến bay."],
      flights: ["Quản lý chuyến bay", "Thêm, cập nhật và quản lý lịch bay."],
      bookings: ["Vé đã đặt", "Theo dõi danh sách vé và trạng thái đặt chỗ."],
      customers: [
        "Khách hàng",
        "Theo dõi hồ sơ, chi tiêu và hoạt động của khách hàng.",
      ],
      reports: [
        "Báo cáo",
        "Theo dõi doanh thu và xu hướng đặt vé theo thời gian.",
      ],
      services: [
        "Dịch vụ",
        "Cập nhật gói tiện ích, ưu đãi và trải nghiệm bán vé.",
      ],
      support: [
        "Hỗ trợ khách hàng",
        "Theo dõi phản hồi, xử lý yêu cầu và chăm sóc khách hàng.",
      ],
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
    if (page === "overview") {
      renderOverview();
      const quick = document.createElement("div");
      quick.className = "grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6";
      quick.innerHTML = [["flights","✈","Chuyến bay"],["bookings","▤","Quản lý vé"],["services","▣","Dịch vụ"],["support","◉","Hỗ trợ khách hàng"],["banned","⊘","Hành khách cấm bay"],["customers","♙","Khách hàng"],["reports","◫","Báo cáo"]].map(([p,i,l]) => `<button data-go="${p}" class="card p-4 text-left hover:border-blue-400 transition"><span class="text-2xl text-blue-600">${i}</span><span class="block font-semibold mt-2 text-sm">${l}</span></button>`).join("");
      $("content").prepend(quick);
    }
    if (page === "flights") renderFlights();
    if (page === "bookings") renderBookings();
    if (page === "customers") renderCustomers();
    if (page === "reports") renderReports();
    if (page === "services") renderServices();
    if (page === "support") renderSupport();
    if (page === "banned") renderBanned();
  }
  function renderOverview() {
    const active = flights.filter((f) => f.status === "active");
    const flying = flights.filter((f) => f.status === "flying");
    const confirmed = bookings.filter((b) => bookingState(b) === "confirmed");
    const cancelled = bookings.filter((b) => bookingState(b) === "cancelled");
    const revenue = confirmed.reduce(
      (total, booking) =>
        total + Number(booking.totalPrice ?? booking.total ?? 0),
      0,
    );
    const customerEmails = new Set([
      ...bookings
        .map((booking) =>
          String(booking.email || "")
            .trim()
            .toLowerCase(),
        )
        .filter(Boolean),
      ...read(KEYS.users, [])
        .filter(
          (user) => String(user.role || "customer").toLowerCase() !== "admin",
        )
        .map((user) =>
          String(user.email || "")
            .trim()
            .toLowerCase(),
        )
        .filter(Boolean),
    ]);
    const routeCounts = Object.values(
      bookings.reduce((map, booking) => {
        const from = booking.from || booking.flight?.from || "-";
        const to = booking.to || booking.flight?.to || "-";
        const key = `${from} → ${to}`;
        map[key] = map[key] || { route: key, count: 0 };
        map[key].count += 1;
        return map;
      }, {}),
    )
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    const stats = [
      [
        "Chuyến bay đang mở",
        active.length,
        '<i class="fa-solid fa-plane"></i>',
      ],
      ["Đang bay", flying.length, '<i class="fa-solid fa-plane-up"></i>'],
      ["Vé đã đặt", bookings.length, '<i class="fa-solid fa-ticket"></i>'],
      [
        "Doanh thu",
        money(revenue),
        '<i class="fa-solid fa-money-bill-wave"></i>',
      ],
      [
        "Tỷ lệ hủy",
        `${bookings.length ? Math.round((cancelled.length / bookings.length) * 100) : 0}%`,
        '<i class="fa-solid fa-rotate-left"></i>',
      ],
      ["Khách hàng", customerEmails.size, '<i class="fa-solid fa-users"></i>'],
    ];
    $("content").innerHTML = `
      <div class="stats-grid">${stats
        .map(
          ([label, value, icon]) =>
            `<div class="card stat-card"><div class="stat-icon">${icon}</div><p class="stat-label">${label}</p><p class="stat-value">${value}</p></div>`,
        )
        .join("")}</div>
      <div class="grid xl:grid-cols-[1.25fr_0.75fr] gap-6 mt-6">
        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-bold text-lg">Top tuyến phổ biến</h2>
            <span class="chip chip-blue"><i class="fa-solid fa-arrow-trend-up mr-1"></i>Xu hướng</span>
          </div>
          <div class="mt-4">
            ${
              routeCounts.length
                ? `<table class="data-table compact"><thead><tr><th>Tuyến</th><th>Vé</th></tr></thead><tbody>${routeCounts
                    .map(
                      ({ route, count }) =>
                        `<tr><td>${safe(route)}</td><td><span class="badge off">${count}</span></td></tr>`,
                    )
                    .join("")}</tbody></table>`
                : '<p class="text-slate-500 mt-3">Chưa có dữ liệu tuyến bay.</p>'
            }
          </div>
        </div>
        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-bold text-lg">Hoạt động gần đây</h2>
            <span class="chip chip-green"><i class="fa-solid fa-clock mr-1"></i>Mới</span>
          </div>
          ${
            bookings.length
              ? `<div class="mt-4 space-y-3">${bookings
                  .slice(-5)
                  .reverse()
                  .map(
                    (b) =>
                      `<div class="border-b pb-3 text-sm flex flex-wrap justify-between gap-2"><span>Vé <b>${safe(b.bookingCode || b.code)}</b> · ${safe(b.passengerDetails?.[0]?.name || b.passenger?.name || "Hành khách")}</span><span>${money(b.totalPrice ?? b.total)}</span></div>`,
                  )
                  .join("")}</div>`
              : '<p class="text-slate-500 mt-4">Chưa có vé được đặt.</p>'
          }
        </div>
      </div>
    `;
  }
  function renderServices() {
    const serviceCards = getServiceCatalog();
    $("content").innerHTML = `
      <div class="card p-5 sm:p-6 mb-6">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 class="font-bold text-lg">Danh mục dịch vụ</h2>
            <p class="text-slate-500 text-sm mt-1">Thêm dịch vụ hoặc cập nhật nội dung được hiển thị trên trang bán vé.</p>
          </div>
          <button id="addService" class="primary"><i class="fa-solid fa-plus mr-2"></i>Thêm dịch vụ</button>
        </div>
      </div>
      <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        ${
          serviceCards
            .map(
              (service) => `
              <div class="card p-5 service-card">
                <div class="flex justify-between items-start gap-3">
                  <div class="service-icon"><i class="fa-solid ${safe(service.icon)}"></i></div>
                  <span class="chip ${service.enabled === false ? "chip-orange" : "chip-green"}">${service.enabled === false ? "Đang ẩn" : "Đang hiển thị"}</span>
                </div>
                <h3 class="font-bold mt-4">${safe(service.title)}</h3>
                <p class="text-slate-500 text-sm mt-2 min-h-10">${safe(service.description)}</p>
                <p class="text-xs text-slate-400 mt-3">Liên kết: ${safe(service.href)}</p>
                <div class="flex gap-2 mt-4">
                  <button class="secondary" data-action="edit-service" data-id="${safe(service.id)}"><i class="fa-solid fa-pen-to-square mr-2"></i>Sửa</button>
                  <button class="secondary" data-action="toggle-service" data-id="${safe(service.id)}">${service.enabled === false ? '<i class="fa-solid fa-eye mr-2"></i>Hiện' : '<i class="fa-solid fa-eye-slash mr-2"></i>Ẩn'}</button>
                </div>
              </div>
            `,
            )
            .join("") ||
          '<div class="card empty md:col-span-2 xl:col-span-3">Chưa có dịch vụ. Hãy thêm dịch vụ đầu tiên.</div>'
        }
      </div>
    `;
    $("addService").addEventListener("click", () => openServiceModal());
  }
  function openServiceModal(service = null) {
    const form = $("serviceForm");
    form.reset();
    editingServiceId = service?.id || null;
    form.elements.title.value = service?.title || "";
    form.elements.description.value = service?.description || "";
    form.elements.icon.value = service?.icon || "fa-circle-info";
    form.elements.href.value = service?.href || "#search";
    form.elements.enabled.checked = service?.enabled !== false;
    $("serviceModalTitle").textContent = editingServiceId
      ? "Chỉnh sửa dịch vụ"
      : "Thêm dịch vụ";
    $("serviceFormError").textContent = "";
    $("serviceModal").classList.remove("hidden");
    form.elements.title.focus();
  }
  function closeServiceModal() {
    $("serviceModal").classList.add("hidden");
    editingServiceId = null;
  }
  function saveService(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const isEditing = !!editingServiceId;
    const title = form.elements.title.value.trim();
    const description = form.elements.description.value.trim();
    const href = form.elements.href.value;
    if (title.length < 2 || description.length < 5) {
      $("serviceFormError").textContent =
        "Tên dịch vụ cần ít nhất 2 ký tự và mô tả cần ít nhất 5 ký tự.";
      return;
    }
    if (!["#search", "#booking-search", "#support"].includes(href)) {
      $("serviceFormError").textContent = "Liên kết dịch vụ không hợp lệ.";
      return;
    }
    const services = getServiceCatalog();
    const service = {
      id: editingServiceId || `service-${Date.now()}`,
      title,
      description,
      icon: form.elements.icon.value,
      href,
      enabled: form.elements.enabled.checked,
    };
    try {
      const updated = editingServiceId
        ? services.map((item) =>
            item.id === editingServiceId ? service : item,
          )
        : [...services, service];
      saveServiceCatalog(updated);
    } catch (error) {
      $("serviceFormError").textContent =
        "Không thể lưu dịch vụ vào bộ nhớ trình duyệt. Hãy kiểm tra dung lượng hoặc quyền lưu trữ.";
      console.error("Could not save service catalog", error);
      return;
    }
    closeServiceModal();
    renderServices();
    alertMessage(
      isEditing
        ? "Đã cập nhật dịch vụ trên trang bán vé."
        : "Đã thêm dịch vụ vào trang bán vé.",
    );
  }
  const SUPPORT_KEY = "tripgo_admin_support";
  const BAN_KEY = "tripgo_banned_passengers";
  const uid = () => crypto.randomUUID();
  function persist(key, value) {
    try { write(key, value); return true; }
    catch { alertMessage("Không thể lưu dữ liệu. Kiểm tra dung lượng lưu trữ của trình duyệt.", true); return false; }
  }
  function renderSupport() {
    const tickets = read(SUPPORT_KEY, []);
    $("content").innerHTML = `<div class="grid xl:grid-cols-[1fr_2fr] gap-6">
      <form id="supportForm" class="card p-6 space-y-4 h-fit">
        <h2 class="text-lg font-bold">Tiếp nhận yêu cầu</h2>
        <label class="label">Họ tên<input name="name" class="field" required maxlength="80"></label>
        <label class="label">Email<input name="email" type="email" class="field" required maxlength="120"></label>
        <label class="label">Mã đặt chỗ (nếu có)<input name="code" class="field" maxlength="30"></label>
        <label class="label">Nội dung<textarea name="issue" class="field" required maxlength="1000" rows="4"></textarea></label>
        <button class="primary" type="submit">Tạo yêu cầu</button>
      </form>
      <div class="card p-6"><div class="flex justify-between flex-wrap gap-3"><h2 class="text-lg font-bold">Yêu cầu hỗ trợ (${tickets.length})</h2><button id="quickReply" class="primary" type="button" ${tickets.length ? "" : "disabled"}>Phản hồi nhanh</button><span class="badge off">${tickets.filter(t => t.status !== "resolved").length} chưa hoàn tất</span></div>
      <div class="grid sm:grid-cols-2 gap-3 my-5"><input id="supportSearch" class="field" placeholder="Tìm tên, email, mã đặt chỗ" aria-label="Tìm yêu cầu"><select id="supportFilter" class="field" aria-label="Lọc yêu cầu"><option value="all">Tất cả</option><option value="open">Mới tiếp nhận</option><option value="processing">Đang xử lý</option><option value="resolved">Đã giải quyết</option></select></div>${tickets.length ? "" : '<p class="text-sm text-slate-500 mb-4">Tạo yêu cầu hỗ trợ trước để sử dụng phản hồi nhanh.</p>'}<div id="supportRows" class="space-y-4"></div></div></div>`;
    const fill = () => {
      const q = $("supportSearch").value.trim().toLowerCase(), filter = $("supportFilter").value;
      const rows = tickets.slice().reverse().filter(t => (filter === "all" || t.status === filter) && [t.name,t.email,t.code,t.issue].some(v => String(v||"").toLowerCase().includes(q)));
      $("supportRows").innerHTML = rows.map(t => `<form data-ticket="${safe(t.id)}" class="rounded-xl border border-slate-200 p-4 space-y-3"><div class="flex justify-between gap-3"><b>${safe(t.name)}</b><span class="text-xs text-slate-500">${safe(new Date(t.createdAt).toLocaleString("vi-VN"))}</span></div><p class="text-sm text-slate-500">${safe(t.email)} · ${safe(t.code || "Không có mã vé")}</p><p class="whitespace-pre-wrap text-sm">${safe(t.issue)}</p><label class="label">Ghi chú phản hồi<textarea name="reply" class="field" maxlength="2000" rows="2">${safe(t.reply || "")}</textarea></label><div class="flex flex-wrap gap-3"><select name="status" class="field flex-1" aria-label="Trạng thái hỗ trợ">${[["open","Mới tiếp nhận"],["processing","Đang xử lý"],["resolved","Đã giải quyết"]].map(([v,l])=>`<option value="${v}" ${t.status===v?"selected":""}>${l}</option>`).join("")}</select><button class="primary">Lưu phản hồi</button><button type="button" class="secondary" data-quick-ticket="${safe(t.id)}">Phản hồi nhanh</button></div></form>`).join("") || '<p class="empty">Chưa có yêu cầu phù hợp.</p>';
    };
    $("quickReply").addEventListener("click", () => openQuickReply());
    $("supportRows").addEventListener("click", e => { const b=e.target.closest("[data-quick-ticket]"); if(b)openQuickReply(b.dataset.quickTicket); });
    $("supportSearch").addEventListener("input",fill); $("supportFilter").addEventListener("change",fill); fill();
    $("supportForm").addEventListener("submit", e => {
      e.preventDefault(); const f=e.currentTarget.elements;
      if (!f.name.value.trim() || !f.issue.value.trim()) return alertMessage("Vui lòng nhập họ tên và nội dung.",true);
      const t={id:uid(),name:f.name.value.trim(),email:f.email.value.trim(),code:f.code.value.trim(),issue:f.issue.value.trim(),status:"open",reply:"",createdAt:new Date().toISOString()};
      if(persist(SUPPORT_KEY,[...read(SUPPORT_KEY,[]),t])) { renderSupport(); alertMessage("Đã tiếp nhận yêu cầu."); }
    });
    $("supportRows").addEventListener("submit", e => {
      e.preventDefault(); const f=e.target, all=read(SUPPORT_KEY,[]), i=all.findIndex(t=>t.id===f.dataset.ticket); if(i<0)return;
      all[i]={...all[i],reply:f.elements.reply.value.trim(),status:f.elements.status.value,updatedAt:new Date().toISOString()};
      if(persist(SUPPORT_KEY,all)){renderSupport();alertMessage("Đã lưu ghi chú và trạng thái. Phản hồi được lưu trong demo, không gửi email.");}
    });
  }
  function openQuickReply(ticketId) {
    if (!authenticated()) return;
    const tickets = read(SUPPORT_KEY, []);
    if (!tickets.length) { alertMessage("Hãy tạo yêu cầu hỗ trợ trước.", true); return; }
    $("quickReplyDialog")?.remove();
    const returnFocus = document.activeElement;
    const dialog = document.createElement("dialog");
    dialog.id = "quickReplyDialog";
    dialog.className = "quick-reply-dialog";
    dialog.setAttribute("aria-labelledby", "quickReplyTitle");
    dialog.innerHTML = `<form id="quickReplyForm" class="space-y-4"><div class="flex justify-between items-start gap-4"><h2 id="quickReplyTitle" class="text-xl font-bold">Phản hồi nhanh</h2><button type="button" class="secondary" id="closeQuickReply" aria-label="Đóng phản hồi nhanh">×</button></div><label class="label">Yêu cầu cần phản hồi<select name="ticket" class="field">${tickets.slice().reverse().map(t=>`<option value="${safe(t.id)}">${safe(t.name)} · ${safe(t.code || t.email)}</option>`).join("")}</select></label><p id="quickReplyIssue" class="text-sm whitespace-pre-wrap text-slate-500"></p><label class="label">Mẫu trả lời<select name="template" class="field"><option value="">Tự nhập nội dung</option><option value="received">Xác nhận tiếp nhận</option><option value="details">Yêu cầu bổ sung thông tin</option><option value="done">Xác nhận đã xử lý</option></select></label><label class="label">Nội dung phản hồi<textarea name="reply" class="field" rows="5" required maxlength="2000"></textarea></label><label class="label">Trạng thái sau phản hồi<select name="status" class="field"><option value="open">Mới tiếp nhận</option><option value="processing">Đang xử lý</option><option value="resolved">Đã giải quyết</option></select></label><p class="text-xs text-slate-500">Phản hồi được lưu trong bản demo, không gửi email.</p><p id="quickReplyError" role="alert" class="text-sm text-red-600"></p><div class="flex justify-end gap-3"><button type="button" class="secondary" id="cancelQuickReply">Hủy</button><button type="submit" class="primary">Lưu phản hồi</button></div></form>`;
    document.body.append(dialog);
    const form = $("quickReplyForm"), fields = form.elements;
    const close = () => { dialog.close(); dialog.remove(); if (returnFocus?.isConnected) returnFocus.focus(); else $("quickReply")?.focus(); };
    $("closeQuickReply").onclick = close;
    $("cancelQuickReply").onclick = close;
    dialog.addEventListener("cancel", e => { e.preventDefault(); close(); });
    const loadTicket = () => {
      const ticket = read(SUPPORT_KEY, []).find(t=>t.id===fields.ticket.value);
      if (!ticket) return;
      $("quickReplyIssue").textContent = ticket.issue;
      fields.reply.value = ticket.reply || "";
      fields.status.value = ticket.status || "open";
      fields.template.value = "";
      $("quickReplyError").textContent = "";
    };
    const selected = tickets.find(t=>t.id===ticketId) || tickets.find(t=>t.status!=="resolved") || tickets[tickets.length-1];
    fields.ticket.value = selected.id;
    loadTicket();
    fields.ticket.onchange = loadTicket;
    fields.template.onchange = () => {
      const templates = {
        received: ["TripGo đã tiếp nhận yêu cầu của bạn. Chúng tôi đang kiểm tra và sẽ cập nhật kết quả xử lý.", "processing"],
        details: ["Vui lòng bổ sung mã đặt chỗ và thông tin liên quan để TripGo hỗ trợ kiểm tra yêu cầu của bạn.", "processing"],
        done: ["Yêu cầu của bạn đã được xử lý. Vui lòng kiểm tra thông tin cập nhật và liên hệ nếu cần hỗ trợ thêm.", "resolved"],
      };
      const template = templates[fields.template.value];
      if (template) { fields.reply.value = template[0]; fields.status.value = template[1]; }
    };
    form.onsubmit = e => {
      e.preventDefault();
      if (!authenticated()) { close(); showAuth(); return; }
      const reply = fields.reply.value.trim();
      if (!reply) { $("quickReplyError").textContent = "Vui lòng nhập nội dung phản hồi."; fields.reply.focus(); return; }
      const all = read(SUPPORT_KEY, []), index = all.findIndex(t=>t.id===fields.ticket.value);
      if (index<0) { $("quickReplyError").textContent="Yêu cầu không còn tồn tại. Hãy đóng và tải lại danh sách."; return; }
      all[index] = { ...all[index], reply, status:fields.status.value, updatedAt:new Date().toISOString() };
      if (persist(SUPPORT_KEY, all)) { close(); renderSupport(); $("quickReply")?.focus(); alertMessage("Đã lưu phản hồi và trạng thái xử lý."); }
      else $("quickReplyError").textContent="Không thể lưu phản hồi. Vui lòng thử lại.";
    };
    dialog.showModal();
    fields.reply.focus();
  }
  function banActive(r) { return r.status === "active" && (!r.until || r.until >= new Date().toLocaleDateString("sv-SE")); }
  function renderBanned() {
    const records=read(BAN_KEY,[]);
    $("content").innerHTML=`<div class="grid xl:grid-cols-[1fr_2fr] gap-6"><form id="banForm" class="card p-6 space-y-4 h-fit"><h2 class="font-bold text-lg" id="banFormTitle">Thêm hồ sơ cấm bay</h2><input name="id" type="hidden"><label class="label">Họ tên<input name="name" class="field" required maxlength="80"></label><label class="label">Số giấy tờ / hộ chiếu<input name="document" class="field" required maxlength="30"></label><label class="label">Lý do<textarea name="reason" class="field" required maxlength="1000" rows="3"></textarea></label><label class="label">Ngày kết thúc (bỏ trống nếu vô thời hạn)<input name="until" type="date" class="field"></label><label class="label">Trạng thái<select name="status" class="field"><option value="active">Đang cấm</option><option value="released">Đã gỡ cấm</option></select></label><div class="flex gap-3"><button class="primary">Lưu hồ sơ</button><button id="resetBan" type="button" class="secondary">Làm mới</button></div></form><div class="card p-6"><h2 class="font-bold text-lg">Danh sách cấm bay (${records.filter(banActive).length} đang hiệu lực)</h2><p class="text-sm text-slate-500 mt-2">Dữ liệu phục vụ quản trị demo. Không tự chặn đặt vé ở trang khách hàng.</p><input id="banSearch" class="field my-5" placeholder="Tìm họ tên hoặc giấy tờ" aria-label="Tìm hồ sơ cấm bay"><div id="banRows" class="space-y-4"></div></div></div>`;
    const fill=()=> { const q=$("banSearch").value.trim().toLowerCase();
      $("banRows").innerHTML=records.filter(r=>[r.name,r.document].some(v=>v.toLowerCase().includes(q))).map(r=>`<div class="rounded-xl border border-slate-200 p-4 space-y-2"><div class="flex justify-between gap-3"><b>${safe(r.name)}</b><span class="badge ${banActive(r)?"cancel":"off"}">${banActive(r)?"Đang cấm":r.status==="released"?"Đã gỡ cấm":"Hết hạn"}</span></div><p class="text-sm">Giấy tờ: ${safe(r.document)}</p><p class="whitespace-pre-wrap text-sm text-slate-500">${safe(r.reason)}</p><p class="text-xs text-slate-500">Đến: ${safe(r.until || "Vô thời hạn")}</p><button class="action" data-ban-edit="${safe(r.id)}">Chỉnh sửa</button>${r.status==="active"?`<button class="action danger" data-ban-release="${safe(r.id)}">Gỡ cấm</button>`:""}</div>`).join("") || '<p class="empty">Chưa có hồ sơ phù hợp.</p>'; };
    fill(); $("banSearch").addEventListener("input",fill);
    $("resetBan").onclick=()=>{ $("banForm").reset(); $("banFormTitle").textContent="Thêm hồ sơ cấm bay"; };
    $("banRows").onclick=e=> { const edit=e.target.closest("[data-ban-edit]"), release=e.target.closest("[data-ban-release]");
      if(edit){const r=records.find(r=>r.id===edit.dataset.banEdit);for(const k of ["id","name","document","reason","until","status"]) $("banForm").elements[k].value=r[k]||"";$("banFormTitle").textContent="Chỉnh sửa hồ sơ";$("banForm").scrollIntoView({behavior:"smooth",block:"start"});}
      if(release && confirm("Gỡ cấm bay cho hành khách này?")){const all=read(BAN_KEY,[]).map(r=>r.id===release.dataset.banRelease?{...r,status:"released",updatedAt:new Date().toISOString()}:r);if(persist(BAN_KEY,all)){renderBanned();alertMessage("Đã gỡ cấm bay.");}}
    };
    $("banForm").onsubmit=e=>{e.preventDefault();const f=e.currentTarget.elements, all=read(BAN_KEY,[]), id=f.id.value||uid(), doc=f.document.value.trim().toUpperCase();
      if(!f.name.value.trim()||!doc||!f.reason.value.trim())return alertMessage("Vui lòng nhập đủ thông tin.",true);
      if(all.some(r=>r.id!==id && r.document.toUpperCase()===doc))return alertMessage("Giấy tờ đã có trong danh sách. Hãy chỉnh sửa hồ sơ hiện có.",true);
      const item={id,name:f.name.value.trim(),document:doc,reason:f.reason.value.trim(),until:f.until.value,status:f.status.value,updatedAt:new Date().toISOString()};
      const i=all.findIndex(r=>r.id===id); if(i<0)all.push(item);else all[i]={...all[i],...item};
      if(persist(BAN_KEY,all)){renderBanned();alertMessage("Đã lưu hồ sơ cấm bay.");}
    };
  }
  function getMonthKey(dateValue) {
    const value = dateValue || "";
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }
  function formatMonthLabel(key) {
    if (!key) return "-";
    const [year, month] = key.split("-").map(Number);
    return `${String(month).padStart(2, "0")}/${year}`;
  }
  function csvEscape(value) {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
  }
  function downloadCsv(filename, rows) {
    if (!rows.length) return;
    const csv = rows
      .map((row) => row.map((cell) => csvEscape(cell)).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }
  function exportBookingsCsv() {
    const rows = [
      [
        "Mã vé",
        "Hành khách",
        "Chuyến bay",
        "Ngày đi",
        "Tổng tiền",
        "Trạng thái",
        "Email",
      ],
      ...bookings.map((booking) => {
        const passenger =
          (booking.passengerDetails || [])
            .map((person) => person.name)
            .filter(Boolean)
            .join(", ") ||
          booking.passenger?.name ||
          "-";
        return [
          booking.bookingCode || booking.code || "-",
          passenger,
          `${booking.from || booking.flight?.from || "-"} → ${booking.to || booking.flight?.to || "-"}`,
          booking.date || booking.departureDate || "-",
          Number(booking.totalPrice ?? booking.total ?? 0),
          status(booking.status),
          booking.email || "-",
        ];
      }),
    ];
    downloadCsv("tripgo-danh-sach-ve.csv", rows);
  }
  function exportCustomersCsv() {
    const rows = [
      ["Tên", "Email", "Vai trò", "Số vé", "Tổng chi tiêu", "Ngày đăng ký"],
      ...read(KEYS.users, []).map((user) => {
        const customerBookings = bookings.filter(
          (booking) =>
            String(booking.email || "")
              .trim()
              .toLowerCase() ===
            String(user.email || "")
              .trim()
              .toLowerCase(),
        );
        return [
          user.name || "Khách hàng",
          user.email || "-",
          user.role || "customer",
          customerBookings.length,
          customerBookings.reduce(
            (sum, booking) =>
              sum + Number(booking.totalPrice ?? booking.total ?? 0),
            0,
          ),
          user.createdAt ? user.createdAt.slice(0, 10) : "-",
        ];
      }),
    ];
    downloadCsv("tripgo-khach-hang.csv", rows);
  }
  function renderReports() {
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - (5 - index));
      return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        label: `${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`,
      };
    });
    const reportRows = months.map((month) => {
      const monthBookings = bookings.filter(
        (booking) =>
          getMonthKey(
            booking.date || booking.createdAt || booking.departureDate,
          ) === month.key,
      );
      const confirmed = monthBookings.filter(
        (booking) => bookingState(booking) === "confirmed",
      );
      const cancelled = monthBookings.filter(
        (booking) => bookingState(booking) === "cancelled",
      );
      const revenue = confirmed.reduce(
        (sum, booking) =>
          sum + Number(booking.totalPrice ?? booking.total ?? 0),
        0,
      );
      return {
        ...month,
        bookings: monthBookings.length,
        revenue,
        cancelled: cancelled.length,
      };
    });
    const totalRevenue = reportRows.reduce(
      (sum, month) => sum + month.revenue,
      0,
    );
    const totalBookings = reportRows.reduce(
      (sum, month) => sum + month.bookings,
      0,
    );
    const avgOrder = totalBookings ? totalRevenue / totalBookings : 0;
    $("content").innerHTML = `
      <div class="card p-4 sm:p-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="font-bold">Báo cáo theo tháng</h2>
          <button id="exportMonthlyReport" class="secondary">Xuất CSV</button>
        </div>
        <div class="stats-grid mt-5">
          <div class="card stat-card"><div class="stat-icon">▤</div><p class="stat-label">Tổng vé</p><p class="stat-value">${totalBookings}</p></div>
          <div class="card stat-card"><div class="stat-icon">₫</div><p class="stat-label">Doanh thu</p><p class="stat-value">${money(totalRevenue)}</p></div>
          <div class="card stat-card"><div class="stat-icon">↩</div><p class="stat-label">Giá trị trung bình / vé</p><p class="stat-value">${money(avgOrder)}</p></div>
        </div>
        <div class="table-scroll mt-6">
          <table class="data-table">
            <thead><tr><th>Tháng</th><th>Vé đặt</th><th>Doanh thu</th><th>Đã hủy</th></tr></thead>
            <tbody>
              ${reportRows
                .map(
                  (month) =>
                    `<tr><td>${safe(month.label)}</td><td><span class="badge off">${month.bookings}</span></td><td>${money(month.revenue)}</td><td>${month.cancelled}</td></tr>`,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
    $("exportMonthlyReport").addEventListener("click", () => {
      downloadCsv("tripgo-bao-cao-theo-thang.csv", [
        ["Tháng", "Vé đặt", "Doanh thu", "Đã hủy"],
        ...reportRows.map((month) => [
          month.label,
          month.bookings,
          month.revenue,
          month.cancelled,
        ]),
      ]);
    });
  }
  function renderCustomers() {
    const users = read(KEYS.users, []);
    const selectedUser =
      selectedCustomerEmail &&
      users.find(
        (user) =>
          String(user.email || "").toLowerCase() ===
          String(selectedCustomerEmail).toLowerCase(),
      );
    const customerBookings = selectedUser
      ? bookings.filter(
          (booking) =>
            String(booking.email || "")
              .trim()
              .toLowerCase() ===
            String(selectedUser.email || "")
              .trim()
              .toLowerCase(),
        )
      : [];
    const detailSpend = customerBookings.reduce(
      (sum, booking) => sum + Number(booking.totalPrice ?? booking.total ?? 0),
      0,
    );
    $("content").innerHTML = `
      <div class="card p-4 sm:p-5 mb-6">
        ${
          selectedUser
            ? `
          <div class="customer-detail-card">
            <div>
              <p class="text-xs uppercase tracking-widest text-amber-600 font-bold">Khách hàng chi tiết</p>
              <h2 class="font-bold text-xl mt-2">${safe(selectedUser.name || "Khách hàng")}</h2>
            </div>
            <div class="mt-4 grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div class="mini-stat"><span>Email</span><strong>${safe(selectedUser.email || "-")}</strong></div>
              <div class="mini-stat"><span>Số vé</span><strong>${customerBookings.length}</strong></div>
              <div class="mini-stat"><span>Tổng chi tiêu</span><strong>${money(detailSpend)}</strong></div>
              <div class="mini-stat"><span>Vai trò</span><strong>${safe((selectedUser.role || "customer") === "admin" ? "Quản trị" : "Khách hàng")}</strong></div>
            </div>
            <div class="mt-5">
              <h3 class="font-bold mb-3">Lịch sử đặt vé</h3>
              ${
                customerBookings.length
                  ? `<div class="space-y-3">${customerBookings
                      .slice()
                      .reverse()
                      .slice(0, 5)
                      .map(
                        (booking) =>
                          `<div class="border-b pb-2 text-sm flex flex-wrap justify-between gap-2"><span>Vé <b>${safe(booking.bookingCode || booking.code || "-")}</b> · ${safe(booking.from || booking.flight?.from || "-")} → ${safe(booking.to || booking.flight?.to || "-")}</span><span>${money(booking.totalPrice ?? booking.total)}</span></div>`,
                      )
                      .join("")}</div>`
                  : '<p class="text-slate-500 mt-2">Khách hàng chưa có vé nào.</p>'
              }
            </div>
          </div>
        `
            : '<p class="text-slate-500">Chọn một khách hàng để xem thông tin chi tiết.</p>'
        }
      </div>
      <div class="card"><div class="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3"><h2 class="font-bold">Khách hàng đã đăng ký <span class="text-slate-400 font-normal">(${users.length})</span></h2><div class="booking-filters"><input id="customerSearch" class="field" aria-label="Tìm khách hàng" placeholder="Tìm tên hoặc email"><select id="customerRole" class="field" aria-label="Lọc khách hàng theo vai trò"><option value="all">Tất cả</option><option value="customer">Khách hàng</option><option value="admin">Quản trị</option></select><button id="exportCustomersCsv" class="secondary">Xuất CSV</button></div></div><div class="table-scroll"><table class="data-table"><thead><tr><th>Khách hàng</th><th>Email</th><th>Số vé</th><th>Tổng chi tiêu</th><th>Đăng ký</th><th>Thao tác</th></tr></thead><tbody id="customerRows"></tbody></table></div></div>`;
    $("customerSearch").addEventListener("input", fillCustomers);
    $("customerRole").addEventListener("change", fillCustomers);
    $("exportCustomersCsv").addEventListener("click", exportCustomersCsv);
    fillCustomers();
  }
  function fillCustomers() {
    const users = read(KEYS.users, []);
    const query = ($("customerSearch").value || "").trim().toLowerCase();
    const selectedRole = $("customerRole").value;
    const rows = users.filter((user) => {
      const role = String(user.role || "customer").toLowerCase();
      const text = `${user.name || ""} ${user.email || ""}`.toLowerCase();
      return (
        (selectedRole === "all" || role === selectedRole) &&
        (!query || text.includes(query))
      );
    });
    $("customerRows").innerHTML = rows.length
      ? rows
          .map((user) => {
            const customerBookings = bookings.filter(
              (booking) =>
                String(booking.email || "")
                  .trim()
                  .toLowerCase() ===
                String(user.email || "")
                  .trim()
                  .toLowerCase(),
            );
            const totalSpend = customerBookings.reduce(
              (sum, booking) =>
                sum + Number(booking.totalPrice ?? booking.total ?? 0),
              0,
            );
            const createdAt = user.createdAt || user.created_at || "";
            const selected =
              String(user.email || "").toLowerCase() ===
              String(selectedCustomerEmail || "").toLowerCase();
            return `<tr class="${selected ? "selected-row" : ""}"><td><b>${safe(user.name || "Khách hàng")}</b><br><span class="text-slate-500">${safe((user.role || "customer") === "admin" ? "Quản trị" : "Khách hàng")}</span></td><td>${safe(user.email || "-")}</td><td><span class="badge off">${customerBookings.length}</span></td><td>${money(totalSpend)}</td><td>${createdAt ? date(createdAt.slice(0, 10)) : "-"}</td><td><button class="action" data-action="customer-detail" data-id="${safe(String(user.email || user.id || ""))}">Chi tiết</button></td></tr>`;
          })
          .join("")
      : '<tr><td colspan="6" class="empty">Không tìm thấy khách hàng phù hợp.</td></tr>';
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
              `<tr><td><b>${safe(f.id)}</b><br><span class="text-slate-500">${safe(f.airline)}</span></td><td>${safe(AIRPORTS[f.from] || f.from)} → ${safe(AIRPORTS[f.to] || f.to)}</td><td>${date(f.date)}<br><span class="text-slate-500">${safe(f.departure)} – ${safe(f.arrival)}</span></td><td>${money(f.price)}</td><td><span class="badge ${flightStatusClass(f.status)}">${flightStatusLabel(f.status)}</span></td><td><button class="action" data-action="edit" data-id="${safe(f.id)}">Sửa</button></td></tr>`,
          )
          .join("")
      : '<tr><td colspan="5" class="empty">Không tìm thấy chuyến bay nào.</td></tr>';
  }
  function renderBookings() {
    bookingLimit = 10;
    const rows = bookings.slice().reverse();
    $("content").innerHTML =
      `<div class="card"><div class="booking-tools"><h2 class="font-bold">Danh sách vé đã đặt <span id="bookingCount" class="text-slate-400 font-normal">(${rows.length})</span></h2><div class="booking-filters"><input id="bookingSearch" class="field" aria-label="Tìm vé đã đặt" placeholder="Tìm mã vé, hành khách, chuyến bay"><select id="bookingStatus" class="field" aria-label="Lọc theo trạng thái"><option value="all">Tất cả trạng thái</option><option value="confirmed">Đã xác nhận</option><option value="pending">Chờ thanh toán</option><option value="cancelled">Đã hủy</option></select><button id="exportBookingsCsv" class="secondary">Xuất CSV</button></div></div><div class="table-scroll"><table class="data-table"><thead><tr><th>Mã vé</th><th>Hành khách</th><th>Chuyến bay</th><th>Ngày đi</th><th>Tổng tiền</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody id="bookingRows"></tbody></table></div><div class="p-4 flex items-center justify-between gap-3"><span id="bookingProgress" class="text-sm text-slate-500"></span><button id="moreBookings" class="secondary hidden">Xem thêm 10 vé</button></div></div>`;
    $("bookingSearch").addEventListener("input", () => { bookingLimit = 10; fillBookings(); });
    $("bookingStatus").addEventListener("change", () => { bookingLimit = 10; fillBookings(); });
    $("moreBookings").addEventListener("click", () => { bookingLimit += 10; fillBookings(); });
    $("exportBookingsCsv").addEventListener("click", exportBookingsCsv);
    fillBookings();
  }
  function fillBookings() {
    const query = ($("bookingSearch").value || "").trim().toLowerCase();
    const selectedStatus = $("bookingStatus").value;
    const matches = bookings
      .slice()
      .reverse()
      .filter((booking) => {
        const names = (booking.passengerDetails || [])
          .map((person) => person.name)
          .join(" ");
        const searchable = [
          booking.bookingCode,
          booking.code,
          booking.flightId,
          booking.airline,
          booking.from,
          booking.to,
          names,
          booking.passenger?.name,
          booking.flight?.from,
          booking.flight?.to,
        ];
        return (
          (selectedStatus === "all" ||
            bookingState(booking) === selectedStatus) &&
          searchable.some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(query),
          )
        );
      });
    $("bookingCount").textContent = `(${matches.length}/${bookings.length})`;
    $("bookingProgress").textContent = `Hiển thị ${Math.min(bookingLimit, matches.length)} / ${matches.length} vé`;
    $("moreBookings").classList.toggle("hidden", matches.length <= bookingLimit);
    $("bookingRows").innerHTML = matches.length
      ? matches.slice(0, bookingLimit)
          .map((booking) => {
            const bookingStatus = bookingState(booking);
            const code = booking.bookingCode || booking.code;
            const passenger =
              (booking.passengerDetails || [])
                .map((person) => person.name)
                .filter(Boolean)
                .join(", ") ||
              booking.passenger?.name ||
              "-";
            return `<tr><td><b>${safe(code || "-")}</b></td><td>${safe(passenger)}</td><td>${safe(booking.from || booking.flight?.from || "-")} → ${safe(booking.to || booking.flight?.to || "-")}</td><td>${date(booking.date || booking.departureDate)}</td><td>${money(booking.totalPrice ?? booking.total)}</td><td><span class="badge ${bookingStatus === "cancelled" ? "cancel" : bookingStatus === "pending" ? "off" : ""}">${status(booking.status)}</span></td><td>${bookingStatus === "cancelled" ? "-" : `<button class="action danger" data-action="cancel" data-id="${safe(code)}">Hủy vé</button>`}</td></tr>`;
          })
          .join("")
      : '<tr><td colspan="7" class="empty">Không tìm thấy vé phù hợp.</td></tr>';
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
      "seats",
      "status",
    ])
      form.elements[key].value =
        f?.[key] ??
        {
          date: localToday(),
          baggage: 7,
          seats: 100,
          status: "active",
        }[key] ??
        "";
    form.elements.date.min = localToday();
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
      seats: Number(f.seats.value),
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
    else if (!validDate(data.date) || !data.departure || !data.arrival)
      error = "Vui lòng nhập đủ ngày và giờ bay.";
    else if (data.date < localToday())
      error = "Ngày bay không được ở trong quá khứ.";
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
      !Number.isInteger(data.seats) ||
      data.seats < 0 ||
      data.seats > 500
    )
      error = "Số chỗ phải là số nguyên từ 0 đến 500.";
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
    if (action === "edit-service" || action === "toggle-service") {
      const services = getServiceCatalog();
      const service = services.find((item) => item.id === id);
      if (!service) return;
      if (action === "edit-service") {
        openServiceModal(service);
        return;
      }
      try {
        saveServiceCatalog(
          services.map((item) =>
            item.id === id
              ? { ...item, enabled: item.enabled === false }
              : item,
          ),
        );
      } catch (error) {
        alertMessage("Không thể cập nhật trạng thái dịch vụ.", true);
        console.error("Could not toggle service visibility", error);
        return;
      }
      renderServices();
      alertMessage(
        service.enabled === false
          ? "Dịch vụ đã được hiển thị trên trang bán vé."
          : "Dịch vụ đã được ẩn khỏi trang bán vé.",
      );
      return;
    }
    if (action === "edit") {
      const f = flights.find((x) => x.id === id);
      if (f) openModal(f);
    }
    if (action === "cancel") {
      if (!confirm(`Hủy vé ${id}?`)) return;
      const index = bookings.findIndex((x) => (x.bookingCode || x.code) === id);
      if (index < 0) return;
      bookings[index] = {
        ...bookings[index],
        status: "cancelled",
        cancelledAt: new Date().toISOString(),
      };
      write(KEYS.bookings, bookings);
      const flightIndex = flights.findIndex(
        (f) => f.id === bookings[index].flightId,
      );
      if (
        flightIndex >= 0 &&
        Number.isFinite(Number(flights[flightIndex].seats))
      ) {
        flights[flightIndex].seats =
          Number(flights[flightIndex].seats) +
          Number(bookings[index].passengers || 1);
        saveFlights();
      }
      render();
      alertMessage("Đã hủy vé.");
    }
    if (action === "customer-detail") {
      const user = read(KEYS.users, []).find(
        (item) =>
          String(item.email || "").toLowerCase() === String(id).toLowerCase() ||
          String(item.id || "").toLowerCase() === String(id).toLowerCase(),
      );
      if (!user) return;
      selectedCustomerEmail = user.email || user.id || null;
      renderCustomers();
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
  setTheme(localStorage.getItem(THEME_KEY) || "light");
  $("themeToggle").addEventListener("click", () => {
    const theme = document.body.classList.contains("admin-dark")
      ? "light"
      : "dark";
    localStorage.setItem(THEME_KEY, theme);
    setTheme(theme);
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
    if (
      event.key === "Escape" &&
      !$("serviceModal").classList.contains("hidden")
    )
      closeServiceModal();
  });
  $("flightForm").addEventListener("submit", saveFlight);
  $("serviceForm").addEventListener("submit", saveService);
  $("closeServiceModal").addEventListener("click", closeServiceModal);
  $("cancelServiceModal").addEventListener("click", closeServiceModal);
  $("serviceModal").addEventListener("click", (event) => {
    if (event.target === $("serviceModal")) closeServiceModal();
  });
  $("content").addEventListener("click", handleAction);
  $("content").addEventListener("click", e => { const b=e.target.closest("[data-go]"); if(b){page=b.dataset.go;render();} });
  window.addEventListener("storage", (event) => {
    if (event.key === SERVICE_KEY && page === "services") renderServices();
    if (event.key === SUPPORT_KEY && page === "support") render();
    if (event.key === BAN_KEY && page === "banned") render();
    if (event.key === THEME_KEY) setTheme(localStorage.getItem(THEME_KEY) || "light");
    if (Object.values(KEYS).includes(event.key)) showAuth();
  });
  ensureAdmin();
  showAuth();
})();
