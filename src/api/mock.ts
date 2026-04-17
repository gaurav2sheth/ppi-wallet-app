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

// ── Sub-Wallet Mock Data ────────────────────────────────────────────────────
const STORAGE_KEY_SUB_WALLETS = '__mock_sub_wallets_v2'; // v2: NCMC balance cap + FASTag security deposit model

export interface SubWallet {
  sub_wallet_id: string;
  type: string;
  icon: string;
  color: string;
  label: string;
  balance_paise: number;
  status: string;
  monthly_limit_paise: number;
  monthly_loaded_paise: number;
  loaded_by: string;
  last_loaded_at: string;
  expiry_date: string | null;
  eligible_categories: string[];
  transactions: SubWalletTxn[];
  // NCMC-specific: max balance cap (₹3,000)
  max_balance_paise?: number;
  // FASTag-specific: security deposit model
  is_security_deposit?: boolean;
  vehicle_count?: number;
  security_deposit_per_vehicle_paise?: number;
  security_deposit_used_paise?: number;
}

export interface SubWalletTxn {
  txn_id: string;
  amount_paise: number;
  type: 'credit' | 'debit';
  merchant: string;
  merchant_category: string;
  description: string;
  timestamp: string;
  status: string;
}

const DEFAULT_SUB_WALLETS: SubWallet[] = [
  {
    sub_wallet_id: 'SW-demo-FOOD',
    type: 'FOOD', icon: '🍱', color: '#F97316', label: 'Food',
    balance_paise: 120000, status: 'ACTIVE',
    monthly_limit_paise: 300000, monthly_loaded_paise: 300000,
    loaded_by: 'employer_001', last_loaded_at: ts(2, 9, 0), expiry_date: null,
    eligible_categories: ['Restaurants', 'Cafes', 'Food delivery', 'Canteen', 'Swiggy', 'Zomato', 'Food & Dining'],
    transactions: [
      { txn_id: 'SWTXN-F001', amount_paise: 35000, type: 'debit', merchant: 'Swiggy', merchant_category: 'Food & Dining', description: 'Swiggy lunch order', timestamp: ts(0, 13, 0), status: 'success' },
      { txn_id: 'SWTXN-F002', amount_paise: 25000, type: 'debit', merchant: 'Zomato', merchant_category: 'Food & Dining', description: 'Zomato dinner order', timestamp: ts(1, 20, 30), status: 'success' },
      { txn_id: 'SWTXN-F003', amount_paise: 8000, type: 'debit', merchant: 'Starbucks', merchant_category: 'Food & Dining', description: 'Starbucks coffee', timestamp: ts(2, 10, 15), status: 'success' },
      { txn_id: 'SWTXN-F004', amount_paise: 12000, type: 'debit', merchant: 'Dominos', merchant_category: 'Food & Dining', description: 'Dominos pizza', timestamp: ts(3, 19, 0), status: 'success' },
      { txn_id: 'SWTXN-F005', amount_paise: 300000, type: 'credit', merchant: 'Acme Payments Corp (Employer)', merchant_category: 'Employer Benefit Load', description: 'FOOD benefit - Monthly Benefits', timestamp: ts(5, 9, 0), status: 'success' },
    ],
  },
  {
    sub_wallet_id: 'SW-demo-NCMC_TRANSIT',
    type: 'NCMC TRANSIT', icon: '🚇', color: '#6366F1', label: 'NCMC Transit',
    balance_paise: 180000, status: 'ACTIVE',
    monthly_limit_paise: 0, monthly_loaded_paise: 0,
    max_balance_paise: 300000, // ₹3,000 max balance cap
    loaded_by: 'employer_001', last_loaded_at: ts(5, 9, 0), expiry_date: null,
    eligible_categories: ['Metro', 'Bus', 'Local train', 'Parking', 'Transit', 'Travel'],
    transactions: [
      { txn_id: 'SWTXN-T001', amount_paise: 6000, type: 'debit', merchant: 'Mumbai Metro', merchant_category: 'Transit', description: 'Metro ride - Andheri to BKC', timestamp: ts(0, 9, 0), status: 'success' },
      { txn_id: 'SWTXN-T002', amount_paise: 4000, type: 'debit', merchant: 'BEST Bus', merchant_category: 'Transit', description: 'Bus ticket', timestamp: ts(1, 8, 30), status: 'success' },
      { txn_id: 'SWTXN-T003', amount_paise: 10000, type: 'debit', merchant: 'Mumbai Metro', merchant_category: 'Transit', description: 'Metro monthly pass', timestamp: ts(3, 9, 0), status: 'success' },
      { txn_id: 'SWTXN-T004', amount_paise: 200000, type: 'credit', merchant: 'Self (Main Wallet)', merchant_category: 'Wallet Transfer', description: 'NCMC wallet top-up', timestamp: ts(5, 9, 0), status: 'success' },
    ],
  },
  {
    sub_wallet_id: 'SW-demo-FASTAG',
    type: 'FASTAG', icon: '🛣️', color: '#10B981', label: 'FASTag',
    balance_paise: 60000, status: 'ACTIVE', // Security deposit: 2 vehicles × ₹300
    monthly_limit_paise: 0, monthly_loaded_paise: 0,
    is_security_deposit: true,
    vehicle_count: 2,
    security_deposit_per_vehicle_paise: 30000, // ₹300 per vehicle
    security_deposit_used_paise: 0, // None used yet
    loaded_by: 'self', last_loaded_at: ts(10, 9, 0), expiry_date: null,
    eligible_categories: ['NHAI toll plazas', 'FASTag recharge portals', 'Toll', 'FASTag'],
    transactions: [
      { txn_id: 'SWTXN-FT01', amount_paise: 15000, type: 'debit', merchant: 'NHAI Toll', merchant_category: 'Toll', description: 'Mumbai-Pune Expressway toll (Main Wallet)', timestamp: ts(1, 11, 0), status: 'success' },
      { txn_id: 'SWTXN-FT02', amount_paise: 10000, type: 'debit', merchant: 'NHAI Toll', merchant_category: 'Toll', description: 'Bandra-Worli Sea Link toll (Main Wallet)', timestamp: ts(4, 15, 0), status: 'success' },
      { txn_id: 'SWTXN-FT03', amount_paise: 30000, type: 'credit', merchant: 'System', merchant_category: 'Security Deposit', description: 'FASTag security deposit - Vehicle 2 (MH-04-AB-1234)', timestamp: ts(10, 9, 0), status: 'success' },
      { txn_id: 'SWTXN-FT04', amount_paise: 30000, type: 'credit', merchant: 'System', merchant_category: 'Security Deposit', description: 'FASTag security deposit - Vehicle 1 (MH-02-CD-5678)', timestamp: ts(60, 9, 0), status: 'success' },
    ],
  },
  {
    sub_wallet_id: 'SW-demo-GIFT',
    type: 'GIFT', icon: '🎁', color: '#EC4899', label: 'Gift',
    balance_paise: 200000, status: 'ACTIVE',
    monthly_limit_paise: 0, monthly_loaded_paise: 0,
    loaded_by: 'employer_001', last_loaded_at: ts(30, 9, 0),
    expiry_date: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000).toISOString(),
    eligible_categories: ['All retail merchants', 'Shopping', 'Food & Dining', 'Entertainment', 'Groceries', 'Fuel', 'Travel', 'Health', 'Education', 'Utilities', 'Bill Payment', 'Insurance', 'Other'],
    transactions: [
      { txn_id: 'SWTXN-G001', amount_paise: 200000, type: 'credit', merchant: 'Acme Payments Corp (Employer)', merchant_category: 'Employer Benefit Load', description: 'GIFT benefit - Diwali Bonus', timestamp: ts(30, 9, 0), status: 'success' },
    ],
  },
  {
    sub_wallet_id: 'SW-demo-FUEL',
    type: 'FUEL', icon: '⛽', color: '#EAB308', label: 'Fuel',
    balance_paise: 150000, status: 'ACTIVE',
    monthly_limit_paise: 250000, monthly_loaded_paise: 250000,
    loaded_by: 'employer_001', last_loaded_at: ts(3, 9, 0), expiry_date: null,
    eligible_categories: ['HP', 'Indian Oil', 'BPCL', 'Shell', 'Fuel', 'HP Petrol', 'IOCL', 'Petroleum'],
    transactions: [
      { txn_id: 'SWTXN-FL01', amount_paise: 50000, type: 'debit', merchant: 'HP Petrol', merchant_category: 'Fuel', description: 'HP Petrol - Fuel refill', timestamp: ts(0, 18, 0), status: 'success' },
      { txn_id: 'SWTXN-FL02', amount_paise: 35000, type: 'debit', merchant: 'IOCL', merchant_category: 'Fuel', description: 'Indian Oil - Diesel', timestamp: ts(2, 17, 0), status: 'success' },
      { txn_id: 'SWTXN-FL03', amount_paise: 250000, type: 'credit', merchant: 'Acme Payments Corp (Employer)', merchant_category: 'Employer Benefit Load', description: 'FUEL benefit - Monthly Benefits', timestamp: ts(3, 9, 0), status: 'success' },
    ],
  },
];

