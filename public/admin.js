// ===== ADMIN PANEL =====
let currentAdminTab = 'create';

function adminTab(tab) {
  currentAdminTab = tab;

  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  const tabIndex = ['create','display','modify','delete','query','sales'];
  const btns     = document.querySelectorAll('.nav-btn');
  const idx      = tabIndex.indexOf(tab);
  if (btns[idx]) btns[idx].classList.add('active');

  const panel = document.getElementById('admin-panel');
  switch(tab) {
    case 'create':  panel.innerHTML = renderCreateForm();    break;
    case 'display': panel.innerHTML = renderDisplayAll();    break;
    case 'modify':  panel.innerHTML = renderModifyForm();    break;
    case 'delete':  panel.innerHTML = renderDeleteForm();    break;
    case 'query':   panel.innerHTML = renderQueryForm();     break;
    case 'sales':   renderSalesDashboard();                  break;
  }
}

// ─── CREATE ───────────────────────────────────────────────
function renderCreateForm() {
  return `
    <div class="panel-title">CREATE PRODUCT</div>
    <div class="form-group">
      <label>PRODUCT NAME</label>
      <input type="text" id="f-name" placeholder="e.g. Basmati Rice" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>PRICE (₹)</label>
        <input type="number" id="f-price" placeholder="0.00" min="0" step="0.01"/>
      </div>
      <div class="form-group">
        <label>DISCOUNT (%)</label>
        <input type="number" id="f-dis" placeholder="0" min="0" max="100"/>
      </div>
    </div>
    <div class="form-group">
      <label>INITIAL STOCK (QTY)</label>
      <input type="number" id="f-stock" placeholder="e.g. 50" min="0" step="1"/>
    </div>
    <div class="form-actions">
      <button class="btn-primary" style="width:auto;font-size:16px;padding:12px 28px" onclick="createProduct()">＋ CREATE PRODUCT</button>
    </div>
    <div id="create-msg"></div>`;
}

async function createProduct() {
  const name  = document.getElementById('f-name').value.trim();
  const price = parseFloat(document.getElementById('f-price').value);
  const dis   = parseFloat(document.getElementById('f-dis').value) || 0;
  const stock = parseInt(document.getElementById('f-stock').value)  || 0;
  const msg   = document.getElementById('create-msg');

  if (!name)                     { msg.innerHTML = `<div class="alert error">⚠ Product name is required.</div>`; return; }
  if (isNaN(price) || price < 0) { msg.innerHTML = `<div class="alert error">⚠ Enter a valid price.</div>`; return; }
  if (dis < 0 || dis > 100)      { msg.innerHTML = `<div class="alert error">⚠ Discount must be 0–100.</div>`; return; }

  const pno = getNextPno();
  try {
    await apiCreateProduct({ pno, name, price, dis, stock });
    products.push({ pno, name, price, dis, stock });
    saveProducts();
    updateProductCountLabel();
    msg.innerHTML = `<div class="alert success">✓ Product #${String(pno).padStart(3,'0')} "${name}" saved to MongoDB (Stock: ${stock}).</div>`;
    document.getElementById('f-name').value  = '';
    document.getElementById('f-price').value = '';
    document.getElementById('f-dis').value   = '';
    document.getElementById('f-stock').value = '';
  } catch (err) {
    msg.innerHTML = `<div class="alert error">⚠ MongoDB error: ${err.message}</div>`;
  }
}

