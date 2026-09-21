const departure = document.getElementById("departure");
const returnDate = document.getElementById("returnDate");
const tripType = document.querySelectorAll('input[name="tripType"]');

const today = new Date();
const iso = today.toISOString().split("T")[0];
departure.min = iso;
returnDate.min = iso;
departure.value = iso;

tripType.forEach(r => r.addEventListener("change", () => {
  const round = document.querySelector('input[name="tripType"]:checked').value === "roundtrip";
  returnDate.disabled = !round;
  returnDate.parentElement.style.opacity = round ? "1" : ".5";
}));

departure.addEventListener("change", () => {
  returnDate.min = departure.value;
});

document.getElementById("swapBtn").addEventListener("click", () => {
  const from = document.getElementById("from");
  const to = document.getElementById("to");
  [from.value, to.value] = [to.value, from.value];
});

document.getElementById("searchBtn").addEventListener("click", () => {
  const params = new URLSearchParams({
    from: document.getElementById("from").value,
    to: document.getElementById("to").value,
    departure: departure.value,
    returnDate: returnDate.value,
    passengers: document.getElementById("passengers").value,
    classType: document.getElementById("classType").value
  });
  localStorage.setItem("tripgo_search", JSON.stringify(Object.fromEntries(params)));
  location.href = "pages/search.html?" + params.toString();
});