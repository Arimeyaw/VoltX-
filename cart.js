let cart = [];

/* ── Add to Cart ── */
function addToCart(id) {
  const product  = products[id];
  const existing = cart.find(item => item.id === id);
  if (existing) existing.qty++;
  else cart.push({ ...product, qty: 1 });
  updateCartCount();
  showToast('success', `${product.name} added to cart!`);
  openCart();
}

/* ── Remove from Cart ── */
function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  updateCartCount();
  renderCart();
}

/* ── Change Quantity ── */
function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (item) {
    item.qty += delta;
    if (item.qty <= 0) { removeFromCart(id); return; }
  }
  updateCartCount();
  renderCart();
}

/* ── Update Cart Badge ── */
function updateCartCount() {
  document.getElementById('cartCount').textContent =
    cart.reduce((sum, item) => sum + item.qty, 0);
}

/* ── Calculate Totals ── */
function calcTotals() {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax      = subtotal * 0.10;
  const shipping = subtotal >= 99 ? 0 : 9.99;
  const total    = subtotal + tax + shipping;
  return { subtotal, tax, shipping, total };
}

/* ── Render Cart Drawer ── */
function renderCart() {
  const cartItemsEl = document.getElementById('cartItems');
  const cartFooter  = document.getElementById('cartFooter');

  if (!cart.length) {
    cartItemsEl.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <div style="font-size:16px;margin-bottom:6px">Your cart is empty</div>
        <div style="font-size:13px;color:var(--muted)">Add some gadgets to get started!</div>
      </div>`;
    cartFooter.style.display = 'none';
    return;
  }

  cartItemsEl.innerHTML = cart
    .map(
      (item) => `
    <div class="cart-item">
      <div class="cart-item-img">
        <img
          src="${item.image}"
          alt="${item.name}"
          style="width:100%;height:100%;object-fit:contain;padding:6px;"
          onerror="this.style.display='none';this.nextElementSibling.style.display='block'"
        />
        <span style="display:none;font-size:28px;line-height:72px;text-align:center;width:100%">${item.emoji}</span>
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.brand} ${item.name}</div>
        <div class="cart-item-price">₵${(item.price * item.qty).toFixed(2)}</div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
          <button class="cart-remove" onclick="removeFromCart(${item.id})">🗑️</button>
        </div>
      </div>
    </div>
  `,
    )
    .join("");

  const { subtotal, tax, shipping, total } = calcTotals();
  cartFooter.style.display = 'block';
  document.getElementById('cartSubtotal').textContent = `₵${subtotal.toFixed(2)}`;
  document.getElementById('cartShipping').textContent  = shipping === 0 ? 'Free' : `₵${shipping.toFixed(2)}`;
  document.getElementById("cartTax").textContent = `₵${tax.toFixed(2)}`;
  document.getElementById("cartTotal").textContent = `₵${total.toFixed(2)}`;

  renderCheckoutSummary();
}

/* ── Render Checkout Summary ── */
function renderCheckoutSummary() {
  const el = document.getElementById('ckOrderSummary');
  if (!el) return;
  const { total } = calcTotals();
  el.innerHTML =
    cart
      .map(
        (item) => `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <img src="${item.image}" alt="${item.name}"
          style="width:36px;height:36px;object-fit:contain;background:var(--bg3);border-radius:6px;padding:3px;"
          onerror="this.style.display='none'" />
        <span style="flex:1">${item.name} ×${item.qty}</span>
        <span style="color:var(--white)">₵${(item.price * item.qty).toFixed(2)}</span>
      </div>
    `,
      )
      .join("") +
    `<div style="display:flex;justify-content:space-between;margin-top:10px;padding-top:10px;
      border-top:1px solid var(--border);color:var(--white);font-weight:600">
      <span>Total</span><span>₵${total.toFixed(2)}</span>
    </div>`;
}

/* ── Open / Close Drawer ── */
function openCart() {
  document.getElementById('cart-overlay').classList.add('open');
  document.getElementById('cart-drawer').classList.add('open');
  renderCart();
}

function closeCart() {
  document.getElementById('cart-overlay').classList.remove('open');
  document.getElementById('cart-drawer').classList.remove('open');
}
