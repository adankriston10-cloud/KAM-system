# 🚀 Key Account Management (KAM) System

A full-stack web application for managing high-value clients with relationship tracking, contract management, revenue monitoring, and account health analytics.

---

## 🎯 Features

### 1. Account Management
- ✅ Company profiles with hierarchy (parent-child relationships)
- ✅ Key contacts with roles (Decision Maker, Influencer, Champion, Blocker)
- ✅ Relationship strength indicators (0–100%)
- ✅ Account health score with animated ring visualization
- ✅ Customer journey stages (Prospect → Onboarding → Active → At Risk → Churned)
- ✅ Full interaction history & timeline

### 2. Contract Management
- ✅ Contract repository with template types (Standard, Enterprise, Custom)
- ✅ Version control (auto-increments on content change)
- ✅ Expiry alerts (90-day, 30-day warnings)
- ✅ One-click renewal with new dates and values
- ✅ SLA definition per contract (metric, target, penalty rate)
- ✅ SLA compliance tracking with automatic penalty calculation

### 3. Revenue & Financials
- ✅ Revenue tracking: MRR, ACV, Upsell, Cross-sell, One-time
- ✅ Monthly trend charts with multi-type bar visualization
- ✅ Automated invoice generation with sequential numbering
- ✅ GST/tax calculation (0%, 5%, 12%, 18%, 28%)
- ✅ Payment status tracking (Pending → Paid / Overdue)
- ✅ One-click "Mark as Paid" with payment date

### 4. Engagement Tracking
- ✅ Meeting logs with outcome and next steps
- ✅ Communication history (Email, Call, Chat, In-Person)
- ✅ Relationship milestones (Go-Live, Contract Signed, Renewal, etc.)
- ✅ NPS / CSAT / CES feedback collection
- ✅ Unified chronological timeline per account

### 5. Account Health Dashboard
- ✅ Health score trends across all accounts
- ✅ Risk categorization (Healthy / Moderate / At Risk)
- ✅ Churn prediction with multi-factor scoring
- ✅ SLA compliance overview
- ✅ Open action items with priority tracking

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Charts | Recharts |
| Routing | React Router v6 |
| HTTP Client | Axios |
| Backend | Node.js, Express.js |
| Database | SQLite (better-sqlite3) |
| Auth | JWT (jsonwebtoken) |
| Validation | express-validator |
| Password | bcryptjs |

---

## 📁 Project Structure

```
kam-system/
├── backend/
│   ├── src/
│   │   ├── index.js              # Express app entry
│   │   ├── database/
│   │   │   └── init.js           # Schema + seed data
│   │   ├── middleware/
│   │   │   └── auth.js           # JWT middleware
│   │   └── routes/
│   │       ├── auth.js           # Login, Register, Me
│   │       ├── accounts.js       # Accounts + Contacts + Actions
│   │       ├── contracts.js      # Contracts + SLAs + Renewal
│   │       ├── revenue.js        # Revenue + Invoices
│   │       ├── engagement.js     # Meetings, Comms, Milestones, Feedback
│   │       └── dashboard.js      # Analytics aggregations
│   ├── data/                     # SQLite DB file (auto-created)
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js          # Axios instance with interceptors
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Auth state management
│   │   ├── components/
│   │   │   └── Layout.jsx        # Sidebar + navigation
│   │   ├── pages/
│   │   │   ├── Login.jsx         # Auth page
│   │   │   ├── Dashboard.jsx     # KPI overview + charts
│   │   │   ├── Accounts.jsx      # Account list + CRUD
│   │   │   ├── AccountDetail.jsx # Single account with tabs
│   │   │   ├── Contracts.jsx     # Contract management + SLAs
│   │   │   ├── Revenue.jsx       # Revenue + Invoicing
│   │   │   ├── Engagement.jsx    # Meetings, Comms, Milestones
│   │   │   └── Health.jsx        # Health dashboard
│   │   ├── App.jsx               # Routes + providers
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── KAM-API.postman_collection.json
├── ER-Diagram.html
└── README.md
```

---

## ⚡ Setup Instructions

### Prerequisites
- Node.js v18+
- npm v9+

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/kam-system.git
cd kam-system
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env if needed (defaults work out of the box)

# Start the server
npm start
# or for development with auto-reload:
npm run dev
```

The backend runs on **http://localhost:5000**

> ✅ The database is **auto-created** at `backend/data/kam.db` on first run  
> ✅ **Seed data** (5 accounts, contacts, contracts, revenue) is auto-inserted  
> ✅ Default login: `admin@kam.com` / `admin123`

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend runs on **http://localhost:5173**

> The Vite dev server proxies all `/api` requests to the backend automatically.

### 4. Production Build

```bash
# Build frontend
cd frontend
npm run build
# Serves from dist/ directory

