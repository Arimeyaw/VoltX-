// Admin JS: manage orders stored in localStorage

// Fallback toast for admin page (admin.html doesn't load ui.js)
if (typeof showToast !== "function") {
  function showToast(type, message) {
    // simple alert fallback
    alert(message);
  }
}
document.addEventListener("DOMContentLoaded", () => {
  // Admin access guard: only allow admin@voltx.com session
  try {
    const sess = JSON.parse(localStorage.getItem("voltx_session") || "null");
    if (
      !sess ||
      !sess.email ||
      sess.email.toLowerCase() !== "admin@voltx.com"
    ) {
      alert("Access denied. Admins only.");
      window.location.href = "index.html";
      return;
    }
  } catch (e) {
    // fallback redirect
    window.location.href = "index.html";
    return;
  }
  renderAdminOrders();
  const refreshBtn = document.getElementById("refreshProducts");
  if (refreshBtn) refreshBtn.addEventListener("click", renderAdminOrders);
  // products management
  loadAdminProducts();
  renderProductsTable();
  const openAddBtn = document.getElementById("openAdd");
  if (openAddBtn)
    openAddBtn.addEventListener(
      "click",
      () => (document.getElementById("addForm").style.display = "block"),
    );
  const cancelAdd = document.getElementById("cancelAdd");
  if (cancelAdd)
    cancelAdd.addEventListener(
      "click",
      () => (document.getElementById("addForm").style.display = "none"),
    );
  const addBtn = document.getElementById("addProductBtn");
  if (addBtn) addBtn.addEventListener("click", adminAddProduct);
});

function renderAdminOrders() {
  const container = document.getElementById("ordersList");
  if (!container) return;
  const orders = JSON.parse(localStorage.getItem("orders") || "[]")
    .slice()
    .reverse();
  if (!orders.length) {
    container.innerHTML = `<div style="padding:20px;color:var(--muted)">No orders placed yet.</div>`;
    return;
  }

  container.innerHTML = orders
    .map((o) => {
      const date = new Date(o.createdAt).toLocaleString();
      const itemsHtml = o.items
        .map(
          (it) =>
            `<div>${it.brand} ${it.name} ×${it.qty} — ₵${(it.price * it.qty).toFixed(2)}</div>`,
        )
        .join("");
      const progress = Math.round(
        (o.stageIndex / Math.max(1, o.stages.length - 1)) * 100,
      );
      return `
      <div class="admin-order">
        <div class="order-head">
          <div><b>${o.ref}</b> · <span class="small">${o.userEmail || "Guest"}</span> · <span class="small">${date}</span></div>
          <div><b>₵${o.totals.total.toFixed(2)}</b></div>
        </div>
        <div class="order-items small">${itemsHtml}</div>
        <div class="order-shipping small">Ship: ${o.shipping.address}, ${o.shipping.city} · ${o.shipping.country}</div>
        <div style="margin-top:8px">
          <div style="height:8px;background:var(--bg3);border-radius:8px;overflow:hidden"><div style="width:${progress}%;height:100%;background:linear-gradient(90deg,var(--accent),var(--accent3))"></div></div>
        </div>
        <div class="order-actions">
          <button class="btn" onclick="adminViewOrder('${o.ref}')">View</button>
          <button class="btn btn-primary" onclick="adminAdvance('${o.ref}')">Advance Stage</button>
          <button class="btn" onclick="adminSetDelivered('${o.ref}')">Mark Delivered</button>
          <button class="btn" onclick="adminDelete('${o.ref}')">Delete</button>
        </div>
      </div>
    `;
    })
    .join("");
}

/* ── Products management for admin ── */
let adminProducts = [];

function loadAdminProducts() {
  const saved = JSON.parse(localStorage.getItem("admin_products") || "null");
  if (saved && Array.isArray(saved)) {
    adminProducts = saved;
    // overwrite global products reference if present
    if (window.products) window.products = adminProducts;
  } else if (window.products) {
    // start from bundled products
    adminProducts = window.products.slice();
  } else {
    adminProducts = [];
  }
}

function saveAdminProducts() {
  localStorage.setItem("admin_products", JSON.stringify(adminProducts));
  if (window.products) window.products = adminProducts;
}

function renderProductsTable() {
  const tbody = document.querySelector("#productsTable tbody");
  if (!tbody) return;
  tbody.innerHTML = adminProducts
    .map(
      (p) => `
    <tr>
      <td>${p.id}</td>
      <td style="width:80px"><img src="${p.image}" alt="" style="width:64px;height:40px;object-fit:cover" onerror="this.style.display='none'">${p.emoji || ""}</td>
      <td>${p.brand}</td>
      <td>${p.name}</td>
      <td>${p.category}</td>
      <td>${p.tag || ""}</td>
      <td>₵${p.price.toFixed(2)}</td>
      <td>
        <button class="btn" onclick="adminEditProduct(${p.id})">Edit</button>
        <button class="btn" onclick="adminDeleteProduct(${p.id})">Delete</button>
      </td>
    </tr>
  `,
    )
    .join("");
}

