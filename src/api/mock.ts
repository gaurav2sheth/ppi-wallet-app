import type { WalletBalanceResponse, LedgerResponse, LedgerEntry, SagaResponse, KycStatusResponse, LimitsUsageResponse, WalletStatusResponse } from '../types/api.types';
import { v4 as uuidv4 } from 'uuid';
import { syncTransaction, syncBalanceUpdate } from '../utils/sync';

const DEMO_WALLET_ID = 'demo-wallet';
const STORAGE_KEY_LEDGER = '__mock_ledger';
const STORAGE_KEY_BALANCE = '__mock_balance';
const DEFAULT_BALANCE = '23611'; // ₹236.11

function ts(daysAgo: number, hours: number, minutes: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

function createSeedLedger(): LedgerEntry[] {
  return [
    { id: uuidv4(), entry_type: 'DEBIT', amount_paise: '6500', balance_after_paise: '23611', held_paise_after: '0', transaction_type: 'MERCHANT_PAY', reference_id: null, description: 'Uber Ride', idempotency_key: uuidv4(), hold_id: null, created_at: ts(0, 10, 29) },
    { id: uuidv4(), entry_type: 'DEBIT', amount_paise: '6700', balance_after_paise: '30111', held_paise_after: '0', transaction_type: 'P2P_TRANSFER', reference_id: null, description: 'Deviprasad Shukla', idempotency_key: uuidv4(), hold_id: null, created_at: ts(0, 9, 15) },
    { id: uuidv4(), entry_type: 'DEBIT', amount_paise: '4500', balance_after_paise: '36811', held_paise_after: '0', transaction_type: 'MERCHANT_PAY', reference_id: null, description: 'Swiggy Order', idempotency_key: uuidv4(), hold_id: null, created_at: ts(1, 20, 45) },
    { id: uuidv4(), entry_type: 'DEBIT', amount_paise: '90000', balance_after_paise: '41311', held_paise_after: '0', transaction_type: 'MERCHANT_PAY', reference_id: null, description: 'Shankari Restaurant', idempotency_key: uuidv4(), hold_id: null, created_at: ts(1, 14, 30) },
    { id: uuidv4(), entry_type: 'CREDIT', amount_paise: '545000', balance_after_paise: '131311', held_paise_after: '0', transaction_type: 'P2P_TRANSFER', reference_id: null, description: 'Siddhartha Guha', idempotency_key: uuidv4(), hold_id: null, created_at: ts(2, 11, 20) },
    { id: uuidv4(), entry_type: 'DEBIT', amount_paise: '3100', balance_after_paise: '586311', held_paise_after: '0', transaction_type: 'MERCHANT_PAY', reference_id: null, description: 'Tea Stall', idempotency_key: uuidv4(), hold_id: null, created_at: ts(3, 8, 10) },
    { id: uuidv4(), entry_type: 'CREDIT', amount_paise: '200000', balance_after_paise: '589411', held_paise_after: '0', transaction_type: 'ADD_MONEY', reference_id: null, description: 'Wallet Top-up', idempotency_key: uuidv4(), hold_id: null, created_at: ts(5, 15, 0), payment_source: 'UPI - HDFC Bank 7125' },
    { id: uuidv4(), entry_type: 'DEBIT', amount_paise: '76651', balance_after_paise: '389411', held_paise_after: '0', transaction_type: 'MERCHANT_PAY', reference_id: null, description: 'Uber Trip', idempotency_key: uuidv4(), hold_id: null, created_at: ts(7, 12, 17) },
    { id: uuidv4(), entry_type: 'CREDIT', amount_paise: '76651', balance_after_paise: '466062', held_paise_after: '0', transaction_type: 'REFUND', reference_id: null, description: 'Uber Refund', idempotency_key: uuidv4(), hold_id: null, created_at: ts(7, 12, 17) },
    { id: uuidv4(), entry_type: 'DEBIT', amount_paise: '50000', balance_after_paise: '466062', held_paise_after: '0', transaction_type: 'BILL_PAY', reference_id: null, description: 'Electricity Bill - MSEB', idempotency_key: uuidv4(), hold_id: null, created_at: ts(10, 9, 5) },
    { id: uuidv4(), entry_type: 'CREDIT', amount_paise: '500000', balance_after_paise: '516062', held_paise_after: '0', transaction_type: 'ADD_MONEY', reference_id: null, description: 'Wallet Top-up', idempotency_key: uuidv4(), hold_id: null, created_at: ts(15, 10, 30), payment_source: 'Debit Card' },
    { id: uuidv4(), entry_type: 'DEBIT', amount_paise: '25000', balance_after_paise: '16062', held_paise_after: '0', transaction_type: 'WALLET_TO_BANK', reference_id: null, description: 'Transfer to HDFC Bank', idempotency_key: uuidv4(), hold_id: null, created_at: ts(20, 16, 22) },
  ];
}

// --- Persistence helpers using localStorage (survives tab close & browser restart) ---
function loadLedger(): LedgerEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_LEDGER);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  const seed = createSeedLedger();
  localStorage.setItem(STORAGE_KEY_LEDGER, JSON.stringify(seed));
  return seed;
}

