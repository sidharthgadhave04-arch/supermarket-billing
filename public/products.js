// ===== PRODUCT DATABASE =====
// All data lives in MongoDB now — localStorage is only a fallback cache

const DEFAULT_PRODUCTS = [
  { pno: 1,  name: "Basmati Rice",      price: 120.00, dis: 5,  stock: 48 },
  { pno: 2,  name: "Sunflower Oil",     price: 185.00, dis: 10, stock: 23 },
  { pno: 3,  name: "Whole Wheat Atta",  price: 55.00,  dis: 0,  stock: 37 },
  { pno: 4,  name: "Toor Dal",          price: 140.00, dis: 8,  stock: 14 },
  { pno: 5,  name: "Amul Butter",       price: 60.00,  dis: 5,  stock: 61 },
  { pno: 6,  name: "Milk 1L",           price: 50.00,  dis: 2,  stock: 82 },
  { pno: 7,  name: "Curd 500g",         price: 40.00,  dis: 0,  stock: 3  },
  { pno: 8,  name: "Paneer 200g",       price: 90.00,  dis: 5,  stock: 19 },
  { pno: 9,  name: "Cheese Slices",     price: 120.00, dis: 10, stock: 7  },
  { pno: 10, name: "Eggs (12 Pack)",    price: 72.00,  dis: 0,  stock: 55 },
  { pno: 11, name: "Maggi Noodles",     price: 14.00,  dis: 0,  stock: 94 },
  { pno: 12, name: "Pasta",             price: 80.00,  dis: 5,  stock: 28 },
  { pno: 13, name: "Tomato Ketchup",    price: 110.00, dis: 7,  stock: 11 },
  { pno: 14, name: "Mayonnaise",        price: 140.00, dis: 10, stock: 4  },
  { pno: 15, name: "Bread",             price: 30.00,  dis: 0,  stock: 66 },
  { pno: 16, name: "Sugar 1kg",         price: 45.00,  dis: 3,  stock: 73 },
  { pno: 17, name: "Salt 1kg",          price: 20.00,  dis: 0,  stock: 88 },
  { pno: 18, name: "Tea Powder",        price: 220.00, dis: 12, stock: 17 },
  { pno: 19, name: "Coffee",            price: 250.00, dis: 10, stock: 9  },
  { pno: 20, name: "Biscuits Pack",     price: 25.00,  dis: 0,  stock: 79 },
  { pno: 21, name: "Chips",             price: 20.00,  dis: 0,  stock: 91 },
  { pno: 22, name: "Cold Drink 1L",     price: 60.00,  dis: 5,  stock: 44 },
  { pno: 23, name: "Fruit Juice",       price: 90.00,  dis: 8,  stock: 31 },
  { pno: 24, name: "Chocolate",         price: 50.00,  dis: 0,  stock: 58 },
  { pno: 25, name: "Ice Cream",         price: 120.00, dis: 10, stock: 13 },
  { pno: 26, name: "Detergent Powder",  price: 200.00, dis: 15, stock: 22 },
  { pno: 27, name: "Dishwash Liquid",   price: 150.00, dis: 10, stock: 35 },
  { pno: 28, name: "Toilet Cleaner",    price: 110.00, dis: 8,  stock: 0  },
  { pno: 29, name: "Handwash",          price: 90.00,  dis: 5,  stock: 42 },
  { pno: 30, name: "Shampoo",           price: 180.00, dis: 12, stock: 16 },
  { pno: 31, name: "Soap",              price: 40.00,  dis: 5,  stock: 67 },
  { pno: 32, name: "Toothpaste",        price: 95.00,  dis: 10, stock: 53 },
  { pno: 33, name: "Toothbrush",        price: 30.00,  dis: 0,  stock: 49 },
  { pno: 34, name: "Face Wash",         price: 150.00, dis: 10, stock: 6  },
  { pno: 35, name: "Hair Oil",          price: 130.00, dis: 8,  stock: 27 },
  { pno: 36, name: "Notebook",          price: 60.00,  dis: 5,  stock: 41 },
  { pno: 37, name: "Pen Pack",          price: 50.00,  dis: 0,  stock: 64 },
  { pno: 38, name: "Pencil Box",        price: 80.00,  dis: 10, stock: 33 },
  { pno: 39, name: "Stapler",           price: 70.00,  dis: 5,  stock: 18 },
  { pno: 40, name: "Marker",            price: 40.00,  dis: 0,  stock: 39 },
  { pno: 41, name: "Apple 1kg",         price: 150.00, dis: 5,  stock: 45 },
  { pno: 42, name: "Banana Dozen",      price: 60.00,  dis: 0,  stock: 52 },
  { pno: 43, name: "Orange 1kg",        price: 80.00,  dis: 5,  stock: 36 },
  { pno: 44, name: "Potato 1kg",        price: 30.00,  dis: 0,  stock: 71 },
  { pno: 45, name: "Onion 1kg",         price: 35.00,  dis: 0,  stock: 0  },
  { pno: 46, name: "Tomato 1kg",        price: 40.00,  dis: 0,  stock: 59 },
  { pno: 47, name: "Cabbage",           price: 25.00,  dis: 0,  stock: 26 },
  { pno: 48, name: "Carrot 1kg",        price: 50.00,  dis: 5,  stock: 43 },
  { pno: 49, name: "Capsicum",          price: 60.00,  dis: 5,  stock: 5  },
  { pno: 50, name: "Spinach Bundle",    price: 20.00,  dis: 0,  stock: 77 }
];

