import assert from 'node:assert/strict';
const values=new Map();globalThis.localStorage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};
class Element {
  constructor(){this.children=[];this.dataset={};this.className='';this.textContent='';this.attrs={};this.classList={toggle:()=>{}};}
  append(e){this.children.push(e);}
  replaceChildren(){this.children=[];}
  setAttribute(k,v){this.attrs[k]=v;}
  getAttribute(k){return this.attrs[k];}
  click(){this.onclick?.();}
}
const elements=new Map(['seats','seatError','seatHelp','seatCounter','selectedSeatList','cabinStats','autoSeats','clearSeats','nextBtn'].map(id=>[id,new Element()]));
globalThis.document={getElementById:id=>elements.get(id),createElement:()=>new Element()};
globalThis.window={addEventListener:()=>{}};globalThis.location={pathname:'/src/pages/seat.html',search:'',href:'',replace:()=>{}};
localStorage.setItem('tripgo_current_user',JSON.stringify({role:'customer',email:'test@example.com'}));
localStorage.setItem('tripgo_selected_flight',JSON.stringify({id:'TG101',date:'2026-10-10',passengers:9}));
await import('../src/js/seat.js');
const seats=()=>elements.get('seats').children.flatMap(row=>row.children).filter(n=>n.dataset.seat);
const click=id=>seats().find(n=>n.dataset.seat===id).click();
assert.equal(seats().length,120);
for(const id of ['1A','1B','1C','1D','1E','1F','3A','3B','3C'])click(id);
assert.equal(seats().filter(n=>n.className.includes('selected')).length,9);
elements.get('nextBtn').click();
assert.deepEqual(JSON.parse(localStorage.getItem('tripgo_selected_seats')),['1A','1B','1C','1D','1E','1F','3A','3B','3C']);
assert.equal(location.href,'/src/pages/confirm.html');
console.log('Passed 9-passenger controller: 1A–1F plus 3A–3C selected and confirmed.');