// ─── DISPLAY ALL ──────────────────────────────────────────
function renderDisplayAll() {
  if (products.length === 0) {
    return `<div class="panel-title">ALL PRODUCTS</div>
      <div class="empty-state"><div class="empty-icon">📦</div><div>NO PRODUCTS FOUND</div></div>`;
  }

  const rows = products.map(p => {
    const stock = p.stock ?? 0;
    let stockStyle = 'color:var(--green)';
    if (stock === 0)      stockStyle = 'color:var(--red);font-weight:bold';
    else if (stock <= 5)  stockStyle = 'color:#ff9800';
    else if (stock <= 15) stockStyle = 'color:var(--accent)';

    return `
      <tr>
        <td>#${String(p.pno).padStart(3,'0')}</td>
        <td>${p.name}</td>
        <td>₹${p.price.toFixed(2)}</td>
        <td>${p.dis}%</td>
        <td style="color:var(--green)">₹${(p.price - p.price * p.dis / 100).toFixed(2)}</td>
        <td style="${stockStyle}">${stock === 0 ? 'OUT OF STOCK' : stock}</td>
      </tr>`;
  }).join('');

  return `
    <div class="panel-title">ALL PRODUCTS</div>
    <table class="admin-table">
      <thead><tr><th>P.NO</th><th>NAME</th><th>PRICE</th><th>DISC</th><th>NET PRICE</th><th>STOCK</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ─── MODIFY ───────────────────────────────────────────────
function renderModifyForm() {
  return `
    <div class="panel-title">MODIFY PRODUCT</div>
    <div class="form-group">
      <label>ENTER PRODUCT NO. TO MODIFY</label>
      <input type="number" id="m-pno" placeholder="e.g. 1" min="1"/>
    </div>
    <div class="form-actions">
      <button class="btn-outline" onclick="loadModifyProduct()">🔍 LOAD PRODUCT</button>
    </div>
    <div id="modify-fields"></div>
    <div id="modify-msg"></div>`;
}

function loadModifyProduct() {
  const pno = parseInt(document.getElementById('m-pno').value);
  const p   = getProductByPno(pno);
  const container = document.getElementById('modify-fields');
  const msg = document.getElementById('modify-msg');
  msg.innerHTML = '';

  if (!p) {
    container.innerHTML = '';
    msg.innerHTML = `<div class="alert error">⚠ Product #${pno} not found.</div>`;
    return;
  }

  container.innerHTML = `
    <div style="border:1px solid var(--border);padding:20px;margin-top:20px">
      <div style="font-family:var(--font-mono);font-size:10px;color:var(--text3);letter-spacing:2px;margin-bottom:16px">
        EDITING — #${String(p.pno).padStart(3,'0')} | ${p.name} @ ₹${p.price} (${p.dis}% off) | Stock: ${p.stock ?? 0}
      </div>
      <div class="form-group"><label>NEW NAME</label><input type="text" id="m-name" value="${p.name}"/></div>
      <div class="form-row">
        <div class="form-group"><label>NEW PRICE (₹)</label><input type="number" id="m-price" value="${p.price}" min="0" step="0.01"/></div>
        <div class="form-group"><label>NEW DISCOUNT (%)</label><input type="number" id="m-dis" value="${p.dis}" min="0" max="100"/></div>
      </div>
      <div class="form-group"><label>STOCK QTY</label><input type="number" id="m-stock" value="${p.stock ?? 0}" min="0" step="1"/></div>
      <div class="form-actions">
        <button class="btn-primary" style="width:auto;font-size:16px;padding:12px 28px" onclick="saveModifyProduct(${p.pno})">✎ SAVE CHANGES</button>
      </div>
    </div>`;
}

async function saveModifyProduct(pno) {
  const p   = getProductByPno(pno);
  const msg = document.getElementById('modify-msg');
  if (!p) return;

  const name  = document.getElementById('m-name').value.trim();
  const price = parseFloat(document.getElementById('m-price').value);
  const dis   = parseFloat(document.getElementById('m-dis').value) || 0;
  const stock = parseInt(document.getElementById('m-stock').value)  || 0;

  if (!name)                     { msg.innerHTML = `<div class="alert error">⚠ Name cannot be empty.</div>`; return; }
  if (isNaN(price) || price < 0) { msg.innerHTML = `<div class="alert error">⚠ Invalid price.</div>`; return; }

  try {
    await apiUpdateProduct(pno, { name, price, dis, stock });
    p.name = name; p.price = price; p.dis = dis; p.stock = stock;
    saveProducts();
    msg.innerHTML = `<div class="alert success">✓ Product #${String(pno).padStart(3,'0')} updated in MongoDB (Stock: ${stock}).</div>`;
    document.getElementById('modify-fields').innerHTML = '';
    document.getElementById('m-pno').value = '';
  } catch (err) {
    msg.innerHTML = `<div class="alert error">⚠ MongoDB error: ${err.message}</div>`;
  }
}

