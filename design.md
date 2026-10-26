---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Technology Stack](#2-technology-stack)
3. [Directory Structure](#3-directory-structure)
4. [Database Schema](#4-database-schema)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Frontend Architecture (React SPA)](#6-frontend-architecture-react-spa)
7. [Backend Architecture (PHP)](#7-backend-architecture-php)
8. [API Endpoints](#8-api-endpoints)
9. [Wallet System](#9-wallet-system)
10. [POS & Marketplace](#10-pos--marketplace)
11. [Fraud Detection](#11-fraud-detection)
12. [Scheduled Jobs (Cron)](#12-scheduled-jobs-cron)
13. [Integration Channels](#13-integration-channels)
14. [Deployment](#14-deployment)

---

## 1. System Overview

YEEP is a comprehensive digital ecosystem built for KCCA to administer Uganda's Youth Economic Empowerment Programme. It connects government administrators, beneficiaries, suppliers, trainers, and the public through a unified platform.

### Core Capabilities

| Capability | Description |
|---|---|
| **Cashless POS** | Point-of-sale with Mobile Money (MTN/Airtel) and Cash. Three price tiers per product. Paginated product grid. |
| **Enterprise Registry** | Full lifecycle management for youth enterprises — registration, verification, monitoring, recovery |
| **Beneficiary Management** | Enrollment, KYC, profiling, phase progression, training, attendance, grievance handling |
| **Wallet Engine** | 70/20/10 split: Asset Float (70%), Living Allowance (20%), Working Capital (10%) |
| **Supplier Marketplace** | Registered suppliers with bond (500K UGX), trust scoring, inventory, order management |
| **GIS Mapping** | MapLibre GL-based spatial visualization of enterprises, markets, and beneficiary distribution |
| **Analytics & Reporting** | Real-time dashboards, Chart.js visualizations, automated reports |
| **Multi-Channel Access** | Web (React SPA), USSD (*284#), Voice IVR, Android (PWA), SMS notifications |
| **Fraud Detection** | 10 fraud types, ghost shop daemon, transaction splitting detection, price cap enforcement |
| **Revolving Fund** | 50/50 government-beneficiary split with graduated deduction rates |
| **Invoice Escrow** | 9-status invoice workflow with 48-hour auto-approval |

### Key Numbers

- **31+** database tables
- **33** React page components
- **27** PHP API endpoints
- **10** business logic engines
- **7** scheduled cron jobs (database events)
- **10** user roles with granular RBAC
- **6** integration channels (Web, USSD, Voice, SMS, Mobile Money, Odoo ERP)

---

## 2. Technology Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.x | UI framework (SPA) |
| TypeScript | 5.6+ | Type safety |
| Vite | 6.x | Build tool & dev server |
| Tailwind CSS | 3.4+ | Utility-first styling |
| Framer Motion | 12.x | Animations |
| Lucide React | latest | Icon library |
| Chart.js + chartjs-plugin-datalabels | 4.x | Data visualization |
| MapLibre GL JS | 5.x | GIS/map rendering |
| Axios | 1.7+ | HTTP client |
| clsx + tailwind-merge | latest | Class merging |
| class-variance-authority | 0.7+ | Component variants |
| @radix-ui/react-slot | 1.3+ | Component primitives |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| PHP | 8.x | Server-side logic |
| MySQL | 8.x | Relational database |
| FPDF | latest | PDF generation |

### Dev Tools
- TypeScript (strict mode)
- ESLint via `phpcs`
- PowerShell security scanning

---

## 3. Directory Structure

```
YEEP/
├── admin/                        # Built React SPA (production build output)
├── api/                          # 27 PHP REST API endpoints
├── assets/                       # Static assets (CSS, images, uploads)
│   ├── css/
│   ├── images/                   # kcca_logo.png, uganda_logo.svg, login-bg.png
│   ├── forms/fpdf/               # FPDF library
│   └── uploads/photos/           # Uploaded photos
├── config/                       # Application & database config
│   ├── app.php
│   └── database.php
├── cron/                         # Background daemon scripts (9 PHP files)
├── database/                     # SQL migration files (36 files)
├── engines/                      # Core business logic (10 PHP files)
├── gis-command-center/           # React frontend source code
│   └── src/
│       ├── components/           # Header, LeftNavigation, UI primitives, maps, panels
│       ├── hooks/                # useAuth, useApiCache, useDashboardData, useToast
│       ├── lib/                  # Utils, permissions, analytics-charts, financials
│       ├── pages/                # 33 page components
│       ├── services/             # API client, module service
│       ├── types/                # TypeScript definitions
│       ├── App.tsx               # Main app with module-based routing
│       ├── main.tsx              # Entry point
│       ├── index.css             # Global styles
│       └── theme.ts              # Theme constants
├── lib/                          # Shared PHP libraries (5 files)
├── odoo/                         # Odoo ERP integration
├── partner/                      # Trainer/partner portal (PHP)
├── supplier/                     # Supplier portal (PHP)
├── login.php                     # OTP-based login page
├── index.php                     # Root entry (redirects to login.php)
├── beneficiary_portal.php        # Beneficiary-facing portal
├── pos.php                       # Point-of-Sale (standalone PHP)
├── receipt.php                   # Receipt lookup & print
└── beneficiary-registration-form.php  # Multi-step registration form
```

---

## 4. Database Schema

### Database: `step_db` (MySQL 8+, utf8mb4_unicode_ci)

#### Reference & Lookup Tables
| Table | Purpose |
|---|---|
| `locations` | Hierarchical: national > region > district > county > sub_county > parish |
| `skill_tracks` | Tailoring, Welding, Agro-Processing, Boda Mechanics, Carpentry |
| `asset_categories` | 10 categories mapped to skill tracks |
| `skill_asset_matrix` | Enforces which assets each skill track can purchase |
| `market_baselines` | Price caps per asset category |
| `trade_benchmarks` | Monthly revenue targets per skill |

#### Users & Identity
| Table | Purpose |
|---|---|
| `users` | Role ENUM: beneficiary, trainer, supplier, parish_chief, sub_county_admin, county_admin, district_admin, national_admin, system |
| `user_sessions` | Session management |
| `nira_verification_log` | National ID verification audit |

#### Enrollment & Progression
| Table | Purpose |
|---|---|
| `enrollments` | KYC tier tracking (Tier 1-3) |
| `phase_progression` | 5 phases — auto-created by trigger on user insert |

#### Wallet System
| Table | Purpose |
|---|---|
| `master_accounts` | 1:1 with user |
| `sub_wallets` | Three per user: living_allowance (20%), asset_float (70%), working_capital (10%) — auto-created by trigger |
| `transactions` | 10 types, 6 statuses, 4-state machine |
| `invoices` | 9-status workflow with escrow, auto-approve after 48hrs |
| `invoice_line_items` | Per-item breakdown |

#### Suppliers
| Table | Purpose |
|---|---|
| `suppliers` | URSB/URA/bank validation, 500K bond, trust score |
| `supplier_inventory` | Supplier product stock |

#### Beneficiary Profiling
| Table | Purpose |
|---|---|
| `next_of_kin` | Emergency contact |
| `beneficiary_health` | Health/medical info |
| `beneficiary_financial_accounts` | Bank/MoMo account details |

#### Training
| Table | Purpose |
|---|---|
| `training_organizations` | Accredited training bodies |
| `training_enrollments` | Training participation |
| `training_modules` | Curriculum modules |

#### Attendance
| Table | Purpose |
|---|---|
| `attendance_logs` | Biometric, GPS, USSD, QR, supervisor_manual methods |

#### Fraud & Compliance
| Table | Purpose |
|---|---|
| `ghost_shop_tickets` | 21-day inactivity triggers inspection |
| `fraud_alerts` | 10 fraud types |
| `txn_aggregation_7day` | Transaction splitting detection |
| `grievances` | County > District > National escalation |

#### Financial Identity
| Table | Purpose |
|---|---|
| `financial_identity` | Credit readiness scoring (monthly recalculation) |

#### Revolving Fund
| Table | Purpose |
|---|---|
| `revolving_deductions` | Graduated: 0% (months 1-3), 1.5% (4-6), 3% (7+) |
| `parish_funds` | Parish-level fund tracking |

#### Mentorship
| Table | Purpose |
|---|---|
| `mentors` | Mentor registry |
| `mentorship_pairings` | Mentor-beneficiary pairs |
| `peer_circles` | Peer support groups |
| `peer_circle_members` | Membership tracking |

#### System
| Table | Purpose |
|---|---|
| `message_queue` | Priority queue with retries |
| `audit_log` | Immutable audit with GPS coordinates |

### Stored Procedures
- `check_skill_asset_match()` — Validates beneficiary can purchase an asset category
- `check_price_cap()` — Validates price within market baseline
- `check_attendance_record()` — Checks if beneficiary is checked in

### Triggers
| Trigger | Event | Action |
|---|---|---|
| `after_master_account_insert` | INSERT on master_accounts | Auto-creates 3 sub-wallets (70/20/10) |
| `after_user_insert_beneficiary` | INSERT on users (role=beneficiary) | Auto-creates phase_progression |
| `after_transaction_insert` | INSERT on transactions | Auto-logs to audit_log |
| `after_customer_payment_insert` | INSERT on customer_payments | Auto-deducts revolving fund contribution |

### Scheduled Events
| Event | Frequency | Purpose |
|---|---|---|
| `ghost_shop_daemon` | Daily | Flags 21-day inactive shops |
| `ghost_shop_escalator` | Daily | Escalates unresponded inspections |
| `grievance_escalator` | Daily | County → District → National |
| `attendance_enforcement` | Daily | Locks accounts after 7 missed days |
| `auto_approve_invoices` | Hourly | Auto-approves after 48hrs |
| `trust_score_calculator` | Monthly | Recalculates supplier trust |
| `financial_identity_calculator` | Monthly | Recalculates credit readiness |

---

## 5. Authentication & Authorization

### Login Flow (OTP-based)
1. User enters phone number (format: `2567XXXXXXXX`)
2. `POST /api/otp.php?action=send` — Sends 6-digit OTP via SMS (simulated in dev)
3. User enters 6-digit code in digit boxes (auto-advance, paste support, backspace navigation)
4. `POST /api/otp.php?action=verify` — Verifies code
5. On success: `auth_token` + `user` stored in `localStorage`
6. Routes: beneficiary → `beneficiary_portal.php`, staff → `admin/`

### Staff Quick-Login
Hardcoded staff accounts on the login page for testing:

| Name | Phone | Role | Portal |
|---|---|---|---|
| Grace Nakato | 256700000010 | Registration Officer | registration_officer |
| Sarah Nabatanzi | 256700000012 | Programme Officer | programme_officer |
| Mariam Nantongo | 256700000016 | Finance Officer | finance_officer |
| Esther Namugenyi | 256700000014 | KCCA Verification Officer | kcca_verification_officer |
| Kampala Commercial Kitchens | 256700001001 | Supplier | supplier |
| Brenda Akello | 256772111000 | Beneficiary | beneficiary |
| Admin | 256700000001 | System Admin | system_admin |

Fallback dev auto-login via `staffAutoLogin()` when API is unavailable.

### RBAC — 10 User Roles
| Role | Offices Accessible | Primary Office |
|---|---|---|
| `staff_registration_officer` | registration-office | registration-office |
| `staff_programme_finance_officer` | programme-office, finance-office | programme-office |
| `staff_programme_officer` | programme-office | programme-office |
| `staff_finance_officer` | finance-office | finance-office |
| `staff_kcca_verification_officer` | verification-office | verification-office |
| `staff_supplier` | supplier-portal | supplier-portal |
| `beneficiary` | beneficiary-portal | beneficiary-portal |
| `system_admin` | programme, registration, verification, marketplace, recovery, finance, administration | programme-office |
| `staff_admin` | programme, registration, verification, marketplace, recovery, finance, administration | programme-office |
| `staff_executive` | executive, programme, registration, verification, marketplace, recovery, finance, administration | executive-office |

### Session
- Token-based (JWT-style via `auth_token` in localStorage)
- Validated against API on each page load
- 24-hour expiry (`SESSION_EXPIRY_HOURS`)

---

## 6. Frontend Architecture (React SPA)

### Module-Based Navigation (Not React Router)
The SPA uses a custom module system via URL query parameter `?module=`. No React Router.

**Flow:** localStorage auth → API token validation → Role detection → Module rendering

### Page Registry (33 Modules)
All modules listed in `App.tsx` MODULES object, lazy-loaded via `React.lazy()` + `Suspense`:

**Executive:**
- `dashboard` — Executive command center
- `analytics` — Analytics dashboards
- `gis` — GIS map view (MapLibre GL)

**Programme Management Group:**
- `beneficiaries` — Beneficiary CRUD and management
- `beneficiary-database` — Searchable beneficiary database
- `enterprises` — Enterprise registry
- `beneficiary-targets` — Target tracking
- `programme-management` — Programme oversight

**Marketplace Group:**
- `marketplace-management` — Marketplace admin
- `cashless-pos` — Point-of-sale with pagination (4 items/page)
- `products` — Product catalog (Coffee, Tea, Dairy)
- `category-management` — Product category CRUD (persisted to localStorage)
- `transaction-history` — Transaction history with search/filter/sort

**Financial Group:**
- `grants-wallet` — Grant disbursement and wallet management
- `transactions` — Transaction ledger
- `recovery-centre` — Recovery and compliance
- `withdrawal-approvals` — Withdrawal approval queue
- `tax-revenue-management` — Tax and revenue

**Operations Group:**
- `enterprise-operations` — Day-to-day operations
- `asset-equipment-management` — Asset tracking
- `me-centre` — Monitoring & evaluation

**Reports Group:**
- `reports-centre` — Reports and exports

**Administration Group:**
- `administration` — Users, roles, settings
- `system-integrations` — External integrations
- `notifications-centre` — Notification management

**Office-specific:**
- `programme-office`, `registration-office`, `verification-office`
- `marketplace-office`, `finance-office`

**Standalone portals:**
- `supplier-portal`, `beneficiary-portal`

**Demo:**
- `demo-login` — SplitLoginCard demo page

### Navigation (Sidebar)
- Collapsible sidebar: 72px collapsed, 260px expanded
- 9 navigation groups with role-filtered visibility
- Icon + label layout using Lucide React icons

### UI Components (shadcn-style)
Custom primitives at `src/components/ui/`:
- `button.tsx` — Variants (default, destructive, outline, secondary, ghost, link), sizes via CVA
- `input.tsx` — With search/file type styles
- `label.tsx` — Form label
- `split-login-card.tsx` — Split layout OTP login

### Key Libraries Used
- **clsx + tailwind-merge** — Class merging via `cn()` utility
- **class-variance-authority** — Component variant management
- **@radix-ui/react-slot** — Polymorphic component support
- **Framer Motion** — Page transitions
- **Chart.js** — Analytics charts (bar, line, doughnut, radar)
- **MapLibre GL** — GIS map rendering

### Theming
Colors defined in `theme.ts` (now green-based scheme):

| Role | Color |
|---|---|
| Primary Background | `#2F6B3C` |
| Hover/Darker | `#24542F` |
| Accent Gold | `#D4A017` |
| Text on dark | White |
| Card backgrounds | `#F5F7FA` |
| Success/Agriculture | `#2E7D32` |

---

## 7. Backend Architecture (PHP)

### Config
**`config/app.php`** — Application constants:
- `APP_NAME`, `APP_ENV`, `APP_DEBUG`, `APP_URL`, `APP_TIMEZONE`
- `USSD_CODE` = `*284#`
- `DEFAULT_GRANT_AMOUNT` = 1,000,000 UGX
- Wallet splits: 70% asset float, 20% living allowance, 10% working capital
- `SUPPLIER_BOND_AMOUNT` = 500,000 UGX
- `MAX_PRICE_DEVIATION` = 15%
- `GHOST_SHOP_DAYS` = 21
- `ATTENDANCE_FREEZE_DAYS` = 7
- `AUTO_APPROVE_HOURS` = 48
- Tax rates: 6% WHT with TIN, 15% without
- `CASHOUT_DAILY_LIMIT` = 500,000 UGX
- MTN MoMo & Airtel Money API keys (sandbox)

**`config/database.php`** — PDO connection via environment variables (fallback to root/no pass for dev).

### Business Logic Engines (`engines/`)
| Engine | Responsibility |
|---|---|
| `BiometricHook.php` | Biometric verification |
| `DisbursementEngine.php` | MoMo/Airtel disbursement |
| `EscrowEngine.php` | Invoice escrow hold/release |
| `FraudDetector.php` | 10-type fraud detection |
| `GhostShopDaemon.php` | Inactivity-based shop inspection |
| `RevenueEngine.php` | Tax/revenue calculation |
| `SettlementEngine.php` | Settlement tracking |
| `SkillAssetMatrix.php` | Skill-to-asset matching |
| `SplitRemittance.php` | 50/50 revolving fund split |
| `WalletEngine.php` | Wallet operations |

### Shared Libraries (`lib/`)
| Library | Purpose |
|---|---|
| `Auth.php` | Token-based session auth |
| `Database.php` | PDO singleton wrapper |
| `Logger.php` | Logging utility |
| `USSDHandler.php` | USSD session handler |
| `VoiceIVR.php` | Voice IVR for illiterate users |

---

## 8. API Endpoints

### Authentication
| Endpoint | Methods | Purpose |
|---|---|---|
| `api/otp.php` | POST | Send & verify OTP codes |
| `api/staff_otp.php` | POST | Staff-specific OTP with simulated codes |
| `api/auth.php` | POST | Session initialization |

### Beneficiary & Enterprise
| Endpoint | Purpose |
|---|---|
| `api/beneficiary.php` | Beneficiary CRUD, KYC, profiling |
| `api/enterprise.php` | Enterprise management |
| `api/enrollments.php` | Enrollment operations (via module_api) |
| `api/attendance.php` | Attendance logging & retrieval |
| `api/training.php` | Training modules & enrollment |

### Financial
| Endpoint | Purpose |
|---|---|
| `api/wallets.php` | Wallet balance & operations |
| `api/wallet_spend.php` | Wallet spending |
| `api/cashout.php` | Cashout processing |
| `api/invoices.php` | Invoice CRUD & lifecycle |
| `api/transactions.php` | Transaction history (via module_api) |

### Marketplace
| Endpoint | Purpose |
|---|---|
| `api/marketplace.php` | Marketplace operations |
| `api/suppliers.php` | Supplier management |
| `api/pos.php` | Point-of-sale transactions |

### Admin & System
| Endpoint | Purpose |
|---|---|
| `api/admin.php` | Admin operations, dashboard data |
| `api/analytics.php` | Analytics data |
| `api/module_api.php` | Generic module operations |
| `api/staff_api.php` | Staff-specific operations |

### Government & External
| Endpoint | Purpose |
|---|---|
| `api/kcca.php` | KCCA-specific operations |
| `api/molg.php` | Ministry of Local Government |
| `api/locations.php` | Location hierarchy |
| `api/fetch_boundaries.php` | GIS boundary data |
| `api/grievance.php` | Grievance submission & tracking |
| `api/upload.php` | File upload handling |

### USSD & Voice
| Endpoint | Purpose |
|---|---|
| `api/ussd.php` | USSD application (*284#) |
| `api/voice.php` | Voice IVR flow |

### Other
| Endpoint | Purpose |
|---|---|
| `api/verify_handshake.php` | Supplier-beneficiary handshake verification |

---

## 9. Wallet System

### 70/20/10 Split Model
Every beneficiary gets three sub-wallets automatically on account creation:

| Wallet | Share | Purpose |
|---|---|---|
| Asset Float | 70% | Business equipment & stock |
| Living Allowance | 20% | Weekly stipend (50,000 UGX) |
| Working Capital | 10% | Operational expenses |

### Grant Disbursement
- Default grant: **1,000,000 UGX** (`DEFAULT_GRANT_AMOUNT`)
- Disbursed via MTN MoMo or Airtel Money API
- 50/50 split: 50% to beneficiary (split into sub-wallets), 50% to revolving fund

### Revolving Fund Deductions
| Period | Deduction Rate |
|---|---|
| Months 1-3 | 0% (grace period) |
| Months 4-6 | 1.5% of sales |
| Month 7+ | 3% of sales |

### Transaction Types (10)
grant_disbursement, supplier_payment, cashout, invoice_payment, revolving_deduction, allowance_withdrawal, asset_purchase, working_capital_transfer, penalty, refund

### Transaction Statuses (6)
pending, processing, completed, failed, reversed, disputed

---

## 10. POS & Marketplace

### Cashless POS (`CashlessPOS.tsx`)
- Product grid with 3 categories: Coffee, Tea, Dairy (5 items each)
- Pagination: 4 items per page
- Three price tiers: Small (1,500 UGX), Medium (3,000 UGX), Large (5,000 UGX)
- Cart management with quantity controls
- Checkout options:
  - **Mobile Money** — MTN/Airtel via SMS OTP
  - **Cash** — 1-hour pre-load with localStorage timestamp
- Receipt generation with `window.print()`
- Transactions persisted to `localStorage` (`yeep_transactions`, capped at 500)
- Categories read dynamically from `localStorage` (`yeep_categories`) with fallback to defaults

### Category Management (`CategoryManagement.tsx`)
- Full CRUD for categories (name, color, icon, image, description)
- Full CRUD for items within categories
- Persists to `localStorage` under `yeep_categories`
- Used by both CashlessPOS and Products pages

### Products (`Products.tsx`)
- Static catalog view with category hero images and product grids
- Uses the same `loadCategories()` function (localStorage with fallback)

---

## 11. Fraud Detection

### 10 Fraud Types (FraudDetector.php)
1. **Transaction Splitting** — Multiple small transactions to avoid limits (detected via 7-day aggregation)
2. **Ghost Shop** — 21 days of inactivity triggers inspection ticket
3. **Price Manipulation** — >15% deviation from market baseline
4. **Duplicate Registration** — Same NIN/multiple enrollments
5. **Identity Fraud** — NIRA verification mismatch
6. **Collusion** — Supplier-beneficiary price fixing
7. **Attendance Fraud** — GPS mismatch, impossible check-in patterns
8. **Wallet Cycling** — Moving money between sub-wallets unnecessarily
9. **Early Default** — Missing first 3 revolving fund payments
10. **Merchant Concentration** — Single supplier >40% of total spend

### Ghost Shop Daemon
- Runs daily via MySQL event `ghost_shop_daemon`
- Flags beneficiaries with no transactions for 21+ days
- Creates `ghost_shop_tickets`
- Escalates unresponded tickets to district level after 7 days

---

## 12. Scheduled Jobs (Cron)

### PHP Cron Scripts (`cron/`)
| Script | Purpose |
|---|---|
| `attendance_hook.php` | Locks accounts after 7 missed days |
| `auto_approval.php` | Auto-approves invoices after 48 hours |
| `cashout_processor.php` | Processes queued cashout requests |
| `ghostshop_daemon.php` | Ghost shop detection (daily) |
| `grievance_escalator.php` | Escalates unresolved grievances |
| `aggregate_analytics.php` | Pre-computes analytics data |
| `mentorship_matcher.php` | Auto-pairs mentors with mentees |
| `split_remittance.php` | Processes revolving fund splits |
| `lock.php` | Distributed locking for cron jobs |
| `run_all.php` | Runs all cron jobs sequentially |

### MySQL Events (7)
Defined at database level, managed by MySQL scheduler.

---

## 13. Integration Channels

### USSD (*284#)
- Code: `*284#`
- Handler: `lib/USSDHandler.php`
- Screens: Balance check, last 5 transactions, grant status, report issue
- Supports illiterate users with optional Voice IVR fallback

### Voice IVR
- Handler: `lib/VoiceIVR.php`
- Uses Twilio-compatible API for voice prompts
- Supports local languages (Luganda, English, Swahili)
- Menu-driven for balance, transactions, support

### SMS
- OTP delivery via SMS gateway
- Transaction confirmations
- Invoice/payment notifications
- Grievance updates

### Mobile Money (MTN/Airtel)
- Disbursement Engine for grant payouts
- Cashless POS payment collection
- Cashout processing
- Sandbox API keys in config

### Odoo ERP Integration
- `odoo/docker-compose.yml`
- Custom addons for YEEP-specific modules
- Data synchronization for accounting

### Web Portals
- **Beneficiary Portal** (`beneficiary_portal.php`) — Dashboard, wallet, invoices, attendance
- **Supplier Portal** (`supplier/`) — Dashboard, orders, products, withdrawals
- **Partner/Trainer Portal** (`partner/`) — Attendance tracking, inventory, milestones

---

## 14. Deployment

### Prerequisites
- PHP 8.x with extensions: PDO, MySQL, mbstring, GD, curl
- MySQL 8.x
- Node.js 20+ for frontend build
- Apache with mod_rewrite or nginx

### Build Steps
```bash
# 1. Install PHP dependencies (none required — no Composer)
# 2. Build React SPA
cd gis-command-center
npm install
npm run build          # Outputs to ../admin/

# 3. Database setup
# Run migrations in order:
php database/run_migration.php
php database/run_phase2_migration.php
# ... etc for all migration runners

# 4. Configure
# Edit config/database.php with production DB credentials
# Edit config/app.php with production URL and API keys

# 5. Set up cron
# Add to crontab:
* * * * * php /path/to/YEEP/cron/run_all.php
```

### Configuration Constants (config/app.php)
```php
define('APP_URL', 'http://localhost/YEEP');
define('APP_ENV', 'development');       // 'production' in prod
define('APP_DEBUG', true);              // false in prod
// Mobile Money API keys (set to sandbox in dev)
// MTN_MOMO_* and AIRTEL_* constants
```

### Environment Variables
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS` — Database connection
- Falls back to development defaults when not set

---

*Generated from codebase analysis. YEEP v1.0 — KCCA Youth Economic Empowerment Programme.*
