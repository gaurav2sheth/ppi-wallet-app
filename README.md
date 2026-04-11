# Paytm PPI Wallet App

A mobile-first React frontend for an RBI-regulated Prepaid Payment Instrument (PPI) Wallet, built with **React 19 + TypeScript + Vite + Tailwind CSS**.

The UI follows Paytm's PODS design language with a navy (#002E6E) / cyan (#00B9F1) color scheme, card-based layouts, pill-shaped buttons, and bottom navigation.

**Live Demo:** [gaurav2sheth.github.io/paytm-wallet-app](https://gaurav2sheth.github.io/paytm-wallet-app)

## Features

- **Wallet Balance** — Real-time balance display on home dashboard with WalletStrip (UPI Lite-style)
- **Add Money** — Top-up wallet via Payment Gateway screen (UPI, Card, Net Banking, Pay Later)
- **Pay Merchant** — QR placeholder + merchant ID payment with split payment support
- **Send Money (P2P)** — Peer-to-peer transfer with UUID validation (Full KYC required per RBI)
- **Transfer to Bank** — Withdraw to bank with IFSC validation and confirm account number
- **Bill Payment** — 6 categories (Electricity, Water, Gas, DTH, Broadband, Insurance)
- **Passbook** — Paginated transaction history with month grouping, type filters, and MCC category icons
- **Spend Analytics** — Donut chart + category breakdown + top merchants + daily trends
- **Budget Manager** — Category-wise spending limits with monthly caps
- **Rewards** — Scratch cards with random cashback (2%-10%) and cashback history
- **Notifications** — In-app notification center with quick action buttons
- **Wallet Statement** — Download statement via email with date range selection
- **KYC Verification** — View tier status, upgrade flow with Aadhaar OTP
- **Profile** — User info, wallet details, navigation menu, logout
- **Transaction Detail** — Full transaction details with saga lifecycle status

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Bundler | Vite 8 |
| Styling | Tailwind CSS v4 (Paytm PODS design tokens) |
| Routing | React Router v7 (HashRouter for GitHub Pages) |
| State | Zustand (7 stores with localStorage persistence) |
| HTTP | Axios |
| Backend | Render Express API (13 endpoints) — falls back to built-in mock data |
| AI/MCP | 35 MCP tools via Render backend for AI agent queries |

## Getting Started

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173` with **built-in mock data** — no backend required.

### With Render backend (production)

The deployed app at GitHub Pages connects to the Render backend via `VITE_API_URL`:

```bash
# Set during build for GitHub Pages deployment
VITE_API_URL=https://ppi-wallet-api.onrender.com npm run build
```

### With local Fastify backend (optional)

```bash
# In the backend directory (Project Folder PPI/)
# Requires PostgreSQL
cp .env.example .env
# Edit .env with your DATABASE_URL
npm run dev
# The frontend auto-detects the backend at localhost:3000
```

## Project Structure

```
src/
  api/
    client.ts         — Axios instance (VITE_API_URL → Render or localhost:3000/v1)
    wallet.api.ts     — Balance, ledger, status endpoints
    saga.api.ts       — Transaction saga endpoints
    kyc.api.ts        — KYC endpoints
    limits.api.ts     — Limits check
    mock.ts           — Complete mock API (localStorage persistence)
  store/
    auth.store.ts     — Login, JWT, user profile
    wallet.store.ts   — Balance, KYC tier
    pin.store.ts      — 4-digit PIN (localStorage)
    budget.store.ts   — Category limits, monthly cap
    payees.store.ts   — Recent contacts
    notifications.store.ts — Alerts with action paths
    rewards.store.ts  — Scratch cards, cashback
  pages/              — 19 page components
  components/
    layout/           — AppShell, AuthGuard, Header, BottomNav
    ui/               — Button, Card, AmountInput, PinModal, ScratchCard, etc.
    wallet/           — WalletStrip, RecentPayees
  hooks/
    useBalance.ts     — Wallet balance fetching
    useLedger.ts      — Passbook transaction history
    useTransaction.ts — Transaction execution with saga pattern
    useKycStatus.ts   — KYC tier and state
    useSpendAnalytics.ts — Spend aggregation by MCC category
  utils/
    format.ts         — Currency formatting (BigInt paise), dates, initials
    idempotency.ts    — UUID v4 idempotency key generation
    cn.ts             — Conditional CSS class joining
    constants.ts      — Routes (16), storage keys, avatar colors, transaction labels
    mcc.ts            — MCC category mapping (19 categories, 23 merchants)
    sync.ts           — Data sync to Render backend + admin dashboard
  types/
    api.types.ts      — API response interfaces (BigInt paise)
```

## Data Synchronization

When transactions occur in the wallet app, `sync.ts` pushes events to two targets:

1. **Admin Dashboard** (dev mode) — via Vite plugin at `POST /api/sync` → writes to `.shared-data/wallet-events.json`
2. **Render Backend** (production) — via `POST ${VITE_API_URL}/api/wallet/transact` → updates MCP mock-data.js in memory

This ensures:
- The admin dashboard shows real-time wallet activity
- AI agent (MCP) queries return accurate, up-to-date data
- Balance and transaction history stay consistent across all three systems

## MCC Category Mapping

19 spending categories with smart keyword detection from transaction descriptions:

Taxi/Ride, Food & Dining, Groceries, Shopping, Fuel, Travel, Entertainment, Health, Education, Utilities, Money Transfer, Refunds, Recharge, Insurance, Bank Transfer, Wallet Top-up, Subscription, Government, Others

## API Integration

The frontend integrates with either the Render Express backend (production) or a Fastify backend (development):

- **Wallet** — balance, ledger, credit/debit, hold/release
- **Saga** — add-money, merchant-pay, p2p-transfer, wallet-to-bank, bill-pay
- **KYC** — initiate, Aadhaar OTP send/verify, status
- **Limits** — RBI limit checks, usage tracking

All monetary values use **BigInt in paise** (1 INR = 100 paise) per RBI compliance.

## Deployment

| Target | URL |
|--------|-----|
| Wallet App | [gaurav2sheth.github.io/paytm-wallet-app](https://gaurav2sheth.github.io/paytm-wallet-app) |
| Admin Dashboard | [gaurav2sheth.github.io/ppi-wallet-admin](https://gaurav2sheth.github.io/ppi-wallet-admin) |
| Backend API | [ppi-wallet-api.onrender.com](https://ppi-wallet-api.onrender.com/health) |
| MCP Server | Local via Claude Desktop (40 tools) |

## License

MIT