function saveLedger(ledger: LedgerEntry[]) {
  localStorage.setItem(STORAGE_KEY_LEDGER, JSON.stringify(ledger));
}

function loadBalance(): string {
  return localStorage.getItem(STORAGE_KEY_BALANCE) ?? DEFAULT_BALANCE;
}

function saveBalance(paise: string) {
  localStorage.setItem(STORAGE_KEY_BALANCE, paise);
}

// ── Load Guard: client-side RBI PPI limit validation (mock fallback) ────────
const BALANCE_CAP_PAISE = 10000000;       // ₹1,00,000
const MONTHLY_LOAD_LIMIT_PAISE = 20000000; // ₹2,00,000
const MIN_KYC_BALANCE_CAP_PAISE = 1000000; // ₹10,000

function paiseToRupeesInt(paise: number): number {
  return Math.floor(paise / 100);
}

function getMonthlyLoadedPaise(): number {
  const ledger = loadLedger();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return ledger
    .filter(e => e.transaction_type === 'ADD_MONEY' && e.entry_type === 'CREDIT' && new Date(e.created_at) >= monthStart)
    .reduce((sum, e) => sum + Number(e.amount_paise), 0);
}

export interface LoadGuardResult {
  allowed: boolean;
  message?: string;
  new_balance?: number;
  blocked_by?: string;
  user_message?: string;
  suggestion?: string;
  max_allowed?: number;
  error?: string;
}

export function mockValidateLoad(amountRupees: number): LoadGuardResult {
  const amountPaise = Math.round(amountRupees * 100);
  const currentBalancePaise = Number(loadBalance());
  const kycTier: string = 'FULL'; // mock user is always FULL KYC
  const monthlyLoadedPaise = getMonthlyLoadedPaise();

  const violations: { rule: string; max_allowed: number }[] = [];

  // Rule 1: BALANCE_CAP
  const newBalance = currentBalancePaise + amountPaise;
  if (newBalance > BALANCE_CAP_PAISE) {
    violations.push({ rule: 'BALANCE_CAP', max_allowed: paiseToRupeesInt(Math.max(0, BALANCE_CAP_PAISE - currentBalancePaise)) });
  }

  // Rule 2: MONTHLY_LOAD
  if (monthlyLoadedPaise + amountPaise > MONTHLY_LOAD_LIMIT_PAISE) {
    violations.push({ rule: 'MONTHLY_LOAD', max_allowed: paiseToRupeesInt(Math.max(0, MONTHLY_LOAD_LIMIT_PAISE - monthlyLoadedPaise)) });
  }

  // Rule 3: MIN_KYC_CAP
  if (kycTier === 'MINIMUM' && newBalance > MIN_KYC_BALANCE_CAP_PAISE) {
    violations.push({ rule: 'MIN_KYC_CAP', max_allowed: paiseToRupeesInt(Math.max(0, MIN_KYC_BALANCE_CAP_PAISE - currentBalancePaise)) });
  }

  if (violations.length === 0) {
    return { allowed: true, message: `You can add ₹${amountRupees.toLocaleString('en-IN')} to your wallet`, new_balance: paiseToRupeesInt(newBalance) };
  }

  violations.sort((a, b) => a.max_allowed - b.max_allowed);
  const blocking = violations[0];

  return {
    allowed: false,
    blocked_by: blocking.rule,
    user_message: `This transaction exceeds your wallet limit. You can add up to ₹${blocking.max_allowed.toLocaleString('en-IN')} right now.`,
    suggestion: blocking.max_allowed > 0 ? `You can add up to ₹${blocking.max_allowed.toLocaleString('en-IN')} right now` : 'You cannot add money at this time',
    max_allowed: blocking.max_allowed,
  };
}

export function mockGetMaxLoadRoom(): { max_room: number; current_balance: number; monthly_loaded: number; kyc_tier: string } {
  const currentBalancePaise = Number(loadBalance());
  const monthlyLoadedPaise = getMonthlyLoadedPaise();
  const balanceRoom = Math.max(0, BALANCE_CAP_PAISE - currentBalancePaise);
  const monthlyRoom = Math.max(0, MONTHLY_LOAD_LIMIT_PAISE - monthlyLoadedPaise);
  return {
    max_room: paiseToRupeesInt(Math.min(balanceRoom, monthlyRoom)),
    current_balance: paiseToRupeesInt(currentBalancePaise),
    monthly_loaded: paiseToRupeesInt(monthlyLoadedPaise),
    kyc_tier: 'FULL',
  };
}

