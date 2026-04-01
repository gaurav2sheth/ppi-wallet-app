import { useState, useCallback, useEffect, useRef } from 'react';
import { walletApi } from '../api/wallet.api';
import type { LedgerEntry } from '../types/api.types';
import { formatMonthYear } from '../utils/format';

interface UseLedgerOptions {
  entry_type?: string;
  limit?: number;
}

export function useLedger(walletId: string | null, options?: UseLedgerOptions) {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cursorRef = useRef<string | null>(null);

  const load = useCallback(async (reset = false) => {
    if (!walletId) return;
    setIsLoading(true);
    setError(null);
    try {
      const cursor = reset ? undefined : (cursorRef.current ?? undefined);
      const data = await walletApi.getLedger(walletId, {
        cursor,
        limit: options?.limit ?? 20,
        entry_type: options?.entry_type,
      });
      cursorRef.current = data.pagination.next_cursor;
      setHasMore(data.pagination.has_more);
      setEntries(prev => reset ? data.entries : [...prev, ...data.entries]);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  }, [walletId, options?.entry_type, options?.limit]);

  useEffect(() => {
    cursorRef.current = null;
    setEntries([]);
    setHasMore(true);
    load(true);
  }, [load]);

  const groupedEntries = entries.reduce<Map<string, LedgerEntry[]>>((map, entry) => {
    const key = formatMonthYear(entry.created_at);
    const group = map.get(key) ?? [];
    group.push(entry);
    map.set(key, group);
    return map;
  }, new Map());

  return { entries, groupedEntries, isLoading, hasMore, loadMore: () => load(false), error, reset: () => load(true) };
}
