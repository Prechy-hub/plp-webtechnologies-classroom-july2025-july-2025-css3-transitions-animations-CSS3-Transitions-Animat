const qs = (s, el=document)=>el.querySelector(s);
const on = (el, ev, fn, opts)=> el && el.addEventListener(ev, fn, opts);

// overlays start hidden
const modalWrap = document.getElementById('modalWrap');
const help      = document.getElementById('help');
[modalWrap, help].forEach(el=>{ if(!el) return; el.hidden=true; el.classList.remove('show','hide'); });

/* Theme */
const themeToggle = qs('#themeToggle');
function applyTheme(mode){
  document.documentElement.classList.toggle('light', mode==='light');
  themeToggle.textContent = mode==='light' ? 'Dark' : 'Light';
  themeToggle.setAttribute('aria-pressed', String(mode==='light'));
}
applyTheme(localStorage.getItem('theme') || 'dark');
on(themeToggle,'click',()=>{
  const next = document.documentElement.classList.contains('light') ? 'dark' : 'light';
  localStorage.setItem('theme', next);
  applyTheme(next);
});

/* Toast */
const toastEl = qs('#toast');
function toast(msg, ms=1500){
  toastEl.textContent = msg;
  toastEl.hidden = false;
  clearTimeout(toastEl._t);
  toastEl._t = setTimeout(()=>{ toastEl.hidden = true; }, ms);
}

/* Cart (closure) */
function makeCartCounter(){ let n=0; return { add(step=1){ n+=step; return n; }, value(){ return n; } }; }
const cart = makeCartCounter();
const cartBadge = qs('#cartCount');

/* Flip + Add */
const flip = qs('#flipCard');
function toggleFlip(){ flip.classList.toggle('active'); }
on(flip,'click',toggleFlip);
on(flip,'keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); toggleFlip(); }});

document.querySelectorAll('[data-add]').forEach(btn=>{
  on(btn,'click',()=>{
    const kobo = Number(btn.dataset.add);
    cartBadge.textContent = String(cart.add(1));
    cartBadge.style.transform = 'scale(1.18)';
    setTimeout(()=>{ cartBadge.style.transform = 'scale(1)'; }, 120);
    toast(`Added ₦${kobo.toLocaleString()} Americano to cart`);
  });
});

/* Pulse CTA */
on(qs('#pulseBtn'),'click', e=>{
  e.currentTarget.classList.remove('pulse');
  void e.currentTarget.offsetWidth;
  e.currentTarget.classList.add('pulse');
});

/* Order form */
const spinner = qs('#spinner');
const orderForm = qs('#orderForm');
const nameInput = qs('#custName');

function calcTotal(amount, {tax=0.075, tip=0}={}){
  const taxAmt = amount*tax, tipAmt = amount*tip, total = amount+taxAmt+tipAmt;
  return { amount, taxAmt, tipAmt, total };
}
function sum(...nums){ return nums.reduce((a,b)=>a+b,0); }

on(orderForm,'submit', async (e)=>{
  e.preventDefault();
  if(!nameInput.value.trim()){ toast('Add a name, please'); nameInput.focus(); return; }
  spinner.hidden = false; qs('#saveBtn').disabled = true;
  await new Promise(r=>setTimeout(r, 900));
  spinner.hidden = true; qs('#saveBtn').disabled = false;
  orderForm.reset();
  toast('Order saved. Ada says thanks!');
});

/* Receipt */
const sub=qs('#subtotal'), tipPct=qs('#tipPct'), taxPct=qs('#taxPct'), out=qs('#receipt');
function renderReceipt(){
  const base = Number(sub?.value||0);
  const tip  = Number(tipPct?.value||0)/100;
  const tax  = Number(taxPct?.value||0)/100;
  const r = calcTotal(base,{tax,tip});
  out.innerHTML = `
    <div>Subtotal: ₦${r.amount.toLocaleString()}</div>
    <div>Tax: ₦${Math.round(r.taxAmt).toLocaleString()}</div>
    <div>Tip: ₦${Math.round(r.tipAmt).toLocaleString()}</div>
    <hr>
    <div><strong>Total: ₦${Math.round(r.total).toLocaleString()}</strong></div>
    <small class="hint">sum(1500, 800, 700) = ₦${sum(1500,800,700).toLocaleString()}</small>
  `;
}
['input','change'].forEach(ev=>{
  on(sub,ev,renderReceipt); on(tipPct,ev,renderReceipt); on(taxPct,ev,renderReceipt);
});
renderReceipt();

/* Modal open/close */
on(qs('#openModal'),'click',()=>{
  modalWrap.hidden = false;
  requestAnimationFrame(()=> modalWrap.classList.add('show'));
});
function closeModal(){
  modalWrap.classList.remove('show'); modalWrap.classList.add('hide');
  setTimeout(()=>{ modalWrap.hidden=true; modalWrap.classList.remove('hide'); }, 200);
}
on(qs('#closeModal'),'click', closeModal);
on(modalWrap,'click', e=>{ if(e.target===modalWrap) closeModal(); });

/* Help overlay */
on(qs('#openHelp'),'click',()=>{ help.hidden=false; requestAnimationFrame(()=>help.classList.add('show')); });
on(qs('#closeHelp'),'click',()=>{ help.classList.remove('show'); help.classList.add('hide'); setTimeout(()=>{ help.hidden=true; help.classList.remove('hide'); },200); });

/* Flip speed slider */
const speed = qs('#speed'), speedOut = qs('#speedOut');
on(speed,'input',()=>{
  speedOut.textContent = speed.value;
  document.documentElement.style.setProperty('--flip-speed', `${speed.value}ms`);
});

/* NEW: slot booking logic */
const slotStatus = qs('#slotStatus');

/* restore previous slot from localStorage */
(function restoreSlot(){
  const t = localStorage.getItem('slotTime');
  if (t) slotStatus.textContent = t;
})();

/* delegate clicks to slot buttons in modal */
on(modalWrap, 'click', (e)=>{
  const btn = e.target.closest('.slotBtn');
  if(!btn) return;
  const time = btn.textContent.trim();
  slotStatus.textContent = time;
  localStorage.setItem('slotTime', time);
  toast(`Booked ${time} with Chinedu`);
  setTimeout(closeModal, 800); // gentle close
});