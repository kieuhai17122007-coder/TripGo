const ticketTypes = {
    economy: {
        name: "Economy",
        baggage: 0,
        baggagePrice: 50000
    },
    premium: {
        name: "Premium",
        baggage: 20,
        baggagePrice: 0
    },
    business: {
        name: "Business",
        baggage: 30,
        baggagePrice: 0
    }
};

function calculateBaggageFee(ticketType, baggageWeight) {
    const ticket = ticketTypes[ticketType];

    if (!ticket) {
        return 0;
    }

    if (baggageWeight <= ticket.baggage) {
        return 0;
    }

    const extraWeight = baggageWeight - ticket.baggage;

    return extraWeight * ticket.baggagePrice;
}

function formatPrice(price) {
    return price.toLocaleString("vi-VN") + " VNĐ";
}

function showBaggageFee(ticketType, baggageWeight) {
    const fee = calculateBaggageFee(ticketType, baggageWeight);

    const result = document.getElementById("baggageFee");

    if (result) {
        result.textContent = formatPrice(fee);
    }

    return fee;
}