function loadSubWallets(): SubWallet[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_SUB_WALLETS);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  const seed = JSON.parse(JSON.stringify(DEFAULT_SUB_WALLETS));
  localStorage.setItem(STORAGE_KEY_SUB_WALLETS, JSON.stringify(seed));
  return seed;
}

export function saveSubWallets(sws: SubWallet[]) {
  localStorage.setItem(STORAGE_KEY_SUB_WALLETS, JSON.stringify(sws));
}

export function mockGetSubWallets() {
  const sws = loadSubWallets();
  const mainPaise = Number(loadBalance());
  const benefitsPaise = sws.reduce((s, w) => s + w.balance_paise, 0);
  return {
    sub_wallets: sws,
    main_balance_paise: mainPaise,
    total_benefits_paise: benefitsPaise,
    total_balance_paise: mainPaise + benefitsPaise,
  };
}

export function mockGetSubWalletDetail(type: string) {
  const sws = loadSubWallets();
  return sws.find(s => s.type === type) || null;
}

/** Check if a merchant category is eligible for a sub-wallet */
export function mockCheckEligibility(merchantCategory: string, subWalletType: string): { eligible: boolean; wallet: SubWallet | null } {
  const sws = loadSubWallets();
  const sw = sws.find(s => s.type === subWalletType);
  if (!sw) return { eligible: false, wallet: null };

  if (subWalletType === 'GIFT') return { eligible: true, wallet: sw };

  const norm = (merchantCategory || '').toLowerCase();
  const eligible = sw.eligible_categories.some(cat =>
    norm.includes(cat.toLowerCase()) || cat.toLowerCase().includes(norm)
  );
  return { eligible, wallet: sw };
}

