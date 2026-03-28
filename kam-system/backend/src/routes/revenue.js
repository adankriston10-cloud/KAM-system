const express = require('express');
const { getDb } = require('../database/init');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/revenue
router.get('/', auth, (req, res) => {
  const db = getDb();
  const { account_id, type, from, to } = req.query;
  let query = 'SELECT r.*, a.company_name FROM revenue r JOIN accounts a ON r.account_id = a.id WHERE 1=1';
  const params = [];

  if (account_id) { query += ' AND r.account_id = ?'; params.push(account_id); }
  if (type) { query += ' AND r.type = ?'; params.push(type); }
  if (from) { query += ' AND r.date >= ?'; params.push(from); }
  if (to) { query += ' AND r.date <= ?'; params.push(to); }
  query += ' ORDER BY r.date DESC';

  try {
    res.json(db.prepare(query).all(...params));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/revenue/summary
router.get('/summary', auth, (req, res) => {
  const db = getDb();
  const { account_id } = req.query;
  const filter = account_id ? 'AND account_id = ' + account_id : '';

  const mrr = db.prepare(`SELECT COALESCE(SUM(amount),0) as total FROM revenue WHERE type='mrr' ${filter} AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')`).get();
  const acv = db.prepare(`SELECT COALESCE(SUM(value),0) as total FROM contracts WHERE status='active' ${account_id ? 'AND account_id=' + account_id : ''}`).get();
  const totalRevenue = db.prepare(`SELECT COALESCE(SUM(amount),0) as total FROM revenue WHERE 1=1 ${filter}`).get();
  const upsell = db.prepare(`SELECT COALESCE(SUM(amount),0) as total FROM revenue WHERE type IN ('upsell','cross_sell') ${filter}`).get();

  const monthly = db.prepare(`
    SELECT strftime('%Y-%m', date) as month, 
      COALESCE(SUM(CASE WHEN type='mrr' THEN amount END),0) as mrr,
      COALESCE(SUM(CASE WHEN type='upsell' THEN amount END),0) as upsell,
      COALESCE(SUM(CASE WHEN type='cross_sell' THEN amount END),0) as cross_sell,
      COALESCE(SUM(amount),0) as total
    FROM revenue WHERE 1=1 ${filter}
    GROUP BY month ORDER BY month DESC LIMIT 12
  `).all().reverse();

  res.json({
    mrr: mrr.total,
    acv: acv.total,
    total_revenue: totalRevenue.total,
    upsell_revenue: upsell.total,
    monthly_trend: monthly
  });
});

// POST /api/revenue
router.post('/', auth, (req, res) => {
  const db = getDb();
  const { account_id, type, amount, date, description } = req.body;
  if (!account_id || !type || !amount || !date) return res.status(400).json({ error: 'account_id, type, amount, date required' });

  try {
    const result = db.prepare('INSERT INTO revenue (account_id, type, amount, date, description) VALUES (?, ?, ?, ?, ?)').run(account_id, type, amount, date, description);
    res.status(201).json(db.prepare('SELECT * FROM revenue WHERE id = ?').get(result.lastInsertRowid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/revenue/:id
router.delete('/:id', auth, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM revenue WHERE id = ?').run(req.params.id);
  res.json({ message: 'Revenue entry deleted' });
});

// === INVOICES ===
// GET /api/revenue/invoices
router.get('/invoices', auth, (req, res) => {
  const db = getDb();
  const { account_id, status } = req.query;
  let query = 'SELECT i.*, a.company_name FROM invoices i JOIN accounts a ON i.account_id = a.id WHERE 1=1';
  const params = [];
  if (account_id) { query += ' AND i.account_id = ?'; params.push(account_id); }
  if (status) { query += ' AND i.status = ?'; params.push(status); }
  query += ' ORDER BY i.created_at DESC';
  res.json(db.prepare(query).all(...params));
});

// POST /api/revenue/invoices
router.post('/invoices', auth, (req, res) => {
  const db = getDb();
  const { account_id, amount, tax_rate = 18, due_date, notes } = req.body;
  if (!account_id || !amount || !due_date) return res.status(400).json({ error: 'account_id, amount, due_date required' });

  // Generate invoice number
  const count = db.prepare('SELECT COUNT(*) as c FROM invoices').get();
  const invNumber = `INV-${new Date().getFullYear()}-${String(count.c + 1).padStart(4, '0')}`;
  const taxAmount = (amount * tax_rate) / 100;
  const totalAmount = amount + taxAmount;

  try {
    const result = db.prepare(`
      INSERT INTO invoices (account_id, invoice_number, amount, tax_rate, tax_amount, total_amount, status, due_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).run(account_id, invNumber, amount, tax_rate, taxAmount, totalAmount, due_date, notes);

    res.status(201).json(db.prepare('SELECT i.*, a.company_name FROM invoices i JOIN accounts a ON i.account_id = a.id WHERE i.id = ?').get(result.lastInsertRowid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/revenue/invoices/:id
router.put('/invoices/:id', auth, (req, res) => {
  const db = getDb();
  const { status, paid_date, notes } = req.body;
  db.prepare('UPDATE invoices SET status=?, paid_date=?, notes=? WHERE id=?').run(status, paid_date || null, notes, req.params.id);
  res.json(db.prepare('SELECT i.*, a.company_name FROM invoices i JOIN accounts a ON i.account_id = a.id WHERE i.id = ?').get(req.params.id));
});

// GET /api/revenue/invoices/overdue - Get overdue invoices
router.get('/invoices/overdue', auth, (req, res) => {
  const db = getDb();
  const overdue = db.prepare(`
    SELECT i.*, a.company_name, CAST((julianday('now') - julianday(i.due_date)) AS INTEGER) as days_overdue
    FROM invoices i JOIN accounts a ON i.account_id = a.id
    WHERE i.status = 'pending' AND i.due_date < date('now')
    ORDER BY days_overdue DESC
  `).all();
  res.json(overdue);
});

module.exports = router;
