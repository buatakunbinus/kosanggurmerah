# Kos Anggur Merah – Product Requirements Document (MVP)

## 1. Project Overview

A dashboard to help the boarding house owner manage 60 rooms and monitor:

- Room rental status and payment status
- Rental income (base rent + penalties)
- Expenses (repairs, utilities, maintenance, etc.)
- Penalties (overnight guest without notice, late payment without notice, custom)
- Monthly financial trends (Jan–Aug initial focus, scalable to full year)

Primary user: Boarding house owner (non-technical), wants quick visibility and simple data entry.

## 2. Goals & Objectives

- Centralize rental + penalty + expense records.
- Reduce late / missed payments through visibility.
- Track violations with structured audit trail.
- Provide clear monthly summary: income, expenses, net profit.
- Simple export for offline review / tax / reporting.

## 3. Scope (MVP)

### In Scope

- CRUD room data (60 rooms; rental price Rp 800,000 – Rp 1,300,000)
- Record rental payments (amount, date, method, status)
- Record expenses (date, category, amount, notes)
- Record penalties (type, amount, date, status, notes)
- Auto late indicator if past due and unpaid
- Monthly financial summary (income = rent + penalties; expenses; net profit)
- Trend graphs: income, expenses, net profit (Jan–Aug)
- Data export: CSV, Excel, PDF (initially CSV + Excel priority; PDF via simple generated report)

### Out of Scope (MVP)

- Automated payment collection (bank / e-wallet integration)
- Multi-location aggregation
- Multi-role user management / authentication levels
- Automated reminders delivery (may stub optional reminder logic)

## 4. Functional Requirements

### 4.1 Room Data Management

Fields:

- Room ID / number (string or int)
- Monthly rent price
- Status: Occupied / Vacant
- Tenant name (nullable if vacant)
- Payment due day (default: uniform, e.g. 5th of month, configurable per room)

Actions:

- Create room
- Update room (price, status, tenant, due day)
- Delete room (only if no active unpaid records OR soft-delete)
- List rooms with current month payment status & penalties

### 4.2 Rental Payments

Fields:

- Payment ID
- Room reference
- Billing month (YYYY-MM)
- Due date (derived from room due day)
- Amount due (room rent)
- Amount paid
- Payment date (nullable)
- Method (cash / transfer / other)
- Status: Paid / Unpaid / Late (Late = today > due date & unpaid)

Actions:

- Create payment record (auto-generated monthly or on-demand)
- Record payment (set amount paid + date + method, auto mark Paid if >= due)
- Update payment (method, correction)
- List/filter by month/year, status

Rules:

- Late status recalculated dynamically (no manual flag)
- Overpayment tracked (optional: store overpayment credit – stretch, not MVP)

### 4.3 Expenses

Fields:

- Expense ID
- Date
- Category (repairs, painting, electricity, water, cleaning, maintenance, other)
- Amount
- Notes (optional)

Actions:

- Add expense
- Edit expense
- Delete expense
- Filter by month/year/category

### 4.4 Penalties

Penalty Types (predefined + custom):

- Overnight Guest Without Notification
- Late Payment Without Notice
- Custom (free-text reason)

Fields:

- Penalty ID
- Room reference (nullable if general? MVP ties to room)
- Type
- Custom description (if type=Custom)
- Amount
- Incident date
- Payment status: Paid / Unpaid (still counted as income for the incident month regardless of paid? Decision: Count when incurred; add field collected flag)
- Notes

Actions:

- Add penalty
- Update penalty (status, amount, notes)
- Delete penalty (audit risk; consider soft delete) – MVP hard delete allowed pre-payment summary finalization

Rules:

- Penalty contributes to the month of incident date in income summary
- If penalty unpaid, show outstanding penalties but still included in gross income vs optionally separate “Uncollected” metric (MVP: Include in income and show unpaid list)

### 4.5 Dashboard Visualization

Components:

- Rooms table: Room # | Tenant | Rent | Status | Payment Due Date | Payment Status | Penalties (count & total this month)
- Summary cards: Total Rent Due, Total Rent Collected, Total Penalties, Total Expenses, Net Profit
- Trend graphs (Jan–Aug): Income, Expenses, Net Profit (line or bar charts)
- Penalties outstanding list (optional panel)

### 4.6 Monthly Financial Summary

For selected month:

- Total Rent Invoiced
- Total Rent Collected
- Total Penalties (incurred)
- Total Penalties Collected (optional)
- Total Expenses
- Net Profit = (Rent Collected + Penalties Collected OR Penalties Incurred\*) - Expenses
  Decision: Show both Gross (including all penalties) and Realized (only collected). MVP: show Net (Collected) & Gross (Incurred) if simple.

### 4.7 Data Export

- Export current month / selected range to CSV & Excel (rooms, payments, penalties, expenses, summary)
- PDF export: Combined monthly summary + tables snapshot (stretch but included as basic formatting)

## 5. Tech Stack & Architecture

Core Technology Choices (MVP ONLY – keep stack minimal):

- Frontend: React + TypeScript (bundled with Vite) for speed and DX
- Styling/UI: Tailwind CSS + small component primitives (no heavy UI lib)
- Charts: Recharts or Chart.js (pick one; default: Recharts for TS friendliness)
- Data Layer / Backend: Supabase (PostgreSQL + auto REST + JS client)
  - Use Supabase tables for persistence (rooms, payments, expenses, penalties)
  - Row Level Security (RLS) can be disabled initially (single user) then hardened later
  - All CRUD via Supabase JS client directly from the frontend (no custom server)
- Auth: Deferred (single-user environment); use service-role key stored in a local .env file NOT committed (or proceed with anon key + RLS off for prototype)
- File / Report Generation: Client-side (CSV / XLSX via SheetJS; PDF via jsPDF or pdfmake)

Architecture Pattern:

- Thin client-only app talking directly to Supabase
- State management: React Query (TanStack Query) for data fetching + caching (optional; if skipped, simple hooks)
- Derived monthly summaries computed client-side with SQL support for aggregation views later if performance needs

Why This Stack:

- Eliminates need for custom backend deployment & authentication complexity
- Supabase provides instant tables + REST / Realtime
- Fits small scale (60 rooms) easily; low operational overhead

Deployment Assumption:

- Hosted static site (e.g. Vercel / Netlify) or run locally with `npm run dev`
- Environment variables stored in `.env.local` (Vite prefix: `VITE_`)

## 6. Non-Functional Requirements

- Simplicity: Minimal clicks for data entry
- Performance: <1s typical query on 60-room scale (Supabase round-trip + caching)
- Reliability: Managed PostgreSQL (Supabase) + manual export backups
- Usability: Mobile-friendly layout (responsive, touch-friendly buttons)
- Security: Single-user; protect service key (local only). Future: enable RLS + auth.
- Offline tolerance: Light (reads require connection; consider local cache for last month summary)

## 7. Data Model (Initial Draft – Supabase Tables)

Entities:

- Room(id, number, rent_price, status, tenant_name, due_day, created_at, updated_at)
- Payment(id, room_id, billing_month, due_date, amount_due, amount_paid, payment_date, method, created_at, updated_at)
- Expense(id, date, category, amount, notes, created_at)
- Penalty(id, room_id, type, custom_description, amount, incident_date, paid, paid_date, notes, created_at)

Derived / Views:

- MonthlySummary(month): aggregates payments, penalties, expenses

Indexes:

- payment(room_id, billing_month) unique
- penalty(incident_date)
- expense(date)

Suggested PostgreSQL Column Types:

- id: uuid (default gen) or bigserial (uuid preferred for client-side creation)
- number: text (ensures flexibility, unique)
- rent_price / amount\* : numeric(12,2)
- status: text (enum constraint: occupied, vacant)
- billing_month: text or date (store first day of month as date for easier range queries) – preferred: date
- due_day: smallint
- method: text (enum constraint optional)
- type: text (enum: overnight_guest, late_payment, custom)
- paid (penalty): boolean

Indexes & Constraints:

- Unique (room_id, billing_month) on payments
- Index on payment(due_date), penalty(incident_date), expense(date)
- Foreign keys room_id (cascade restrict on delete)

Views (optional future): monthly_summary (aggregated totals per month)

## 8. Key Business Rules

- One payment record per room per billing month
- Late = unpaid AND today > due_date
- Penalty counted in month of incident_date
- Room deletion blocked if any payment exists (or we orphan data) – MVP: block

## 9. User Flows (High Level)

1. Monthly Start: System (or user) generates payment rows for each occupied room.
2. Daily: Owner opens dashboard, sees unpaid/late payments, records payments received.
3. Incident: Owner records penalty; appears in monthly summary instantly.
4. Expense: Owner records expense after purchase/service.
5. Month End: Owner exports summary.

## 10. Reports & Visualizations