/** Find the best sub-wallet match for a merchant category */
export function mockFindBestSubWallet(merchantCategory: string): SubWallet | null {
  const sws = loadSubWallets();
  const norm = (merchantCategory || '').toLowerCase();

  // Check specific wallets first (not GIFT), then GIFT as fallback
  for (const sw of sws) {
    if (sw.type === 'GIFT' || sw.status !== 'ACTIVE' || sw.balance_paise <= 0) continue;
    if (sw.eligible_categories.some(cat =>
      norm.includes(cat.toLowerCase()) || cat.toLowerCase().includes(norm)
    )) {
      return sw;
    }
  }

  // Gift wallet as fallback if has balance
  const giftWallet = sws.find(s => s.type === 'GIFT' && s.status === 'ACTIVE' && s.balance_paise > 0);
  if (giftWallet) {
    // Check expiry
    if (giftWallet.expiry_date && new Date(giftWallet.expiry_date) < new Date()) return null;
    return giftWallet;
  }

  return null;
}

/**
 * Add money to a sub-wallet — handles 3 different models:
 *
 * NCMC TRANSIT: Self-load from main wallet, capped at ₹3,000 balance.
 *               Only NCMC balance is used for NCMC transactions.
 *
 * FASTAG:       "Add Money" loads the MAIN wallet (not FASTag sub-wallet).
 *               Sub-wallet holds security deposit only (₹300/vehicle).
 *               If security deposit was partially used, refill it first,
 *               then add the rest to main wallet.
 *
 * GIFT:         Self-load from main wallet, no cap.
 */
