function openProductModal(id) {
  const p = products[id];

  document.getElementById("modalImg").innerHTML = `
    <img
      src="${p.image}"
      alt="${p.brand} ${p.name}"
      style="width:100%;max-height:320px;object-fit:contain;"
      onerror="this.outerHTML='<span style=\\'font-size:100px\\'>${p.emoji}</span>'"
    />
  `;

  document.getElementById("modalBrand").textContent = p.brand;
  document.getElementById("modalName").textContent = p.name;
  document.getElementById("modalPrice").textContent = `₵${p.price.toFixed(2)}`;
  document.getElementById("modalOriginal").textContent = p.original
    ? `Was ₵${p.original.toFixed(2)}`
    : "";

  document.getElementById("modalRating").innerHTML = `
    <span class="stars">${"★".repeat(Math.floor(p.rating))}</span>
    <b style="color:var(--white)">${p.rating}</b>
    <span style="color:var(--muted)">(${p.reviews.toLocaleString()} reviews)</span>
  `;

  document.getElementById("modalDesc").textContent = p.desc;

  document.getElementById("modalSpecs").innerHTML =
    "<h4>Specifications</h4>" +
    p.specs
      .map(
        (s) => `
      <div class="spec-row">
        <span class="spec-key">${s[0]}</span>
        <span class="spec-val">${s[1]}</span>
      </div>
    `,
      )
      .join("");

  document.getElementById("modalAddBtn").onclick = () => {
    addToCart(id);
    closeModal();
  };

  // setup modal wishlist button to toggle wishlist for this product
  const mw = document.querySelector(".modal-wish-btn");
  if (mw) {
    mw.onclick = (e) => {
      e.stopPropagation();
      toggleWishlistById(id);
    };
    mw.textContent = isInWishlist(id) ? "❤️" : "🤍";
  }

  // expose current modal product id
  window.currentProductModalId = id;

  document.getElementById("modal-overlay").classList.add("open");
}

function closeModal() {
  document.getElementById("modal-overlay").classList.remove("open");
  // stop any active tracking poll
  try {
    if (window.__trackingIntervalId) {
      clearInterval(window.__trackingIntervalId);
      window.__trackingIntervalId = null;
      window.__trackingRef = null;
    }
  } catch (e) {}
}

//  DEAL OF THE DAY — inject real product image

function loadDealImage() {
  const dealProduct = products[6]; // MacBook Air M3 15"
  const dealRight = document.querySelector(".deal-right");
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
  const heroImgEl = document.querySelector(".product-img-hero");
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
    showToast("error", "Your cart is empty!");
    return;
  }
  renderCart();
  document.getElementById("checkout-overlay").classList.add("open");
}

function closeCheckout() {
  document.getElementById("checkout-overlay").classList.remove("open");
}

function selectPayment(el) {
  document
    .querySelectorAll(".pay-method")
    .forEach((e) => e.classList.remove("active"));
  el.classList.add("active");
  const isCard = el.textContent.includes("Credit Card");
  document.getElementById("cardFields").style.display = isCard
    ? "block"
    : "none";
}

function formatCard(input) {
  const digits = input.value.replace(/\D/g, "").substring(0, 16);
  input.value = digits.replace(/(.{4})/g, "₵1 ").trim();
}

