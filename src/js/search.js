
const defaultFlights = [
    {
        id: "TG101",
        airline: "Vietnam Airlines",
        from: "HAN",
        to: "SGN",
        departure: "07:00",
        arrival: "09:10",
        duration: "2 giờ 10 phút",
        price: 1500000
    },

    {
        id: "TG102",
        airline: "Vietjet Air",
        from: "HAN",
        to: "SGN",
        departure: "09:30",
        arrival: "11:40",
        duration: "2 giờ 10 phút",
        price: 1100000
    },

    {
        id: "TG103",
        airline: "Bamboo Airways",
        from: "HAN",
        to: "DAD",
        departure: "08:00",
        arrival: "09:25",
        duration: "1 giờ 25 phút",
        price: 950000
    },

    {
        id: "TG104",
        airline: "Vietnam Airlines",
        from: "SGN",
        to: "HAN",
        departure: "14:00",
        arrival: "16:10",
        duration: "2 giờ 10 phút",
        price: 1600000
    },

    {
        id: "TG105",
        airline: "Vietjet Air",
        from: "SGN",
        to: "DAD",
        departure: "10:00",
        arrival: "11:20",
        duration: "1 giờ 20 phút",
        price: 850000
    },

    {
        id: "TG106",
        airline: "Bamboo Airways",
        from: "DAD",
        to: "HAN",
        departure: "16:00",
        arrival: "17:25",
        duration: "1 giờ 25 phút",
        price: 1000000
    },

    {
        id: "TG107",
        airline: "Vietnam Airlines",
        from: "HAN",
        to: "CXR",
        departure: "11:00",
        arrival: "12:50",
        duration: "1 giờ 50 phút",
        price: 1250000
    },

    {
        id: "TG108",
        airline: "Vietjet Air",
        from: "HAN",
        to: "PQC",
        departure: "13:30",
        arrival: "15:45",
        duration: "2 giờ 15 phút",
        price: 1350000
    }
];
let flights = defaultFlights;

function readFlights() {
    try {
        const savedFlights = localStorage.getItem("tripgo_flights");
        if (savedFlights === null) {
            flights = defaultFlights;
            return;
        }

        const parsedFlights = JSON.parse(savedFlights);
        if (!Array.isArray(parsedFlights)) {
            throw new TypeError("The flight catalog must be an array.");
        }
        flights = parsedFlights;
    } catch (error) {
        console.error("Could not read the TripGo flight catalog", error);
        flights = defaultFlights;
    }
}


const fromInput = document.getElementById("from");

const toInput = document.getElementById("to");

const departureInput =
    document.getElementById("departure");

const returnInput =
    document.getElementById("returnDate");

const returnGroup =
    document.getElementById("returnGroup");

const passengersInput =
    document.getElementById("passengers");

const ticketClassInput =
    document.getElementById("ticketClass");

const searchButton =
    document.getElementById("searchButton");

const errorBox =
    document.getElementById("error");

const resultTitle =
    document.getElementById("resultTitle");

const flightResults =
    document.getElementById("flightResults");


returnGroup.style.display = "none";
readFlights();

const searchParams = new URLSearchParams(window.location.search);
if (searchParams.has("from")) {
    fromInput.value = searchParams.get("from");
}
if (searchParams.has("to")) {
    toInput.value = searchParams.get("to");
}


const today =
    new Date().toISOString().split("T")[0];

departureInput.min = today;

returnInput.min = today;


const tripTypeInputs =
    document.querySelectorAll(
        'input[name="tripType"]'
    );


tripTypeInputs.forEach(function (radio) {

    radio.addEventListener(
        "change",
        function () {

            if (this.value === "roundtrip") {

                returnGroup.style.display = "flex";

            } else {

                returnGroup.style.display = "none";

                returnInput.value = "";
            }

        }
    );

});