function adminFindIndex(id) {
  return adminProducts.findIndex((p) => p.id === id);
}

function adminEditProduct(id) {
  const idx = adminFindIndex(id);
  if (idx === -1) return showToast("error", "Product not found");
  const p = adminProducts[idx];
  const newName = prompt("Product name", p.name);
  if (newName === null) return;
  const newPrice = prompt("Price (number)", String(p.price));
  if (newPrice === null) return;
  p.name = newName.trim() || p.name;
  const num = parseFloat(newPrice);
  if (!isNaN(num)) p.price = num;
  adminProducts[idx] = p;
  saveAdminProducts();
  renderProductsTable();
  showToast("success", "Product updated");
}

function adminDeleteProduct(id) {
  if (!confirm("Delete this product?")) return;
  const idx = adminFindIndex(id);
  if (idx === -1) return showToast("error", "Product not found");
  adminProducts.splice(idx, 1);
  saveAdminProducts();
  renderProductsTable();
  showToast("success", "Product removed");
}

function adminAddProduct() {
  const brand = document.getElementById("p-brand").value.trim();
  const name = document.getElementById("p-name").value.trim();
  const image = document.getElementById("p-image").value.trim();
  const category =
    document.getElementById("p-category").value.trim() || "general";
  const tag = document.getElementById("p-tag").value.trim() || "";
  const price = parseFloat(document.getElementById("p-price").value.trim());
  if (!brand || !name || isNaN(price))
    return showToast("error", "Please provide brand, name and valid price");
  const newId = adminProducts.reduce((m, p) => Math.max(m, p.id), -1) + 1;
  const newP = {
    id: newId,
    image: image || "",
    emoji: "📦",
    brand,
    name,
    category,
    tag,
    price,
    original: null,
    rating: 4.5,
    reviews: 0,
    desc: "",
    specs: [],
  };
  adminProducts.push(newP);
  saveAdminProducts();
  renderProductsTable();
  document.getElementById("addForm").style.display = "none";
  ["p-brand", "p-name", "p-image", "p-category", "p-tag", "p-price"].forEach(
    (id) => (document.getElementById(id).value = ""),
  );
  showToast("success", "Product added");
}

function findOrder(ref) {
  const orders = JSON.parse(localStorage.getItem("orders") || "[]");
  const idx = orders.findIndex((o) => o.ref === ref);
  return { orders, idx };
}

function adminAdvance(ref) {
  const { orders, idx } = findOrder(ref);
  if (idx === -1) return showToast("error", "Order not found");
  const o = orders[idx];
  if (o.stageIndex < o.stages.length - 1) {
    o.stageIndex++;
    o.status = o.stages[o.stageIndex];
    orders[idx] = o;
    localStorage.setItem("orders", JSON.stringify(orders));
    showToast("success", `Order ${ref} advanced to ${o.status}`);
    renderAdminOrders();
    if (typeof renderOrderHistory === "function") renderOrderHistory();
  } else {
    showToast("success", "Order already at final stage");
  }
}

function adminSetDelivered(ref) {
  const { orders, idx } = findOrder(ref);
  if (idx === -1) return showToast("error", "Order not found");
  const o = orders[idx];
  o.stageIndex = o.stages.length - 1;
  o.status = o.stages[o.stageIndex];
  orders[idx] = o;
  localStorage.setItem("orders", JSON.stringify(orders));
  showToast("success", `Order ${ref} set to ${o.status}`);
  renderAdminOrders();
  if (typeof renderOrderHistory === "function") renderOrderHistory();
}

function adminDelete(ref) {
  if (!confirm(`Delete order ${ref}? This cannot be undone.`)) return;
  const { orders, idx } = findOrder(ref);
  if (idx === -1) return showToast("error", "Order not found");
  orders.splice(idx, 1);
  localStorage.setItem("orders", JSON.stringify(orders));
  showToast("success", `Order ${ref} deleted`);
  renderAdminOrders();
  if (typeof renderOrderHistory === "function") renderOrderHistory();
}

function adminViewOrder(ref) {
  const { orders, idx } = findOrder(ref);
  if (idx === -1) return showToast("error", "Order not found");
  const o = orders[idx];
  // Open a quick view using a new window area — reuse product modal where possible
  const details = `Order ${o.ref}\nStatus: ${o.status}\nItems:\n${o.items.map((i) => `- ${i.brand} ${i.name} ×${i.qty}`).join("\n")}`;
  alert(details);
}
