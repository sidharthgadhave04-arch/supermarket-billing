// ===== SCREEN MANAGEMENT =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.style.display = '';
  });
  const target = document.getElementById(id);
  if (target) {
    target.style.display = 'flex';
    target.classList.add('active');
  }

  if (id === 'customer-screen') {
    renderProductGrid();
    updateCartCount();
  }
  if (id === 'admin-screen') {
    updateProductCountLabel();
    adminTab('create');
  }
  if (id === 'invoice-screen') {
    document.getElementById('invoice-date').textContent = new Date().toLocaleString('en-IN');
  }
}

function showMainMenu() {
  showScreen('main-menu');
}

// ===== TICKER ANIMATION =====
function initTicker() {
  const ticker = document.querySelector('.ticker');
  if (!ticker) return;
  const text = ticker.textContent.trim();
  ticker.innerHTML = `<span class="ticker-inner">${text}&nbsp;&nbsp;&nbsp;${text}&nbsp;&nbsp;&nbsp;</span>`;
}

// ===== EXIT =====
function confirmExit() {
  document.getElementById('exit-modal').style.display = 'flex';
}
function closeModal() {
  document.getElementById('exit-modal').style.display = 'none';
}

// ===== RESET ORDER =====
function resetOrder() {
  cart = [];
  updateCartCount();
  showScreen('customer-screen');
  renderProductGrid();
}

// ===== ADMIN COUNT LABEL =====
function updateProductCountLabel() {
  const el = document.getElementById('product-count-label');
  if (el) el.textContent = `${products.length} Product${products.length !== 1 ? 's' : ''}`;
}

// ===== INIT =====
window.addEventListener('DOMContentLoaded', async () => {
  initTicker();

  // Show intro screen first
  const intro = document.getElementById('intro-screen');
  document.querySelectorAll('.screen').forEach(s => {
    s.style.display = 'none';
    s.classList.remove('active');
  });
  intro.style.display = 'flex';
  intro.classList.add('active');

  // ESC closes modals
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  // Load products from MongoDB in background
  await initProducts(); // defined in products.js
});
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.style.display = 'none';
    s.classList.remove('active');
  });

  const target = document.getElementById(id);
  if (target) {
    target.style.display = 'flex';
    target.classList.add('active');
    // Force scroll to top
    target.scrollTop = 0;
  }

  if (id === 'customer-screen') {
    renderProductGrid();
    updateCartCount();
  }
  if (id === 'admin-screen') {
    updateProductCountLabel();
    adminTab('create');
  }
  if (id === 'invoice-screen') {
    document.getElementById('invoice-date').textContent = new Date().toLocaleString('en-IN');
  }
  if (id === 'main-menu') {
    updateMMProductCount();
    updateMMClock();
  }
}