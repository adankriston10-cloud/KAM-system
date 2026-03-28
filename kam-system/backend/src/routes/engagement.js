const express = require('express');
const { getDb } = require('../database/init');
const auth = require('../middleware/auth');

const router = express.Router();

// === MEETINGS ===
router.get('/meetings', auth, (req, res) => {
  const db = getDb();
  const { account_id } = req.query;
  let query = 'SELECT m.*, a.company_name FROM meetings m JOIN accounts a ON m.account_id = a.id';
  const params = [];
  if (account_id) { query += ' WHERE m.account_id = ?'; params.push(account_id); }
  query += ' ORDER BY m.date DESC';
  res.json(db.prepare(query).all(...params));
});

router.post('/meetings', auth, (req, res) => {
  const db = getDb();
  const { account_id, title, date, type = 'review', notes, attendees = [], outcome, next_steps } = req.body;
  if (!account_id || !title || !date) return res.status(400).json({ error: 'account_id, title, date required' });

  const result = db.prepare(`
    INSERT INTO meetings (account_id, title, date, type, notes, attendees, outcome, next_steps)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(account_id, title, date, type, notes, JSON.stringify(attendees), outcome, next_steps);

  res.status(201).json(db.prepare('SELECT * FROM meetings WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/meetings/:id', auth, (req, res) => {
  const db = getDb();
  const { title, date, type, notes, attendees, outcome, next_steps } = req.body;
  db.prepare(`UPDATE meetings SET title=?, date=?, type=?, notes=?, attendees=?, outcome=?, next_steps=? WHERE id=?`)
    .run(title, date, type, notes, JSON.stringify(attendees || []), outcome, next_steps, req.params.id);
  res.json(db.prepare('SELECT * FROM meetings WHERE id = ?').get(req.params.id));
});

router.delete('/meetings/:id', auth, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM meetings WHERE id = ?').run(req.params.id);
  res.json({ message: 'Meeting deleted' });
});

// === COMMUNICATIONS ===
router.get('/communications', auth, (req, res) => {
  const db = getDb();
  const { account_id, type } = req.query;
  let query = `
    SELECT c.*, a.company_name, ct.name as contact_name
    FROM communications c 
    JOIN accounts a ON c.account_id = a.id 
    LEFT JOIN contacts ct ON c.contact_id = ct.id
    WHERE 1=1
  `;
  const params = [];
  if (account_id) { query += ' AND c.account_id = ?'; params.push(account_id); }
  if (type) { query += ' AND c.type = ?'; params.push(type); }
  query += ' ORDER BY c.date DESC';
  res.json(db.prepare(query).all(...params));
});

router.post('/communications', auth, (req, res) => {
  const db = getDb();
  const { account_id, type, subject, content, direction = 'outbound', date, contact_id } = req.body;
  if (!account_id || !type || !date) return res.status(400).json({ error: 'account_id, type, date required' });

  const result = db.prepare(`
    INSERT INTO communications (account_id, type, subject, content, direction, date, contact_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(account_id, type, subject, content, direction, date, contact_id || null);

  res.status(201).json(db.prepare('SELECT * FROM communications WHERE id = ?').get(result.lastInsertRowid));
});

router.delete('/communications/:id', auth, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM communications WHERE id = ?').run(req.params.id);
  res.json({ message: 'Communication deleted' });
});

// === MILESTONES ===
router.get('/milestones', auth, (req, res) => {
  const db = getDb();
  const { account_id } = req.query;
  let query = 'SELECT m.*, a.company_name FROM milestones m JOIN accounts a ON m.account_id = a.id';
  if (account_id) { query += ' WHERE m.account_id = ?'; }
  query += ' ORDER BY m.date DESC';
  res.json(db.prepare(query).all(...(account_id ? [account_id] : [])));
});

router.post('/milestones', auth, (req, res) => {
  const db = getDb();
  const { account_id, title, description, date, type = 'other' } = req.body;
  if (!account_id || !title || !date) return res.status(400).json({ error: 'account_id, title, date required' });

  const result = db.prepare('INSERT INTO milestones (account_id, title, description, date, type) VALUES (?, ?, ?, ?, ?)').run(account_id, title, description, date, type);
  res.status(201).json(db.prepare('SELECT * FROM milestones WHERE id = ?').get(result.lastInsertRowid));
});

router.delete('/milestones/:id', auth, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM milestones WHERE id = ?').run(req.params.id);
  res.json({ message: 'Milestone deleted' });
});

// === FEEDBACK ===
router.get('/feedback', auth, (req, res) => {
  const db = getDb();
  const { account_id } = req.query;
  let query = 'SELECT f.*, a.company_name FROM feedback f JOIN accounts a ON f.account_id = a.id';
  if (account_id) { query += ' WHERE f.account_id = ?'; }
  query += ' ORDER BY f.date DESC';
  res.json(db.prepare(query).all(...(account_id ? [account_id] : [])));
});

router.post('/feedback', auth, (req, res) => {
  const db = getDb();
  const { account_id, score, type = 'nps', comments, date } = req.body;
  if (!account_id || !score || !date) return res.status(400).json({ error: 'account_id, score, date required' });

  const result = db.prepare('INSERT INTO feedback (account_id, score, type, comments, date) VALUES (?, ?, ?, ?, ?)').run(account_id, score, type, comments, date);
  
  // Update account health score based on feedback
  const avgFeedback = db.prepare('SELECT AVG(score) * 10 as avg FROM feedback WHERE account_id = ?').get(account_id);
  if (avgFeedback?.avg) {
    db.prepare('UPDATE accounts SET health_score = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(Math.round(avgFeedback.avg), account_id);
  }
  
  res.status(201).json(db.prepare('SELECT * FROM feedback WHERE id = ?').get(result.lastInsertRowid));
});

// GET /api/engagement/timeline/:account_id
router.get('/timeline/:account_id', auth, (req, res) => {
  const db = getDb();
  const id = req.params.account_id;

  const meetings = db.prepare("SELECT 'meeting' as type, title, date as event_date, notes as detail FROM meetings WHERE account_id = ?").all(id);
  const comms = db.prepare("SELECT 'communication' as type, subject as title, date as event_date, content as detail FROM communications WHERE account_id = ?").all(id);
  const milestones = db.prepare("SELECT 'milestone' as type, title, date as event_date, description as detail FROM milestones WHERE account_id = ?").all(id);
  const feedbacks = db.prepare("SELECT 'feedback' as type, ('NPS Score: ' || score) as title, date as event_date, comments as detail FROM feedback WHERE account_id = ?").all(id);

  const timeline = [...meetings, ...comms, ...milestones, ...feedbacks]
    .sort((a, b) => new Date(b.event_date) - new Date(a.event_date));

  res.json(timeline);
});

module.exports = router;