- Monthly cards & charts (library: Chart.js / ECharts)
- Export generated fully client-side:
  - CSV: manual string build or SheetJS
  - Excel: SheetJS
  - PDF: jsPDF or pdfmake (basic tabular + summary)
    (No custom server needed.)

## 11. Assumptions

- Single machine deployment (local PC) acceptable initially.
- Owner comfortable running a simple local app (browser UI)
- No multi-currency; all amounts in IDR (Rp)
- Tax handling out of scope

## 12. Open Questions (To Refine Later)

- Should penalties unpaid be excluded from realized income? (Currently: show both)
- Automated monthly payment record generation schedule? (Manual button vs auto cron)
- Soft delete vs hard delete – for audit (MVP: hard delete, simple undo not included)

## 13. MVP Completion Criteria

- Able to add rooms, payments, expenses, penalties
- Dashboard shows correct computed statuses & totals
- Trend graphs render Jan–Aug with stored data
- Export CSV & Excel for a month works
- Net profit formula correct

## 14. Future Enhancements (Post-MVP)

- Authentication & roles
- Automated reminders (email / WhatsApp)
- Multi-property support
- Overpayment credit handling
- Attach receipt images
- Bulk import historical data

---

Prepared: 2025-08-15

## 15. Implementation Progress (Rolling)

Status Legend: ✅ Done | 🚧 In Progress | ⏳ Pending | 🔄 Planned Adjustment

Core Setup:

- ✅ Project scaffold (Vite + React + TS + Tailwind)
- ✅ Supabase schema draft (`docs/supabase_schema.sql`)
- ✅ Supabase client integration
- ✅ Domain TypeScript models
- ✅ React Query integration
- ✅ Currency / formatting utilities
- ✅ Monthly summary computation function + unit test

Features:

- ✅ Room creation & listing (basic) with tenant, rent, due day
- ✅ Rooms table shows payment status (derived) & penalties summary (current month)
- 🚧 Payment status derivation (function ready; integrated in rooms table)
- ✅ Payment record generation (monthly auto-create helper with UI button)
- 🚧 Payment recording form (inline expandable row)
- ✅ Penalty CRUD (add, list, mark paid, delete) with month filter
- ✅ Expense CRUD (add, list, inline edit, delete) with month filter
- ⏳ Payment CRUD UI (record payment, method, amount)
- ⏳ Penalty CRUD UI (add, mark paid)
- ⏳ Expense CRUD UI & listing
- 🚧 Monthly financial summary cards & chart visualizations (dashboard added with range + CSV/Excel/PDF export; needs polish)
- ✅ Data export (CSV / Excel / PDF basic) (needs styling/polish later)
- 🚧 Monthly financial summary cards & chart visualizations (dashboard added with range + CSV/Excel/PDF export; polish + loading skeletons pending)
- 🚧 Monthly financial summary cards & chart visualizations (dashboard added with range + CSV/Excel/PDF export; basic loading skeletons added; further polish pending)
- ✅ Data export (CSV / Excel / PDF basic) (needs styling/polish later)
- 🚧 Toast notifications (success/error) integrated for core CRUD (rooms, payments, penalties, expenses)
- 🚧 Loading skeletons for tables (rooms, penalties, expenses) & summary
- 🚧 Linting configuration (.eslintrc) added (rules minimal; enforcement WIP)
- 🚧 Accessibility improvements (aria-live toasts, export button labels)
- ✅ Global error boundary (basic reload UX)
- ✅ Pure payment generation helper + unit tests
- ✅ Validation schemas (zod) for payment record & expense create
- ✅ Export helper pure functions (CSV/Excel builders) + unit tests
- 🚧 Form validation surfacing (integrated in payments & expense create; remaining forms pending)

Non-Functional / Tooling:

- ✅ Type checking & test harness (Vitest) working
- ✅ Initial unit test passing
- 🚧 Linting (ESLint config minimal; rules not enforced yet)
- ⏳ Accessibility & responsive refinements

Next Focus (Planned Order):

1. Payment generation helper & UI action
2. Payment recording form (update amount_paid/payment_date/method)
3. Penalty CRUD (with mark paid) & integrate counts in summary later
4. Expense CRUD
5. Summary cards + charts (income, expenses, net realized/gross)
6. Export utilities (CSV, Excel first; PDF after)
7. Polishing (loading states, error toasts, validations)

Open Technical Considerations:

- Whether to store a boolean generated flag for payments vs deriving existence each month (current plan: derive missing payments on demand and insert)
- Potential view for monthly summary vs client aggregation (still client-side)