# Run backend in production
cd ../backend
NODE_ENV=production npm start
```

---

## 🔑 Authentication

All API routes except `/api/auth/login` and `/api/auth/register` require a Bearer token.

```
Authorization: Bearer <your_jwt_token>
```

Tokens expire in **7 days** (configurable via `JWT_EXPIRES_IN` in `.env`).

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with email + password |
| POST | `/api/auth/register` | Register new user |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/auth/users` | Get all users |

### Accounts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/accounts` | List all (with search, stage filter) |
| GET | `/api/accounts/:id` | Full account detail |
| POST | `/api/accounts` | Create account |
| PUT | `/api/accounts/:id` | Update account |
| DELETE | `/api/accounts/:id` | Delete account |
| GET | `/api/accounts/:id/contacts` | List contacts |
| POST | `/api/accounts/:id/contacts` | Add contact |
| PUT | `/api/accounts/:id/contacts/:cid` | Update contact |
| DELETE | `/api/accounts/:id/contacts/:cid` | Remove contact |
| GET | `/api/accounts/:id/actions` | Get action items |
| POST | `/api/accounts/:id/actions` | Add action item |
| PUT | `/api/accounts/:id/actions/:aid` | Update action item |

### Contracts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/contracts` | List all contracts |
| GET | `/api/contracts/expiring?days=90` | Contracts expiring in N days |
| GET | `/api/contracts/:id` | Contract detail with SLAs |
| POST | `/api/contracts` | Create contract |
| PUT | `/api/contracts/:id` | Update contract |
| DELETE | `/api/contracts/:id` | Delete contract |
| POST | `/api/contracts/:id/renew` | Renew contract |
| GET | `/api/contracts/:id/slas` | Get SLAs |
| POST | `/api/contracts/:id/slas` | Add SLA |
| PUT | `/api/contracts/:id/slas/:sid` | Update SLA |
| GET | `/api/contracts/:id/slas/penalty` | Calculate penalty |

### Revenue
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/revenue/summary` | MRR, ACV, totals, monthly trend |
| GET | `/api/revenue` | Revenue entries (filterable) |
| POST | `/api/revenue` | Add revenue entry |
| DELETE | `/api/revenue/:id` | Delete entry |
| GET | `/api/revenue/invoices` | List invoices |
| POST | `/api/revenue/invoices` | Generate invoice with GST |
| PUT | `/api/revenue/invoices/:id` | Update invoice (mark paid) |
| GET | `/api/revenue/invoices/overdue` | Overdue invoices |

### Engagement
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/engagement/meetings` | List meetings |
| POST | `/api/engagement/meetings` | Log meeting |
| PUT | `/api/engagement/meetings/:id` | Update meeting |
| DELETE | `/api/engagement/meetings/:id` | Delete meeting |
| GET | `/api/engagement/communications` | List communications |
| POST | `/api/engagement/communications` | Log communication |
| GET | `/api/engagement/milestones` | List milestones |
| POST | `/api/engagement/milestones` | Add milestone |
| GET | `/api/engagement/feedback` | List feedback |
| POST | `/api/engagement/feedback` | Record feedback (updates health score) |
| GET | `/api/engagement/timeline/:account_id` | Chronological timeline |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/overview` | KPI metrics |
| GET | `/api/dashboard/revenue-trend` | Monthly revenue by type |
| GET | `/api/dashboard/health-distribution` | Account health breakdown |
| GET | `/api/dashboard/stage-distribution` | Accounts by stage |
| GET | `/api/dashboard/churn-risk` | At-risk accounts with scoring |
| GET | `/api/dashboard/top-accounts` | Top 5 by revenue |
| GET | `/api/dashboard/upcoming-actions` | Open action items |
| GET | `/api/dashboard/sla-compliance` | SLA compliance overview |

---

## 🗃️ Database Schema

See `ER-Diagram.html` for the full visual entity-relationship diagram.

**Tables:** `users`, `accounts`, `contacts`, `contracts`, `slas`, `revenue`, `invoices`, `meetings`, `communications`, `milestones`, `feedback`, `action_items`

**Key Design Decisions:**
- Self-referencing `accounts.parent_id` for parent-child hierarchy
- Version control on contracts (auto-increments when content changes)
- Feedback submission automatically recalculates account health score
- SLA penalty is calculated dynamically: `penalty_rate × (target - compliance) / target`
- Invoice number auto-generated as `INV-YYYY-NNNN`

---

## 🧪 Postman Collection

Import `KAM-API.postman_collection.json` into Postman.

**Quick Start:**
1. Run the **Login** request first — token is auto-saved to collection variable
2. All other requests use `{{token}}` automatically
3. Base URL is set to `http://localhost:5000/api` via `{{baseUrl}}`

---

## 🎨 UI Design

- Dark theme with slate/blue color system
- Custom fonts: Syne (display), DM Sans (body)  
- Animated health score rings
- Responsive layout with sidebar navigation
- All CRUD operations via modal dialogs
- Toast notifications for all user actions

---

## 👤 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@kam.com | admin123 |
| Manager | sarah@kam.com | admin123 |
| Manager | raj@kam.com | admin123 |

---

## 📧 Contact

Built as part of internship evaluation for Key Account Management System.