function placeOrder() {
  const required = [
    "ckFirstName",
    "ckLastName",
    "ckEmail",
    "ckAddress",
    "ckCity",
  ];
  for (const fieldId of required) {
    if (!document.getElementById(fieldId).value.trim()) {
      showToast("error", "Please fill in all required fields.");
      return;
    }
  }

  const ref = "VX-" + Math.floor(100000 + Math.random() * 900000);
  document.getElementById("orderRef").textContent = `ORDER #${ref}`;

  // Build order object
  const orders = JSON.parse(localStorage.getItem("orders") || "[]");
  const ck = (id) =>
    document.getElementById(id) && document.getElementById(id).value.trim();
  const shipping = {
    firstName: ck("ckFirstName"),
    lastName: ck("ckLastName"),
    email: ck("ckEmail"),
    phone: ck("ckPhone") || "",
    address: ck("ckAddress"),
    city: ck("ckCity"),
    country: document.getElementById("ckCountry")
      ? document.getElementById("ckCountry").value
      : "",
  };

  const totals = calcTotals();

  const order = {
    ref,
    userEmail: (window.currentUser && window.currentUser.email) || null,
    items: cart.map((i) => ({
      id: i.id,
      name: i.name,
      brand: i.brand,
      price: i.price,
      qty: i.qty,
    })),
    totals,
    shipping,
    status: "Order Received",
    stageIndex: 0,
    stages: [
      "Order Received",
      "Processing",
      "Shipped",
      "Out for Delivery",
      "Delivered",
    ],
    createdAt: new Date().toISOString(),
  };

  orders.push(order);
  localStorage.setItem("orders", JSON.stringify(orders));

  // Finish up
  closeCheckout();
  cart = [];
  updateCartCount();
  document.getElementById("success-overlay").classList.add("open");

  // Refresh order history UI if present
  if (typeof renderOrderHistory === "function") renderOrderHistory();
}

function closeSuccess() {
  document.getElementById("success-overlay").classList.remove("open");
}

// NOTIFICATIONS

function showToast(type, message) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === "success" ? "✅" : "❌"}</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.cssText = "opacity:0;transform:translateX(20px);transition:.3s";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function toggleWish(btn, id = null) {
  // determine product id
  let pid = id;
  if (pid === null) {
    const idAttr = btn.getAttribute && btn.getAttribute("data-pid");
    pid = idAttr ? parseInt(idAttr, 10) : null;
  }
  if (pid !== null) {
    const now = toggleWishlist(pid);
    if (btn) {
      btn.classList.toggle("active", now);
      btn.textContent = now ? "❤️" : "🤍";
    }
    showToast(
      "success",
      now ? "Added to wishlist! ❤️" : "Removed from wishlist",
    );
    return;
  }
  // fallback when no id provided
  if (!btn) return;
  btn.classList.toggle("active");
  const on = btn.classList.contains("active");
  btn.textContent = on ? "❤️" : "🤍";
  showToast("success", on ? "Added to wishlist! ❤️" : "Removed from wishlist");
}

/* Wishlist helpers stored per-user (or guest) */
function getWishlistKey() {
  const email = window.currentUser && window.currentUser.email;
  return email ? `wishlist_${email}` : "wishlist_guest";
}

function getWishlist() {
  try {
    return JSON.parse(localStorage.getItem(getWishlistKey()) || "[]");
  } catch (e) {
    return [];
  }
}

function isInWishlist(id) {
  const list = getWishlist();
  return list.indexOf(id) !== -1;
}

function saveWishlist(list) {
  localStorage.setItem(getWishlistKey(), JSON.stringify(list));
}

function addToWishlistId(id) {
  const list = getWishlist();
  if (list.indexOf(id) === -1) {
    list.push(id);
    saveWishlist(list);
    return true;
  }
  return false;
}

function removeFromWishlistId(id) {
  let list = getWishlist();
  if (list.indexOf(id) !== -1) {
    list = list.filter((x) => x !== id);
    saveWishlist(list);
    return true;
  }
  return false;
}

function toggleWishlist(id) {
  if (isInWishlist(id)) {
    removeFromWishlistId(id);
    return false;
  }
  addToWishlistId(id);
  return true;
}

function toggleWishlistById(id) {
  const changed = toggleWishlist(id);
  // update modal heart if present
  const mw = document.querySelector(".modal-wish-btn");
  if (mw) mw.textContent = changed ? "❤️" : "🤍";
  // update product wish buttons in grid
  document.querySelectorAll(".product-wish").forEach((el) => {
    const pid = el.getAttribute("data-pid");
    if (pid && parseInt(pid, 10) === id) {
      el.classList.toggle("active", changed);
      el.textContent = changed ? "❤️" : "🤍";
    }
  });
  showToast(
    "success",
    changed ? "Added to wishlist! ❤️" : "Removed from wishlist",
  );
}