// ─── DELETE ───────────────────────────────────────────────
function renderDeleteForm() {
  return `
    <div class="panel-title">DELETE PRODUCT</div>
    <div class="form-group">
      <label>ENTER PRODUCT NO. TO DELETE</label>
      <input type="number" id="d-pno" placeholder="e.g. 3" min="1"/>
    </div>
    <div class="form-actions">
      <button class="btn-outline" onclick="loadDeletePreview()">🔍 FIND PRODUCT</button>
    </div>
    <div id="delete-preview"></div>
    <div id="delete-msg"></div>`;
}

function loadDeletePreview() {
  const pno     = parseInt(document.getElementById('d-pno').value);
  const p       = getProductByPno(pno);
  const preview = document.getElementById('delete-preview');
  const msg     = document.getElementById('delete-msg');
  msg.innerHTML = '';

  if (!p) {
    preview.innerHTML = '';
    msg.innerHTML = `<div class="alert error">⚠ Product #${pno} not found.</div>`;
    return;
  }

  preview.innerHTML = `
    <div style="border:1px solid var(--red);padding:20px;margin-top:20px;background:rgba(224,82,82,0.05)">
      <div style="font-family:var(--font-mono);font-size:11px;color:var(--text2);margin-bottom:12px;letter-spacing:1px">PRODUCT TO DELETE:</div>
      <div style="font-family:var(--font-display);font-size:24px;color:var(--text);letter-spacing:2px;margin-bottom:4px">${p.name}</div>
      <div style="font-family:var(--font-mono);font-size:12px;color:var(--text2)">
        #${String(p.pno).padStart(3,'0')} &nbsp;|&nbsp; ₹${p.price.toFixed(2)} &nbsp;|&nbsp; ${p.dis}% discount &nbsp;|&nbsp; Stock: ${p.stock ?? 0}
      </div>
      <div class="form-actions" style="margin-top:16px">
        <button class="btn-danger" onclick="confirmDeleteProduct(${p.pno})">✕ CONFIRM DELETE</button>
        <button class="btn-outline" onclick="document.getElementById('delete-preview').innerHTML='';document.getElementById('d-pno').value=''">CANCEL</button>
      </div>
    </div>`;
}

async function confirmDeleteProduct(pno) {
  const p = getProductByPno(pno);
  if (!p) return;
  const name = p.name;
  try {
    await apiDeleteProduct(pno);
    products = products.filter(x => x.pno !== pno);
    cart     = cart.filter(c => c.pno !== pno);
    saveProducts();
    updateProductCountLabel();
    updateCartCount();
    document.getElementById('delete-preview').innerHTML = '';
    document.getElementById('d-pno').value = '';
    document.getElementById('delete-msg').innerHTML =
      `<div class="alert success">✓ "${name}" deleted from MongoDB.</div>`;
  } catch (err) {
    document.getElementById('delete-msg').innerHTML =
      `<div class="alert error">⚠ MongoDB error: ${err.message}</div>`;
  }
}

// ─── QUERY ────────────────────────────────────────────────
function renderQueryForm() {
  return `
    <div class="panel-title">QUERY PRODUCT</div>
    <div class="form-group">
      <label>ENTER PRODUCT NO.</label>
      <input type="number" id="q-pno" placeholder="e.g. 2" min="1" oninput="runQuery()"/>
    </div>
    <div id="query-result"></div>`;
}

