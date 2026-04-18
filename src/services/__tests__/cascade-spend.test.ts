/**
 * calculateCascadeSpend — pure function contract tests
 *
 * Protects:
 *   1. Clean split across category-specific sub-wallet + main wallet
 *   2. Clean decline (no partial debit) when total funds short
 *   3. Gift as universal fallback only when no category-specific match
 *   4. Expired Gift is not usable
 *   5. Invalid input is rejected without side effects
 *
 * See docs/edge-cases.md §2 for the full scenario list.
 */

import { describe, it, expect } from 'vitest';
import { calculateCascadeSpend } from '../cascade-spend';

describe('calculateCascadeSpend — happy path', () => {
  it('splits a ₹500 Swiggy payment cleanly across Food (₹400) and main (₹100)', () => {
    const result = calculateCascadeSpend({
      amountPaise: 50000,
      merchantCategory: 'FOOD',
      subWallets: { food: 40000, gift: 0 },
      mainBalance: 10000,
    });
    expect(result.status).toBe('APPROVED');
    expect(result.splits).toEqual([
      { source: 'FOOD_SUBWALLET', amountPaise: 40000 },
      { source: 'MAIN_WALLET', amountPaise: 10000 },
    ]);
  });

  it('uses only the Food sub-wallet when it fully covers the amount', () => {
    const result = calculateCascadeSpend({
      amountPaise: 30000,
      merchantCategory: 'FOOD',
      subWallets: { food: 50000, gift: 100000 },
      mainBalance: 100000,
    });
    expect(result.status).toBe('APPROVED');
    expect(result.splits).toEqual([
      { source: 'FOOD_SUBWALLET', amountPaise: 30000 },
    ]);
  });

  it('falls back to Gift when no category-specific match applies', () => {
    const result = calculateCascadeSpend({
      amountPaise: 20000,
      merchantCategory: 'OTHER',
      subWallets: { food: 30000, gift: 50000 }, // Food ineligible for OTHER
      mainBalance: 0,
    });
    expect(result.status).toBe('APPROVED');
    expect(result.splits).toEqual([
      { source: 'GIFT_SUBWALLET', amountPaise: 20000 },
    ]);
  });

  it('uses main wallet only when no sub-wallet applies and no Gift', () => {
    const result = calculateCascadeSpend({
      amountPaise: 10000,
      merchantCategory: 'OTHER',
      subWallets: {},
      mainBalance: 15000,
    });
    expect(result.status).toBe('APPROVED');
    expect(result.splits).toEqual([
      { source: 'MAIN_WALLET', amountPaise: 10000 },
    ]);
  });

  it('splits category-specific + main even when Gift is also funded (category wins)', () => {
    const result = calculateCascadeSpend({
      amountPaise: 50000,
      merchantCategory: 'FOOD',
      subWallets: { food: 30000, gift: 100000 },
      mainBalance: 20000,
    });
    expect(result.status).toBe('APPROVED');
    // Category-specific preferred; Gift untouched even though it could have covered the whole amount
    expect(result.splits).toEqual([
      { source: 'FOOD_SUBWALLET', amountPaise: 30000 },
      { source: 'MAIN_WALLET', amountPaise: 20000 },
    ]);
  });

  it('splits Gift + main when Gift partially covers an OTHER-category payment', () => {
    const result = calculateCascadeSpend({
      amountPaise: 30000,
      merchantCategory: 'OTHER',
      subWallets: { gift: 20000 },
      mainBalance: 15000,
    });
    expect(result.status).toBe('APPROVED');
    expect(result.splits).toEqual([
      { source: 'GIFT_SUBWALLET', amountPaise: 20000 },
      { source: 'MAIN_WALLET', amountPaise: 10000 },
    ]);
  });
});

describe('calculateCascadeSpend — decline invariants', () => {
  it('declines with INSUFFICIENT_FUNDS when Food + main falls short by even ₹1', () => {
    const result = calculateCascadeSpend({
      amountPaise: 50000,
      merchantCategory: 'FOOD',
      subWallets: { food: 40000, gift: 0 },
      mainBalance: 9900, // ₹99, short by ₹1
    });
    expect(result.status).toBe('DECLINED');
    expect(result.reason).toBe('INSUFFICIENT_FUNDS');
    // CRITICAL: no partial debit recorded in the plan
    expect(result.splits).toEqual([]);
  });

  it('declines when Gift + main falls short (OTHER category)', () => {
    const result = calculateCascadeSpend({
      amountPaise: 30000,
      merchantCategory: 'OTHER',
      subWallets: { gift: 15000 },
      mainBalance: 10000,
    });
    expect(result.status).toBe('DECLINED');
    expect(result.reason).toBe('INSUFFICIENT_FUNDS');
    expect(result.splits).toEqual([]);
  });

  it('declines when only main wallet is available and it is short', () => {
    const result = calculateCascadeSpend({
      amountPaise: 10000,
      merchantCategory: 'OTHER',
      subWallets: {},
      mainBalance: 5000,
    });
    expect(result.status).toBe('DECLINED');
    expect(result.splits).toEqual([]);
  });

  it('declines with INVALID_INPUT for zero or negative amount', () => {
    const zero = calculateCascadeSpend({
      amountPaise: 0,
      merchantCategory: 'FOOD',
      subWallets: { food: 1000 },
      mainBalance: 1000,
    });
    const neg = calculateCascadeSpend({
      amountPaise: -100,
      merchantCategory: 'FOOD',
      subWallets: { food: 1000 },
      mainBalance: 1000,
    });
    expect(zero.status).toBe('DECLINED');
    expect(zero.reason).toBe('INVALID_INPUT');
    expect(neg.status).toBe('DECLINED');
    expect(neg.reason).toBe('INVALID_INPUT');
  });
});

describe('calculateCascadeSpend — Gift wallet edge cases', () => {
  it('does not use an expired Gift wallet even when it has balance', () => {
    const result = calculateCascadeSpend({
      amountPaise: 10000,
      merchantCategory: 'OTHER',
      subWallets: { gift: 50000, giftExpired: true },
      mainBalance: 5000,
    });
    expect(result.status).toBe('DECLINED');
    expect(result.reason).toBe('INSUFFICIENT_FUNDS');
  });

  it('uses main wallet instead of expired Gift when main has balance', () => {
    const result = calculateCascadeSpend({
      amountPaise: 5000,
      merchantCategory: 'OTHER',
      subWallets: { gift: 50000, giftExpired: true },
      mainBalance: 8000,
    });
    expect(result.status).toBe('APPROVED');
    expect(result.splits).toEqual([
      { source: 'MAIN_WALLET', amountPaise: 5000 },
    ]);
  });
});

describe('calculateCascadeSpend — every split has strictly positive amount', () => {
  it('never emits a zero-amount split', () => {
    // Exact-coverage case: Food balance exactly equals the amount.
    // The split should be [Food 100%], NOT [Food 100%, Main 0].
    const result = calculateCascadeSpend({
      amountPaise: 30000,
      merchantCategory: 'FOOD',
      subWallets: { food: 30000 },
      mainBalance: 50000,
    });
    expect(result.status).toBe('APPROVED');
    expect(result.splits).toHaveLength(1);
    expect(result.splits[0].amountPaise).toBeGreaterThan(0);
  });
});