function openWishlist() {
  const ids = getWishlist();
  const items = ids.map((i) => products[i]).filter(Boolean);
  const modalInner = document.querySelector("#modal-overlay .modal-inner");
  if (!modalInner) return;
  modalInner.innerHTML = `<div style="padding:20px;grid-column:1/-1">
    <h2>My Wishlist</h2>
    <div style="margin-top:12px">${items.length ? items.map((p) => `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px;border-bottom:1px solid var(--border)"><div style="display:flex;gap:12px;align-items:center"><img src="${p.image}" style="width:72px;height:48px;object-fit:cover" onerror="this.style.display='none'"> <div><b>${p.brand} ${p.name}</b><div style="color:var(--muted);font-size:13px">₵${p.price.toFixed(2)}</div></div></div><div><button class="btn" onclick="openProductModal(${p.id});return false">View</button> <button class="btn" onclick="toggleWishlistById(${p.id})">Remove</button></div></div>`).join("") : '<div style="color:var(--muted)">Your wishlist is empty.</div>'}</div>
    </div>`;
  document.getElementById("modal-overlay").classList.add("open");
}

function openPolicy(type) {
  const modalInner = document.querySelector("#modal-overlay .modal-inner");
  if (!modalInner) return;
  const title = type === "privacy" ? "Privacy Policy" : "Terms of Service";
  const body =
    type === "privacy"
      ? `<p>Your privacy is important. This demo does not share data. (Sample policy text.)</p>`
      : `<p>These are the terms of service for VoltX demo. Use at your own risk. (Sample terms.)</p>`;
  modalInner.innerHTML = `<div style="padding:20px;grid-column:1/-1"><h2>${title}</h2>${body}<div style="margin-top:12px;color:var(--muted)">This is a demo page.</div></div>`;
  document.getElementById("modal-overlay").classList.add("open");
}

function openAccountSettings() {
  const user = window.currentUser;
  const modalInner = document.querySelector("#modal-overlay .modal-inner");
  if (!modalInner) return;
  if (!user) {
    modalInner.innerHTML = `<div style="padding:20px;grid-column:1/-1"><div style="color:var(--muted)">Please <a onclick="openAuth('login')">sign in</a> to access account settings.</div></div>`;
    document.getElementById("modal-overlay").classList.add("open");
    return;
  }
  modalInner.innerHTML = `
    <div style="padding:20px;grid-column:1/-1">
      <h2>Account Settings</h2>
      <div style="margin-top:12px">
        <label>First Name</label>
        <input id="acc-first" value="${user.firstName}" />
      </div>
      <div style="margin-top:8px">
        <label>Last Name</label>
        <input id="acc-last" value="${user.lastName}" />
      </div>
      <div style="margin-top:8px">
        <label>Change Password (leave blank to keep)</label>
        <input id="acc-pass" type="password" placeholder="New password" />
      </div>
      <div style="margin-top:12px">
        <button class="btn btn-primary" onclick="saveAccountSettings()">Save</button>
      </div>
    </div>`;
  document.getElementById("modal-overlay").classList.add("open");
}

/* ── Orders (modal) ── */
function openOrders() {
  const orders = JSON.parse(localStorage.getItem("orders") || "[]");
  const userEmail = (window.currentUser && window.currentUser.email) || null;
  const myOrders = orders
    .filter((o) =>
      userEmail ? o.userEmail === userEmail : o.userEmail == null,
    )
    .reverse();

  const modalInner = document.querySelector("#modal-overlay .modal-inner");
  if (!modalInner) return;

  if (!myOrders.length) {
    modalInner.innerHTML = `<div style="padding:20px;grid-column:1/-1"><h2>My Orders</h2><div style="color:var(--muted);margin-top:8px">No orders yet. Place an order and it will appear here.</div></div>`;
    document.getElementById("modal-overlay").classList.add("open");
    return;
  }

  const listHtml = myOrders
    .map((o) => {
      const date = new Date(o.createdAt).toLocaleString();
      const itemsHtml = o.items
        .map(
          (it) =>
            `<div style="font-size:13px;color:var(--muted);display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><a href="#" onclick="openProductModal(${it.id});return false;" style="color:var(--accent);text-decoration:underline">${it.brand} ${it.name}</a><span>×${it.qty} · ₵${(it.price * it.qty).toFixed(2)}</span></div>`,
        )
        .join("");
      const progress = Math.round(
        (o.stageIndex / Math.max(1, o.stages.length - 1)) * 100,
      );
      return `
        <div class="order-card">
          <div class="order-head"><div><b>${o.ref}</b> · <span style="color:var(--muted)">${date}</span></div><div><b>₵${o.totals.total.toFixed(2)}</b></div></div>
          <div style="margin-top:8px">${itemsHtml}</div>
          <div class="order-shipping" style="margin-top:8px">Ship to: ${o.shipping.address}, ${o.shipping.city} · ${o.shipping.country}</div>
          <div style="margin-top:8px" class="order-status">
            <div class="status-name">Status: <b>${o.status}</b></div>
            <div class="status-bar"><div class="status-fill" style="width:${progress}%;"></div></div>
            <div style="margin-top:6px"><button class="btn" onclick="trackOrder('${o.ref}')">Track</button></div>
          </div>
        </div>
      `;
    })
    .join("");

  modalInner.innerHTML = `<div style="padding:20px;grid-column:1/-1"><h2>My Orders</h2><div style="margin-top:12px">${listHtml}</div></div>`;
  document.getElementById("modal-overlay").classList.add("open");
}

