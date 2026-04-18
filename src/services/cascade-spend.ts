/**
 * cascade-spend — pure function for computing a merchant-pay split across
 * the main wallet and eligible sub-wallets.
 *
 * Why this is a pure function (and why that matters):
 *   The cascade-spend logic was previously spread across
 *   `mockCheckEligibility`, `mockFindBestSubWallet`, and per-wallet debit
 *   helpers in `api/mock.ts` — mixing pure decisions with localStorage
 *   mutations. That made the "clean decline on shortfall, no partial
 *   debit" invariant hard to test in one assertion (it required mocking
 *   localStorage to prove the absence of a write).
 *
 *   This function takes immutable input, returns a plan, and never writes.
 *   Callers (including mock.ts and a future real ledger) perform the
 *   writes based on the plan — or skip them entirely if status is DECLINED.
 *
 * Invariants:
 *   1. If the sub-wallet(s) plus main balance sum < amount: status = DECLINED,
 *      reason = INSUFFICIENT_FUNDS, splits = [] (no partial debit).
 *   2. If a category-specific sub-wallet covers the whole amount, it is
 *      preferred over splitting to main.
 *   3. If a category-specific sub-wallet covers part, the remainder comes
 *      from main wallet — never from Gift in this position. Gift is only
 *      used when no category-specific sub-wallet applies.
 *   4. Gift wallet is universal eligibility EXCEPT when expired.
 *   5. Every split entry has strictly positive amountPaise.
 *
 * See docs/adr/ADR-004-fastag-security-deposit.md and
 * docs/edge-cases.md §2 (Cascade Spend Boundaries) for the full spec.
 */

export type CascadeSource = 'MAIN_WALLET' | 'FOOD_SUBWALLET' | 'GIFT_SUBWALLET' | 'FUEL_SUBWALLET';

export type CascadeCategory = 'FOOD' | 'FUEL' | 'GROCERIES' | 'TRANSIT' | 'TOLL' | 'OTHER';

export interface CascadeSplit {
  source: CascadeSource;
  amountPaise: number;
}

export interface CascadeStatus {
  status: 'APPROVED' | 'DECLINED';
  splits: CascadeSplit[];
  reason?: 'INSUFFICIENT_FUNDS' | 'INVALID_INPUT' | 'EXPIRED_GIFT';
}

export interface CascadeInput {
  amountPaise: number;
  merchantCategory: CascadeCategory;
  subWallets: {
    food?: number;
    fuel?: number;
    gift?: number;
    giftExpired?: boolean;
  };
  mainBalance: number;
}

/** Which category-specific sub-wallet (if any) is eligible for this category. */
function categorySpecificWallet(cat: CascadeCategory): CascadeSource | null {
  switch (cat) {
    case 'FOOD':
    case 'GROCERIES':
      return 'FOOD_SUBWALLET';
    case 'FUEL':
      return 'FUEL_SUBWALLET';
    // TRANSIT and TOLL are handled OUTSIDE cascade-spend — NCMC is isolated
    // (ADR-005) and FASTag uses security-deposit fallback (ADR-004).
    default:
      return null;
  }
}

function balanceFor(source: CascadeSource, input: CascadeInput): number {
  switch (source) {
    case 'FOOD_SUBWALLET': return input.subWallets.food ?? 0;
    case 'FUEL_SUBWALLET': return input.subWallets.fuel ?? 0;
    case 'GIFT_SUBWALLET': return input.subWallets.gift ?? 0;
    case 'MAIN_WALLET':    return input.mainBalance ?? 0;
  }
}

/**
 * Pure cascade-spend planner. Never writes; returns the split plan and
 * status. Callers apply the splits or show the decline.
 */
export function calculateCascadeSpend(input: CascadeInput): CascadeStatus {
  // Input validation
  if (!input || !Number.isFinite(input.amountPaise) || input.amountPaise <= 0) {
    return { status: 'DECLINED', splits: [], reason: 'INVALID_INPUT' };
  }

  const specific = categorySpecificWallet(input.merchantCategory);
  const giftAvailable = !input.subWallets.giftExpired && (input.subWallets.gift ?? 0) > 0;

  // Order of preference:
  //   1. Category-specific sub-wallet (if any, with balance)
  //   2. Main wallet (to cover remainder)
  //   3. Gift wallet (only if no category-specific match applied)
  //
  // Note: the rule "Gift can cover remainder after category-specific" is
  // intentionally NOT supported. Gift is a fallback when there's no
  // category-specific wallet, not a chainable filler. This matches the
  // documented behaviour in docs/adr/ADR-005-ncmc-isolated-balance.md's
  // sibling rules for Gift.

  const splits: CascadeSplit[] = [];
  let remaining = input.amountPaise;

  if (specific && balanceFor(specific, input) > 0) {
    // Path A: category-specific wallet + main wallet remainder
    const specificBalance = balanceFor(specific, input);
    const fromSpecific = Math.min(specificBalance, remaining);
    if (fromSpecific > 0) {
      splits.push({ source: specific, amountPaise: fromSpecific });
      remaining -= fromSpecific;
    }
    if (remaining > 0) {
      const mainBalance = input.mainBalance ?? 0;
      if (mainBalance >= remaining) {
        splits.push({ source: 'MAIN_WALLET', amountPaise: remaining });
        remaining = 0;
      } else {
        // INVARIANT: clean decline, no partial debit.
        return { status: 'DECLINED', splits: [], reason: 'INSUFFICIENT_FUNDS' };
      }
    }
    return { status: 'APPROVED', splits };
  }

  // Path B: no category-specific wallet — try Gift as universal fallback
  if (giftAvailable) {
    const giftBalance = input.subWallets.gift ?? 0;
    const fromGift = Math.min(giftBalance, remaining);
    if (fromGift > 0) {
      splits.push({ source: 'GIFT_SUBWALLET', amountPaise: fromGift });
      remaining -= fromGift;
    }
    if (remaining > 0) {
      const mainBalance = input.mainBalance ?? 0;
      if (mainBalance >= remaining) {
        splits.push({ source: 'MAIN_WALLET', amountPaise: remaining });
        remaining = 0;
      } else {
        return { status: 'DECLINED', splits: [], reason: 'INSUFFICIENT_FUNDS' };
      }
    }
    return { status: 'APPROVED', splits };
  }

  // Path C: main wallet only
  const mainBalance = input.mainBalance ?? 0;
  if (mainBalance >= remaining) {
    splits.push({ source: 'MAIN_WALLET', amountPaise: remaining });
    return { status: 'APPROVED', splits };
  }

  return { status: 'DECLINED', splits: [], reason: 'INSUFFICIENT_FUNDS' };
}