export function mockAddMoneyToSubWallet(type: string, amountPaise: number, paymentSource?: string): { success: boolean; message: string; new_balance?: number; detail?: string } {
  const sws = loadSubWallets();
  const sw = sws.find(s => s.type === type);
  if (!sw) return { success: false, message: 'Sub-wallet not found' };
  if (sw.status !== 'ACTIVE') return { success: false, message: 'Sub-wallet is not active' };

  const selfLoadTypes = ['FASTAG', 'NCMC TRANSIT', 'GIFT'];
  if (!selfLoadTypes.includes(type)) return { success: false, message: 'Self-load not allowed for this wallet type' };

  const ledger = loadLedger();
  const mainBalancePaise = Number(loadBalance());

  // ─── FASTAG: Add Money goes to main wallet; refill security deposit first ───
  if (type === 'FASTAG') {
    // FASTag "Add Money" is a normal wallet top-up (like Add Money from bank)
    // If security deposit was used, refill it first
    const depositUsed = sw.security_deposit_used_paise || 0;
    let depositRefill = 0;
    let mainWalletAdd = amountPaise;

    if (depositUsed > 0) {
      depositRefill = Math.min(depositUsed, amountPaise);
      mainWalletAdd = amountPaise - depositRefill;
      sw.balance_paise += depositRefill;
      sw.security_deposit_used_paise = depositUsed - depositRefill;
    }

    // Add rest to main wallet
    const newMainBalance = mainBalancePaise + mainWalletAdd;
    saveBalance(String(newMainBalance));

    // Transaction in FASTag sub-wallet (only if deposit refilled)
    if (depositRefill > 0) {
      sw.transactions.unshift({
        txn_id: `SWTXN-FTREF-${Date.now()}`,
        amount_paise: depositRefill,
        type: 'credit',
        merchant: 'System',
        merchant_category: 'Security Deposit Refill',
        description: `Security deposit refilled from top-up`,
        timestamp: new Date().toISOString(),
        status: 'success',
      });
    }
    saveSubWallets(sws);

    // Credit entry in main ledger
    ledger.unshift({
      id: uuidv4(),
      entry_type: 'CREDIT',
      amount_paise: String(mainWalletAdd),
      balance_after_paise: String(newMainBalance),
      held_paise_after: '0',
      transaction_type: 'ADD_MONEY',
      reference_id: null,
      description: 'FASTag Wallet Top-up',
      idempotency_key: uuidv4(),
      hold_id: null,
      created_at: new Date().toISOString(),
      payment_source: paymentSource || 'UPI - HDFC Bank 7125',
    });
    saveLedger(ledger);

    const parts: string[] = [];
    if (depositRefill > 0) parts.push(`₹${(depositRefill / 100).toLocaleString('en-IN')} refilled to security deposit`);
    if (mainWalletAdd > 0) parts.push(`₹${(mainWalletAdd / 100).toLocaleString('en-IN')} added to main wallet`);

    return {
      success: true,
      message: `₹${(amountPaise / 100).toLocaleString('en-IN')} top-up successful`,
      detail: parts.join(' + '),
      new_balance: newMainBalance,
    };
  }

  // ─── NCMC TRANSIT: Self-load from main wallet, capped at ₹3,000 ────────────
  if (type === 'NCMC TRANSIT') {
    if (amountPaise > mainBalancePaise) return { success: false, message: 'Insufficient main wallet balance' };

    const maxBalance = sw.max_balance_paise || 300000; // ₹3,000
    const headroom = maxBalance - sw.balance_paise;
    if (headroom <= 0) return { success: false, message: `NCMC wallet is at maximum balance of ₹${(maxBalance / 100).toLocaleString('en-IN')}` };
    if (amountPaise > headroom) return { success: false, message: `Can only add ₹${(headroom / 100).toLocaleString('en-IN')} more (max balance ₹${(maxBalance / 100).toLocaleString('en-IN')})` };

    // Deduct from main, add to NCMC
    const newMainBalance = mainBalancePaise - amountPaise;
    saveBalance(String(newMainBalance));
    sw.balance_paise += amountPaise;
    sw.last_loaded_at = new Date().toISOString();

    sw.transactions.unshift({
      txn_id: `SWTXN-NCMC-${Date.now()}`,
      amount_paise: amountPaise,
      type: 'credit',
      merchant: 'Self (Main Wallet)',
      merchant_category: 'Wallet Transfer',
      description: 'Added from main wallet',
      timestamp: new Date().toISOString(),
      status: 'success',
    });
    saveSubWallets(sws);

    ledger.unshift({
      id: uuidv4(),
      entry_type: 'DEBIT',
      amount_paise: String(amountPaise),
      balance_after_paise: String(newMainBalance),
      held_paise_after: '0',
      transaction_type: 'P2P_TRANSFER',
      reference_id: null,
      description: 'NCMC Transit Wallet Top-up',
      idempotency_key: uuidv4(),
      hold_id: null,
      created_at: new Date().toISOString(),
    });
    saveLedger(ledger);

    return { success: true, message: `₹${(amountPaise / 100).toLocaleString('en-IN')} added to NCMC Transit Wallet`, new_balance: sw.balance_paise };
  }

  // ─── GIFT: Self-load from main wallet, no cap ──────────────────────────────
  if (amountPaise > mainBalancePaise) return { success: false, message: 'Insufficient main wallet balance' };

  const newMainBalance = mainBalancePaise - amountPaise;
  saveBalance(String(newMainBalance));
  sw.balance_paise += amountPaise;
  sw.last_loaded_at = new Date().toISOString();

  sw.transactions.unshift({
    txn_id: `SWTXN-SELF-${Date.now()}`,
    amount_paise: amountPaise,
    type: 'credit',
    merchant: 'Self (Main Wallet)',
    merchant_category: 'Wallet Transfer',
    description: 'Added from main wallet',
    timestamp: new Date().toISOString(),
    status: 'success',
  });
  saveSubWallets(sws);

  ledger.unshift({
    id: uuidv4(),
    entry_type: 'DEBIT',
    amount_paise: String(amountPaise),
    balance_after_paise: String(newMainBalance),
    held_paise_after: '0',
    transaction_type: 'P2P_TRANSFER',
    reference_id: null,
    description: `${sw.label} Wallet Top-up`,
    idempotency_key: uuidv4(),
    hold_id: null,
    created_at: new Date().toISOString(),
  });
  saveLedger(ledger);

  return { success: true, message: `₹${(amountPaise / 100).toLocaleString('en-IN')} added to ${sw.label} Wallet`, new_balance: sw.balance_paise };
}