function saveAccountSettings() {
  const fn = document.getElementById("acc-first").value.trim();
  const ln = document.getElementById("acc-last").value.trim();
  const pw = document.getElementById("acc-pass").value;
  if (!window.currentUser) return showToast("error", "No user signed in");
  const users = JSON.parse(localStorage.getItem("voltx_users") || "[]");
  const idx = users.findIndex((u) => u.email === window.currentUser.email);
  if (idx === -1) return showToast("error", "User record not found");
  if (fn) users[idx].firstName = fn;
  if (ln) users[idx].lastName = ln;
  if (pw) users[idx].password = btoa(pw);
  localStorage.setItem("voltx_users", JSON.stringify(users));
  // update session
  window.currentUser = users[idx];
  localStorage.setItem("voltx_session", JSON.stringify(users[idx]));
  updateNavForUser();
  showToast("success", "Account updated");
  document.getElementById("modal-overlay").classList.remove("open");
}

function subscribeNewsletter() {
  const email = document.getElementById("nlEmail").value.trim();
  if (!email || !email.includes("@")) {
    showToast("error", "Please enter a valid email address.");
    return;
  }
  showToast(
    "success",
    "🎉 Subscribed! Check your inbox for your welcome discount.",
  );
  document.getElementById("nlEmail").value = "";
}

//  DEAL COUNTDOWN TIMER

let timerSeconds = 8 * 3600 + 34 * 60 + 59;

function updateTimer() {
  timerSeconds--;
  if (timerSeconds < 0) timerSeconds = 86399;
  const h = Math.floor(timerSeconds / 3600);
  const m = Math.floor((timerSeconds % 3600) / 60);
  const s = timerSeconds % 60;
  document.getElementById("dh").textContent = String(h).padStart(2, "0");
  document.getElementById("dm").textContent = String(m).padStart(2, "0");
  document.getElementById("ds").textContent = String(s).padStart(2, "0");
}

setInterval(updateTimer, 1000);

//  SMOOTH SCROLL

function smoothGo(selector, linkEl) {
  const target = document.querySelector(selector);
  if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  if (linkEl) {
    document
      .querySelectorAll(".nav-links a")
      .forEach((a) => a.classList.remove("active"));
    linkEl.classList.add("active");
  }
}
