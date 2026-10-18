export function normalizeFlight(flight) {
  if (!flight || typeof flight !== "object" || Array.isArray(flight)) {
    return null;
  }

  const departure = flight.departure ?? flight.departureTime ?? "";
  const arrival = flight.arrival ?? flight.arrivalTime ?? "";

  return {
    ...flight,
    id: flight.id ?? flight.flightNumber ?? "",
    date: flight.date ?? flight.departureDate ?? "",
    departure,
    arrival,
    duration:
      typeof flight.duration === "string" &&
      /^\d+ giờ \d+ phút$/.test(flight.duration)
        ? flight.duration
        : getFlightDuration(departure, arrival),
    seats: flight.seats ?? flight.availableSeats,
    status: flight.status === "available" ? "active" : flight.status,
  };
}

export function getFlightDuration(departure, arrival) {
  const parseTime = (value) => {
    if (typeof value !== "string") return null;

    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
  };

  const departureMinutes = parseTime(departure);
  const arrivalMinutes = parseTime(arrival);

  if (departureMinutes === null || arrivalMinutes === null) {
    return "Thời gian chưa cập nhật";
  }

  const durationMinutes =
    (arrivalMinutes - departureMinutes + 24 * 60) % (24 * 60);
  return `${Math.floor(durationMinutes / 60)} giờ ${durationMinutes % 60} phút`;
}

export function mergeFlightCatalog(defaultFlights, savedFlights) {
  const savedById = new Map(savedFlights.map((flight) => [flight.id, flight]));
  const defaultIds = new Set(defaultFlights.map((flight) => flight.id));

  return [
    ...defaultFlights.map((flight) => savedById.get(flight.id) ?? flight),
    ...savedFlights.filter((flight) => !defaultIds.has(flight.id)),
  ];
}

export function matchesFlightSearch(
  flight,
  { from, to, departure, passengers },
) {
  return (
    flight.from === from &&
    flight.to === to &&
    (flight.status === undefined || flight.status === "active") &&
    (!flight.date || flight.date === departure) &&
    (flight.seats === undefined || Number(flight.seats) >= passengers)
  );
}

const AIRLINES = [
  "Vietnam Airlines",
  "Vietjet Air",
  "Bamboo Airways",
  "Jetstar Pacific",
];

const ROUTE_TEMPLATES = [
  { departure: "07:00", arrival: "09:10", price: 1400000 },
  { departure: "09:30", arrival: "11:40", price: 1200000 },
  { departure: "13:00", arrival: "15:10", price: 1600000 },
  { departure: "18:00", arrival: "20:10", price: 1750000 },
];

export function buildRouteFlightOptions(
  flights,
  { from, to, departure, passengers = 1 } = {},
) {
  if (!from || !to || from === to) {
    return [];
  }

  const directFlights = flights.filter((flight) =>
    matchesFlightSearch(flight, {
      from,
      to,
      departure,
      passengers,
    }),
  );

  if (directFlights.length >= 2) {
    return directFlights;
  }

  const generated = [...directFlights];

  for (let index = generated.length; generated.length < 2; index += 1) {
    const template = ROUTE_TEMPLATES[index % ROUTE_TEMPLATES.length];
    const flightId = `${from}${to}${String(index + 1).padStart(2, "0")}`;

    generated.push({
      id: flightId,
      airline: AIRLINES[index % AIRLINES.length],
      from,
      to,
      date: departure || "",
      departure: template.departure,
      arrival: template.arrival,
      seats: Math.max(120, Number(passengers) * 12),
      price: template.price + index * 250000,
      status: "active",
    });
  }

  return generated;
}
