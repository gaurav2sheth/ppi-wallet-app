# Paytm PPI Wallet App

A mobile-first React frontend for an RBI-regulated Prepaid Payment Instrument (PPI) Wallet, built with **React 18 + TypeScript + Vite + Tailwind CSS**.

The UI follows Paytm's design language with a navy/cyan color scheme, card-based layouts, and bottom navigation.

## Features

- **Wallet Balance** - Real-time balance display on home dashboard
- **Add Money** - Top-up wallet with amount presets and confirmation flow
- **Pay Merchant** - QR placeholder + merchant ID payment
- **Send Money (P2P)** - Peer-to-peer transfer (Full KYC required per RBI)
- **Transfer to Bank** - Withdraw to bank with IFSC validation
- **Bill Payment** - Category-based bill pay (Electricity, Water, Gas, DTH, etc.)
- **Passbook** - Paginated transaction history with month grouping and type filters
- **KYC Verification** - View tier status, upgrade flow with Aadhaar OTP
- **Profile** - User info, wallet details, navigation menu, logout

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Bundler | Vite |
| Styling | Tailwind CSS v4 |
| Routing | React Router v6 |
| State | Zustand |
| HTTP | Axios |
| Backend | Fastify API (65 endpoints) - optional, app works with built-in mock data |

## Getting Started

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173` with **built-in mock data** - no backend required.

### With live backend (optional)

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
  api/          # Axios client + mock fallback layer
  store/        # Zustand stores (auth, wallet)
  pages/        # 12 page components
  components/
    layout/     # AppShell, Header, BottomNav
    ui/         # Button, Card, AmountInput, OtpInput, Avatar, FilterPills, Toast
  hooks/        # useBalance, useLedger, useTransaction, useKycStatus
  types/        # TypeScript interfaces matching backend API
  utils/        # Currency formatting (BigInt paise), idempotency keys
```

## API Integration

The frontend integrates with a Fastify backend providing 65 REST endpoints:

- **Wallet** - balance, ledger, credit/debit, hold/release
- **Saga** - add-money, merchant-pay, p2p-transfer, wallet-to-bank, bill-pay
- **KYC** - initiate, Aadhaar OTP send/verify, status
- **Limits** - RBI limit checks, usage tracking
- **UPI** - VPA management, collect requests
- **Lifecycle** - suspend, close, dormancy processing

All monetary values use **BigInt in paise** (1 INR = 100 paise) per RBI compliance.

## License

MIT
