import type { WalletBalanceResponse, LedgerResponse, LedgerEntry, SagaResponse, KycStatusResponse, LimitsUsageResponse, WalletStatusResponse } from '../types/api.types';
import { v4 as uuidv4 } from 'uuid';

const DEMO_WALLET_ID = 'demo-wallet';

let mockBalancePaise = 23611n; // ₹236.11

function ts(daysAgo: number, hours = 12): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hours, Math.floor(Math.random() * 60), 0, 0);
  return d.toISOString();
}

const mockLedger: LedgerEntry[] = [
  { id: uuidv4(), entry_type: 'DEBIT', amount_paise: '6500', balance_after_paise: '23611', held_paise_after: '0', transaction_type: 'MERCHANT_PAY', reference_id: null, description: 'Uber Ride', idempotency_key: uuidv4(), hold_id: null, created_at: ts(0, 10) },
  { id: uuidv4(), entry_type: 'DEBIT', amount_paise: '6700', balance_after_paise: '30111', held_paise_after: '0', transaction_type: 'P2P_TRANSFER', reference_id: null, description: 'Deviprasad Shukla', idempotency_key: uuidv4(), hold_id: null, created_at: ts(0, 9) },
  { id: uuidv4(), entry_type: 'DEBIT', amount_paise: '4500', balance_after_paise: '36811', held_paise_after: '0', transaction_type: 'MERCHANT_PAY', reference_id: null, description: 'Swiggy Order', idempotency_key: uuidv4(), hold_id: null, created_at: ts(1, 20) },
  { id: uuidv4(), entry_type: 'DEBIT', amount_paise: '90000', balance_after_paise: '41311', held_paise_after: '0', transaction_type: 'MERCHANT_PAY', reference_id: null, description: 'Shankari Restaurant', idempotency_key: uuidv4(), hold_id: null, created_at: ts(1, 14) },
  { id: uuidv4(), entry_type: 'CREDIT', amount_paise: '545000', balance_after_paise: '131311', held_paise_after: '0', transaction_type: 'P2P_TRANSFER', reference_id: null, description: 'Siddhartha Guha', idempotency_key: uuidv4(), hold_id: null, created_at: ts(2, 11) },
  { id: uuidv4(), entry_type: 'DEBIT', amount_paise: '3100', balance_after_paise: '586311', held_paise_after: '0', transaction_type: 'MERCHANT_PAY', reference_id: null, description: 'Tea Stall', idempotency_key: uuidv4(), hold_id: null, created_at: ts(3, 8) },
  { id: uuidv4(), entry_type: 'CREDIT', amount_paise: '200000', balance_after_paise: '589411', held_paise_after: '0', transaction_type: 'ADD_MONEY', reference_id: null, description: 'Wallet Top-up', idempotency_key: uuidv4(), hold_id: null, created_at: ts(5, 15) },
  { id: uuidv4(), entry_type: 'DEBIT', amount_paise: '76651', balance_after_paise: '389411', held_paise_after: '0', transaction_type: 'MERCHANT_PAY', reference_id: null, description: 'Uber Trip', idempotency_key: uuidv4(), hold_id: null, created_at: ts(7, 12) },
  { id: uuidv4(), entry_type: 'CREDIT', amount_paise: '76651', balance_after_paise: '466062', held_paise_after: '0', transaction_type: 'REFUND', reference_id: null, description: 'Uber Refund', idempotency_key: uuidv4(), hold_id: null, created_at: ts(7, 12) },
  { id: uuidv4(), entry_type: 'DEBIT', amount_paise: '50000', balance_after_paise: '466062', held_paise_after: '0', transaction_type: 'BILL_PAY', reference_id: null, description: 'Electricity Bill - MSEB', idempotency_key: uuidv4(), hold_id: null, created_at: ts(10, 9) },
  { id: uuidv4(), entry_type: 'CREDIT', amount_paise: '500000', balance_after_paise: '516062', held_paise_after: '0', transaction_type: 'ADD_MONEY', reference_id: null, description: 'Wallet Top-up', idempotency_key: uuidv4(), hold_id: null, created_at: ts(15, 10) },
  { id: uuidv4(), entry_type: 'DEBIT', amount_paise: '25000', balance_after_paise: '16062', held_paise_after: '0', transaction_type: 'WALLET_TO_BANK', reference_id: null, description: 'Transfer to HDFC Bank', idempotency_key: uuidv4(), hold_id: null, created_at: ts(20, 16) },
];

export const mockApi = {
  isEnabled: true, // Will be set to false if real API responds

  getBalance: (walletId: string): WalletBalanceResponse => ({
    success: true,
    wallet_id: walletId || DEMO_WALLET_ID,
    user_id: 'user-demo',
    balance_paise: mockBalancePaise.toString(),
    held_paise: '0',
    available_paise: mockBalancePaise.toString(),
    kyc_tier: 'FULL',
    is_active: true,
    updated_at: new Date().toISOString(),
  }),

  getLedger: (_walletId: string, params?: { cursor?: string; limit?: number; entry_type?: string }): LedgerResponse => {
    let entries = [...mockLedger];
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

  getWalletStatus: (walletId: string): WalletStatusResponse => ({
    wallet_id: walletId || DEMO_WALLET_ID,
    user_id: 'user-demo',
    state: 'ACTIVE',
    kyc_tier: 'FULL',
    balance_paise: mockBalancePaise.toString(),
    held_paise: '0',
    available_paise: mockBalancePaise.toString(),
    is_active: true,
    created_at: ts(90),
    updated_at: new Date().toISOString(),
  }),

  sagaSuccess: (type: string, amountPaise: number, isCredit: boolean): SagaResponse => {
    if (isCredit) {
      mockBalancePaise += BigInt(amountPaise);
    } else {
      if (BigInt(amountPaise) > mockBalancePaise) {
        throw { code: 'INSUFFICIENT_BALANCE', message: 'Insufficient balance in your wallet.', statusCode: 422 };
      }
      mockBalancePaise -= BigInt(amountPaise);
    }
    return {
      success: true,
      saga_id: uuidv4(),
      saga_type: type,
      status: 'COMPLETED',
      result: { balance_after_paise: mockBalancePaise.toString() },
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
    current_balance_paise: mockBalancePaise.toString(),
    monthly_p2p_mtd_paise: '150000',
    annual_load_ytd_paise: '2500000',
  }),
};
