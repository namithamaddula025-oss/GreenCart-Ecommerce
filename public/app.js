const $ = (selector) => document.querySelector(selector);
const state = { products: [], categories: [], cart: readCart(), category: "All", search: "" };
const money = (amount) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]));
function readCart() { try { return JSON.parse(localStorage.getItem("greencart-cart") || "[]"); } catch { return []; } }
function saveCart() { localStorage.setItem("greencart-cart", JSON.stringify(state.cart)); renderCart(); }
function toast(message) { const el = $("#toast"); el.textContent = message; el.classList.add("show"); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove("show"), 2600); }
async function request(url, options = {}) {
  const response = await fetch(url, { headers: { "Content-Type": "application/json", ...(options.headers || {}) }, ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}
async function init() {
  try {
    [state.products, state.categories] = await Promise.all([request("/api/products"), request("/api/categories")]);
    renderCategories(); renderProducts(); renderCart();
  } catch (error) {
    $("#productGrid").innerHTML = `<p class="loading">Could not load products. Start the server and refresh this page.<br>${escapeHTML(error.message)}</p>`;
  }
}
function renderCategories() {
  $("#categoryFilters").innerHTML = ["All", ...state.categories].map(category =>
    `<button class="filter-chip ${category === state.category ? "active" : ""}" data-category="${escapeHTML(category)}">${escapeHTML(category === "All" ? "All products" : category)}</button>`
  ).join("");
}
function renderProducts() {
  const filtered = state.products.filter(p => (state.category === "All" || p.category === state.category) &&
    `${p.name} ${p.description} ${p.category}`.toLowerCase().includes(state.search.toLowerCase()));
  $("#emptyState").classList.toggle("hidden", filtered.length > 0);
  $("#productGrid").innerHTML = filtered.map(p => `
    <article class="product-card">
      <div class="product-image-wrap">
        <img class="product-image" src="${escapeHTML(p.image)}" alt="${escapeHTML(p.name)}" loading="lazy" onerror="this.src='https://placehold.co/600x700/e8eee2/174b38?text=GreenCart'">
        <span class="product-badge">Mindful pick</span>
        <button class="quick-add" data-add="${p.id}">＋ Add to bag</button>
      </div>
      <div class="product-info">
        <span class="product-category">${escapeHTML(p.category)}</span>
        <div class="product-title-row"><h3 class="product-title">${escapeHTML(p.name)}</h3><span class="product-price">${money(p.price)}</span></div>
        <p class="product-desc">${escapeHTML(p.description)}</p>
      </div>
    </article>`).join("");
}
function addToCart(id) {
  const product = state.products.find(p => p.id === Number(id));
  if (!product) return;
  const existing = state.cart.find(i => i.id === product.id);
  if (existing) existing.quantity = Math.min(existing.quantity + 1, product.stock);
  else state.cart.push({ id: product.id, quantity: 1 });
  saveCart(); toast(`${product.name} added to your bag.`);
}
function cartDetails() {
  return state.cart.map(item => {
    const product = state.products.find(p => p.id === item.id);
    return product ? { ...product, quantity: item.quantity } : null;
  }).filter(Boolean);
}
function renderCart() {
  const items = cartDetails();
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  $("#cartCount").textContent = count;
  $("#cartTotal").textContent = money(total);
  $("#checkoutTotal").textContent = money(total);
  $("#cartItems").innerHTML = items.length ? items.map(item => `
    <div class="cart-row">
      <img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}" onerror="this.src='https://placehold.co/200x240/e8eee2/174b38?text=Item'">
      <div><h3>${escapeHTML(item.name)}</h3><p>${money(item.price)}</p>
        <div class="qty-controls"><button data-qty="${item.id}" data-delta="-1" aria-label="Decrease quantity">−</button><span>${item.quantity}</span><button data-qty="${item.id}" data-delta="1" aria-label="Increase quantity">+</button></div>
        <button class="remove-item" data-remove="${item.id}">Remove</button>
      </div><strong>${money(item.price * item.quantity)}</strong>
    </div>`).join("") : `<div class="cart-empty">Your bag is waiting for something good. 🌿<br><br><a href="#shop" id="cartShopLink">Explore the collection ↗</a></div>`;
  const disabled = !items.length;
  $("#checkoutOpen").disabled = disabled;
  $("#checkoutOpen").style.opacity = disabled ? ".5" : "1";
}
function openCart() { $("#overlay").classList.remove("hidden"); $("#cartDrawer").classList.add("open"); $("#cartDrawer").setAttribute("aria-hidden","false"); document.body.style.overflow="hidden"; }
function closeCart() { $("#overlay").classList.add("hidden"); $("#cartDrawer").classList.remove("open"); $("#cartDrawer").setAttribute("aria-hidden","true"); document.body.style.overflow=""; }
function openCheckout() {
  if (!state.cart.length) return toast("Add an item to your bag first.");
  closeCart(); $("#checkoutModal").classList.remove("hidden"); $("#orderSuccess").classList.add("hidden"); $("#checkoutForm").classList.remove("hidden"); $("#checkoutTotal").textContent = money(cartDetails().reduce((s,p)=>s+p.price*p.quantity,0)); document.body.style.overflow="hidden";
}
function closeCheckout() { $("#checkoutModal").classList.add("hidden"); document.body.style.overflow=""; }
$("#categoryFilters").addEventListener("click", e => { const button = e.target.closest("[data-category]"); if (!button) return; state.category = button.dataset.category; renderCategories(); renderProducts(); });
$("#productGrid").addEventListener("click", e => { const button = e.target.closest("[data-add]"); if (button) addToCart(button.dataset.add); });
$("#searchInput").addEventListener("input", e => { state.search = e.target.value; renderProducts(); });
$("#searchFocus").addEventListener("click", () => { $("#shop").scrollIntoView({ behavior: "smooth" }); setTimeout(() => $("#searchInput").focus(), 350); });
$("#cartOpen").addEventListener("click", openCart);
$("#cartClose").addEventListener("click", closeCart);
$("#overlay").addEventListener("click", closeCart);
$("#cartItems").addEventListener("click", e => {
  const qty = e.target.closest("[data-qty]");
  const remove = e.target.closest("[data-remove]");
  if (qty) {
    const item = state.cart.find(i => i.id === Number(qty.dataset.qty));
    if (item) { item.quantity += Number(qty.dataset.delta); if (item.quantity < 1) state.cart = state.cart.filter(i => i.id !== item.id); }
    saveCart();
  }
  if (remove) { state.cart = state.cart.filter(i => i.id !== Number(remove.dataset.remove)); saveCart(); }
  if (e.target.closest("#cartShopLink")) closeCart();
});
$("#checkoutOpen").addEventListener("click", openCheckout);
$("#checkoutClose").addEventListener("click", closeCheckout);
$("#checkoutForm").addEventListener("submit", async e => {
  e.preventDefault();
  const button = $("#placeOrder"); button.disabled = true; button.textContent = "Placing order...";
  const form = new FormData(e.currentTarget);
  try {
    const result = await request("/api/orders", { method: "POST", body: JSON.stringify({
      customerName: form.get("customerName"), email: form.get("email"), address: form.get("address"),
      items: state.cart.map(item => ({ id: item.id, quantity: item.quantity }))
    })});
    state.cart = []; saveCart();
    $("#checkoutForm").classList.add("hidden");
    $("#orderSuccess").innerHTML = `<strong>Order placed. 🌱</strong><br>${escapeHTML(result.message)}<br>Your demo order number is <strong>#GC${result.orderId}</strong>.<br>Total: <strong>${money(result.total)}</strong><br><br>No payment was collected. Thank you for choosing a more mindful shop!`;
    $("#orderSuccess").classList.remove("hidden");
  } catch (error) { toast(error.message); }
  finally { button.disabled = false; button.innerHTML = 'Place demo order <span>→</span>'; }
});
$("#adminOpen").addEventListener("click", loadAdmin);
$("#adminClose").addEventListener("click", () => { $("#adminModal").classList.add("hidden"); document.body.style.overflow=""; });
async function loadAdmin() {
  $("#adminModal").classList.remove("hidden"); $("#adminOrders").innerHTML = '<p class="loading">Loading orders...</p>'; document.body.style.overflow="hidden";
  try {
    const orders = await request("/api/orders");
    $("#adminOrders").innerHTML = orders.length ? orders.map(o => `
      <div class="admin-order"><div class="admin-order-top"><strong>Order #GC${o.id} · ${escapeHTML(o.customerName)}</strong><strong>${money(o.total)}</strong></div>
      <p>${escapeHTML(o.email)}<br>${escapeHTML(o.address)}<br>${o.items.map(i => `${escapeHTML(i.name)} × ${i.quantity}`).join(", ")}<br>${escapeHTML(o.createdAt)}</p>
      <label>Status: <select data-status="${o.id}">${["Placed","Processing","Shipped","Delivered","Cancelled"].map(s=>`<option ${o.status===s?"selected":""}>${s}</option>`).join("")}</select></label></div>`).join("") : '<p class="loading">No orders yet. Place a demo order to see it here.</p>';
  } catch (error) { $("#adminOrders").textContent = error.message; }
}
$("#adminOrders").addEventListener("change", async e => {
  const select = e.target.closest("[data-status]"); if (!select) return;
  try { await request(`/api/orders/${select.dataset.status}/status`, { method:"PATCH", body:JSON.stringify({status:select.value}) }); toast("Order status updated."); }
  catch (error) { toast(error.message); }
});
document.addEventListener("keydown", e => { if (e.key === "Escape") { closeCart(); closeCheckout(); $("#adminModal").classList.add("hidden"); document.body.style.overflow=""; } });
init();
