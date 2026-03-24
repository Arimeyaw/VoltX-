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
        <div style="font-size:50px;margin-bottom:14px">🔍</div>
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
        <div class="product-wish" onclick="event.stopPropagation(); toggleWish(this)">🤍</div>
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
        ⚡ Quick Add to Cart
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
  renderOrderHistory();

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

function renderOrderHistory() {
  const container = document.getElementById("orderHistory");
  if (!container) return;

  const orders = JSON.parse(localStorage.getItem("orders")) || [];

  if (!orders.length) {
    container.innerHTML = "<p>No orders yet.</p>";
    return;
  }

  container.innerHTML = orders
    .map(
      (order) => `
    <div style="
      border:1px solid #444;
      padding:15px;
      margin:10px 0;
      border-radius:10px;
      background:#111;
    ">
      <h4>📦 ${order.id}</h4>
      <p>Status: ${order.status}</p>
      <p>Items: ${order.items.length}</p>
      <p style="color:#00ffa6;font-weight:bold;">
        💰 Total: ₵${order.total}
      </p>
    </div>
  `,
    )
    .join("");
}