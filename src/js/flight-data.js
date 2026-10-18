export function normalizeFlight(flight) {
  if (!flight || typeof flight !== "object" || Array.isArray(flight)) {
    return null;
  }

  return {
    ...flight,
    id: flight.id ?? flight.flightNumber ?? "",
    date: flight.date ?? flight.departureDate ?? "",
    departure: flight.departure ?? flight.departureTime ?? "",
    arrival: flight.arrival ?? flight.arrivalTime ?? "",
    seats: flight.seats ?? flight.availableSeats,
    status: flight.status === "available" ? "active" : flight.status,
  };
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
  if (
    !from ||
    !to ||
    from === to ||
    !departure ||
    !Number.isInteger(Number(passengers)) ||
    Number(passengers) < 1
  ) {
    return [];
  }

  const catalog = Array.isArray(flights) ? flights : [];

  return catalog
    .map(normalizeFlight)
    .filter(Boolean)
    .filter((flight) =>
      matchesFlightSearch(flight, {
        from,
        to,
        departure,
        passengers: Number(passengers),
      }),
    )
    .filter(
      (flight) =>
        flight.departure &&
        flight.arrival &&
        Number.isFinite(Number(flight.price)) &&
        Number(flight.price) > 0,
    );
}