function runQuery() {
  const pno    = parseInt(document.getElementById('q-pno').value);
  const result = document.getElementById('query-result');
  if (!pno) { result.innerHTML = ''; return; }

  const p = getProductByPno(pno);
  if (!p) { result.innerHTML = `<div class="alert error">⚠ No product with P.No. ${pno}.</div>`; return; }

  const netPrice = p.price - (p.price * p.dis / 100);
  const stock    = p.stock ?? 0;
  let stockColor = 'var(--green)';
  if (stock === 0)      stockColor = 'var(--red)';
  else if (stock <= 5)  stockColor = '#ff9800';
  else if (stock <= 15) stockColor = 'var(--accent)';

  result.innerHTML = `
    <div style="border:1px solid var(--accent);padding:24px;margin-top:16px">
      <div style="font-family:var(--font-mono);font-size:10px;color:var(--text3);letter-spacing:3px;margin-bottom:12px">PRODUCT DETAILS</div>
      <div style="font-family:var(--font-display);font-size:36px;letter-spacing:3px;color:var(--text);margin-bottom:16px">${p.name}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;font-family:var(--font-mono);font-size:12px">
        <div><div style="color:var(--text3);font-size:10px;letter-spacing:2px;margin-bottom:4px">P.NO</div><div style="color:var(--accent)">#${String(p.pno).padStart(3,'0')}</div></div>
        <div><div style="color:var(--text3);font-size:10px;letter-spacing:2px;margin-bottom:4px">MRP</div><div>₹${p.price.toFixed(2)}</div></div>
        <div><div style="color:var(--text3);font-size:10px;letter-spacing:2px;margin-bottom:4px">DISCOUNT</div><div style="color:var(--green)">${p.dis}%</div></div>
        <div><div style="color:var(--text3);font-size:10px;letter-spacing:2px;margin-bottom:4px">NET PRICE</div><div style="color:var(--accent)">₹${netPrice.toFixed(2)}</div></div>
        <div><div style="color:var(--text3);font-size:10px;letter-spacing:2px;margin-bottom:4px">STOCK LEFT</div><div style="color:${stockColor}">${stock === 0 ? 'OUT OF STOCK' : stock + ' units'}</div></div>
      </div>
    </div>`;
}

