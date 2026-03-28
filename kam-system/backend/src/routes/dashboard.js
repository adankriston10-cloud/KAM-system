const express = require('express');
const { getDb } = require('../database/init');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/overview
router.get('/overview', auth, (req, res) => {
  const db = getDb();

  const totalAccounts = db.prepare("SELECT COUNT(*) as count FROM accounts").get();
  const atRisk = db.prepare("SELECT COUNT(*) as count FROM accounts WHERE journey_stage = 'at_risk' OR health_score < 50").get();
  const activeContracts = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(value),0) as total_value FROM contracts WHERE status = 'active'").get();
  const mrr = db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM revenue WHERE type='mrr' AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')").get();
  const pendingInvoices = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(total_amount),0) as total FROM invoices WHERE status='pending'").get();
  const overdueInvoices = db.prepare("SELECT COUNT(*) as count FROM invoices WHERE status='pending' AND due_date < date('now')").get();
  const avgHealthScore = db.prepare("SELECT ROUND(AVG(health_score),1) as avg FROM accounts").get();
  const openActions = db.prepare("SELECT COUNT(*) as count FROM action_items WHERE status IN ('open','in_progress')").get();
  const expiringContracts = db.prepare("SELECT COUNT(*) as count FROM contracts WHERE status='active' AND julianday(end_date) - julianday('now') <= 90").get();

  res.json({
    total_accounts: totalAccounts.count,
    at_risk_accounts: atRisk.count,
    active_contracts: activeContracts.count,
    contract_value: activeContracts.total_value,
    mrr: mrr.total,
    pending_invoices: pendingInvoices.count,
    pending_invoice_value: pendingInvoices.total,
    overdue_invoices: overdueInvoices.count,
    avg_health_score: avgHealthScore.avg,
    open_action_items: openActions.count,
    expiring_contracts: expiringContracts.count
  });
});

// GET /api/dashboard/health-distribution
router.get('/health-distribution', auth, (req, res) => {
  const db = getDb();
  const accounts = db.prepare(`
    SELECT company_name, health_score, journey_stage,
      CASE 
        WHEN health_score >= 80 THEN 'healthy'
        WHEN health_score >= 60 THEN 'moderate'
        ELSE 'at_risk'
      END as health_category
    FROM accounts ORDER BY health_score DESC
  `).all();

  const distribution = {
    healthy: accounts.filter(a => a.health_score >= 80).length,
    moderate: accounts.filter(a => a.health_score >= 60 && a.health_score < 80).length,
    at_risk: accounts.filter(a => a.health_score < 60).length,
    accounts
  };

  res.json(distribution);
});

// GET /api/dashboard/revenue-trend
router.get('/revenue-trend', auth, (req, res) => {
  const db = getDb();
  const trend = db.prepare(`
    SELECT 
      strftime('%Y-%m', date) as month,
      COALESCE(SUM(CASE WHEN type='mrr' THEN amount END),0) as mrr,
      COALESCE(SUM(CASE WHEN type='upsell' THEN amount END),0) as upsell,
      COALESCE(SUM(CASE WHEN type='cross_sell' THEN amount END),0) as cross_sell,
      COALESCE(SUM(CASE WHEN type='one_time' THEN amount END),0) as one_time,
      COALESCE(SUM(amount),0) as total
    FROM revenue 
    GROUP BY month 
    ORDER BY month DESC LIMIT 12
  `).all().reverse();
  res.json(trend);
});

// GET /api/dashboard/stage-distribution
router.get('/stage-distribution', auth, (req, res) => {
  const db = getDb();
  const stages = db.prepare(`
    SELECT journey_stage as stage, COUNT(*) as count, ROUND(AVG(health_score),1) as avg_health
    FROM accounts GROUP BY journey_stage ORDER BY count DESC
  `).all();
  res.json(stages);
});

// GET /api/dashboard/churn-risk
router.get('/churn-risk', auth, (req, res) => {
  const db = getDb();
  // Accounts with low health + expiring contracts + recent negative feedback
  const risks = db.prepare(`
    SELECT a.id, a.company_name, a.health_score, a.journey_stage,
      (SELECT MAX(score) FROM feedback WHERE account_id = a.id) as last_nps,
      (SELECT COUNT(*) FROM contracts WHERE account_id = a.id AND status='active' AND julianday(end_date) - julianday('now') <= 60) as expiring_contracts,
      (SELECT COUNT(*) FROM action_items WHERE account_id = a.id AND status='open' AND priority='high') as high_priority_actions,
      CASE 
        WHEN a.health_score < 50 THEN 'high'
        WHEN a.health_score < 70 THEN 'medium'
        ELSE 'low'
      END as churn_risk
    FROM accounts a
    WHERE a.health_score < 75 OR a.journey_stage = 'at_risk'
    ORDER BY a.health_score ASC
  `).all();
  res.json(risks);
});

// GET /api/dashboard/top-accounts
router.get('/top-accounts', auth, (req, res) => {
  const db = getDb();
  const accounts = db.prepare(`
    SELECT a.company_name, a.health_score, a.journey_stage,
      COALESCE(SUM(r.amount),0) as total_revenue,
      (SELECT COUNT(*) FROM contracts WHERE account_id = a.id AND status='active') as active_contracts
    FROM accounts a LEFT JOIN revenue r ON a.id = r.account_id
    GROUP BY a.id ORDER BY total_revenue DESC LIMIT 5
  `).all();
  res.json(accounts);
});

// GET /api/dashboard/upcoming-actions
router.get('/upcoming-actions', auth, (req, res) => {
  const db = getDb();
  const actions = db.prepare(`
    SELECT ai.*, a.company_name, u.name as assignee_name
    FROM action_items ai 
    JOIN accounts a ON ai.account_id = a.id
    LEFT JOIN users u ON ai.assigned_to = u.id
    WHERE ai.status IN ('open', 'in_progress') AND ai.due_date IS NOT NULL
    ORDER BY ai.priority DESC, ai.due_date ASC LIMIT 10
  `).all();
  res.json(actions);
});

// GET /api/dashboard/sla-compliance
router.get('/sla-compliance', auth, (req, res) => {
  const db = getDb();
  const slas = db.prepare(`
    SELECT s.*, c.title as contract_title, a.company_name,
      CASE WHEN s.current_compliance < CAST(s.target AS REAL) THEN 1 ELSE 0 END as breached
    FROM slas s 
    JOIN contracts c ON s.contract_id = c.id
    JOIN accounts a ON c.account_id = a.id
    WHERE c.status = 'active'
    ORDER BY s.current_compliance ASC
  `).all();

  const stats = {
    total: slas.length,
    compliant: slas.filter(s => !s.breached).length,
    breached: slas.filter(s => s.breached).length,
    avg_compliance: slas.length ? (slas.reduce((acc, s) => acc + s.current_compliance, 0) / slas.length).toFixed(1) : 100,
    slas
  };
  res.json(stats);
});

module.exports = router;