/**
 * Direct external load to NCMC wallet — money comes from UPI/Debit Card/Net Banking
 * bypassing the main wallet entirely.
 * - NCMC ₹3,000 balance cap is enforced
 * - Main wallet balance is NOT affected
 * - A CREDIT ledger entry is created for audit trail
 */
export function mockDirectLoadNcmc(amountPaise: number, paymentSource: string): { success: boolean; message: string; new_balance?: number; detail?: string } {
  const sws = loadSubWallets();
  const sw = sws.find(s => s.type === 'NCMC TRANSIT');
  if (!sw) return { success: false, message: 'NCMC wallet not found' };
  if (sw.status !== 'ACTIVE') return { success: false, message: 'NCMC wallet is not active' };

  const maxBalance = sw.max_balance_paise || 300000; // ₹3,000
  const headroom = maxBalance - sw.balance_paise;
  if (headroom <= 0) return { success: false, message: `NCMC wallet is at maximum balance of ₹${(maxBalance / 100).toLocaleString('en-IN')}` };
  if (amountPaise > headroom) return { success: false, message: `Can only add ₹${(headroom / 100).toLocaleString('en-IN')} more (max balance ₹${(maxBalance / 100).toLocaleString('en-IN')})` };

  // Add directly to NCMC balance
  sw.balance_paise += amountPaise;
  sw.last_loaded_at = new Date().toISOString();
  sw.loaded_by = 'self';

  sw.transactions.unshift({
    txn_id: `SWTXN-NCMC-${Date.now()}`,
    amount_paise: amountPaise,
    type: 'credit',
    merchant: paymentSource,
    merchant_category: 'Direct Load',
    description: `Direct load via ${paymentSource}`,
    timestamp: new Date().toISOString(),
    status: 'success',
  });
  saveSubWallets(sws);

  // Ledger entry for audit (main balance unchanged)
  const ledger = loadLedger();
  const mainBalance = Number(loadBalance());
  ledger.unshift({
    id: uuidv4(),
    entry_type: 'CREDIT',
    amount_paise: String(amountPaise),
    balance_after_paise: String(mainBalance), // main balance stays the same
    held_paise_after: '0',
    transaction_type: 'ADD_MONEY',
    reference_id: null,
    description: `NCMC Transit Direct Load via ${paymentSource}`,
    idempotency_key: uuidv4(),
    hold_id: null,
    created_at: new Date().toISOString(),
    payment_source: paymentSource,
  });
  saveLedger(ledger);

  return { success: true, message: `₹${(amountPaise / 100).toLocaleString('en-IN')} loaded to NCMC Transit`, new_balance: sw.balance_paise };
}