// ─── SALES DASHBOARD — pulls from MongoDB ────────────────
async function renderSalesDashboard() {
  const panel = document.getElementById('admin-panel');
  panel.innerHTML = `<div class="panel-title">SALES DASHBOARD</div><div style="font-family:var(--font-mono);font-size:12px;color:var(--text3)">Loading from MongoDB...</div>`;

  const sales = await getSales(); // from products.js — hits /api/sales

  const summaryHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:28px">
      <div style="background:rgba(245,197,24,0.08);border:1px solid var(--accent);padding:20px">
        <div style="font-family:var(--font-mono);font-size:10px;color:var(--text3);letter-spacing:3px;margin-bottom:8px">ALL-TIME REVENUE</div>
        <div style="font-family:var(--font-display);font-size:36px;color:var(--accent);letter-spacing:2px">₹${sales.totalRevenue.toFixed(2)}</div>
      </div>
      <div style="background:rgba(82,224,122,0.08);border:1px solid var(--green);padding:20px">
        <div style="font-family:var(--font-mono);font-size:10px;color:var(--text3);letter-spacing:3px;margin-bottom:8px">TOTAL ORDERS</div>
        <div style="font-family:var(--font-display);font-size:36px;color:var(--green);letter-spacing:2px">${sales.totalOrders}</div>
      </div>
    </div>`;

  const itemKeys = Object.keys(sales.items || {});
  let tableHTML = '';
  if (itemKeys.length === 0) {
    tableHTML = `<div class="empty-state"><div class="empty-icon">📊</div><div>NO SALES RECORDED YET</div></div>`;
  } else {
    const sorted = itemKeys
      .map(k => ({ pno: k, ...sales.items[k] }))
      .sort((a, b) => b.unitsSold - a.unitsSold);

    const rows = sorted.map((item, i) => `
      <tr>
        <td style="color:var(--text3)">${i + 1}</td>
        <td>#${String(item.pno).padStart(3,'0')}</td>
        <td>${item.name}</td>
        <td style="color:var(--accent)">${item.unitsSold}</td>
        <td style="color:var(--green)">₹${item.revenue.toFixed(2)}</td>
      </tr>`).join('');

    tableHTML = `
      <div style="font-family:var(--font-mono);font-size:10px;color:var(--text3);letter-spacing:3px;margin-bottom:12px">PER-PRODUCT BREAKDOWN</div>
      <table class="admin-table">
        <thead><tr><th>#</th><th>P.NO</th><th>PRODUCT</th><th>UNITS SOLD</th><th>REVENUE</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  panel.innerHTML = `
    <div class="panel-title">SALES DASHBOARD</div>
    ${summaryHTML}
    ${tableHTML}
    <div style="margin-top:24px">
      <button class="btn-danger" style="font-size:12px;padding:8px 20px" onclick="resetSalesData()">✕ RESET ALL SALES DATA</button>
    </div>`;
}

async function resetSalesData() {
  if (!confirm('Reset ALL sales data in MongoDB? This cannot be undone.')) return;
  try {
    await fetch('/api/sales', { method: 'DELETE' });
    renderSalesDashboard();
  } catch (err) {
    alert('Error resetting sales: ' + err.message);
  }
}
// ── ADD to admin nav in index.html ──
// <button class="nav-btn" onclick="adminTab('sales')">📊 Total Sales</button>

// ── ADD this function to admin.js ──
async function renderSalesPanel() {
  const panel = document.getElementById('admin-panel');
  panel.innerHTML = `<div class="panel-title">TOTAL SALES</div>
    <div style="font-family:var(--font-mono);font-size:12px;color:var(--text3);letter-spacing:1px;margin-bottom:20px">Loading orders...</div>`;

  try {
    const res = await fetch('/api/orders');
    const data = await res.json();
    const orders = data.data || [];

    if (orders.length === 0) {
      panel.innerHTML = `<div class="panel-title">TOTAL SALES</div>
        <div class="empty-state"><div class="empty-icon">📊</div><div>NO ORDERS YET</div></div>`;
      return;
    }

    const totalRevenue = orders.reduce((s, o) => s + o.grandTotal, 0);
    const totalSavings = orders.reduce((s, o) => s + o.savings, 0);
    const totalOrders  = orders.length;
    const avgOrder     = totalRevenue / totalOrders;

    panel.innerHTML = `
      <div class="panel-title">TOTAL SALES</div>

      <div class="sales-stats">
        <div class="sales-stat-card">
          <div class="ss-label">TOTAL REVENUE</div>
          <div class="ss-value" style="color:var(--accent)">₹${totalRevenue.toFixed(2)}</div>
        </div>
        <div class="sales-stat-card">
          <div class="ss-label">TOTAL ORDERS</div>
          <div class="ss-value">${totalOrders}</div>
        </div>
        <div class="sales-stat-card">
          <div class="ss-label">AVG ORDER VALUE</div>
          <div class="ss-value">₹${avgOrder.toFixed(2)}</div>
        </div>
        <div class="sales-stat-card">
          <div class="ss-label">TOTAL SAVINGS GIVEN</div>
          <div class="ss-value" style="color:var(--green)">₹${totalSavings.toFixed(2)}</div>
        </div>
      </div>

      <div style="font-family:var(--font-mono);font-size:10px;color:var(--text3);letter-spacing:3px;margin:24px 0 12px">RECENT ORDERS</div>
      <table class="admin-table">
        <thead>
          <tr><th>#</th><th>DATE</th><th>ITEMS</th><th>SUBTOTAL</th><th>SAVINGS</th><th>TOTAL</th></tr>
        </thead>
        <tbody>
          ${orders.slice(0,20).map((o, i) => `
            <tr>
              <td style="color:var(--text3)">${String(i+1).padStart(3,'0')}</td>
              <td>${new Date(o.createdAt).toLocaleString('en-IN')}</td>
              <td>${o.items.reduce((s,it)=>s+it.qty,0)} units</td>
              <td>₹${o.subtotal.toFixed(2)}</td>
              <td style="color:var(--green)">-₹${o.savings.toFixed(2)}</td>
              <td style="color:var(--accent)">₹${o.grandTotal.toFixed(2)}</td>
            </tr>`).join('')}
        </tbody>
      </table>`;

  } catch (err) {
    panel.innerHTML = `<div class="panel-title">TOTAL SALES</div>
      <div class="alert error">⚠ Could not load orders. Is the server running?</div>`;
  }
}
