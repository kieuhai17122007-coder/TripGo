const USERS_KEY = "tripgo_users";
const CURRENT_USER_KEY = "tripgo_current_user";
const BOOKINGS_KEY = "tripgo_bookings";

function readJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function getUsers() {
  const users = readJson(USERS_KEY, []);
  return Array.isArray(users) ? users : [];
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getCurrentUser() {
  return readJson(CURRENT_USER_KEY, null);
}

function isLoggedIn() {
  return !!getCurrentUser();
}

function isAdmin() {
  return getCurrentUser()?.role === "admin";
}

function getBookings() {
  const bookings = readJson(BOOKINGS_KEY, []);
  if (Array.isArray(bookings)) return bookings;

  const oldBooking = readJson("tripgo_booking", null);
  return oldBooking ? [oldBooking] : [];
}

function saveBookings(bookings) {
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
  if (bookings.length) {
    localStorage.setItem(
      "tripgo_booking",
      JSON.stringify(bookings[bookings.length - 1]),
    );
  }
}

function seedAdmin() {
  const users = getUsers();
  const adminEmail = "admin@tripgo.vn";
  if (!users.some((user) => user.email === adminEmail)) {
    users.push({
      id: "ADMIN001",
      name: "TripGo Admin",
      email: adminEmail,
      phone: "0900000000",
      password: "admin123",
      role: "admin",
      createdAt: new Date().toISOString(),
    });
    saveUsers(users);
  }
}

function requireLogin(returnUrl = location.pathname + location.search) {
  if (isLoggedIn()) return true;
  const target = returnUrl || "/";
  location.replace(
    `/src/pages/login.html?returnUrl=${encodeURIComponent(target)}`,
  );
  return false;
}

function requireAdmin() {
  if (isAdmin()) return true;
  if (!isLoggedIn()) {
    location.replace("/src/pages/login.html?returnUrl=/admin/");
    return false;
  }
  location.replace("/");
  return false;
}

function logout() {
  localStorage.removeItem(CURRENT_USER_KEY);
  localStorage.removeItem("tripgo_session");
  location.replace("/");
}

fu;
function updateAuthUI() {
  const user = getCurrentUser();
  const currentPath = location.pathname;
  const currentHash = location.hash;

  document.querySelectorAll("[data-nav]").forEach((link) => {
    const key = link.dataset.nav;
    let active = false;

    if (key === "home") {
      active = currentPath === "/" && !currentHash;
    }
    if (key === "flights") {
      active = currentPath.endsWith("/search.html");
    }
    if (key === "services") {
      active = currentPath === "/" && currentHash === "#services";
    }
    if (key === "booking") {
      active = currentPath.endsWith("/booking.html");
    }
    if (key === "checkin") {
      active = currentPath.endsWith("/checkin.html");
    }

    link.classList.toggle("active", active);
  });

  document.querySelectorAll("[data-auth-link]").forEach((link) => {
    const existingMenu = link.closest(".account-menu");

    if (!user) {
      if (existingMenu) {
        const loginLink = document.createElement("a");
        loginLink.dataset.authLink = "";
        loginLink.href = "/src/pages/login.html";
        loginLink.textContent = "Đăng nhập";
        existingMenu.replaceWith(loginLink);
      } else {
        link.textContent = "Đăng nhập";
        link.href = "/src/pages/login.html";
      }
      return;
    }

    if (existingMenu) {
      const name = existingMenu.querySelector(".account-name");
      const avatar = existingMenu.querySelector(".account-avatar");
      const adminLink = existingMenu.querySelector(".account-admin-link");
      const historyLink = existingMenu.querySelector(".account-history-link");

      if (name) {
        name.textContent =
          user.role === "admin" ? "Quản trị" : user.name || "Tài khoản";
      }

      if (avatar) {
        avatar.textContent = String(user.name || "U")
          .charAt(0)
          .toUpperCase();
      }

      if (adminLink) adminLink.hidden = user.role !== "admin";
      if (historyLink) historyLink.hidden = user.role === "admin";

      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "account-menu";

    const trigger = document.createElement("button");
    trigger.className = "account-trigger";
    trigger.type = "button";
    trigger.setAttribute("aria-expanded", "false");

    const avatar = document.createElement("span");
    avatar.className = "account-avatar";
    avatar.textContent = String(user.name || "U")
      .charAt(0)
      .toUpperCase();

    const name = document.createElement("span");
    name.className = "account-name";
    name.textContent =
      user.role === "admin" ? "Quản trị" : user.name || "Tài khoản";

    const chevron = document.createElement("span");
    chevron.className = "account-chevron";
    chevron.setAttribute("aria-hidden", "true");

    trigger.append(avatar, name, chevron);

    const dropdown = document.createElement("div");
    dropdown.className = "account-dropdown";

    const adminLink = document.createElement("a");
    adminLink.className = "account-admin-link";
    adminLink.href = "/admin/";
    adminLink.textContent = "⚙ Quản trị";
    adminLink.hidden = user.role !== "admin";

    const historyLink = document.createElement("a");
    historyLink.className = "account-history-link";
    historyLink.href = "/src/pages/history.html";
    historyLink.textContent = "✈ Lịch sử đặt vé";
    historyLink.hidden = user.role === "admin";

    const bookingLink = document.createElement("a");
    bookingLink.href = "/src/pages/booking.html";
    bookingLink.textContent = "⌕ Tra cứu đặt chỗ";

    const logoutButton = document.createElement("button");
    logoutButton.type = "button";
    logoutButton.dataset.logout = "";
    logoutButton.textContent = "↪ Đăng xuất";
    logoutButton.addEventListener("click", logout);

    dropdown.append(adminLink, historyLink, bookingLink, logoutButton);
    wrapper.append(trigger, dropdown);

    trigger.addEventListener("click", (event) => {
      event.stopPropagation();

      document.querySelectorAll(".account-menu.open").forEach((menu) => {
        if (menu !== wrapper) {
          menu.classList.remove("open");
          menu
            .querySelector(".account-trigger")
            ?.setAttribute("aria-expanded", "false");
        }
      });

      const isOpen = wrapper.classList.toggle("open");
      trigger.setAttribute("aria-expanded", String(isOpen));
    });

    link.replaceWith(wrapper);
  });
}

seedAdmin();

window.TripGoAuth = {
  getUsers,
  saveUsers,
  getCurrentUser,
  getBookings,
  saveBookings,
  isLoggedIn,
  isAdmin,
  requireLogin,
  requireAdmin,
  logout,
  updateAuthUI,
  USERS_KEY,
  CURRENT_USER_KEY,
  BOOKINGS_KEY,
};

export {
  getUsers,
  saveUsers,
  getCurrentUser,
  getBookings,
  saveBookings,
  isLoggedIn,
  isAdmin,
  requireLogin,
  requireAdmin,
  logout,
  updateAuthUI,
};
