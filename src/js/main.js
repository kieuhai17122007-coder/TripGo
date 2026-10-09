
document.addEventListener("DOMContentLoaded", function () {
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