if (searchParams.has("departure")) {
    departureInput.value = searchParams.get("departure");
}
if (searchParams.has("returnDate")) {
    returnInput.value = searchParams.get("returnDate");
}
if (searchParams.has("passengers")) {
    passengersInput.value = searchParams.get("passengers");
}
if (searchParams.has("ticketClass")) {
    ticketClassInput.value = searchParams.get("ticketClass");
}
if (searchParams.has("tripType")) {
    const tripType = Array.from(tripTypeInputs).find(
        radio => radio.value === searchParams.get("tripType")
    );
    if (tripType) {
        tripType.checked = true;
        tripType.dispatchEvent(new Event("change"));
    }
}

departureInput.addEventListener(
    "change",
    function () {

        returnInput.min =
            departureInput.value;

    }
);


searchButton.addEventListener(
    "click",
    searchFlights
);

if (searchParams.has("departure")) {
    searchFlights();
}


function searchFlights() {

    clearError();


    const from =
        fromInput.value;

    const to =
        toInput.value;

    const departure =
        departureInput.value;

    const returnDate =
        returnInput.value;

    const passengers =
        Number(passengersInput.value);

    const ticketClass =
        ticketClassInput.value;


    const tripType =
        document.querySelector(
            'input[name="tripType"]:checked'
        ).value;


    if (!from) {

        showError(
            "Vui lòng chọn điểm đi."
        );

        return;
    }


    if (!to) {

        showError(
            "Vui lòng chọn điểm đến."
        );

        return;
    }


    if (from === to) {

        showError(
            "Điểm đi và điểm đến không được giống nhau."
        );

        return;
    }


    if (!departure) {

        showError(
            "Vui lòng chọn ngày đi."
        );

        return;
    }


    if (
        tripType === "roundtrip" &&
        !returnDate
    ) {

        showError(
            "Vui lòng chọn ngày về."
        );

        return;
    }


    if (
        tripType === "roundtrip" &&
        returnDate < departure
    ) {

        showError(
            "Ngày về phải sau ngày đi."
        );

        return;
    }


    const result =
        flights.filter(function (flight) {

            return (
                flight.from === from &&
                flight.to === to &&
                (flight.status === undefined || flight.status === "active") &&
                (!flight.date || flight.date === departure) &&
                (flight.seats === undefined || Number(flight.seats) >= passengers)
            );
        });


    displayFlights(
        result,
        passengers,
        ticketClass,
        departure,
        returnDate,
        tripType
    );

}


function displayFlights(
    result,
    passengers,
    ticketClass,
    departure,
    returnDate,
    tripType
) {

    if (result.length === 0) {

        resultTitle.textContent =
            "Không tìm thấy chuyến bay";

        flightResults.innerHTML = `
            <div class="empty-result">

                <div class="empty-icon">
                    ✈
                </div>

                <h3>
                    Không có chuyến bay
                </h3>

                <p>
                    Không tìm thấy chuyến bay phù hợp với thông tin bạn đã chọn.
                </p>

            </div>
        `;

        return;
    }


    resultTitle.textContent =
        `Tìm thấy ${result.length} chuyến bay`;


    flightResults.innerHTML = "";


    result.forEach(function (flight) {

        let className =
            "Phổ thông";

        let classMultiplier = 1;


        if (ticketClass === "business") {

            className =
                "Thương gia";

            classMultiplier =
                1.8;
        }


        const totalPrice =
            flight.price *
            classMultiplier *
            passengers;


        const card =
            document.createElement("div");


        card.className =
            "flight-card";


        const duration = flight.duration || getFlightDuration(flight.departure, flight.arrival);
        card.innerHTML = `

            <div class="flight-top">

                <div>

                    <div class="airline">
                        ${escapeHtml(flight.airline)}
                    </div>

                    <div class="flight-number">
                        Chuyến bay ${escapeHtml(flight.id)}
                    </div>

                </div>

            </div>


            <div class="flight-content">


                <div>

                    <div class="flight-time">
                        ${escapeHtml(flight.departure)}
                    </div>

                    <div class="airport">
                        ${escapeHtml(getAirportName(flight.from))}
                    </div>

                </div>


                <div class="route">

                    <div class="duration">
                        ${escapeHtml(duration)}
                    </div>

                    <div class="route-line"></div>

                    <div class="direct">
                        Bay thẳng
                    </div>

                </div>


                <div>

                    <div class="flight-time">
                        ${escapeHtml(flight.arrival)}
                    </div>

                    <div class="airport">
                        ${escapeHtml(getAirportName(flight.to))}
                    </div>

                </div>


                <div class="flight-price">

                    <div class="price">
                        ${formatPrice(totalPrice)}
                    </div>

                    <div class="price-note">
                        ${passengers} hành khách
                    </div>

                    <div class="class-name">
                        ${className}
                    </div>

                    <button
                        type="button"
                        class="select-button"
                    >
                        CHỌN CHUYẾN BAY
                    </button>

                </div>

            </div>
        `;


        const selectButton =
            card.querySelector(
                ".select-button"
            );


        selectButton.addEventListener(
            "click",
            function () {

                selectFlight(
                    flight,
                    passengers,
                    ticketClass,
                    departure,
                    returnDate,
                    tripType,
                    totalPrice
                );

            }
        );


        flightResults.appendChild(card);

    });

}


