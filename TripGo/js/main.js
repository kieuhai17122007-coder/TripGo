const departure=document.getElementById('departure');
const returnDate=document.getElementById('returnDate');
const tripType=document.querySelectorAll('input[name="tripType"]');
const today=todayISO();
departure.min=today; returnDate.min=today; departure.value=today;
tripType.forEach(r=>r.addEventListener('change',()=>{ const round=document.querySelector('input[name="tripType"]:checked').value==='roundtrip'; returnDate.disabled=!round; returnDate.required=round; returnDate.closest('.field').style.opacity=round?'1':'.5'; }));
departure.addEventListener('change',()=>{ returnDate.min=departure.value; if(returnDate.value && returnDate.value<departure.value) returnDate.value=departure.value; });
document.getElementById('swapBtn').addEventListener('click',()=>{ const a=document.getElementById('from'),b=document.getElementById('to'); [a.value,b.value]=[b.value,a.value]; });
document.getElementById('searchBtn').addEventListener('click',()=>{
 const from=document.getElementById('from').value,to=document.getElementById('to').value,dep=departure.value,ret=returnDate.value,pax=Number(document.getElementById('passengers').value),classType=document.getElementById('classType').value;
 if(from===to) return alert('Điểm đi và điểm đến không được trùng nhau.');
 if(!dep) return alert('Vui lòng chọn ngày đi.');
 if(document.querySelector('input[name="tripType"]:checked').value==='roundtrip' && !ret) return alert('Vui lòng chọn ngày về.');
 const data={tripType:document.querySelector('input[name="tripType"]:checked').value,from,to,departure:dep,returnDate:ret,passengers:pax,classType};
 write(TG.SEARCH,data); location.href='pages/search.html?'+new URLSearchParams(data).toString();
});
