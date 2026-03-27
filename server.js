const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const dotenv     = require('dotenv');
const path       = require('path');

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── MongoDB Connection ────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err));

// ── Schemas ───────────────────────────────────────────────

// Mirrors C++ product struct: pno, name, price, dis, qty(stock)
const productSchema = new mongoose.Schema({
  pno:   { type: Number, required: true, unique: true },
  name:  { type: String, required: true },
  price: { type: Number, required: true },
  dis:   { type: Number, default: 0 },
  stock: { type: Number, default: 0 },   // ← C++ qty field
});

// Mirrors C++ place_order() output
const orderSchema = new mongoose.Schema({
  items: [{
    pno:   Number,
    name:  String,
    qty:   Number,
    price: Number,
    dis:   Number,
    amt:   Number,
    damt:  Number,
  }],
  grandTotal: { type: Number, required: true },
  payment: {
    mode:       { type: String, enum: ['cash','upi','card'], required: true },
    amountPaid: Number,
    changeDue:  Number,
    upiId:      String,
    cardType:   String,
  },
  date: { type: Date, default: Date.now },
});

// Sales summary — mirrors C++ total accumulation
const salesSchema = new mongoose.Schema({
  totalRevenue: { type: Number, default: 0 },
  totalOrders:  { type: Number, default: 0 },
  items: {
    type: Map,
    of: new mongoose.Schema({
      name:      String,
      unitsSold: { type: Number, default: 0 },
      revenue:   { type: Number, default: 0 },
    }, { _id: false }),
  },
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
const Order   = mongoose.model('Order',   orderSchema);
const Sales   = mongoose.model('Sales',   salesSchema);

// ── Helper: get or create single Sales document ──────────
async function getSalesDoc() {
  let doc = await Sales.findOne();
  if (!doc) {
    doc = new Sales({ totalRevenue: 0, totalOrders: 0, items: new Map() });
    await doc.save();
  }
  return doc;
}

// ══════════════════════════════════════════════════════════
//  PRODUCT ROUTES
// ══════════════════════════════════════════════════════════

// GET all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ pno: 1 });
    res.json(products);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create product
app.post('/api/products', async (req, res) => {
  try {
    const p = new Product(req.body);
    await p.save();
    res.status(201).json(p);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT update product (by pno)
app.put('/api/products/:pno', async (req, res) => {
  try {
    const p = await Product.findOneAndUpdate(
      { pno: Number(req.params.pno) },
      req.body,
      { new: true }
    );
    if (!p) return res.status(404).json({ error: 'Product not found' });
    res.json(p);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE product (by pno)
app.delete('/api/products/:pno', async (req, res) => {
  try {
    await Product.findOneAndDelete({ pno: Number(req.params.pno) });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PATCH deduct stock after order (bulk)
app.patch('/api/products/deduct-stock', async (req, res) => {
  try {
    const { items } = req.body; // [{ pno, qty }]
    for (const item of items) {
      await Product.findOneAndUpdate(
        { pno: item.pno },
        { $inc: { stock: -item.qty } }
      );
    }
    res.json({ message: 'Stock updated' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ══════════════════════════════════════════════════════════
//  ORDER ROUTES
// ══════════════════════════════════════════════════════════

// POST new order — saves order, deducts stock, updates sales
app.post('/api/orders', async (req, res) => {
  try {
    const { items, grandTotal, payment, date } = req.body;

    // 1. Save order
    const order = new Order({ items, grandTotal, payment, date });
    await order.save();

    // 2. Deduct stock from each product (mirrors C++ place_order qty reduction)
    for (const item of items) {
      await Product.findOneAndUpdate(
        { pno: item.pno },
        { $inc: { stock: -item.qty } }
      );
    }

    // 3. Update sales summary (mirrors C++ total accumulation)
    const sales = await getSalesDoc();
    sales.totalRevenue = parseFloat((sales.totalRevenue + grandTotal).toFixed(2));
    sales.totalOrders  += 1;
    for (const item of items) {
      const key     = String(item.pno);
      const current = sales.items.get(key) || { name: item.name, unitsSold: 0, revenue: 0 };
      current.unitsSold += item.qty;
      current.revenue    = parseFloat((current.revenue + item.damt).toFixed(2));
      sales.items.set(key, current);
    }
    sales.markModified('items');
    await sales.save();

    res.status(201).json(order);
  } catch (err) {
    console.error('Order error:', err);
    res.status(400).json({ error: err.message });
  }
});

// GET all orders
app.get('/api/orders', async (req, res) => {
  try {
    res.json(await Order.find().sort({ date: -1 }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════════════════════
//  SALES ROUTES
// ══════════════════════════════════════════════════════════

// GET sales summary
app.get('/api/sales', async (req, res) => {
  try {
    const sales = await getSalesDoc();
    // Convert Map to plain object for JSON
    const itemsObj = {};
    sales.items.forEach((val, key) => { itemsObj[key] = val; });
    res.json({
      totalRevenue: sales.totalRevenue,
      totalOrders:  sales.totalOrders,
      items:        itemsObj,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE reset sales
app.delete('/api/sales', async (req, res) => {
  try {
    await Sales.deleteMany({});
    res.json({ message: 'Sales reset' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Catch-all: serve frontend ─────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));