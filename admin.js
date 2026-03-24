const ADMIN_EMAIL = "admin@voltx.com";
const STORAGE_KEYS = {
  session: "voltx_session",
  users: "voltx_users",
  products: "admin_products",
  orders: "orders",
  accessLog: "admin_access_log",
};
const DEFAULT_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80";

let state = {
  products: [],
  orders: [],
  logs: [],
  search: "",
};

function applySavedTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") document.body.classList.add("light");
  else document.body.classList.remove("light");
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : parsed;
  } catch (err) {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function getSession() {
  return readJSON(STORAGE_KEYS.session, null);
}

function isAdminSession(sess) {
  return Boolean(
    sess && sess.email && sess.email.toLowerCase() === ADMIN_EMAIL,
  );
}

function ensureDemoAdminExists() {
  const users = asArray(readJSON(STORAGE_KEYS.users, []));
  if (!users.find((u) => (u.email || "").toLowerCase() === ADMIN_EMAIL)) {
    users.push({
      firstName: "Admin",
      lastName: "User",
      email: ADMIN_EMAIL,
      password: btoa("admin1234"),
      createdAt: new Date().toISOString(),
    });
    writeJSON(STORAGE_KEYS.users, users);
  }
}

function logAccess(outcome, note, email) {
  const logs = asArray(readJSON(STORAGE_KEYS.accessLog, []));
  logs.push({
    ts: new Date().toISOString(),
    outcome,
    note: note || "",
    email: email || null,
  });
  writeJSON(STORAGE_KEYS.accessLog, logs);
}

function normalizeProduct(p, fallbackId) {
  const price = Number(p && p.price);
  const image =
    p && typeof p.image === "string" && p.image.trim()
      ? p.image.trim()
      : DEFAULT_PRODUCT_IMAGE;
  return {
    id: Number.isFinite(Number(p && p.id)) ? Number(p.id) : fallbackId,
    brand: (p && p.brand) || "Unknown",
    name: (p && p.name) || "Untitled",
    image,
    category: (p && p.category) || "general",
    tag: (p && p.tag) || "",
    price: Number.isFinite(price) ? price : 0,
    emoji: (p && p.emoji) || "",
    original: p && p.original != null ? p.original : null,
    rating: Number(p && p.rating) || 0,
    reviews: Number(p && p.reviews) || 0,
    desc: (p && p.desc) || "",
    specs: Array.isArray(p && p.specs) ? p.specs : [],
  };
}

function normalizeOrder(o) {
  const fallbackStages = ["Order Placed", "Preparing", "Shipped", "Delivered"];
  const stages =
    Array.isArray(o && o.stages) && o.stages.length ? o.stages : fallbackStages;
  const rawStage = Number(o && o.stageIndex);
  const stageIndex = Number.isFinite(rawStage)
    ? Math.min(Math.max(0, rawStage), stages.length - 1)
    : 0;
  const items = Array.isArray(o && o.items) ? o.items : [];
  const shipping = (o && o.shipping) || {};

  let total = Number(o && o.totals && o.totals.total);
  if (!Number.isFinite(total)) {
    total = items.reduce(
      (sum, it) => sum + Number((it && it.price) || 0) * Number((it && it.qty) || 0),
      0,
    );
  }

  return {
    ...o,
    ref: (o && o.ref) || `ORD-${Date.now()}`,
    createdAt: (o && o.createdAt) || new Date().toISOString(),
    userEmail: (o && o.userEmail) || "Guest",
    items,
    stages,
    stageIndex,
    status: (o && o.status) || stages[stageIndex],
    totals: { total },
    shipping: {
      address: shipping.address || "N/A",
      city: shipping.city || "N/A",
      country: shipping.country || "N/A",
    },
  };
}

function syncDataFromStorage() {
  const storedProducts = readJSON(STORAGE_KEYS.products, null);
  const sourceProducts =
    Array.isArray(storedProducts) && storedProducts.length
      ? storedProducts
      : Array.isArray(window.products)
        ? window.products
        : [];

  state.products = asArray(sourceProducts).map((p, idx) =>
    normalizeProduct(p, idx),
  );
  reindexProducts();
  if (!storedProducts) writeJSON(STORAGE_KEYS.products, state.products);

  state.orders = asArray(readJSON(STORAGE_KEYS.orders, []))
    .filter((o) => o && typeof o === "object")
    .map(normalizeOrder)
    .reverse();

  state.logs = asArray(readJSON(STORAGE_KEYS.accessLog, [])).slice().reverse();
}

function reindexProducts() {
  state.products = asArray(state.products).map((p, idx) =>
    normalizeProduct({ ...p, id: idx }, idx),
  );
}

function saveProducts() {
  reindexProducts();
  writeJSON(STORAGE_KEYS.products, state.products);
  if (Array.isArray(window.products)) {
    window.products = state.products.slice();
  }
}

function saveOrders() {
  const forward = state.orders.slice().reverse();
  writeJSON(STORAGE_KEYS.orders, forward);
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function money(v) {
  return `₵${Number(v || 0).toFixed(2)}`;
}

function renderStats() {
  const totalRevenue = state.orders.reduce(
    (sum, o) => sum + Number(o.totals && o.totals.total),
    0,
  );
  const pending = state.orders.filter(
    (o) => o.stageIndex < o.stages.length - 1,
  ).length;

  setText("statProducts", String(state.products.length));
  setText("statOrders", String(state.orders.length));
  setText("statRevenue", money(totalRevenue));
  setText("statPending", String(pending));
}

function productMatchesSearch(p) {
  const q = state.search.trim().toLowerCase();
  if (!q) return true;
  return [p.brand, p.name, p.category, p.tag].some((v) =>
    String(v || "")
      .toLowerCase()
      .includes(q),
  );
}

function renderProducts() {
  const tbody = document.getElementById("adminProductsBody");
  if (!tbody) return;

  const rows = state.products.filter(productMatchesSearch);
  if (!rows.length) {
    tbody.innerHTML =
      '<tr><td colspan="8"><div class="empty-state">No matching products found.</div></td></tr>';
    return;
  }

  tbody.innerHTML = rows
    .map(
      (p) => `
      <tr>
        <td>${p.id}</td>
        <td><img class="table-image" src="${p.image}" alt="${p.brand} ${p.name}" onerror="this.style.display='none'" /></td>
        <td>${p.brand}</td>
        <td>${p.name}</td>
        <td>${p.category}</td>
        <td>${p.tag || "-"}</td>
        <td>${money(p.price)}</td>
        <td>
          <div class="action-row">
            <button class="btn" onclick="editProduct(${p.id})">Edit</button>
            <button class="btn" onclick="deleteProduct(${p.id})">Delete</button>
          </div>
        </td>
      </tr>
    `,
    )
    .join("");
}

function renderOrders() {
  const list = document.getElementById("adminOrdersList");
  if (!list) return;

  if (!state.orders.length) {
    list.innerHTML = '<div class="empty-state">No orders have been placed yet.</div>';
    return;
  }

  list.innerHTML = state.orders
    .map((o) => {
      const date = new Date(o.createdAt);
      const displayDate = Number.isNaN(date.getTime())
        ? "Unknown date"
        : date.toLocaleString();
      const items = o.items
        .map(
          (it) =>
            `${(it && it.brand) || ""} ${(it && it.name) || "Item"} x${Number((it && it.qty) || 0)}`,
        )
        .join(", ");
      const progress = Math.round(
        (o.stageIndex / Math.max(1, o.stages.length - 1)) * 100,
      );

      return `
        <div class="order-card">
          <div class="order-head">
            <strong>${o.ref}</strong>
            <strong>${money(o.totals.total)}</strong>
          </div>
          <div class="order-meta">${o.userEmail} • ${displayDate} • ${o.status}</div>
          <div class="order-items">${items || "No items"}</div>
          <div class="order-ship">Ship to: ${o.shipping.address}, ${o.shipping.city}, ${o.shipping.country}</div>
          <div class="order-progress"><span style="width:${progress}%"></span></div>
          <div class="order-actions">
            <button class="btn btn-primary" onclick="advanceOrder('${o.ref}')">Advance</button>
            <button class="btn" onclick="markDelivered('${o.ref}')">Mark Delivered</button>
            <button class="btn" onclick="deleteOrder('${o.ref}')">Delete</button>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderLogs() {
  const list = document.getElementById("adminAccessLogList");
  if (!list) return;

  if (!state.logs.length) {
    list.innerHTML = '<div class="empty-state">No admin access logs yet.</div>';
    return;
  }

  list.innerHTML = state.logs
    .map(
      (l) => `
      <div class="log-card">
        <div><strong>${String(l.outcome || "unknown").toUpperCase()}</strong> • ${l.email || "guest"}</div>
        <div class="log-note">${l.ts || ""}</div>
        <div class="log-note">${l.note || ""}</div>
      </div>
    `,
    )
    .join("");
}

function renderAll() {
  renderStats();
  renderProducts();
  renderOrders();
  renderLogs();
}

function resetProductForm() {
  ["pBrand", "pName", "pImage", "pCategory", "pTag", "pPrice"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}

function openProductModal() {
  const modal = document.getElementById("productModalBackdrop");
  if (!modal) return;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

function closeProductModal() {
  const modal = document.getElementById("productModalBackdrop");
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

function addProduct() {
  const brand = document.getElementById("pBrand").value.trim();
  const name = document.getElementById("pName").value.trim();
  const image = document.getElementById("pImage").value.trim();
  const category = document.getElementById("pCategory").value.trim() || "general";
  const tag = document.getElementById("pTag").value.trim();
  const price = Number(document.getElementById("pPrice").value);

  if (!brand || !name || !Number.isFinite(price) || price < 0) {
    alert("Please provide brand, name and a valid price.");
    return;
  }

  const nextId = state.products.reduce((max, p) => Math.max(max, Number(p.id) || 0), -1) + 1;
  state.products.push(
    normalizeProduct(
      {
        id: nextId,
        brand,
        name,
        image,
        category,
        tag,
        price,
        original: null,
        rating: 4.5,
        reviews: 0,
        desc: "",
        specs: [],
      },
      nextId,
    ),
  );

  saveProducts();
  state.search = "";
  const searchInput = document.getElementById("productSearch");
  if (searchInput) searchInput.value = "";
  renderAll();
  resetProductForm();
  closeProductModal();
  alert("Product added successfully.");
}

function findProductIndexById(id) {
  return state.products.findIndex((p) => Number(p.id) === Number(id));
}

function editProduct(id) {
  const idx = findProductIndexById(id);
  if (idx === -1) return;

  const product = state.products[idx];
  const newName = prompt("Product name", product.name);
  if (newName === null) return;
  const newPrice = prompt("Price", String(product.price));
  if (newPrice === null) return;

  const price = Number(newPrice);
  if (!Number.isFinite(price) || price < 0) {
    alert("Invalid price.");
    return;
  }

  product.name = newName.trim() || product.name;
  product.price = price;

  state.products[idx] = normalizeProduct(product, product.id);
  saveProducts();
  renderAll();
}

function deleteProduct(id) {
  if (!confirm("Delete this product?")) return;
  const idx = findProductIndexById(id);
  if (idx === -1) return;
  state.products.splice(idx, 1);
  saveProducts();
  renderAll();
}

function restoreDefaultProducts() {
  if (!confirm("Restore the original product catalog? This will replace current admin products.")) return;
  const defaults = Array.isArray(window.__defaultProducts)
    ? window.__defaultProducts
    : [];
  if (!defaults.length) {
    alert("Default products are unavailable in this session.");
    return;
  }
  state.products = defaults.map((p, idx) => normalizeProduct({ ...p, id: idx }, idx));
  saveProducts();
  state.search = "";
  const searchInput = document.getElementById("productSearch");
  if (searchInput) searchInput.value = "";
  renderAll();
  alert("Default products restored.");
}

function findOrderIndexByRef(ref) {
  return state.orders.findIndex((o) => o.ref === ref);
}

function advanceOrder(ref) {
  const idx = findOrderIndexByRef(ref);
  if (idx === -1) return;
  const order = state.orders[idx];
  if (order.stageIndex < order.stages.length - 1) {
    order.stageIndex += 1;
    order.status = order.stages[order.stageIndex];
    state.orders[idx] = normalizeOrder(order);
    saveOrders();
    renderAll();
  }
}

function markDelivered(ref) {
  const idx = findOrderIndexByRef(ref);
  if (idx === -1) return;
  const order = state.orders[idx];
  order.stageIndex = order.stages.length - 1;
  order.status = order.stages[order.stageIndex];
  state.orders[idx] = normalizeOrder(order);
  saveOrders();
  renderAll();
}

function deleteOrder(ref) {
  if (!confirm(`Delete order ${ref}?`)) return;
  const idx = findOrderIndexByRef(ref);
  if (idx === -1) return;
  state.orders.splice(idx, 1);
  saveOrders();
  renderAll();
}

function clearLogs() {
  if (!confirm("Clear all admin access logs?")) return;
  state.logs = [];
  writeJSON(STORAGE_KEYS.accessLog, []);
  renderLogs();
}

function logoutAdmin() {
  localStorage.removeItem(STORAGE_KEYS.session);
  window.location.href = "index.html";
}

function showDeniedState() {
  const app = document.getElementById("adminApp");
  if (!app) return;
  app.innerHTML = `
    <section class="denied">
      <h1>Access Denied</h1>
      <p>Only admin accounts can access this dashboard.</p>
      <p>Use <strong>${ADMIN_EMAIL}</strong> to sign in.</p>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:12px">
        <a class="btn" href="index.html">Return to Store</a>
        <button class="btn btn-primary" id="useDemoAdminBtn">Use Demo Admin</button>
      </div>
    </section>
  `;

  const demoBtn = document.getElementById("useDemoAdminBtn");
  if (demoBtn) {
    demoBtn.addEventListener("click", () => {
      ensureDemoAdminExists();
      const users = asArray(readJSON(STORAGE_KEYS.users, []));
      const admin = users.find((u) => (u.email || "").toLowerCase() === ADMIN_EMAIL);
      if (admin) {
        writeJSON(STORAGE_KEYS.session, admin);
        window.location.reload();
      }
    });
  }
}

function bindEvents() {
  const search = document.getElementById("productSearch");
  if (search) {
    search.addEventListener("input", (e) => {
      state.search = e.target.value || "";
      renderProducts();
    });
  }

  const refreshProductsBtn = document.getElementById("refreshProductsBtn");
  if (refreshProductsBtn) {
    refreshProductsBtn.addEventListener("click", () => {
      syncDataFromStorage();
      renderAll();
    });
  }

  const refreshOrdersBtn = document.getElementById("refreshOrdersBtn");
  if (refreshOrdersBtn) {
    refreshOrdersBtn.addEventListener("click", () => {
      syncDataFromStorage();
      renderAll();
    });
  }

  const openModalBtn = document.getElementById("openProductModalBtn");
  if (openModalBtn) openModalBtn.addEventListener("click", openProductModal);

  const closeModalBtn = document.getElementById("closeProductModalBtn");
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeProductModal);

  const modalBackdrop = document.getElementById("productModalBackdrop");
  if (modalBackdrop) {
    modalBackdrop.addEventListener("click", (e) => {
      if (e.target === modalBackdrop) closeProductModal();
    });
  }

  const saveProductBtn = document.getElementById("saveProductBtn");
  if (saveProductBtn) saveProductBtn.addEventListener("click", addProduct);

  const restoreDefaultsBtn = document.getElementById("restoreDefaultsBtn");
  if (restoreDefaultsBtn) {
    restoreDefaultsBtn.addEventListener("click", restoreDefaultProducts);
  }

  const clearLogsBtn = document.getElementById("clearLogsBtn");
  if (clearLogsBtn) clearLogsBtn.addEventListener("click", clearLogs);

  const adminLogoutBtn = document.getElementById("adminLogoutBtn");
  if (adminLogoutBtn) adminLogoutBtn.addEventListener("click", logoutAdmin);
}

function bootAdmin() {
  ensureDemoAdminExists();
  applySavedTheme();

  const session = getSession();
  if (!isAdminSession(session)) {
    logAccess("denied", "admin.js guard", session && session.email);
    showDeniedState();
    return;
  }

  logAccess("allowed", "admin.js guard", session.email);

  syncDataFromStorage();
  bindEvents();
  renderAll();
}

document.addEventListener("DOMContentLoaded", bootAdmin);

window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.advanceOrder = advanceOrder;
window.markDelivered = markDelivered;
window.deleteOrder = deleteOrder;
window.addProduct = addProduct;
window.restoreDefaultProducts = restoreDefaultProducts;