function selectFlight(
    flight,
    passengers,
    ticketClass,
    departure,
    returnDate,
    tripType,
    totalPrice
) {

    const selectedFlight = {

        flightId:
            flight.id,

        airline:
            flight.airline,

        from:
            flight.from,

        to:
            flight.to,

        departureDate:
            departure,

        returnDate:
            returnDate,

        tripType:
            tripType,

        departureTime:
            flight.departure,

        arrivalTime:
            flight.arrival,

        duration:
            flight.duration || getFlightDuration(flight.departure, flight.arrival),

        passengers:
            passengers,

        ticketClass:
            ticketClass,

        basePrice:
            flight.price,

        totalPrice:
            totalPrice

    };


    localStorage.setItem(
        "tripgo_selected_flight",
        JSON.stringify({...selectedFlight, id: flight.id, date: departure, departure: flight.departure, arrival: flight.arrival, price: totalPrice / passengers, search: {passengers, departure, classType: ticketClass === "business" ? "Thương gia" : "Phổ thông"}})
    );


    localStorage.removeItem("tripgo_selected_seats");
    localStorage.removeItem("tripgo_selected_seat");
    localStorage.removeItem("tripgo_selected_seat_flight");
    window.location.href =
        "/src/pages/passenger.html";
}

function getFlightDuration(departure, arrival) {
    if (!departure || !arrival) return "Thời gian chưa cập nhật";
    const [departureHour, departureMinute] = departure.split(":").map(Number);
    const [arrivalHour, arrivalMinute] = arrival.split(":").map(Number);
    let minutes = arrivalHour * 60 + arrivalMinute - (departureHour * 60 + departureMinute);
    if (minutes < 0) minutes += 24 * 60;
    return `${Math.floor(minutes / 60)} giờ ${minutes % 60} phút`;
}

function getAirportName(code) {
    const airports = {
        HAN: "Hà Nội",
        SGN: "TP. Hồ Chí Minh",
        DAD: "Đà Nẵng",
        PQC: "Phú Quốc",
        CXR: "Nha Trang",
        HPH: "Hải Phòng",
        HUI: "Huế",
        VCA: "Cần Thơ",
        UIH: "Quy Nhơn",
        VDO: "Vân Đồn"
    };
    return airports[code] || code;
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

window.addEventListener("storage", event => {
    if (event.key === "tripgo_flights") {
        readFlights();
        if (departureInput.value) searchFlights();
    }
});


function formatPrice(price) {

    return new Intl.NumberFormat(
        "vi-VN"
    ).format(price) + " VNĐ";

}


function showError(message) {

    errorBox.textContent =
        message;

}


function clearError() {

    errorBox.textContent =
        "";

}
