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
    if (page === "overview") renderOverview();
    if (page === "flights") renderFlights();
    if (page === "bookings") renderBookings();
    if (page === "customers") renderCustomers();
    if (page === "reports") renderReports();
    if (page === "services") renderServices();
    if (page === "support") renderSupport();
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
  function renderSupport() {
    const tickets = [
      {
        name: "Nguyễn Thị Lan",
        issue: "Mất vé đã đặt",
        status: "Đang xử lý",
        time: "5 phút trước",
      },
      {
        name: "Trần Minh Hoàng",
        issue: "Yêu cầu đổi lịch bay",
        status: "Chờ xác nhận",
        time: "18 phút trước",
      },
      {
        name: "Phạm Hồng Anh",
        issue: "Thắc mắc về hành lý",
        status: "Đã trả lời",
        time: "1 giờ trước",
      },
    ];
    $("content").innerHTML = `
      <div class="grid xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <div class="card p-6">
          <div class="flex items-center justify-between gap-3 flex-wrap">
            <h2 class="font-bold text-lg">Yêu cầu hỗ trợ mới</h2>
            <span class="chip chip-orange"><i class="fa-solid fa-bell mr-1"></i>3 tin nhắn</span>
          </div>
          <div class="mt-5 space-y-3">
            ${tickets
              .map(
                (ticket) => `
                  <div class="support-item">
                    <div>
                      <p class="font-semibold">${safe(ticket.name)}</p>
                      <p class="text-sm text-slate-500">${safe(ticket.issue)}</p>
                    </div>
                    <div class="text-right">
                      <span class="chip ${ticket.status === "Đã trả lời" ? "chip-green" : ticket.status === "Đang xử lý" ? "chip-blue" : "chip-orange"}">${ticket.status}</span>
                      <p class="text-xs text-slate-400 mt-2">${ticket.time}</p>
                    </div>
                  </div>
                `,
              )
              .join("")}
          </div>
        </div>
        <div class="card p-6">
          <h2 class="font-bold text-lg">Tổng hợp CSKH</h2>
          <div class="mt-5 space-y-4">
            <div class="mini-stat"><span>Chăm sóc hôm nay</span><strong>28 cuộc</strong></div>
            <div class="mini-stat"><span>Thời gian phản hồi</span><strong>12 phút</strong></div>
            <div class="mini-stat"><span>Tỷ lệ hài lòng</span><strong>94%</strong></div>
          </div>
          <button class="primary w-full mt-5"><i class="fa-solid fa-message mr-2"></i>Phản hồi nhanh</button>
        </div>
      </div>
    `;
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
    const rows = bookings.slice().reverse();
    $("content").innerHTML =
      `<div class="card"><div class="booking-tools"><h2 class="font-bold">Danh sách vé đã đặt <span id="bookingCount" class="text-slate-400 font-normal">(${rows.length})</span></h2><div class="booking-filters"><input id="bookingSearch" class="field" aria-label="Tìm vé đã đặt" placeholder="Tìm mã vé, hành khách, chuyến bay"><select id="bookingStatus" class="field" aria-label="Lọc theo trạng thái"><option value="all">Tất cả trạng thái</option><option value="confirmed">Đã xác nhận</option><option value="pending">Chờ thanh toán</option><option value="cancelled">Đã hủy</option></select><button id="exportBookingsCsv" class="secondary">Xuất CSV</button></div></div><div class="table-scroll"><table class="data-table"><thead><tr><th>Mã vé</th><th>Hành khách</th><th>Chuyến bay</th><th>Ngày đi</th><th>Tổng tiền</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody id="bookingRows"></tbody></table></div></div>`;
    $("bookingSearch").addEventListener("input", fillBookings);
    $("bookingStatus").addEventListener("change", fillBookings);
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
    $("bookingRows").innerHTML = matches.length
      ? matches
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
  window.addEventListener("storage", (event) => {
    if (event.key === SERVICE_KEY && page === "services") renderServices();
    if (Object.values(KEYS).includes(event.key)) showAuth();
  });
  ensureAdmin();
  showAuth();
})();
