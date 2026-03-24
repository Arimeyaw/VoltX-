function openProductModal(id) {
  const p = products[id];

  document.getElementById('modalImg').innerHTML = `
    <img
      src="${p.image}"
      alt="${p.brand} ${p.name}"
      style="width:100%;max-height:320px;object-fit:contain;"
      onerror="this.outerHTML='<span style=\\'font-size:100px\\'>${p.emoji}</span>'"
    />
  `;

  document.getElementById('modalBrand').textContent    = p.brand;
  document.getElementById('modalName').textContent     = p.name;
  document.getElementById("modalPrice").textContent = `₵${p.price.toFixed(2)}`;
  document.getElementById('modalOriginal').textContent = p.original ? `Was ₵${p.original.toFixed(2)}` : '';

  document.getElementById('modalRating').innerHTML = `
    <span class="stars">${'★'.repeat(Math.floor(p.rating))}</span>
    <b style="color:var(--white)">${p.rating}</b>
    <span style="color:var(--muted)">(${p.reviews.toLocaleString()} reviews)</span>
  `;

  document.getElementById('modalDesc').textContent = p.desc;

  document.getElementById('modalSpecs').innerHTML =
    '<h4>Specifications</h4>' +
    p.specs.map(s => `
      <div class="spec-row">
        <span class="spec-key">${s[0]}</span>
        <span class="spec-val">${s[1]}</span>
      </div>
    `).join('');

  document.getElementById('modalAddBtn').onclick = () => {
    addToCart(id);
    closeModal();
  };

  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}



  //  DEAL OF THE DAY — inject real product image

function loadDealImage() {
  const dealProduct = products[6]; // MacBook Air M3 15"
  const dealRight   = document.querySelector('.deal-right');
  if (!dealRight) return;
  dealRight.innerHTML = `
    <img
      src="${dealProduct.image}"
      alt="${dealProduct.brand} ${dealProduct.name}"
      style="width:100%;max-height:340px;object-fit:contain;position:relative;z-index:1;transition:transform .4s ease;"
      onmouseover="this.style.transform='scale(1.04)'"
      onmouseout="this.style.transform='scale(1)'"
      onerror="this.outerHTML='<span style=\\'font-size:120px;position:relative;z-index:1\\'>💻</span>'"
    />
  `;
}



  //  HERO CARD — inject real product image

function loadHeroImage() {
  const heroProduct = products[0]; // Sony WH-1000XM5
  const heroImgEl   = document.querySelector('.product-img-hero');
  if (!heroImgEl) return;
  heroImgEl.innerHTML = `
    <img
      src="${heroProduct.image}"
      alt="${heroProduct.brand} ${heroProduct.name}"
      style="width:100%;height:100%;object-fit:contain;padding:16px;transition:transform .3s;"
      onmouseover="this.style.transform='scale(1.05)'"
      onmouseout="this.style.transform='scale(1)'"
      onerror="this.outerHTML='<span style=\\'font-size:80px\\'>🎧</span>'"
    />
  `;
}



  //  CHECKOUT

function openCheckout() {
  if (!cart.length) {
    showToast('error', 'Your cart is empty!');
    return;
  }
  renderCart();
  document.getElementById('checkout-overlay').classList.add('open');
}

function closeCheckout() {
  document.getElementById('checkout-overlay').classList.remove('open');
}

function selectPayment(el) {
  document.querySelectorAll('.pay-method').forEach(e => e.classList.remove('active'));
  el.classList.add('active');
  const isCard = el.textContent.includes('Credit Card');
  document.getElementById('cardFields').style.display = isCard ? 'block' : 'none';
}

function formatCard(input) {
  const digits = input.value.replace(/\D/g, '').substring(0, 16);
  input.value = digits.replace(/(.{4})/g, "₵1 ").trim();
}

function placeOrder() {
  const required = ['ckFirstName', 'ckLastName', 'ckEmail', 'ckAddress', 'ckCity'];
  for (const fieldId of required) {
    if (!document.getElementById(fieldId).value.trim()) {
      showToast('error', 'Please fill in all required fields.');
      return;
    }
  }

  const ref = 'VX-' + Math.floor(100000 + Math.random() * 900000);
  document.getElementById('orderRef').textContent = `ORDER #${ref}`;

  closeCheckout();
  cart = [];
  updateCartCount();
  document.getElementById('success-overlay').classList.add('open');
}

function closeSuccess() {
  document.getElementById('success-overlay').classList.remove('open');
}


// NOTIFICATIONS

function showToast(type, message) {
  const container = document.getElementById('toast-container');
  const toast     = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✅' : '❌'}</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.cssText = 'opacity:0;transform:translateX(20px);transition:.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}




function toggleWish(btn) {
  btn.classList.toggle('active');
  const on = btn.classList.contains('active');
  btn.textContent = on ? '❤️' : '🤍';
  showToast('success', on ? 'Added to wishlist! ❤️' : 'Removed from wishlist');
}


function subscribeNewsletter() {
  const email = document.getElementById('nlEmail').value.trim();
  if (!email || !email.includes('@')) {
    showToast('error', 'Please enter a valid email address.');
    return;
  }
  showToast('success', '🎉 Subscribed! Check your inbox for your welcome discount.');
  document.getElementById('nlEmail').value = '';
}



  //  DEAL COUNTDOWN TIMER


let timerSeconds = (8 * 3600) + (34 * 60) + 59;

function updateTimer() {
  timerSeconds--;
  if (timerSeconds < 0) timerSeconds = 86399;
  const h = Math.floor(timerSeconds / 3600);
  const m = Math.floor((timerSeconds % 3600) / 60);
  const s = timerSeconds % 60;
  document.getElementById('dh').textContent = String(h).padStart(2, '0');
  document.getElementById('dm').textContent = String(m).padStart(2, '0');
  document.getElementById('ds').textContent = String(s).padStart(2, '0');
}

setInterval(updateTimer, 1000);



  //  SMOOTH SCROLL 

function smoothGo(selector, linkEl) {
  const target = document.querySelector(selector);
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (linkEl) {
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    linkEl.classList.add('active');
  }
}
