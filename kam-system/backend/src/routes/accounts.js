const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDb } = require('../database/init');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/accounts
router.get('/', auth, (req, res) => {
  const db = getDb();
  const { stage, search, sort = 'company_name' } = req.query;
  
  let query = `
    SELECT a.*, u.name as manager_name,
      (SELECT COUNT(*) FROM contacts WHERE account_id = a.id) as contact_count,
      (SELECT COUNT(*) FROM contracts WHERE account_id = a.id AND status = 'active') as active_contracts,
      (SELECT COALESCE(SUM(amount),0) FROM revenue WHERE account_id = a.id) as total_revenue,
      p.company_name as parent_name
    FROM accounts a
    LEFT JOIN users u ON a.account_manager_id = u.id
    LEFT JOIN accounts p ON a.parent_id = p.id
    WHERE 1=1
  `;
  const params = [];

  if (stage) { query += ' AND a.journey_stage = ?'; params.push(stage); }
  if (search) { query += ' AND (a.company_name LIKE ? OR a.industry LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  
  const allowedSort = ['company_name', 'health_score', 'annual_revenue', 'created_at'];
  query += ` ORDER BY a.${allowedSort.includes(sort) ? sort : 'company_name'}`;

  try {
    const accounts = db.prepare(query).all(...params);
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/accounts/:id
router.get('/:id', auth, (req, res) => {
  const db = getDb();
  const account = db.prepare(`
    SELECT a.*, u.name as manager_name, p.company_name as parent_name
    FROM accounts a
    LEFT JOIN users u ON a.account_manager_id = u.id
    LEFT JOIN accounts p ON a.parent_id = p.id
    WHERE a.id = ?
  `).get(req.params.id);

  if (!account) return res.status(404).json({ error: 'Account not found' });

  // Get contacts
  account.contacts = db.prepare('SELECT * FROM contacts WHERE account_id = ? ORDER BY role, name').all(req.params.id);
  
  // Get active contracts
  account.contracts = db.prepare('SELECT * FROM contracts WHERE account_id = ? ORDER BY created_at DESC').all(req.params.id);
  
  // Get recent activity
  account.recent_meetings = db.prepare('SELECT * FROM meetings WHERE account_id = ? ORDER BY date DESC LIMIT 5').all(req.params.id);
  account.action_items = db.prepare('SELECT * FROM action_items WHERE account_id = ? AND status != ? ORDER BY priority, due_date').all(req.params.id, 'completed');
  account.milestones = db.prepare('SELECT * FROM milestones WHERE account_id = ? ORDER BY date DESC').all(req.params.id);
  
  // Get revenue summary
  account.revenue_summary = db.prepare(`
    SELECT type, COALESCE(SUM(amount),0) as total
    FROM revenue WHERE account_id = ? GROUP BY type
  `).all(req.params.id);

  // Children accounts
  account.subsidiaries = db.prepare('SELECT id, company_name, health_score, journey_stage FROM accounts WHERE parent_id = ?').all(req.params.id);

  res.json(account);
});

// POST /api/accounts
router.post('/', auth, [
  body('company_name').notEmpty().withMessage('Company name required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const db = getDb();
  const { company_name, industry, company_size, website, address, phone, parent_id, health_score = 70, journey_stage = 'prospect', account_manager_id, annual_revenue = 0, notes } = req.body;

  try {
    const result = db.prepare(`
      INSERT INTO accounts (company_name, industry, company_size, website, address, phone, parent_id, health_score, journey_stage, account_manager_id, annual_revenue, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(company_name, industry, company_size, website, address, phone, parent_id || null, health_score, journey_stage, account_manager_id || null, annual_revenue, notes);

    const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(account);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/accounts/:id
router.put('/:id', auth, (req, res) => {
  const db = getDb();
  const { company_name, industry, company_size, website, address, phone, parent_id, health_score, journey_stage, account_manager_id, annual_revenue, notes } = req.body;

  try {
    db.prepare(`
      UPDATE accounts SET company_name=?, industry=?, company_size=?, website=?, address=?, phone=?,
      parent_id=?, health_score=?, journey_stage=?, account_manager_id=?, annual_revenue=?, notes=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(company_name, industry, company_size, website, address, phone, parent_id || null, health_score, journey_stage, account_manager_id || null, annual_revenue, notes, req.params.id);

    const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(req.params.id);
    if (!account) return res.status(404).json({ error: 'Account not found' });
    res.json(account);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/accounts/:id
router.delete('/:id', auth, (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM accounts WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Account not found' });
  res.json({ message: 'Account deleted successfully' });
});

// === CONTACTS ===
// GET /api/accounts/:id/contacts
router.get('/:id/contacts', auth, (req, res) => {
  const db = getDb();
  const contacts = db.prepare('SELECT * FROM contacts WHERE account_id = ? ORDER BY role, name').all(req.params.id);
  res.json(contacts);
});

// POST /api/accounts/:id/contacts
router.post('/:id/contacts', auth, [
  body('name').notEmpty().withMessage('Contact name required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const db = getDb();
  const { name, email, phone, title, role = 'influencer', relationship_strength = 50, notes } = req.body;

  try {
    const result = db.prepare(`
      INSERT INTO contacts (account_id, name, email, phone, title, role, relationship_strength, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.params.id, name, email, phone, title, role, relationship_strength, notes);

    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(contact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/accounts/:id/contacts/:contactId
router.put('/:id/contacts/:contactId', auth, (req, res) => {
  const db = getDb();
  const { name, email, phone, title, role, relationship_strength, notes } = req.body;
  
  db.prepare(`
    UPDATE contacts SET name=?, email=?, phone=?, title=?, role=?, relationship_strength=?, notes=? WHERE id=? AND account_id=?
  `).run(name, email, phone, title, role, relationship_strength, notes, req.params.contactId, req.params.id);

  const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.contactId);
  res.json(contact);
});

// DELETE /api/accounts/:id/contacts/:contactId
router.delete('/:id/contacts/:contactId', auth, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM contacts WHERE id = ? AND account_id = ?').run(req.params.contactId, req.params.id);
  res.json({ message: 'Contact deleted' });
});

// === ACTION ITEMS ===
router.get('/:id/actions', auth, (req, res) => {
  const db = getDb();
  const items = db.prepare(`
    SELECT ai.*, u.name as assignee_name 
    FROM action_items ai LEFT JOIN users u ON ai.assigned_to = u.id
    WHERE ai.account_id = ? ORDER BY priority, due_date
  `).all(req.params.id);
  res.json(items);
});

router.post('/:id/actions', auth, (req, res) => {
  const db = getDb();
  const { title, description, priority = 'medium', due_date, status = 'open', assigned_to } = req.body;
  const result = db.prepare(`
    INSERT INTO action_items (account_id, title, description, priority, due_date, status, assigned_to)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(req.params.id, title, description, priority, due_date, status, assigned_to || req.user.id);
  res.status(201).json(db.prepare('SELECT * FROM action_items WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id/actions/:actionId', auth, (req, res) => {
  const db = getDb();
  const { title, description, priority, due_date, status, assigned_to } = req.body;
  db.prepare(`UPDATE action_items SET title=?, description=?, priority=?, due_date=?, status=?, assigned_to=? WHERE id=? AND account_id=?`)
    .run(title, description, priority, due_date, status, assigned_to, req.params.actionId, req.params.id);
  res.json(db.prepare('SELECT * FROM action_items WHERE id = ?').get(req.params.actionId));
});

module.exports = router;
