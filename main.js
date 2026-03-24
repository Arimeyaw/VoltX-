let orderHistory = JSON.parse(localStorage.getItem("orders")) || [];
let currentFilter = "all";
let currentSort = "default";
let currentCategory = "all";

/* ── Helper: build product image HTML ── */
function productImgHTML(p) {
  return `
    <img
      src="${p.image}"
      alt="${p.brand} ${p.name}"
      onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
    />
    <span class="img-fallback">${p.emoji}</span>
  `;
}

function renderProducts() {
  let items = [...products];

  const searchInput = document.getElementById("searchInput");
  const query = searchInput ? searchInput.value.toLowerCase() : "";

  // Search
  if (query) {
    items = items.filter((p) =>
      (p.name + p.brand + p.category).toLowerCase().includes(query),
    );
  }

  // Category
  if (currentCategory !== "all") {
    items = items.filter((p) => p.category === currentCategory);
  }

  // Filters
  if (currentFilter === "sale")
    items = items.filter((p) => p.original !== null);
  if (currentFilter === "new") items = items.filter((p) => p.tag === "new");
  if (currentFilter === "top") items = items.filter((p) => p.rating >= 4.7);

  // Sorting
  if (currentSort === "price-asc") items.sort((a, b) => a.price - b.price);
  if (currentSort === "price-desc") items.sort((a, b) => b.price - a.price);
  if (currentSort === "rating") items.sort((a, b) => b.rating - a.rating);

  const grid = document.getElementById("productsGrid");

  if (!grid) return;

  if (!items.length) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--muted)">
        <div style="font-size:50px;margin-bottom:14px"><i class="fas fa-search"></i></div>
        <div>No products found.</div>
      </div>`;
    return;
  }

  grid.innerHTML = items
    .map(
      (p) => `
    <div class="product-card">

      <div class="product-img" onclick="openProductModal(${p.id})">
        <div class="product-badges">
          ${p.original ? '<span class="badge badge-red">SALE</span>' : ""}
          ${p.tag === "new" ? '<span class="badge badge-purple">NEW</span>' : ""}
          ${p.tag === "top" ? '<span class="badge">TOP</span>' : ""}
        </div>
        ${productImgHTML(p)}
        <div data-pid="${p.id}" class="product-wish ${isInWishlist && isInWishlist(p.id) ? "active" : ""}" onclick="event.stopPropagation(); toggleWish(this, ${p.id})">${typeof isInWishlist === "function" && isInWishlist(p.id) ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>'}</div>
      </div>

      <div class="product-body">
        <div class="product-brand">${p.brand}</div>
        <div class="product-name" onclick="openProductModal(${p.id})">${p.name}</div>
        <div class="product-rating">
          <span class="stars">${"★".repeat(Math.floor(p.rating))}${"☆".repeat(5 - Math.floor(p.rating))}</span>
          ${p.rating} <span>(${p.reviews.toLocaleString()})</span>
        </div>

        <div class="product-footer">
          <div class="product-price">
            ₵${p.price.toFixed(2)}
            ${p.original ? `<s>₵${p.original.toFixed(2)}</s>` : ""}
          </div>
          <button class="add-btn" onclick="addToCart(${p.id})">+</button>
        </div>
      </div>

      <div class="quick-add" onclick="addToCart(${p.id})">
        <i class="fas fa-bolt"></i> Quick Add to Cart
      </div>

    </div>
  `,
    )
    .join("");
}

/* ── Filters & Controls ── */
function filterCat(category, el) {
  currentCategory = category;
  document
    .querySelectorAll(".cat-card")
    .forEach((c) => c.classList.remove("active"));
  el.classList.add("active");
  renderProducts();
}

function setFilter(filter, el) {
  currentFilter = filter;
  document
    .querySelectorAll(".filter-btn")
    .forEach((b) => b.classList.remove("active"));
  el.classList.add("active");
  renderProducts();
}

function sortProducts(value) {
  currentSort = value;
  renderProducts();
}

function filterProducts() {
  renderProducts();
}

document.addEventListener("DOMContentLoaded", () => {
  // Load products
  renderProducts();
  loadHeroImage();
  loadDealImage();

  // 🌗 DARK MODE
  const toggleBtn = document.getElementById("themeToggle");

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      document.body.classList.toggle("light");

      localStorage.setItem(
        "theme",
        document.body.classList.contains("dark") ? "light" : "dark",
      );
    });

    if (localStorage.getItem("theme") === "light") {
      document.body.classList.add("light");
    }
  }
});

/* ── Render Order History for current user ── */
function renderOrderHistory() {
  const container = document.getElementById("orderHistory");
  if (!container) return;

  const orders = JSON.parse(localStorage.getItem("orders") || "[]");
  const userEmail = (window.currentUser && window.currentUser.email) || null;

  // If user is signed in, show their orders; otherwise show guest orders (userEmail == null)
  const myOrders = orders
    .filter((o) =>
      userEmail ? o.userEmail === userEmail : o.userEmail == null,
    )
    .reverse();
  if (!myOrders.length) {
    container.innerHTML = `
      <div style="padding:20px;text-align:center;color:var(--muted)">
        <div style="font-size:28px"><i class="fas fa-box"></i></div>
        <div>No orders yet. Place an order and it will appear here.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = myOrders
    .map((o) => {
      const date = new Date(o.createdAt).toLocaleString();
      const itemsHtml = o.items
        .map(
          (it) => `
          <div style="font-size:13px;color:var(--muted);display:flex;justify-content:space-between;align-items:center">
            <a href="#" onclick="openProductModal(${it.id});return false;" style="color:var(--accent);text-decoration:underline">${it.brand} ${it.name}</a>
            <span>×${it.qty} · ₵${(it.price * it.qty).toFixed(2)}</span>
          </div>
        `,
        )
        .join("");
      const progress = Math.round(
        (o.stageIndex / Math.max(1, o.stages.length - 1)) * 100,
      );
      return `
      <div class="order-card">
        <div class="order-head">
          <div><b>${o.ref}</b> · <span style="color:var(--muted)">${date}</span></div>
          <div><b>₵${o.totals.total.toFixed(2)}</b></div>
        </div>
        <div class="order-items">${itemsHtml}</div>
        <div class="order-shipping">Ship to: ${o.shipping.address}, ${o.shipping.city} · ${o.shipping.country}</div>
        <div class="order-status">
          <div class="status-name">Status: <b>${o.status}</b></div>
          <div class="status-bar"><div class="status-fill" style="width:${progress}%;"></div></div>
          <div style="margin-top:6px"><button class="btn" onclick="trackOrder('${o.ref}')">Track</button></div>
        </div>
      </div>
    `;
    })
    .join("");
}