/** Simulate a FASTag toll transaction — deducts from main wallet; falls back to security deposit */
export function mockFastagTransaction(amountPaise: number, tollName: string): { success: boolean; message: string; source: string } {
  const mainBalancePaise = Number(loadBalance());
  const sws = loadSubWallets();
  const fastag = sws.find(s => s.type === 'FASTAG');
  if (!fastag) return { success: false, message: 'No FASTag wallet found', source: '' };

  const ledger = loadLedger();
  let source = '';

  if (mainBalancePaise >= amountPaise) {
    // Deduct entirely from main wallet
    const newMain = mainBalancePaise - amountPaise;
    saveBalance(String(newMain));
    source = 'Main Wallet';

    ledger.unshift({
      id: uuidv4(),
      entry_type: 'DEBIT',
      amount_paise: String(amountPaise),
      balance_after_paise: String(newMain),
      held_paise_after: '0',
      transaction_type: 'MERCHANT_PAY',
      reference_id: null,
      description: `FASTag - ${tollName}`,
      idempotency_key: uuidv4(),
      hold_id: null,
      created_at: new Date().toISOString(),
    });
    saveLedger(ledger);
  } else {
    // Main wallet insufficient — use what's available + dip into security deposit
    const fromMain = mainBalancePaise;
    const fromDeposit = amountPaise - fromMain;

    if (fromDeposit > fastag.balance_paise) {
      return { success: false, message: 'Insufficient balance (main wallet + security deposit)', source: '' };
    }

    // Drain main wallet
    saveBalance('0');
    if (fromMain > 0) {
      ledger.unshift({
        id: uuidv4(),
        entry_type: 'DEBIT',
        amount_paise: String(fromMain),
        balance_after_paise: '0',
        held_paise_after: '0',
        transaction_type: 'MERCHANT_PAY',
        reference_id: null,
        description: `FASTag - ${tollName} (partial)`,
        idempotency_key: uuidv4(),
        hold_id: null,
        created_at: new Date().toISOString(),
      });
    }
    saveLedger(ledger);

    // Deduct from security deposit
    fastag.balance_paise -= fromDeposit;
    fastag.security_deposit_used_paise = (fastag.security_deposit_used_paise || 0) + fromDeposit;
    source = fromMain > 0 ? `Main ₹${(fromMain / 100).toFixed(2)} + Security Deposit ₹${(fromDeposit / 100).toFixed(2)}` : 'Security Deposit';
  }

  // Add FASTag transaction record
  fastag.transactions.unshift({
    txn_id: `SWTXN-FT-${Date.now()}`,
    amount_paise: amountPaise,
    type: 'debit',
    merchant: tollName,
    merchant_category: 'Toll',
    description: `${tollName} toll (${source})`,
    timestamp: new Date().toISOString(),
    status: 'success',
  });
  saveSubWallets(sws);

  return { success: true, message: `₹${(amountPaise / 100).toLocaleString('en-IN')} toll paid via ${source}`, source };
}

/** Issue a new FASTag for a vehicle — adds ₹300 security deposit to sub-wallet */
export function mockIssueFastag(vehicleNumber: string): { success: boolean; message: string } {
  const sws = loadSubWallets();
  const fastag = sws.find(s => s.type === 'FASTAG');
  if (!fastag) return { success: false, message: 'No FASTag wallet found' };

  const depositPaise = fastag.security_deposit_per_vehicle_paise || 30000;
  const mainBalancePaise = Number(loadBalance());
  if (depositPaise > mainBalancePaise) return { success: false, message: 'Insufficient main wallet balance for security deposit' };

  // Deduct from main
  const newMain = mainBalancePaise - depositPaise;
  saveBalance(String(newMain));

  // Add to FASTag security deposit
  fastag.balance_paise += depositPaise;
  fastag.vehicle_count = (fastag.vehicle_count || 0) + 1;
  fastag.last_loaded_at = new Date().toISOString();

  fastag.transactions.unshift({
    txn_id: `SWTXN-FTNEW-${Date.now()}`,
    amount_paise: depositPaise,
    type: 'credit',
    merchant: 'System',
    merchant_category: 'Security Deposit',
    description: `FASTag security deposit - New vehicle (${vehicleNumber})`,
    timestamp: new Date().toISOString(),
    status: 'success',
  });
  saveSubWallets(sws);

  const ledger = loadLedger();
  ledger.unshift({
    id: uuidv4(),
    entry_type: 'DEBIT',
    amount_paise: String(depositPaise),
    balance_after_paise: String(newMain),
    held_paise_after: '0',
    transaction_type: 'P2P_TRANSFER',
    reference_id: null,
    description: `FASTag security deposit - ${vehicleNumber}`,
    idempotency_key: uuidv4(),
    hold_id: null,
    created_at: new Date().toISOString(),
  });
  saveLedger(ledger);

  return { success: true, message: `FASTag issued for ${vehicleNumber}. ₹${(depositPaise / 100).toFixed(0)} security deposit collected.` };
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
