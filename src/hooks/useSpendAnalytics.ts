import { useMemo } from 'react';
import type { LedgerEntry } from '../types/api.types';
import { getMccCategory, type MccCategory } from '../utils/mcc';

export interface CategorySpend {
  category: MccCategory;
  totalPaise: bigint;
  count: number;
  percentage: number;
}

export interface MerchantSpend {
  name: string;
  category: MccCategory;
  totalPaise: bigint;
  count: number;
}

export interface DailySpend {
  date: string; // YYYY-MM-DD
  dayLabel: string; // "1", "2", etc.
  totalPaise: bigint;
}

export interface SpendAnalytics {
  totalSpendPaise: bigint;
  totalIncomePaise: bigint;
  categoryBreakdown: CategorySpend[];
  topMerchants: MerchantSpend[];
  dailySpend: DailySpend[];
  transactionCount: number;
}

export function useSpendAnalytics(entries: LedgerEntry[], monthsBack = 1): SpendAnalytics {
  return useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 1);

    const filtered = entries.filter(e => new Date(e.created_at) >= cutoff);

    let totalSpendPaise = 0n;
    let totalIncomePaise = 0n;
    const categoryMap = new Map<string, { category: MccCategory; totalPaise: bigint; count: number }>();
    const merchantMap = new Map<string, { name: string; category: MccCategory; totalPaise: bigint; count: number }>();
    const dailyMap = new Map<string, bigint>();

    for (const entry of filtered) {
      const amt = BigInt(entry.amount_paise);
      const isDebit = entry.entry_type === 'DEBIT';
      const mcc = getMccCategory(entry.transaction_type, entry.description, entry.entry_type);

      if (isDebit) {
        totalSpendPaise += amt;

        // Category aggregation
        const catKey = mcc.label;
        const existing = categoryMap.get(catKey);
        if (existing) {
          existing.totalPaise += amt;
          existing.count++;
        } else {
          categoryMap.set(catKey, { category: mcc, totalPaise: amt, count: 1 });
        }

        // Merchant aggregation
        const merchName = entry.description ?? 'Unknown';
        const mExisting = merchantMap.get(merchName);
        if (mExisting) {
          mExisting.totalPaise += amt;
          mExisting.count++;
        } else {
          merchantMap.set(merchName, { name: merchName, category: mcc, totalPaise: amt, count: 1 });
        }

        // Daily aggregation
        const day = entry.created_at.split('T')[0];
        dailyMap.set(day, (dailyMap.get(day) ?? 0n) + amt);
      } else {
        totalIncomePaise += amt;
      }
    }

    // Sort categories by spend descending
    const categoryBreakdown: CategorySpend[] = Array.from(categoryMap.values())
      .sort((a, b) => (b.totalPaise > a.totalPaise ? 1 : -1))
      .map(c => ({
        ...c,
        percentage: totalSpendPaise > 0n ? Number((c.totalPaise * 10000n) / totalSpendPaise) / 100 : 0,
      }));

    // Top 5 merchants
    const topMerchants: MerchantSpend[] = Array.from(merchantMap.values())
      .sort((a, b) => (b.totalPaise > a.totalPaise ? 1 : -1))
      .slice(0, 5);

    // Daily spend for last 30 days
    const dailySpend: DailySpend[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailySpend.push({
        date: key,
        dayLabel: d.getDate().toString(),
        totalPaise: dailyMap.get(key) ?? 0n,
      });
    }

    return {
      totalSpendPaise,
      totalIncomePaise,
      categoryBreakdown,
      topMerchants,
      dailySpend,
      transactionCount: filtered.filter(e => e.entry_type === 'DEBIT').length,
    };
  }, [entries, monthsBack]);
}