/* ── Simple tracking view — expand order stages inline ── */
function trackOrder(ref) {
  const orders = JSON.parse(localStorage.getItem("orders") || "[]");
  const o = orders.find((x) => x.ref === ref);
  if (!o) {
    showToast("error", "Order not found");
    return;
  }
  // Build stage UI
  const stagesHtml = o.stages
    .map((s, idx) => {
      const cls = idx <= o.stageIndex ? "stage done" : "stage";
      return `<div class="track-stage ${cls}"><div class="dot"></div><div class="stage-label">${s}</div></div>`;
    })
    .join("");

  // Prefer showing tracking inside the product modal if available
  const modalInner = document.querySelector("#modal-overlay .modal-inner");
  if (modalInner) {
    modalInner.innerHTML = `
      <div style="padding:12px;max-width:900px;margin:0 auto">
        <button class="btn" onclick="openOrders()">← Back to Orders</button>
        <h3 style="margin-top:12px">Tracking ${o.ref}</h3>
        <div style="margin-top:8px">${stagesHtml}</div>
        <div style="margin-top:12px;color:var(--muted)">Placed: ${new Date(o.createdAt).toLocaleString()}</div>
      </div>
    `;
    document.getElementById("modal-overlay").classList.add("open");
    // start polling localStorage for order updates so user sees real-time changes
    try {
      // clear previous
      if (window.__trackingIntervalId) {
        clearInterval(window.__trackingIntervalId);
        window.__trackingIntervalId = null;
        window.__trackingRef = null;
      }
      window.__trackingRef = ref;
      window.__trackingIntervalId = setInterval(() => {
        const ordersNow = JSON.parse(localStorage.getItem("orders") || "[]");
        const updated = ordersNow.find((x) => x.ref === ref);
        if (!updated) {
          showToast("error", "Order was removed");
          clearInterval(window.__trackingIntervalId);
          window.__trackingIntervalId = null;
          return;
        }
        // if changed, re-render tracking UI inside modal
        if (
          updated.stageIndex !== o.stageIndex ||
          updated.status !== o.status
        ) {
          const newStagesHtml = updated.stages
            .map((s, idx) => {
              const cls = idx <= updated.stageIndex ? "stage done" : "stage";
              return `<div class="track-stage ${cls}"><div class="dot"></div><div class="stage-label">${s}</div></div>`;
            })
            .join("");
          const modalInnerNow = document.querySelector(
            "#modal-overlay .modal-inner",
          );
          if (modalInnerNow) {
            modalInnerNow.innerHTML = `
              <div style="padding:12px;max-width:900px;margin:0 auto">
                <button class="btn" onclick="openOrders()">← Back to Orders</button>
                <h3 style="margin-top:12px">Tracking ${updated.ref}</h3>
                <div style="margin-top:8px">${newStagesHtml}</div>
                <div style="margin-top:12px;color:var(--muted)">Placed: ${new Date(updated.createdAt).toLocaleString()}</div>
              </div>
            `;
          }
          // update local reference 'o' so further diffs compare correctly
          o.stageIndex = updated.stageIndex;
          o.status = updated.status;
        }
        // stop polling when delivered
        if (updated.stageIndex >= updated.stages.length - 1) {
          clearInterval(window.__trackingIntervalId);
          window.__trackingIntervalId = null;
        }
      }, 2500);
    } catch (e) {}
    return;
  }

  // Fallback: render inline into orderHistory section
  const container = document.getElementById("orderHistory");
  if (container) {
    container.innerHTML = `
      <div style="padding:12px;max-width:900px;margin:0 auto">
        <button class="btn" onclick="renderOrderHistory()">← Back to Orders</button>
        <h3 style="margin-top:12px">Tracking ${o.ref}</h3>
        <div style="margin-top:8px">${stagesHtml}</div>
        <div style="margin-top:12px;color:var(--muted)">Placed: ${new Date(o.createdAt).toLocaleString()}</div>
      </div>
    `;
  }
}
