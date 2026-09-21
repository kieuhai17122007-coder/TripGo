const params = new URLSearchParams(location.search);
const from = params.get("from") || "HAN";
const to = params.get("to") || "DAD";
const date = params.get("departure") || new Date().toISOString().split("T")[0];
const airport = {HAN:"Hà Nội",SGN:"TP. Hồ Chí Minh",DAD:"Đà Nẵng",PQC:"Phú Quốc"};
document.getElementById("routeText").textContent = `${airport[from] || from} → ${airport[to] || to} · ${date}`;

let flights = [];
fetch("../data/flights.json").then(r=>r.json()).then(data=>{
  flights=data.filter(f=>f.from===from && f.to===to);
  render();
}).catch(()=>{document.getElementById("flightList").innerHTML="<p>Không thể tải dữ liệu chuyến bay.</p>"});

function render(){
  const sort=document.getElementById("sort").value;
  const list=[...flights].sort((a,b)=>sort==="price"?a.price-b.price:a.departure.localeCompare(b.departure));
  const box=document.getElementById("flightList");
  if(!list.length){box.innerHTML='<div class="flight-card"><div><b>Không có chuyến bay</b><p>Hãy thử thay đổi điểm đi hoặc điểm đến.</p></div></div>';return}
  box.innerHTML=list.map(f=>`<article class="flight-card">
    <div><div class="flight-time">${f.departure}</div><small>${airport[f.from]} (${f.from})</small></div>
    <div class="flight-line">1 giờ 25 phút<br>${f.aircraft}</div>
    <div><div class="flight-time">${f.arrival}</div><small>${airport[f.to]} (${f.to})</small></div>
    <div><div class="price">${f.price.toLocaleString("vi-VN")} ₫</div><small>Phổ thông</small><br><button class="primary-btn select-flight" onclick="selectFlight('${f.id}')">CHỌN</button></div>
  </article>`).join("");
}
document.getElementById("sort").addEventListener("change",render);
function selectFlight(id){
  const flight=flights.find(f=>f.id===id);
  localStorage.setItem("tripgo_selected_flight",JSON.stringify(flight));
  location.href="passenger.html";
}