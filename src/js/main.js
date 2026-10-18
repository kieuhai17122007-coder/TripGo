import "./auth.js";

document.addEventListener("DOMContentLoaded", function () {
  const departureInput = document.getElementById("departure");
  const returnInput = document.getElementById("returnDate");
  const homeSearchForm = document.getElementById("homeSearchForm");
  const fromInput = document.getElementById("from");
  const toInput = document.getElementById("to");
  const tripTypeInputs = document.querySelectorAll('input[name="tripType"]');
  const returnField = returnInput?.closest(".return-field");
  const errorBox = document.getElementById("searchError");

  const getToday = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const updateDateLimits = () => {
    const today = getToday();
    if (!departureInput || !returnInput) return;
    departureInput.min = today;
    if (!departureInput.value || departureInput.value < today) {
      departureInput.value = today;
    }

    returnInput.min = departureInput.value;
  };

  const selectedTripType = () =>
    document.querySelector('input[name="tripType"]:checked')?.value || "oneway";

  const updateTripType = () => {
    const roundTrip = selectedTripType() === "roundtrip";
    if (returnField) returnField.hidden = !roundTrip;
    if (returnInput) {
      returnInput.required = roundTrip;
      updateDateLimits();
    }
  };

  if (departureInput && returnInput) {
    updateDateLimits();
    tripTypeInputs.forEach((input) =>
      input.addEventListener("change", updateTripType),
    );
    updateTripType();
    departureInput.addEventListener("change", () => {
      updateDateLimits();
      clearFieldError("departure");
      if (returnInput.value && returnInput.value < departureInput.value) {
        setFieldError("returnDate", "Ngày về phải bằng hoặc sau ngày đi.");
      }
    });
    returnInput.addEventListener("change", () => {
      if (returnInput.value && returnInput.value < departureInput.value) {
        setFieldError("returnDate", "Ngày về phải bằng hoặc sau ngày đi.");
      } else {
        clearFieldError("returnDate");
      }
    });
  }

  function setFieldError(id, message) {
    const input = document.getElementById(id);
    const fieldError = document.getElementById(`${id}Error`);
    if (fieldError) fieldError.textContent = message;
    input?.setAttribute("aria-invalid", "true");
  }

  function clearFieldError(id) {
    const input = document.getElementById(id);
    const fieldError = document.getElementById(`${id}Error`);
    if (fieldError) fieldError.textContent = "";
    input?.removeAttribute("aria-invalid");
  }

  function clearSearchErrors() {
    ["from", "to", "departure", "returnDate", "passengers"].forEach(
      clearFieldError,
    );
    if (errorBox) errorBox.textContent = "";
  }

  const serviceGrid = document.querySelector(".service-grid");
  const renderServices = () => {
    if (!serviceGrid) return;

    let storedServices;
    try {
      storedServices = localStorage.getItem("tripgo_services");
    } catch (error) {
      console.error("Could not access the TripGo service catalog", error);
      return;
    }
    if (storedServices === null) return;

    let services;
    try {
      services = JSON.parse(storedServices);
    } catch (error) {
      console.error("Could not read the TripGo service catalog", error);
      return;
    }

    if (!Array.isArray(services)) {
      console.error("The TripGo service catalog must be an array.");
      return;
    }

    const links = {
      "#search": "/src/pages/search.html",
      "#booking-search": "/src/pages/booking.html",
      "#support": "/src/pages/checkin.html",
    };
    const icons = {
      "fa-plane": "✈️",
      "fa-ticket": "📋",
      "fa-qrcode": "✓",
      "fa-chair": "💺",
      "fa-suitcase-rolling": "🧳",
      "fa-headset": "🎧",
      "fa-bolt": "⚡",
      "fa-circle-info": "ℹ️",
    };
    const fragment = document.createDocumentFragment();

    services
      .filter((service) => service && service.enabled !== false)
      .forEach((service) => {
        const card = document.createElement("a");
        card.className = "service-card";
        card.href = links[service.href] || "/src/pages/search.html";

        const icon = document.createElement("span");
        icon.textContent = icons[service.icon] || "✈️";
        const title = document.createElement("h3");
        title.textContent = service.title || "Dịch vụ TripGo";
        const description = document.createElement("p");
        description.textContent = service.description || "";

        card.append(icon, title, description);
        fragment.append(card);
      });

    serviceGrid.replaceChildren(fragment);
  };

  renderServices();
  window.addEventListener("storage", (event) => {
    if (event.key === "tripgo_services") renderServices();
  });

  document.getElementById("swapBtn")?.addEventListener("click", () => {
    if (!fromInput || !toInput) return;
    const from = fromInput.value;
    fromInput.value = toInput.value;
    toInput.value = from;
    clearFieldError("from");
    clearFieldError("to");
  });

  homeSearchForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    clearSearchErrors();

    const from = fromInput.value;
    const to = toInput.value;
    const departure = departureInput.value;
    const returnDate = returnInput.value;
    const passengers = Number(document.getElementById("passengers").value);
    const tripType = selectedTripType();
    let firstInvalidField = null;

    const invalid = (id, message) => {
      setFieldError(id, message);
      firstInvalidField ||= document.getElementById(id);
    };

    if (!from) invalid("from", "Chọn điểm khởi hành.");
    if (!to) invalid("to", "Chọn điểm đến.");
    if (from && to && from === to) invalid("to", "Điểm đến phải khác điểm đi.");
    if (!departure) invalid("departure", "Chọn ngày khởi hành.");
    else if (departure < getToday())
      invalid("departure", "Ngày khởi hành không được ở trong quá khứ.");
    if (tripType === "roundtrip") {
      if (!returnDate) invalid("returnDate", "Chọn ngày về.");
      else if (returnDate < getToday())
        invalid("returnDate", "Ngày về không được ở trong quá khứ.");
      else if (departure && returnDate < departure)
        invalid("returnDate", "Ngày về phải bằng hoặc sau ngày đi.");
    }
    if (!Number.isInteger(passengers) || passengers < 1 || passengers > 9) {
      invalid("passengers", "Số hành khách phải từ 1 đến 9.");
    }

    if (firstInvalidField) {
      if (errorBox)
        errorBox.textContent = "Vui lòng kiểm tra lại thông tin tìm kiếm.";
      firstInvalidField.focus();
      return;
    }

    const params = new URLSearchParams({
      from,
      to,
      departure,
      returnDate: tripType === "roundtrip" ? returnDate : "",
      passengers: String(passengers),
      ticketClass: document.getElementById("classType").value,
      tripType,
    });
    const searchUrl = `/src/pages/search.html?${params}`;
    if (!window.TripGoAuth.isLoggedIn()) {
      window.location.href = `/src/pages/login.html?returnUrl=${encodeURIComponent(searchUrl)}`;
      return;
    }
    window.location.href = searchUrl;
  });

  const searchForm = document.getElementById("searchForm");

  if (!searchForm) {
    return;
  }

  const passengersInput = document.getElementById("passengers");

  searchForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const from = fromInput.value.trim();
    const to = toInput.value.trim();
    const departure = departureInput.value;
    const returnDate = returnInput ? returnInput.value : "";

    const passengers = Number(passengersInput.value);

    if (!from || !to || !departure || !passengersInput.value) {
      alert("Vui lòng nhập đầy đủ thông tin tìm kiếm!");
      return;
    }

    if (from === to) {
      alert("Điểm đi và điểm đến không được trùng nhau!");
      return;
    }

    if (!Number.isInteger(passengers) || passengers < 1 || passengers > 9) {
      alert("Số hành khách phải từ 1 đến 9!");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const departureDate = new Date(departure + "T00:00:00");

    if (departureDate < today) {
      alert("Ngày đi không được ở trong quá khứ!");
      return;
    }

    if (returnDate) {
      const returnDateValue = new Date(returnDate + "T00:00:00");

      if (returnDateValue < departureDate) {
        alert("Ngày về phải bằng hoặc sau ngày đi!");
        return;
      }
    }
    const searchData = {
      from: from,
      to: to,
      departure: departure,
      returnDate: returnDate,
      passengers: passengers,
    };

    try {
      localStorage.setItem("tripgo_search", JSON.stringify(searchData));
    } catch (error) {
      alert("Không thể lưu thông tin tìm kiếm!");
      return;
    }
    window.location.href = "search.html";
  });
});
