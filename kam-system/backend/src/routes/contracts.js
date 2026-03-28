const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDb } = require('../database/init');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/contracts
router.get('/', auth, (req, res) => {
  const db = getDb();
  const { status, account_id } = req.query;
  let query = `
    SELECT c.*, a.company_name,
      (SELECT COUNT(*) FROM slas WHERE contract_id = c.id) as sla_count,
      u.name as created_by_name,
      CASE WHEN c.end_date < date('now') AND c.status = 'active' THEN 1 ELSE 0 END as is_expired,
      CAST((julianday(c.end_date) - julianday('now')) AS INTEGER) as days_to_expiry
    FROM contracts c
    JOIN accounts a ON c.account_id = a.id
    LEFT JOIN users u ON c.created_by = u.id
    WHERE 1=1
  `;
  const params = [];
  if (status) { query += ' AND c.status = ?'; params.push(status); }
  if (account_id) { query += ' AND c.account_id = ?'; params.push(account_id); }
  query += ' ORDER BY c.end_date ASC';

  try {
    const contracts = db.prepare(query).all(...params);
    res.json(contracts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/contracts/expiring - contracts expiring in 90 days
router.get('/expiring', auth, (req, res) => {
  const db = getDb();
  const days = req.query.days || 90;
  const contracts = db.prepare(`
    SELECT c.*, a.company_name,
      CAST((julianday(c.end_date) - julianday('now')) AS INTEGER) as days_to_expiry
    FROM contracts c JOIN accounts a ON c.account_id = a.id
    WHERE c.status = 'active' AND julianday(c.end_date) - julianday('now') <= ?
    ORDER BY c.end_date ASC
  `).all(days);
  res.json(contracts);
});

// GET /api/contracts/:id
router.get('/:id', auth, (req, res) => {
  const db = getDb();
  const contract = db.prepare(`
    SELECT c.*, a.company_name, u.name as created_by_name,
      CAST((julianday(c.end_date) - julianday('now')) AS INTEGER) as days_to_expiry
    FROM contracts c JOIN accounts a ON c.account_id = a.id LEFT JOIN users u ON c.created_by = u.id
    WHERE c.id = ?
  `).get(req.params.id);

  if (!contract) return res.status(404).json({ error: 'Contract not found' });
  contract.slas = db.prepare('SELECT * FROM slas WHERE contract_id = ?').all(req.params.id);
  res.json(contract);
});

// POST /api/contracts
router.post('/', auth, [
  body('account_id').notEmpty().withMessage('Account ID required'),
  body('title').notEmpty().withMessage('Contract title required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const db = getDb();
  const { account_id, title, template_type = 'standard', status = 'active', start_date, end_date, value = 0, content } = req.body;

  // Get next version
  const lastVersion = db.prepare('SELECT MAX(version) as v FROM contracts WHERE account_id = ? AND title = ?').get(account_id, title);
  const version = (lastVersion?.v || 0) + 1;

  try {
    const result = db.prepare(`
      INSERT INTO contracts (account_id, title, template_type, status, start_date, end_date, value, version, content, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(account_id, title, template_type, status, start_date, end_date, value, version, content || getDefaultTemplate(template_type, title), req.user.id);

    const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(contract);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/contracts/:id
router.put('/:id', auth, (req, res) => {
  const db = getDb();
  const { title, template_type, status, start_date, end_date, value, content } = req.body;

  // Increment version on content change
  const current = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Contract not found' });
  
  const newVersion = content && content !== current.content ? current.version + 1 : current.version;

  db.prepare(`
    UPDATE contracts SET title=?, template_type=?, status=?, start_date=?, end_date=?, value=?, content=?, version=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(title, template_type, status, start_date, end_date, value, content, newVersion, req.params.id);

  res.json(db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id));
});

// DELETE /api/contracts/:id
router.delete('/:id', auth, (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM contracts WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Contract not found' });
  res.json({ message: 'Contract deleted' });
});

// POST /api/contracts/:id/renew
router.post('/:id/renew', auth, (req, res) => {
  const db = getDb();
  const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id);
  if (!contract) return res.status(404).json({ error: 'Contract not found' });

  const { new_end_date, new_value } = req.body;
  
  // Mark old contract as renewed
  db.prepare("UPDATE contracts SET status = 'renewed' WHERE id = ?").run(req.params.id);

  // Create new version
  const result = db.prepare(`
    INSERT INTO contracts (account_id, title, template_type, status, start_date, end_date, value, version, content, created_by)
    VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?, ?)
  `).run(contract.account_id, contract.title, contract.template_type, contract.end_date, new_end_date, new_value || contract.value, contract.version + 1, contract.content, req.user.id);

  res.status(201).json(db.prepare('SELECT * FROM contracts WHERE id = ?').get(result.lastInsertRowid));
});

// === SLAs ===
router.get('/:id/slas', auth, (req, res) => {
  const db = getDb();
  res.json(db.prepare('SELECT * FROM slas WHERE contract_id = ?').all(req.params.id));
});

router.post('/:id/slas', auth, (req, res) => {
  const db = getDb();
  const { metric, target, unit = '%', penalty_rate = 0, current_compliance = 100 } = req.body;
  const result = db.prepare(`INSERT INTO slas (contract_id, metric, target, unit, penalty_rate, current_compliance) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.params.id, metric, target, unit, penalty_rate, current_compliance);
  res.status(201).json(db.prepare('SELECT * FROM slas WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id/slas/:slaId', auth, (req, res) => {
  const db = getDb();
  const { metric, target, unit, penalty_rate, current_compliance } = req.body;
  db.prepare('UPDATE slas SET metric=?, target=?, unit=?, penalty_rate=?, current_compliance=? WHERE id=?')
    .run(metric, target, unit, penalty_rate, current_compliance, req.params.slaId);
  res.json(db.prepare('SELECT * FROM slas WHERE id = ?').get(req.params.slaId));
});

// GET /api/contracts/:id/slas/penalty - Calculate SLA penalty
router.get('/:id/slas/penalty', auth, (req, res) => {
  const db = getDb();
  const slas = db.prepare('SELECT * FROM slas WHERE contract_id = ?').all(req.params.id);
  
  let totalPenalty = 0;
  const breakdown = slas.map(sla => {
    const targetNum = parseFloat(sla.target);
    const compliance = parseFloat(sla.current_compliance);
    const breached = compliance < targetNum;
    const penalty = breached ? sla.penalty_rate * ((targetNum - compliance) / targetNum) : 0;
    totalPenalty += penalty;
    return { ...sla, breached, penalty: Math.round(penalty) };
  });

  res.json({ total_penalty: Math.round(totalPenalty), breakdown });
});

function getDefaultTemplate(type, title) {
  return `# ${title}\n\nThis ${type} agreement is entered into between the parties...\n\n## Terms and Conditions\n\n1. Services\n2. Payment Terms\n3. Liability\n4. Termination`;
}

module.exports = router;
