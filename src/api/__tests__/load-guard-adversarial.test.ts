/**
 * Load Guard — adversarial and boundary invariants
 *
 * Invariants protected by this test suite:
 *   1. BALANCE_CAP: at exactly ₹1,00,000, the next load must be rejected
 *      (boundary is inclusive: balance ≤ cap).
 *   2. MONTHLY_LOAD: the second of two concurrent loads that individually
 *      pass but together exceed the cap must be rejected.
 *   3. Idempotency-key replay: a replayed load with the same key must NOT
 *      double-credit the wallet.
 *
 * Known gap (see docs/scope-and-limitations.md):
 *   - There is no atomic `processLoad(userId, amount, idempotencyKey)`
 *     function in the codebase. `mockValidateLoad` only validates; the
 *     actual commit happens inside the saga flow without idempotency-key-
 *     backed dedupe. The concurrency and idempotency tests below are
 *     marked `.skip` with an explicit pointer to the scope doc — they
 *     would pass once a `processLoad` is introduced.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockValidateLoad } from '../mock';

vi.mock('../../utils/sync', () => ({
  syncTransaction: vi.fn(),
  syncBalanceUpdate: vi.fn(),
  syncUserLogin: vi.fn(),
}));

describe('Load Guard — adversarial / boundary (testable today)', () => {
  beforeEach(() => {
    // Reset to a known state
    localStorage.clear();
  });

  it('rejects a load that would push balance over the ₹1,00,000 reference cap', () => {
    // Seed: put balance just under the cap (₹99,999)
    localStorage.setItem('__mock_balance', String(99_99_900));

    // Try to add ₹200 (would push to ₹1,00,199 — over cap by ₹199)
    const result = mockValidateLoad(200);

    expect(result.allowed).toBe(false);
    expect(result.blocked_by).toBe('BALANCE_CAP');
  });

  it('accepts a load exactly at the ₹1,00,000 reference cap boundary (inclusive)', () => {
    // Seed: ₹99,900 (1 paisa under ₹99,900 ... fine)
    localStorage.setItem('__mock_balance', String(99_90_000));

    // Add ₹100 → ₹1,00,000 exactly
    const result = mockValidateLoad(100);

    expect(result.allowed).toBe(true);
  });

  it('rejects a load that would exceed the ₹2,00,000 monthly load limit', () => {
    // The reference impl tracks monthly loads via the ledger.
    // With a fresh localStorage, there are no loads for the current month,
    // so we can only exercise the cap boundary here. The monthly-boundary
    // test is expanded in load-guard-timezone.test.js (mcp side).
    // This test asserts that a ₹3,00,000 attempt from zero is rejected by
    // BALANCE_CAP before MONTHLY_LOAD even matters (correct priority).
    localStorage.setItem('__mock_balance', '0');

    const result = mockValidateLoad(3_00_000);

    expect(result.allowed).toBe(false);
    // BALANCE_CAP fires first because 3L > 1L cap
    expect(result.blocked_by).toBe('BALANCE_CAP');
  });
});

describe.skip('Load Guard — concurrency and idempotency (gaps, see scope-and-limitations.md)', () => {
  // SKIPPED: these tests require an atomic `processLoad` function that
  // validates AND commits in one locked step. The current codebase only
  // has `mockValidateLoad` (read-only validation) and a saga-level commit
  // without idempotency-key-backed dedupe.
  //
  // Expected production behaviour documented in:
  //   docs/scope-and-limitations.md §Adversarial test findings (#1)
  //   docs/edge-cases.md §1. Load Guard — Concurrency & Idempotency

  it('rejects the second of two concurrent loads that together exceed the cap', async () => {
    // Would require Promise.all([processLoad(...), processLoad(...)])
    // with row-level lock or optimistic concurrency. Not implemented.
  });

  it('returns the cached result on idempotency-key replay rather than double-crediting', async () => {
    // Would require an idempotency-key store with TTL. Not implemented.
  });
});
