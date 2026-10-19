
document.addEventListener("DOMContentLoaded", function () {
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
            "#support": "/src/pages/checkin.html"
        };
        const icons = {
            "fa-plane": "✈️",
            "fa-ticket": "📋",
            "fa-qrcode": "✓",
            "fa-chair": "💺",
            "fa-suitcase-rolling": "🧳",
            "fa-headset": "🎧",
            "fa-bolt": "⚡",
            "fa-circle-info": "ℹ️"
        };
        const fragment = document.createDocumentFragment();

        services.filter(service => service && service.enabled !== false).forEach(service => {
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
    window.addEventListener("storage", event => {
        if (event.key === "tripgo_services") renderServices();
    });

    const homepageSearchButton = document.getElementById("searchBtn");
    if (homepageSearchButton) {
        homepageSearchButton.addEventListener("click", () => {
            const from = document.getElementById("from").value;
            const to = document.getElementById("to").value;
            const departure = document.getElementById("departure").value;
            const returnDate = document.getElementById("returnDate").value;
            const passengers = Number(document.getElementById("passengers").value);
            const tripType = document.querySelector(
                'input[name="tripType"]:checked'
            )?.value || "oneway";

            if (!from || !to || !departure) {
                alert("Vui lòng nhập đầy đủ thông tin chuyến bay.");
                return;
            }
            if (from === to) {
                alert("Điểm đi và điểm đến không được trùng nhau.");
                return;
            }
            if (tripType === "roundtrip" && !returnDate) {
                alert("Vui lòng chọn ngày về.");
                return;
            }
            if (returnDate && returnDate < departure) {
                alert("Ngày về phải bằng hoặc sau ngày đi.");
                return;
            }
            if (!Number.isInteger(passengers) || passengers < 1 || passengers > 9) {
                alert("Số hành khách phải từ 1 đến 9.");
                return;
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (new Date(`${departure}T00:00:00`) < today) {
                alert("Ngày đi không được ở trong quá khứ.");
                return;
            }

            const params = new URLSearchParams({
                from,
                to,
                departure,
                returnDate,
                passengers: String(passengers),
                ticketClass: document.getElementById("classType").value === "Thương gia"
                    ? "business"
                    : "economy",
                tripType
            });
            window.location.href = `/src/pages/search.html?${params}`;
        });
    }

    const searchForm = document.getElementById("searchForm");

    if (!searchForm) {
        return;
    }

    const fromInput = document.getElementById("from");
    const toInput = document.getElementById("to");
    const departureInput = document.getElementById("departure");
    const returnInput = document.getElementById("returnDate");
    const passengersInput = document.getElementById("passengers");

    searchForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const from = fromInput.value.trim();
        const to = toInput.value.trim();
        const departure = departureInput.value;
        const returnDate = returnInput
            ? returnInput.value
            : "";

        const passengers = Number(passengersInput.value);

        if (!from || !to || !departure || !passengersInput.value) {
            alert("Vui lòng nhập đầy đủ thông tin tìm kiếm!");
            return;
        }

        if (from === to) {
            alert("Điểm đi và điểm đến không được trùng nhau!");
            return;
        }

        if (
            !Number.isInteger(passengers) ||
            passengers < 1 ||
            passengers > 9
        ) {
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
            const returnDateValue =
                new Date(returnDate + "T00:00:00");

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
            passengers: passengers
        };

        try {
            localStorage.setItem(
                "tripgo_search",
                JSON.stringify(searchData)
            );
        } catch (error) {
            alert("Không thể lưu thông tin tìm kiếm!");
            return;
        }
        window.location.href = "search.html";
    });
});
