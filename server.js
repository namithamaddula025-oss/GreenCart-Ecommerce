const express = require("express");
const path = require("path");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 3000;
const db = new Database(process.env.DATABASE_PATH || path.join(__dirname, "greencart.db"));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, category TEXT NOT NULL, description TEXT NOT NULL,
    price REAL NOT NULL, image TEXT NOT NULL, stock INTEGER NOT NULL DEFAULT 20
  );
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL, email TEXT NOT NULL, address TEXT NOT NULL,
    items_json TEXT NOT NULL, total REAL NOT NULL, status TEXT NOT NULL DEFAULT 'Placed',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);
const count = db.prepare("SELECT COUNT(*) AS n FROM products").get().n;
if (!count) {
  const seed = db.prepare(`INSERT INTO products (name,category,description,price,image,stock) VALUES (?,?,?,?,?,?)`);
  const products = [
    ["Reusable Steel Bottle","Daily Essentials","Double-wall stainless steel bottle for everyday hydration.",499,"https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=700&q=80",30],
    ["Organic Cotton Tote","Accessories","A sturdy reusable tote for shopping, books and daily errands.",249,"https://images.unsplash.com/photo-1597484661643-2f5fef640dd1?auto=format&fit=crop&w=700&q=80",25],
    ["Bamboo Toothbrush Set","Personal Care","A simple plastic-free swap for your daily oral-care routine.",199,"https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&w=700&q=80",40],
    ["Plant-Based Soap","Personal Care","Gentle everyday soap with a fresh botanical scent.",149,"https://images.unsplash.com/photo-1607006344380-b6775a0824ce?auto=format&fit=crop&w=700&q=80",35],
    ["Reusable Coffee Cup","Daily Essentials","Lightweight cup for coffee runs and workday breaks.",349,"https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=700&q=80",20],
    ["Seed Starter Kit","Home & Garden","Grow herbs at home with a beginner-friendly seed kit.",299,"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=700&q=80",15],
    ["Natural Jute Basket","Home & Garden","A multipurpose woven basket for tidy shelves and counters.",399,"https://images.unsplash.com/photo-1593085260707-5377ba37f868?auto=format&fit=crop&w=700&q=80",12],
    ["Beeswax Food Wraps","Kitchen","Reusable food wraps designed to help reduce disposable plastic.",279,"https://images.unsplash.com/photo-1604719312566-8912e9c8a213?auto=format&fit=crop&w=700&q=80",18]
  ];
  const tx = db.transaction(rows => rows.forEach(p => seed.run(...p)));
  tx(products);
}

app.get("/api/products", (req, res) => {
  const { q = "", category = "All" } = req.query;
  let rows = db.prepare("SELECT * FROM products WHERE (name LIKE ? OR description LIKE ?) ORDER BY id DESC")
    .all(`%${q}%`, `%${q}%`);
  if (category !== "All") rows = rows.filter(p => p.category === category);
  res.json(rows);
});
app.get("/api/categories", (_req, res) => {
  res.json(db.prepare("SELECT DISTINCT category FROM products ORDER BY category").all().map(x => x.category));
});
app.post("/api/orders", (req, res) => {
  const { customerName, email, address, items } = req.body || {};
  if (!customerName?.trim() || !email?.trim() || !address?.trim() || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: "Please provide your name, email, address and at least one item." });
  }
  const getProduct = db.prepare("SELECT * FROM products WHERE id = ?");
  const normalized = [];
  let total = 0;
  for (const item of items) {
    const product = getProduct.get(Number(item.id));
    const qty = Number(item.quantity);
    if (!product || !Number.isInteger(qty) || qty < 1 || qty > product.stock) {
      return res.status(400).json({ error: "One or more items are unavailable or have an invalid quantity." });
    }
    normalized.push({ id: product.id, name: product.name, price: product.price, quantity: qty });
    total += product.price * qty;
  }
  const result = db.prepare(`INSERT INTO orders (customer_name,email,address,items_json,total) VALUES (?,?,?,?,?)`)
    .run(customerName.trim(), email.trim(), address.trim(), JSON.stringify(normalized), total);
  res.status(201).json({ message: "Order placed successfully!", orderId: result.lastInsertRowid, total });
});
app.get("/api/orders", (_req, res) => {
  const rows = db.prepare("SELECT id, customer_name AS customerName, email, address, items_json AS itemsJson, total, status, created_at AS createdAt FROM orders ORDER BY id DESC").all();
  res.json(rows.map(o => ({ ...o, items: JSON.parse(o.itemsJson) })));
});
app.patch("/api/orders/:id/status", (req, res) => {
  const allowed = ["Placed", "Processing", "Shipped", "Delivered", "Cancelled"];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ error: "Invalid order status." });
  const result = db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(req.body.status, Number(req.params.id));
  if (!result.changes) return res.status(404).json({ error: "Order not found." });
  res.json({ message: "Order status updated." });
});
app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.listen(PORT, () => console.log(`GreenCart running at http://localhost:${PORT}`));
