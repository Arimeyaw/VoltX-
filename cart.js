let cart = [];
const PROMO_CODES = {
  VOLT20: 0.2,
};
let appliedPromoCode = "";

/* ── Add to Cart ── */
function addToCart(id) {
  const product = products[id];
  const existing = cart.find((item) => item.id === id);
  if (existing) existing.qty++;
  else cart.push({ ...product, qty: 1 });
  updateCartCount();
  showToast("success", `${product.name} added to cart!`);
  openCart();
}

/* ── Remove from Cart ── */
function removeFromCart(id) {
  cart = cart.filter((item) => item.id !== id);
  updateCartCount();
  renderCart();
}

/* ── Change Quantity ── */
function changeQty(id, delta) {
  const item = cart.find((i) => i.id === id);
  if (item) {
    item.qty += delta;
    if (item.qty <= 0) {
      removeFromCart(id);
      return;
    }
  }
  updateCartCount();
  renderCart();
}

/* ── Update Cart Badge ── */
function updateCartCount() {
  document.getElementById("cartCount").textContent = cart.reduce(
    (sum, item) => sum + item.qty,
    0,
  );
}

/* ── Calculate Totals ── */
function calcTotals() {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discountRate = PROMO_CODES[appliedPromoCode] || 0;
  const discount = subtotal * discountRate;
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const tax = discountedSubtotal * 0.1;
  const shipping = discountedSubtotal >= 99 ? 0 : 9.99;
  const total = discountedSubtotal + tax + shipping;
  return { subtotal, discount, tax, shipping, total, promoCode: appliedPromoCode };
}

/* ── Render Cart Drawer ── */
function renderCart() {
  const cartItemsEl = document.getElementById("cartItems");
  const cartFooter = document.getElementById("cartFooter");

  if (!cart.length) {
    appliedPromoCode = "";
    cartItemsEl.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon"><i class="fas fa-shopping-cart"></i></div>
        <div style="font-size:16px;margin-bottom:6px">Your cart is empty</div>
        <div style="font-size:13px;color:var(--muted)">Add some gadgets to get started!</div>
      </div>`;
    cartFooter.style.display = "none";
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
          <button class="cart-remove" onclick="removeFromCart(${item.id})"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    </div>
  `,
    )
    .join("");

  const { subtotal, discount, tax, shipping, total } = calcTotals();
  cartFooter.style.display = "block";
  document.getElementById("cartSubtotal").textContent =
    `₵${subtotal.toFixed(2)}`;
  const discountRow = document.getElementById("cartDiscountRow");
  if (discount > 0) {
    discountRow.style.display = "flex";
    document.getElementById("cartDiscount").textContent = `-₵${discount.toFixed(2)}`;
  } else {
    discountRow.style.display = "none";
  }
  document.getElementById("cartShipping").textContent =
    shipping === 0 ? "Free" : `₵${shipping.toFixed(2)}`;
  document.getElementById("cartTax").textContent = `₵${tax.toFixed(2)}`;
  document.getElementById("cartTotal").textContent = `₵${total.toFixed(2)}`;

  renderCheckoutSummary();
}

/* ── Render Checkout Summary ── */
function renderCheckoutSummary() {
  const el = document.getElementById("ckOrderSummary");
  if (!el) return;
  const { subtotal, discount, total, promoCode } = calcTotals();
  const promoMsgEl = document.getElementById("promoMsg");
  const promoInput = document.getElementById("promoCodeInput");
  if (promoInput && promoCode) promoInput.value = promoCode;
  const appliedPromoHtml = promoCode
    ? `<div class="promo-applied">
        <span><b>${promoCode}</b> applied (20% off)</span>
        <span class="promo-remove" onclick="removePromoCode()">Remove</span>
      </div>`
    : "";
  const discountHtml = discount > 0
    ? `<div style="display:flex;justify-content:space-between;margin-top:6px;color:var(--success)">
        <span>Discount</span><span>-₵${discount.toFixed(2)}</span>
      </div>`
    : "";
  el.innerHTML =
    appliedPromoHtml +
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
    `<div style="display:flex;justify-content:space-between;margin-top:8px;color:var(--muted)">
      <span>Subtotal</span><span>₵${subtotal.toFixed(2)}</span>
    </div>` +
    discountHtml +
    `<div style="display:flex;justify-content:space-between;margin-top:10px;padding-top:10px;
      border-top:1px solid var(--border);color:var(--white);font-weight:600">
      <span>Total</span><span>₵${total.toFixed(2)}</span>
    </div>`;
}

function applyPromoFromCheckout() {
  const input = document.getElementById("promoCodeInput");
  const msg = document.getElementById("promoMsg");
  if (!input || !msg) return;
  const code = input.value.trim().toUpperCase();

  if (!code) {
    msg.textContent = "Enter a promo code first.";
    msg.className = "promo-msg error";
    return;
  }

  if (!PROMO_CODES[code]) {
    appliedPromoCode = "";
    msg.textContent = "Invalid promo code.";
    msg.className = "promo-msg error";
    return;
  }

  appliedPromoCode = code;
  msg.textContent = `${code} applied successfully.`;
  msg.className = "promo-msg success";
  renderCart();
}

function removePromoCode() {
  appliedPromoCode = "";
  const msg = document.getElementById("promoMsg");
  const input = document.getElementById("promoCodeInput");
  if (input) input.value = "";
  renderCart();
  if (msg) {
    msg.textContent = "Promo code removed.";
    msg.className = "promo-msg";
  }
}

/* ── Open / Close Drawer ── */
function openCart() {
  document.getElementById("cart-overlay").classList.add("open");
  document.getElementById("cart-drawer").classList.add("open");
  renderCart();
}

function closeCart() {
  document.getElementById("cart-overlay").classList.remove("open");
  document.getElementById("cart-drawer").classList.remove("open");
}