let products = [];
let cart     = [];

// ── Load products from MongoDB on page load ───────────────
async function initProducts() {
  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('API error');
    const data = await res.json();

    if (data.length === 0) {
      // First run: seed MongoDB with defaults
      console.log('[SuperMart] Seeding MongoDB with default products...');
      for (const p of DEFAULT_PRODUCTS) {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(p)
        });
      }
      products = [...DEFAULT_PRODUCTS];
    } else {
      products = data.map(p => ({
        pno:   p.pno,
        name:  p.name,
        price: p.price,
        dis:   p.dis,
        stock: p.stock ?? 0,
      }));
    }
  } catch (err) {
    // Fallback to localStorage if API unreachable
    console.warn('[SuperMart] API unreachable, using localStorage fallback');
    const stored = JSON.parse(localStorage.getItem('supermart_products') || 'null');
    products = stored || DEFAULT_PRODUCTS;
  }

  renderProductGrid();
  updateCartCount();
}

// ── Save product changes to MongoDB ──────────────────────
async function saveProducts() {
  // localStorage cache for offline fallback
  localStorage.setItem('supermart_products', JSON.stringify(products));
}

// ── API: create product ───────────────────────────────────
async function apiCreateProduct(productData) {
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── API: update product ───────────────────────────────────
async function apiUpdateProduct(pno, data) {
  const res = await fetch(`/api/products/${pno}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── API: delete product ───────────────────────────────────
async function apiDeleteProduct(pno) {
  const res = await fetch(`/api/products/${pno}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Sales helpers ─────────────────────────────────────────
async function getSales() {
  try {
    const res = await fetch('/api/sales');
    if (!res.ok) throw new Error();
    return res.json();
  } catch {
    return JSON.parse(localStorage.getItem('supermart_sales') || '{"totalRevenue":0,"totalOrders":0,"items":{}}');
  }
}

// Called after successful POST /api/orders (server handles DB write)
// This just updates the local products array stock so UI reflects instantly
function deductStock(cartItems) {
  cartItems.forEach(item => {
    const p = getProductByPno(item.pno);
    if (p) p.stock = Math.max(0, p.stock - item.qty);
  });
  saveProducts();
}

// ── Cart helpers ──────────────────────────────────────────
function getProductByPno(pno) {
  return products.find(p => p.pno === pno) || null;
}

function getNextPno() {
  if (products.length === 0) return 1;
  return Math.max(...products.map(p => p.pno)) + 1;
}

function setQty(pno, qty) {
  const p = getProductByPno(pno);
  if (!p) return;
  if (qty > p.stock) qty = p.stock;

  const existing = cart.find(c => c.pno === pno);
  if (qty <= 0) {
    cart = cart.filter(c => c.pno !== pno);
  } else if (existing) {
    existing.qty = qty;
  } else {
    cart.push({ pno, qty });
  }
  updateCartCount();
  refreshProductCards();
}

function getQty(pno) {
  const item = cart.find(c => c.pno === pno);
  return item ? item.qty : 0;
}

function updateCartCount() {
  const total = cart.reduce((sum, c) => sum + c.qty, 0);
  const el = document.getElementById('cart-count');
  if (el) el.textContent = `Cart: ${total}`;
}

// ── Render product grid ───────────────────────────────────
function renderProductGrid() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  if (products.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">📦</div>
        <div>NO PRODUCTS AVAILABLE<br>Ask admin to add products.</div>
      </div>`;
    return;
  }

  grid.innerHTML = products.map(p => {
    const qty        = getQty(p.pno);
    const inCart     = qty > 0;
    const outOfStock = p.stock === 0;

    let stockColor = 'var(--green)';
    let stockLabel = `${p.stock} left`;
    if (p.stock === 0)       { stockColor = 'var(--red)';    stockLabel = 'OUT OF STOCK'; }
    else if (p.stock <= 5)   { stockColor = '#ff9800';       stockLabel = `Only ${p.stock} left!`; }
    else if (p.stock <= 15)  { stockColor = 'var(--accent)'; stockLabel = `${p.stock} left`; }

    return `
      <div class="product-card ${inCart ? 'in-cart' : ''} ${outOfStock ? 'out-of-stock' : ''}" id="card-${p.pno}">
        <div class="p-pno">PROD #${String(p.pno).padStart(3,'0')}</div>
        <div class="p-name">${p.name}</div>
        <div class="p-price">₹${p.price.toFixed(2)}</div>
        <div class="p-disc">${p.dis > 0 ? `${p.dis}% discount applied` : 'No discount'}</div>
        <div class="p-stock" style="font-family:var(--font-mono);font-size:10px;letter-spacing:1px;color:${stockColor};margin-bottom:12px;">
          ▪ ${stockLabel}
        </div>
        <div class="qty-row">
          <button class="qty-btn" onclick="changeQty(${p.pno}, -1)" ${outOfStock ? 'disabled' : ''}>−</button>
          <span class="qty-display" id="qty-${p.pno}">${qty}</span>
          <button class="qty-btn" onclick="changeQty(${p.pno}, 1)" ${outOfStock ? 'disabled' : ''}>+</button>
        </div>
        ${outOfStock ? '<div style="font-family:var(--font-mono);font-size:10px;color:var(--red);text-align:center;margin-top:8px;letter-spacing:1px;">UNAVAILABLE</div>' : ''}
      </div>`;
  }).join('');
}

function changeQty(pno, delta) {
  setQty(pno, getQty(pno) + delta);
}

function refreshProductCards() {
  products.forEach(p => {
    const qtyEl  = document.getElementById(`qty-${p.pno}`);
    const cardEl = document.getElementById(`card-${p.pno}`);
    if (qtyEl) qtyEl.textContent = getQty(p.pno);
    if (cardEl) cardEl.classList.toggle('in-cart', getQty(p.pno) > 0);
  });
}

// ── Search ────────────────────────────────────────────────
function searchProducts() {
  const filter = document.getElementById("product-search").value.toLowerCase();
  const cards  = document.getElementById("product-grid").getElementsByClassName("product-card");
  for (let i = 0; i < cards.length; i++) {
    const name = cards[i].querySelector(".p-name").textContent.toLowerCase();
    cards[i].style.display = name.includes(filter) ? "" : "none";
  }
}