// ===== INVOICE RENDERING =====
function renderInvoice() {
  const tbody    = document.getElementById('invoice-body');
  const totalDiv = document.getElementById('invoice-total');

  if (cart.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;font-family:var(--font-mono);color:var(--text3);">NO ITEMS IN CART</td></tr>`;
    totalDiv.innerHTML = '';
    return;
  }

  let subtotal = 0, totalDiscount = 0, grandTotal = 0, rows = '';

  cart.forEach(item => {
    const p = getProductByPno(item.pno);
    if (!p) return;
    const amt   = p.price * item.qty;
    const damt  = amt - (amt * p.dis / 100);
    const saved = amt - damt;
    subtotal      += amt;
    totalDiscount += saved;
    grandTotal    += damt;
    rows += `
      <tr>
        <td>#${String(p.pno).padStart(3,'0')}</td>
        <td>${p.name}</td>
        <td>${item.qty}</td>
        <td>Rs.${p.price.toFixed(2)}</td>
        <td>Rs.${amt.toFixed(2)}</td>
        <td style="color:var(--green)">${p.dis > 0 ? `${p.dis}% (-Rs.${saved.toFixed(2)})` : '-'}</td>
        <td style="color:var(--accent)">Rs.${damt.toFixed(2)}</td>
      </tr>`;
  });

  tbody.innerHTML = rows;
  totalDiv.innerHTML = `
    <div class="total-row"><span>SUBTOTAL</span><span>Rs.${subtotal.toFixed(2)}</span></div>
    <div class="total-row" style="color:var(--green)"><span>TOTAL SAVINGS</span><span>-Rs.${totalDiscount.toFixed(2)}</span></div>
    <div class="total-row grand"><span>GRAND TOTAL</span><span>Rs.${grandTotal.toFixed(2)}</span></div>
    <div style="font-family:var(--font-mono);font-size:10px;color:var(--text3);margin-top:14px;letter-spacing:1px;">
      ${cart.length} item type(s) | ${cart.reduce((s,c)=>s+c.qty,0)} unit(s) | ${new Date().toLocaleString('en-IN')}
    </div>`;

  window._grandTotal = grandTotal;
}

function printInvoice() { window.print(); }

// ===== PAYMENT MODAL =====
function openPaymentModal() {
  if (!cart.length) return;
  renderInvoice();
  document.getElementById('payment-modal').style.display = 'flex';
  const t = window._grandTotal || 0;
  document.getElementById('pay-total-display').textContent = 'Rs.' + t.toFixed(2);
  selectPaymentMode(null);
  document.getElementById('pay-confirm-btn').disabled = true;
  document.getElementById('payment-success').style.display = 'none';
  document.getElementById('payment-form-area').style.display = 'block';
  document.getElementById('pay-confirm-btn').textContent = 'CONFIRM PAYMENT';
}

function closePaymentModal() {
  document.getElementById('payment-modal').style.display = 'none';
}

let _selectedMode = null;

function selectPaymentMode(mode) {
  _selectedMode = mode;
  document.querySelectorAll('.pay-mode-card').forEach(c => c.classList.remove('selected'));
  if (mode) document.getElementById('pay-' + mode).classList.add('selected');

  ['cash','upi','card'].forEach(m => {
    document.getElementById(m + '-section').style.display = 'none';
  });

  if (mode === 'cash') {
    document.getElementById('cash-section').style.display = 'block';
    document.getElementById('cash-input').value = '';
    document.getElementById('cash-change').textContent = '';
    document.getElementById('pay-confirm-btn').disabled = true;
  } else if (mode === 'upi') {
    document.getElementById('upi-section').style.display = 'block';
    document.getElementById('pay-confirm-btn').disabled = false;
  } else if (mode === 'card') {
    document.getElementById('card-section').style.display = 'block';
    document.getElementById('pay-confirm-btn').disabled = false;
  }
}

function calcChange() {
  const paid    = parseFloat(document.getElementById('cash-input').value) || 0;
  const total   = window._grandTotal || 0;
  const changeEl = document.getElementById('cash-change');
  const btn      = document.getElementById('pay-confirm-btn');
  if (paid >= total) {
    changeEl.innerHTML = '<span style="color:var(--green)">Change Due: Rs.' + (paid - total).toFixed(2) + '</span>';
    btn.disabled = false;
  } else if (paid > 0) {
    changeEl.innerHTML = '<span style="color:var(--red)">Short by Rs.' + (total - paid).toFixed(2) + '</span>';
    btn.disabled = true;
  } else {
    changeEl.textContent = '';
    btn.disabled = true;
  }
}

