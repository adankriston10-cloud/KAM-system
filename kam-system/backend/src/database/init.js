const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../../data/kam.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDatabase() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'manager',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      industry TEXT,
      company_size TEXT,
      website TEXT,
      address TEXT,
      phone TEXT,
      parent_id INTEGER REFERENCES accounts(id),
      health_score INTEGER DEFAULT 70,
      journey_stage TEXT DEFAULT 'active',
      account_manager_id INTEGER REFERENCES users(id),
      annual_revenue REAL DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      title TEXT,
      role TEXT DEFAULT 'influencer',
      relationship_strength INTEGER DEFAULT 50,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      template_type TEXT DEFAULT 'standard',
      status TEXT DEFAULT 'active',
      start_date DATE,
      end_date DATE,
      value REAL DEFAULT 0,
      version INTEGER DEFAULT 1,
      content TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS slas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
      metric TEXT NOT NULL,
      target TEXT NOT NULL,
      unit TEXT DEFAULT '%',
      penalty_rate REAL DEFAULT 0,
      current_compliance REAL DEFAULT 100,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS revenue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      date DATE NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      invoice_number TEXT UNIQUE,
      amount REAL NOT NULL,
      tax_rate REAL DEFAULT 18,
      tax_amount REAL,
      total_amount REAL,
      status TEXT DEFAULT 'pending',
      due_date DATE,
      paid_date DATE,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS meetings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      date DATETIME NOT NULL,
      type TEXT DEFAULT 'review',
      notes TEXT,
      attendees TEXT DEFAULT '[]',
      outcome TEXT,
      next_steps TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS communications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      subject TEXT,
      content TEXT,
      direction TEXT DEFAULT 'outbound',
      date DATETIME NOT NULL,
      contact_id INTEGER REFERENCES contacts(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS milestones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      date DATE NOT NULL,
      type TEXT DEFAULT 'other',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      score INTEGER NOT NULL,
      type TEXT DEFAULT 'nps',
      comments TEXT,
      date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS action_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT DEFAULT 'medium',
      due_date DATE,
      status TEXT DEFAULT 'open',
      assigned_to INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed data if users table is empty
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    seedData(db);
  }

  console.log('✅ Database initialized successfully');
}

