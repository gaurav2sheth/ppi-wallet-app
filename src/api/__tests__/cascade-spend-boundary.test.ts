/**
 * Cascade spend — boundary conditions
 *
 * Invariants protected by this test suite:
 *   1. Category-specific wallets win over Gift fallback when eligible.
 *   2. Non-matching merchant categories are hard-rejected against
 *      restricted sub-wallets (NCMC, Food, Fuel).
 *   3. Gift wallet is a universal fallback when it has balance and is
 *      not expired.
 *   4. Expired Gift wallet is not returned by `mockFindBestSubWallet`.
 *
 * Known gap (see docs/scope-and-limitations.md §Adversarial test findings #2):
 *   There is no pure `calculateCascadeSpend(input) → {splits, status}`
 *   function. Logic is split across `mockCheckEligibility`,
 *   `mockFindBestSubWallet`, and per-wallet debit helpers inside mock.ts.
 *   The "clean decline with no partial debit on shortfall" test is marked
 *   `.todo` below — it would become a single-function assertion once the
 *   cascade logic is factored into a pure function.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mockCheckEligibility,
  mockFindBestSubWallet,
  saveSubWallets,
  mockGetSubWallets,
  type SubWallet,
} from '../mock';

vi.mock('../../utils/sync', () => ({
  syncTransaction: vi.fn(),
  syncBalanceUpdate: vi.fn(),
  syncUserLogin: vi.fn(),
}));

describe('Cascade spend — eligibility and fallback chain', () => {
  beforeEach(() => {
    localStorage.clear();
    // Force a fresh seed of sub-wallets
    mockGetSubWallets();
  });

  it('picks Food sub-wallet for a Swiggy (Food) merchant when Food has balance', () => {
    const best = mockFindBestSubWallet('Food delivery');
    expect(best).not.toBeNull();
    expect(best!.type).toBe('FOOD');
  });

  it('falls back to Gift when the category-specific wallet is empty and Gift has balance', () => {
    // Drain the Food wallet; leave Gift intact
    const sws = mockGetSubWallets().sub_wallets;
    const food = sws.find((s: SubWallet) => s.type === 'FOOD')!;
    food.balance_paise = 0;
    saveSubWallets(sws);

    const best = mockFindBestSubWallet('Food delivery');
    expect(best).not.toBeNull();
    expect(best!.type).toBe('GIFT');
  });

  it('returns null when no sub-wallet is eligible AND Gift has no balance', () => {
    const sws = mockGetSubWallets().sub_wallets;
    sws.forEach((s: SubWallet) => { s.balance_paise = 0; });
    saveSubWallets(sws);

    const best = mockFindBestSubWallet('Food delivery');
    expect(best).toBeNull();
  });

  it('does not return an expired Gift wallet as a fallback', () => {
    const sws = mockGetSubWallets().sub_wallets;
    // Drain specific wallets, leave Gift with balance but expired
    sws.forEach((s: SubWallet) => {
      if (s.type !== 'GIFT') s.balance_paise = 0;
    });
    const gift = sws.find((s: SubWallet) => s.type === 'GIFT')!;
    gift.balance_paise = 500000; // ₹5,000
    gift.expiry_date = new Date(Date.now() - 86_400_000).toISOString(); // yesterday
    saveSubWallets(sws);

    const best = mockFindBestSubWallet('Food delivery');
    expect(best).toBeNull();
  });
});

describe('Cascade spend — eligibility rejections', () => {
  beforeEach(() => {
    localStorage.clear();
    mockGetSubWallets();
  });

  it('declines NCMC for a non-transit merchant (Food)', () => {
    const result = mockCheckEligibility('Food delivery', 'NCMC TRANSIT');
    expect(result.eligible).toBe(false);
  });

  it('accepts NCMC for a transit merchant (Metro)', () => {
    const result = mockCheckEligibility('Metro', 'NCMC TRANSIT');
    expect(result.eligible).toBe(true);
  });

  it('declines FASTAG for any non-toll merchant', () => {
    const result = mockCheckEligibility('Food delivery', 'FASTAG');
    expect(result.eligible).toBe(false);
  });

  it('accepts Gift for any merchant category (universal eligibility)', () => {
    const foodResult = mockCheckEligibility('Food delivery', 'GIFT');
    const electronicsResult = mockCheckEligibility('Electronics', 'GIFT');
    const randomResult = mockCheckEligibility('SomeObscureCategory', 'GIFT');

    expect(foodResult.eligible).toBe(true);
    expect(electronicsResult.eligible).toBe(true);
    expect(randomResult.eligible).toBe(true);
  });
});

describe.todo(
  'Cascade spend — atomic split with clean decline on shortfall (blocked on pure function extraction)',
  () => {
    // See docs/scope-and-limitations.md §Adversarial test findings #2.
    // Expected test shape once `calculateCascadeSpend` is factored out:
    //
    //   const result = calculateCascadeSpend({
    //     amount: 50000,
    //     category: 'FOOD',
    //     subWallets: { food: 40000 },
    //     mainBalance: 9900, // short by ₹1
    //   });
    //   expect(result.status).toBe('DECLINED');
    //   expect(result.reason).toBe('INSUFFICIENT_FUNDS');
    //   expect(result.splits).toEqual([]); // crucially: no partial debit
  }
);