// ===== CONFIRM PAYMENT =====
async function confirmPayment() {
  const total = window._grandTotal || 0;
  const mode  = _selectedMode;
  if (!mode) return;

  let paymentData = { mode };
  if (mode === 'cash') {
    const paid = parseFloat(document.getElementById('cash-input').value) || 0;
    paymentData.amountPaid = paid;
    paymentData.changeDue  = parseFloat((paid - total).toFixed(2));
  } else if (mode === 'upi') {
    paymentData.upiId      = document.getElementById('upi-id-input').value.trim() || 'N/A';
    paymentData.amountPaid = total;
    paymentData.changeDue  = 0;
  } else if (mode === 'card') {
    paymentData.cardType   = document.getElementById('card-type-select').value;
    paymentData.amountPaid = total;
    paymentData.changeDue  = 0;
  }

  const items = cart.map(item => {
    const p    = getProductByPno(item.pno);
    const amt  = p.price * item.qty;
    const damt = amt - (amt * p.dis / 100);
    return {
      pno: p.pno, name: p.name, qty: item.qty,
      price: p.price, dis: p.dis,
      amt:  parseFloat(amt.toFixed(2)),
      damt: parseFloat(damt.toFixed(2))
    };
  });

  const orderPayload = {
    items,
    grandTotal: parseFloat(total.toFixed(2)),
    payment: paymentData,
    date: new Date().toISOString(),
  };

  // Disable button immediately to prevent double-submit
  const btn = document.getElementById('pay-confirm-btn');
  btn.textContent = 'SAVING...';
  btn.disabled    = true;

  try {
    // POST to MongoDB via server — server handles stock deduction + sales update
    const res = await fetch('/api/orders', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(orderPayload),
    });
    if (!res.ok) throw new Error('Server error: ' + res.status);

    // Update local products array so UI reflects stock change instantly
    deductStock(items);
    showPaymentSuccess(paymentData, total);

  } catch (err) {
    // Fallback: save locally if server unreachable
    console.warn('[SuperMart] MongoDB save failed, using localStorage:', err.message);
    const orders = JSON.parse(localStorage.getItem('supermart_orders') || '[]');
    orders.push(orderPayload);
    localStorage.setItem('supermart_orders', JSON.stringify(orders));
    deductStock(items);
    showPaymentSuccess(paymentData, total);
  }
}

// ===== PAYMENT SUCCESS SCREEN =====
function showPaymentSuccess(paymentData, total) {
  document.getElementById('payment-form-area').style.display = 'none';
  const successEl = document.getElementById('payment-success');
  successEl.style.display = 'block';

  const modeIcons = {
    cash: `<svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="26" cy="26" r="24" stroke="#4caf50" stroke-width="2"/>
      <rect x="12" y="20" width="28" height="18" rx="2" stroke="#4caf50" stroke-width="2" fill="none"/>
      <circle cx="26" cy="29" r="4" stroke="#4caf50" stroke-width="2" fill="none"/>
      <line x1="12" y1="25" x2="40" y2="25" stroke="#4caf50" stroke-width="2"/>
    </svg>`,
    upi: `<svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="26" cy="26" r="24" stroke="#4caf50" stroke-width="2"/>
      <rect x="16" y="12" width="20" height="30" rx="3" stroke="#4caf50" stroke-width="2" fill="none"/>
      <circle cx="26" cy="37" r="2" fill="#4caf50"/>
      <line x1="20" y1="17" x2="32" y2="17" stroke="#4caf50" stroke-width="2"/>
    </svg>`,
    card: `<svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="26" cy="26" r="24" stroke="#4caf50" stroke-width="2"/>
      <rect x="10" y="18" width="32" height="20" rx="2" stroke="#4caf50" stroke-width="2" fill="none"/>
      <line x1="10" y1="25" x2="42" y2="25" stroke="#4caf50" stroke-width="2"/>
      <rect x="14" y="29" width="8" height="4" rx="1" fill="#4caf50"/>
    </svg>`
  };

  const modeLabels = { cash: 'CASH', upi: 'UPI', card: 'CARD' };

  let extraLine = '';
  if (paymentData.mode === 'cash')
    extraLine = '<div class="success-detail">Change Returned &nbsp;Rs.' + paymentData.changeDue.toFixed(2) + '</div>';
  else if (paymentData.mode === 'upi')
    extraLine = '<div class="success-detail">UPI ID &nbsp;' + paymentData.upiId + '</div>';
  else if (paymentData.mode === 'card')
    extraLine = '<div class="success-detail">Card Type &nbsp;' + paymentData.cardType.toUpperCase() + '</div>';

  successEl.innerHTML =
    '<div class="success-icon">'      + modeIcons[paymentData.mode]   + '</div>' +
    '<div class="success-title">PAYMENT SUCCESSFUL</div>'                          +
    '<div class="success-amount">Rs.' + total.toFixed(2)               + '</div>' +
    '<div class="success-detail">Via ' + modeLabels[paymentData.mode] + '</div>'  +
    extraLine +
    '<div class="success-actions">'   +
    '<button class="btn-primary" onclick="printAndReset()">PRINT &amp; NEW ORDER</button>' +
    '<button class="btn-outline" onclick="closePaymentModal()">CLOSE</button>'     +
    '</div>';
}

function printAndReset() {
  closePaymentModal();
  printInvoice();
  setTimeout(() => resetOrder(), 500);
}