export const mockApi = {
  getBalance: (walletId: string): WalletBalanceResponse => {
    const bal = loadBalance();
    return {
      success: true,
      wallet_id: walletId || DEMO_WALLET_ID,
      user_id: 'user-demo',
      balance_paise: bal,
      held_paise: '0',
      available_paise: bal,
      kyc_tier: 'FULL',
      is_active: true,
      updated_at: new Date().toISOString(),
    };
  },

  getLedger: (_walletId: string, params?: { cursor?: string; limit?: number; entry_type?: string }): LedgerResponse => {
    let entries = loadLedger();
    if (params?.entry_type) {
      entries = entries.filter(e => e.entry_type === params.entry_type);
    }
    const limit = params?.limit ?? 20;
    const cursorIdx = params?.cursor ? entries.findIndex(e => e.id === params.cursor) + 1 : 0;
    const page = entries.slice(cursorIdx, cursorIdx + limit);
    const hasMore = cursorIdx + limit < entries.length;
    return {
      success: true,
      wallet_id: _walletId || DEMO_WALLET_ID,
      entries: page,
      pagination: { next_cursor: hasMore ? page[page.length - 1]?.id ?? null : null, has_more: hasMore },
    };
  },

  getWalletStatus: (walletId: string): WalletStatusResponse => {
    const bal = loadBalance();
    return {
      wallet_id: walletId || DEMO_WALLET_ID,
      user_id: 'user-demo',
      state: 'ACTIVE',
      kyc_tier: 'FULL',
      balance_paise: bal,
      held_paise: '0',
      available_paise: bal,
      is_active: true,
      created_at: ts(90, 10, 0),
      updated_at: new Date().toISOString(),
    };
  },

  sagaSuccess: (type: string, amountPaise: number, isCredit: boolean, description?: string, paymentSource?: string): SagaResponse => {
    let bal = BigInt(loadBalance());

    if (isCredit) {
      bal += BigInt(amountPaise);
    } else {
      if (BigInt(amountPaise) > bal) {
        throw { code: 'INSUFFICIENT_BALANCE', message: 'Insufficient balance in your wallet.', statusCode: 422 };
      }
      bal -= BigInt(amountPaise);
    }
    saveBalance(bal.toString());

    // Add ledger entry so Passbook reflects the transaction
    const ledger = loadLedger();
    const entry: LedgerEntry = {
      id: uuidv4(),
      entry_type: isCredit ? 'CREDIT' : 'DEBIT',
      amount_paise: amountPaise.toString(),
      balance_after_paise: bal.toString(),
      held_paise_after: '0',
      transaction_type: type,
      reference_id: null,
      description: description ?? (isCredit ? 'Wallet Top-up' : 'Payment'),
      idempotency_key: uuidv4(),
      hold_id: null,
      created_at: new Date().toISOString(),
      payment_source: paymentSource,
    };
    ledger.unshift(entry);
    saveLedger(ledger);

    const sagaId = uuidv4();

    // Sync to admin dashboard
    const walletId = localStorage.getItem('ppsl_wallet_id') ?? DEMO_WALLET_ID;
    const userName = localStorage.getItem('ppsl_user_name') ?? 'Demo User';
    syncTransaction({
      saga_id: sagaId,
      wallet_id: walletId,
      user_name: userName,
      saga_type: type,
      status: 'COMPLETED',
      amount_paise: amountPaise.toString(),
      description: description ?? (isCredit ? 'Wallet Top-up' : 'Payment'),
      entry_type: isCredit ? 'CREDIT' : 'DEBIT',
      counterparty: description ?? '',
    });
    syncBalanceUpdate(walletId, bal.toString(), 'FULL');

    return {
      success: true,
      saga_id: sagaId,
      saga_type: type,
      status: 'COMPLETED',
      result: { balance_after_paise: bal.toString() },
    };
  },

  getKycStatus: (walletId: string): KycStatusResponse => ({
    wallet_id: walletId || DEMO_WALLET_ID,
    kyc_state: 'FULL_KYC',
    kyc_tier: 'FULL',
    wallet_expiry_date: null,
    ckyc_number: 'CKYC-12345678',
    pan_masked: 'ABCDE****F',
    aadhaar_verified: true,
  }),

  getLimitsUsage: (walletId: string): LimitsUsageResponse => ({
    wallet_id: walletId || DEMO_WALLET_ID,
    kyc_tier: 'FULL',
    current_balance_paise: loadBalance(),
    monthly_p2p_mtd_paise: '150000',
    annual_load_ytd_paise: '2500000',
  }),
};