function seedData(db) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);

  // Insert admin user
  const adminInsert = db.prepare(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`);
  const admin = adminInsert.run('Admin User', 'admin@kam.com', hashedPassword, 'admin');
  const manager = adminInsert.run('Sarah Johnson', 'sarah@kam.com', hashedPassword, 'manager');
  const mgr2 = adminInsert.run('Raj Patel', 'raj@kam.com', hashedPassword, 'manager');

  // Insert accounts
  const accInsert = db.prepare(`INSERT INTO accounts (company_name, industry, company_size, website, health_score, journey_stage, account_manager_id, annual_revenue, phone, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  
  const acc1 = accInsert.run('TechCorp Solutions', 'Technology', '501-1000', 'https://techcorp.com', 85, 'active', manager.lastInsertRowid, 2500000, '+91-9876543210', 'Mumbai, Maharashtra');
  const acc2 = accInsert.run('GlobalTrade India', 'Manufacturing', '1001-5000', 'https://globaltrade.in', 62, 'at_risk', manager.lastInsertRowid, 5000000, '+91-9876543211', 'Delhi, NCR');
  const acc3 = accInsert.run('FinServe Group', 'Finance', '201-500', 'https://finserve.com', 91, 'active', mgr2.lastInsertRowid, 1800000, '+91-9876543212', 'Bengaluru, Karnataka');
  const acc4 = accInsert.run('HealthPlus Systems', 'Healthcare', '51-200', 'https://healthplus.io', 45, 'at_risk', mgr2.lastInsertRowid, 900000, '+91-9876543213', 'Chennai, Tamil Nadu');
  const acc5 = accInsert.run('EduTech Innovations', 'Education', '11-50', 'https://edutech.co', 78, 'onboarding', manager.lastInsertRowid, 350000, '+91-9876543214', 'Pune, Maharashtra');

  // Insert contacts
  const conInsert = db.prepare(`INSERT INTO contacts (account_id, name, email, phone, title, role, relationship_strength) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  
  conInsert.run(acc1.lastInsertRowid, 'Priya Sharma', 'priya@techcorp.com', '+91-9876500001', 'CTO', 'decision_maker', 88);
  conInsert.run(acc1.lastInsertRowid, 'Arun Kumar', 'arun@techcorp.com', '+91-9876500002', 'VP Engineering', 'influencer', 72);
  conInsert.run(acc2.lastInsertRowid, 'Manish Gupta', 'manish@globaltrade.in', '+91-9876500003', 'CEO', 'decision_maker', 55);
  conInsert.run(acc2.lastInsertRowid, 'Neha Singh', 'neha@globaltrade.in', '+91-9876500004', 'IT Director', 'champion', 68);
  conInsert.run(acc3.lastInsertRowid, 'Vijay Reddy', 'vijay@finserve.com', '+91-9876500005', 'CFO', 'decision_maker', 92);
  conInsert.run(acc4.lastInsertRowid, 'Dr. Meera Iyer', 'meera@healthplus.io', '+91-9876500006', 'COO', 'decision_maker', 40);
  conInsert.run(acc5.lastInsertRowid, 'Rohit Jain', 'rohit@edutech.co', '+91-9876500007', 'Founder', 'decision_maker', 80);

  // Insert contracts
  const ctInsert = db.prepare(`INSERT INTO contracts (account_id, title, template_type, status, start_date, end_date, value, version, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  
  const ct1 = ctInsert.run(acc1.lastInsertRowid, 'Enterprise Platform License', 'enterprise', 'active', '2024-01-01', '2024-12-31', 1200000, 2, admin.lastInsertRowid);
  const ct2 = ctInsert.run(acc2.lastInsertRowid, 'Manufacturing Suite Agreement', 'standard', 'active', '2024-03-01', '2024-08-31', 800000, 1, admin.lastInsertRowid);
  const ct3 = ctInsert.run(acc3.lastInsertRowid, 'FinTech Premium Package', 'enterprise', 'active', '2023-07-01', '2025-06-30', 2400000, 3, admin.lastInsertRowid);
  const ct4 = ctInsert.run(acc4.lastInsertRowid, 'Healthcare Basic Plan', 'standard', 'active', '2024-04-01', '2024-09-30', 450000, 1, admin.lastInsertRowid);
  ctInsert.run(acc5.lastInsertRowid, 'Education Starter Package', 'custom', 'active', '2024-06-01', '2025-05-31', 180000, 1, admin.lastInsertRowid);

  // Insert SLAs
  const slaInsert = db.prepare(`INSERT INTO slas (contract_id, metric, target, unit, penalty_rate, current_compliance) VALUES (?, ?, ?, ?, ?, ?)`);
  slaInsert.run(ct1.lastInsertRowid, 'System Uptime', '99.9', '%', 5000, 99.7);
  slaInsert.run(ct1.lastInsertRowid, 'Response Time', '2', 'hours', 2000, 98.5);
  slaInsert.run(ct2.lastInsertRowid, 'Uptime', '99.5', '%', 3000, 97.2);
  slaInsert.run(ct3.lastInsertRowid, 'Uptime', '99.99', '%', 10000, 99.95);
  slaInsert.run(ct4.lastInsertRowid, 'Support Response', '4', 'hours', 1000, 94.0);

  // Insert revenue
  const revInsert = db.prepare(`INSERT INTO revenue (account_id, type, amount, date, description) VALUES (?, ?, ?, ?, ?)`);
  const months = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06'];
  months.forEach(m => {
    revInsert.run(acc1.lastInsertRowid, 'mrr', 100000, `${m}-01`, 'Monthly Recurring Revenue');
    revInsert.run(acc2.lastInsertRowid, 'mrr', 66667, `${m}-01`, 'Monthly Recurring Revenue');
    revInsert.run(acc3.lastInsertRowid, 'mrr', 100000, `${m}-01`, 'Monthly Recurring Revenue');
  });
  revInsert.run(acc1.lastInsertRowid, 'upsell', 150000, '2024-03-15', 'Additional Module License');
  revInsert.run(acc3.lastInsertRowid, 'cross_sell', 200000, '2024-05-10', 'Analytics Add-on');
  revInsert.run(acc2.lastInsertRowid, 'one_time', 50000, '2024-04-20', 'Implementation Fee');

  // Insert invoices
  const invInsert = db.prepare(`INSERT INTO invoices (account_id, invoice_number, amount, tax_rate, tax_amount, total_amount, status, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const inv = (id, num, amt, st, due) => {
    const tax = amt * 0.18;
    invInsert.run(id, num, amt, 18, tax, amt + tax, st, due);
  };
  inv(acc1.lastInsertRowid, 'INV-2024-001', 100000, 'paid', '2024-02-01');
  inv(acc1.lastInsertRowid, 'INV-2024-002', 100000, 'paid', '2024-03-01');
  inv(acc1.lastInsertRowid, 'INV-2024-003', 100000, 'pending', '2024-07-01');
  inv(acc2.lastInsertRowid, 'INV-2024-004', 66667, 'overdue', '2024-05-15');
  inv(acc3.lastInsertRowid, 'INV-2024-005', 100000, 'paid', '2024-06-01');
  inv(acc4.lastInsertRowid, 'INV-2024-006', 37500, 'pending', '2024-07-15');

  // Insert meetings
  const metInsert = db.prepare(`INSERT INTO meetings (account_id, title, date, type, notes, outcome, next_steps) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  metInsert.run(acc1.lastInsertRowid, 'Q2 Business Review', '2024-06-15 10:00', 'review', 'Reviewed Q2 performance metrics. Client satisfied with uptime SLA compliance.', 'Positive - renewal discussion initiated', 'Send renewal proposal by June 30');
  metInsert.run(acc2.lastInsertRowid, 'Risk Mitigation Meeting', '2024-06-20 14:00', 'support', 'Discussed ongoing integration issues and roadmap concerns.', 'Action plan agreed upon', 'Technical team to resolve API issues within 2 weeks');
  metInsert.run(acc3.lastInsertRowid, 'Annual Contract Review', '2024-05-28 11:00', 'renewal', 'Reviewed 2-year contract performance. Discussed expansion opportunities.', 'Excellent - expansion proposed', 'Prepare analytics module proposal');
  metInsert.run(acc4.lastInsertRowid, 'Health Check Call', '2024-06-10 15:00', 'support', 'Client experiencing performance issues. Need immediate action.', 'Escalated to engineering', 'Deploy hotfix within 48 hours');

  // Insert communications
  const commInsert = db.prepare(`INSERT INTO communications (account_id, type, subject, content, direction, date) VALUES (?, ?, ?, ?, ?, ?)`);
  commInsert.run(acc1.lastInsertRowid, 'email', 'Renewal Proposal Q3', 'Please find attached our renewal proposal for Q3 2024...', 'outbound', '2024-06-18 09:30');
  commInsert.run(acc2.lastInsertRowid, 'call', 'Follow-up on Integration Issues', 'Called to follow up on API integration problems reported last week...', 'outbound', '2024-06-22 11:00');
  commInsert.run(acc3.lastInsertRowid, 'email', 'Analytics Module Proposal', 'We are excited to share our analytics module proposal...', 'outbound', '2024-06-01 10:00');

  // Insert milestones
  const milInsert = db.prepare(`INSERT INTO milestones (account_id, title, description, date, type) VALUES (?, ?, ?, ?, ?)`);
  milInsert.run(acc1.lastInsertRowid, 'Contract Signed', 'Enterprise platform license agreement signed', '2024-01-01', 'contract_signed');
  milInsert.run(acc1.lastInsertRowid, 'Go-Live', 'Platform successfully deployed in production', '2024-02-15', 'go_live');
  milInsert.run(acc3.lastInsertRowid, '2-Year Anniversary', 'Celebrated 2 years of partnership', '2024-05-01', 'other');

  // Insert feedback
  const fbInsert = db.prepare(`INSERT INTO feedback (account_id, score, type, comments, date) VALUES (?, ?, ?, ?, ?)`);
  fbInsert.run(acc1.lastInsertRowid, 9, 'nps', 'Excellent support and platform reliability. Very happy!', '2024-06-01');
  fbInsert.run(acc2.lastInsertRowid, 5, 'csat', 'Integration challenges have been frustrating. Need better documentation.', '2024-06-01');
  fbInsert.run(acc3.lastInsertRowid, 10, 'nps', 'Best decision we made. The platform has transformed our operations.', '2024-06-01');
  fbInsert.run(acc4.lastInsertRowid, 4, 'nps', 'Experiencing performance issues. Support response time needs improvement.', '2024-06-01');
  fbInsert.run(acc5.lastInsertRowid, 8, 'csat', 'Great onboarding experience. Looking forward to full deployment.', '2024-06-01');

  // Insert action items
  const aiInsert = db.prepare(`INSERT INTO action_items (account_id, title, description, priority, due_date, status, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  aiInsert.run(acc2.lastInsertRowid, 'Resolve API Integration Issues', 'Fix the authentication problems in REST API integration', 'high', '2024-07-05', 'in_progress', mgr2.lastInsertRowid);
  aiInsert.run(acc4.lastInsertRowid, 'Performance Optimization', 'Investigate and fix server response time issues', 'high', '2024-07-01', 'open', mgr2.lastInsertRowid);
  aiInsert.run(acc1.lastInsertRowid, 'Send Renewal Proposal', 'Prepare and send Q3 renewal proposal with new pricing', 'medium', '2024-07-10', 'open', manager.lastInsertRowid);
  aiInsert.run(acc3.lastInsertRowid, 'Analytics Module Demo', 'Schedule and conduct analytics module demo', 'medium', '2024-07-15', 'open', manager.lastInsertRowid);

  console.log('✅ Seed data inserted successfully');
  console.log('📧 Login: admin@kam.com / admin123');
}

module.exports = { getDb, initDatabase };
