/**
 * NCMC — isolation invariants
 *
 * The NCMC (National Common Mobility Card) sub-wallet is closed-loop
 * and transit-only. These invariants are fundamental to the sub-wallet's
 * regulatory and UX model:
 *
 *   1. NCMC is NOT eligible for non-transit merchant categories.
 *   2. NCMC has its own ₹3,000 balance cap (independent of main wallet).
 *   3. Direct UPI/DC/NB load into NCMC must respect the ₹3,000 cap.
 *   4. NCMC balance does NOT cascade to main wallet on shortfall (the
 *      metro tap fails rather than silently drawing from main).
 *
 * Known gap (see docs/scope-and-limitations.md §Adversarial test findings #3):
 *   There is no `attemptP2P`/`attemptMerchantPay` service with an
 *   explicit source-sub-wallet parameter. The invariant "P2P from NCMC
 *   must hard-reject" is enforced by the UI not exposing NCMC as a P2P
 *   source — not by a service-boundary check. The `.skip` tests below
 *   document what should be added once a `transactions` service is extracted.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mockCheckEligibility,
  mockDirectLoadNcmc,
  mockGetSubWallets,
  saveSubWallets,
  type SubWallet,
} from '../mock';

vi.mock('../../utils/sync', () => ({
  syncTransaction: vi.fn(),
  syncBalanceUpdate: vi.fn(),
  syncUserLogin: vi.fn(),
}));

describe('NCMC — eligibility isolation', () => {
  beforeEach(() => {
    localStorage.clear();
    mockGetSubWallets();
  });

  it('hard-rejects NCMC for a Food merchant', () => {
    const result = mockCheckEligibility('Food delivery', 'NCMC TRANSIT');
    expect(result.eligible).toBe(false);
  });

  it('hard-rejects NCMC for an Electronics merchant', () => {
    const result = mockCheckEligibility('Electronics', 'NCMC TRANSIT');
    expect(result.eligible).toBe(false);
  });

  it('hard-rejects NCMC for a generic merchant category', () => {
    const result = mockCheckEligibility('Random Merchant', 'NCMC TRANSIT');
    expect(result.eligible).toBe(false);
  });

  it('allows NCMC for Metro (transit)', () => {
    const result = mockCheckEligibility('Metro', 'NCMC TRANSIT');
    expect(result.eligible).toBe(true);
  });

  it('allows NCMC for Bus (transit)', () => {
    const result = mockCheckEligibility('Bus', 'NCMC TRANSIT');
    expect(result.eligible).toBe(true);
  });
});

describe('NCMC — direct load cap enforcement', () => {
  beforeEach(() => {
    localStorage.clear();
    mockGetSubWallets();
  });

  it('rejects a direct UPI load that would exceed the ₹3,000 NCMC cap', () => {
    // Seed NCMC balance near the cap
    const sws = mockGetSubWallets().sub_wallets;
    const ncmc = sws.find((s: SubWallet) => s.type === 'NCMC TRANSIT')!;
    ncmc.balance_paise = 290000; // ₹2,900
    saveSubWallets(sws);

    // Try to add ₹200 — would push to ₹3,100, over the ₹3,000 cap
    const result = mockDirectLoadNcmc(20000, 'UPI - HDFC Bank 7125');

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/3,000|3000|cap|max/i);
  });

  it('accepts a direct UPI load that lands exactly at the ₹3,000 cap', () => {
    const sws = mockGetSubWallets().sub_wallets;
    const ncmc = sws.find((s: SubWallet) => s.type === 'NCMC TRANSIT')!;
    ncmc.balance_paise = 250000; // ₹2,500
    saveSubWallets(sws);

    // Add ₹500 → ₹3,000 exactly
    const result = mockDirectLoadNcmc(50000, 'UPI - HDFC Bank 7125');

    expect(result.success).toBe(true);
  });

  it('does not change main wallet balance on direct NCMC load', () => {
    localStorage.setItem('__mock_balance', '23611'); // ₹236.11
    const sws = mockGetSubWallets().sub_wallets;
    const ncmc = sws.find((s: SubWallet) => s.type === 'NCMC TRANSIT')!;
    ncmc.balance_paise = 100000; // ₹1,000
    saveSubWallets(sws);

    mockDirectLoadNcmc(50000, 'UPI - HDFC Bank 7125');

    const mainAfter = Number(localStorage.getItem('__mock_balance'));
    expect(mainAfter).toBe(23611); // unchanged
  });
});

describe.skip('NCMC — service-boundary isolation (blocked on transactions service extraction)', () => {
  // See docs/scope-and-limitations.md §Adversarial test findings #3.
  // These tests would require `transactions.ts` service with explicit
  // `attemptP2P({ source })` and `attemptMerchantPay({ preferredSource })`
  // signatures that take a sub-wallet source parameter.

  it('hard-rejects a P2P transfer sourced from NCMC balance', () => {
    // const result = attemptP2P({ source: 'NCMC_SUBWALLET', amountPaise: 10000 });
    // expect(result.status).toBe('REJECTED');
    // expect(result.errorCode).toBe('NCMC_NOT_TRANSFERABLE');
  });

  it('does not cascade from NCMC to main wallet on NCMC shortfall at a transit merchant', () => {
    // With NCMC=₹300 and main=₹1L, a ₹500 metro tap should fail, not silently draw from main.
  });
});
