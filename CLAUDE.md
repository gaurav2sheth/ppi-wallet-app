# Paytm Wallet App

Consumer-facing mobile-first React SPA for the PPI Wallet.

**Part of the PPI Wallet Platform** — see root `CLAUDE.md` for ecosystem overview.

## Tech

React 19 + TypeScript + Vite 8 + Tailwind CSS v4 + Zustand + Axios. HashRouter for GitHub Pages.

## Dev Commands

```bash
/usr/local/bin/node ./node_modules/.bin/tsc --noEmit      # type-check
/usr/local/bin/node ./node_modules/.bin/vite build         # production build
/usr/local/bin/node ./node_modules/.bin/gh-pages -d dist   # deploy to GitHub Pages
```

## Key Files

| File | Purpose |
|------|---------|
| `src/api/mock.ts` | Client-side mock with localStorage persistence. Sub-wallet engine (NCMC cap, FASTag deposit, self-load). All seed data lives here. |
| `src/api/saga.api.ts` | Transaction execution with 3-tier fallback (API → mock). |
| `src/components/wallet/WalletStrip.tsx` | Home page wallet card — collapsible vertical sub-wallet list |
| `src/pages/SubWalletDetailPage.tsx` | Sub-wallet detail with Add Money (NCMC/FASTag/Gift), txn history, AI |
| `src/utils/mcc.ts` | MCC category mapping (19 categories, keyword detection) |
| `src/utils/format.ts` | Currency formatting — always use `formatPaise()` |
| `src/store/` | 7 Zustand stores (auth, wallet, pin, budget, payees, notifications, rewards) |

## Routes (21 Pages)

`/login`, `/` (home), `/wallet`, `/wallet/detail`, `/wallet/add-money`, `/wallet/sub/:type`, `/wallet/statement`, `/pay`, `/send`, `/transfer-bank`, `/bill-pay`, `/passbook`, `/analytics`, `/budget`, `/kyc`, `/profile`, `/transaction/:id`, `/notifications`, `/rewards`

## Patterns

- Transaction flow: Amount input → PinModal → saga API call → Result screen (success/retry)
- PIN default: 1234 (stored in localStorage `wallet_pin`)
- Mock login: any 10-digit phone number
- Sub-wallet self-load types: NCMC TRANSIT, FASTAG, GIFT (Food and Fuel are employer-only)
- FASTag "Add Money" = top-up main wallet + refill security deposit. NOT a sub-wallet load.
- All amounts in paise internally, formatted with `formatPaise()` for display

## Design System

Paytm PODS: Navy #002E6E, Cyan #00B9F1, Green #12B76A. Card-based layouts, pill buttons, bottom nav (Home / Scan & Pay / Passbook / Profile). Max-width 480px centred on desktop.
