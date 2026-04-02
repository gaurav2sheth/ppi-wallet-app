import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { FilterPills } from '../components/ui/FilterPills';
import { Avatar } from '../components/ui/Avatar';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAuthStore } from '../store/auth.store';
import { useLedger } from '../hooks/useLedger';
import { formatPaise, formatDate } from '../utils/format';
import { getMccCategory } from '../utils/mcc';
import { TRANSACTION_TYPE_LABELS } from '../utils/constants';
import type { LedgerEntry } from '../types/api.types';

const filterOptions = [
  { label: 'All', value: '' },
  { label: 'Credits', value: 'CREDIT' },
  { label: 'Debits', value: 'DEBIT' },
  { label: 'Holds', value: 'HOLD' },
];

export function PassbookPage() {
  const navigate = useNavigate();
  const { walletId } = useAuthStore();
  const [filter, setFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const { groupedEntries, isLoading, hasMore, loadMore } = useLedger(walletId, {
    entry_type: filter || undefined,
    limit: 20,
  });
  const loaderRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const handleScroll = useCallback(() => {
    if (!loaderRef.current || isLoading || !hasMore) return;
    const rect = loaderRef.current.getBoundingClientRect();
    if (rect.top < window.innerHeight + 100) loadMore();
  }, [isLoading, hasMore, loadMore]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (showSearch) searchRef.current?.focus();
  }, [showSearch]);

  // Filter entries by search query
  const filteredGroups: Map<string, LedgerEntry[]> = searchQuery.trim()
    ? (() => {
        const q = searchQuery.toLowerCase();
        const result = new Map<string, LedgerEntry[]>();
        for (const [month, monthEntries] of groupedEntries.entries()) {
          const filtered = monthEntries.filter(e =>
            (e.description?.toLowerCase().includes(q)) ||
            (e.transaction_type.toLowerCase().includes(q)) ||
            (e.amount_paise.includes(q))
          );
          if (filtered.length > 0) result.set(month, filtered);
        }
        return result;
      })()
    : groupedEntries;

  return (
    <div className="page-enter">
      <Header
        showBack
        title={showSearch ? undefined : 'Payment History'}
        rightActions={
          showSearch ? (
            <div className="flex items-center gap-2 flex-1 ml-2">
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search transactions..."
                className="flex-1 text-sm outline-none bg-gray-100 rounded-full px-4 py-2"
              />
              <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="text-xs font-semibold text-paytm-cyan">Cancel</button>
            </div>
          ) : (
            <button onClick={() => setShowSearch(true)} className="p-2 rounded-full hover:bg-gray-100">
              <svg width="18" height="18" fill="none" stroke="#1A1A1A" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
            </button>
          )
        }
      />
      <div className="px-4 pt-4 space-y-4">
        <FilterPills options={filterOptions} selected={filter} onSelect={setFilter} />

        {isLoading && groupedEntries.size === 0 ? (
          <LoadingSpinner />
        ) : filteredGroups.size === 0 ? (
          <Card className="text-center py-8">
            <p className="text-3xl mb-2">{searchQuery ? '🔍' : '📋'}</p>
            <p className="text-sm text-paytm-muted">{searchQuery ? `No results for "${searchQuery}"` : 'No transactions found'}</p>
          </Card>
        ) : (
          Array.from(filteredGroups.entries()).map(([month, entries]) => {
            const monthDebitTotal = entries
              .filter(e => e.entry_type === 'DEBIT')
              .reduce((sum, e) => sum + BigInt(e.amount_paise), 0n);

            return (
              <div key={month}>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-bold text-paytm-text">{month}</p>
                  {monthDebitTotal > 0n && (
                    <p className="text-[11px] text-paytm-muted">
                      Spent <span className="font-semibold text-paytm-text">{formatPaise(monthDebitTotal.toString())}</span>
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  {entries.map(e => {
                    const isCredit = e.entry_type === 'CREDIT' || e.entry_type === 'HOLD_RELEASE';
                    const mcc = getMccCategory(e.transaction_type, e.description, e.entry_type);
                    const typeLabel = TRANSACTION_TYPE_LABELS[e.transaction_type] ?? mcc.label;
                    const name = e.description ?? typeLabel;

                    return (
                      <Card key={e.id} className="!p-3" onClick={() => navigate(`/transaction?id=${e.id}`)}>
                        <div className="flex items-start gap-3">
                          <Avatar name={name} size="md" mcc={mcc} />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <p className="text-sm font-medium text-paytm-text truncate pr-2">{name}</p>
                              <p className={`text-sm font-bold shrink-0 ${isCredit ? 'text-paytm-green' : 'text-paytm-text'}`}>
                                {isCredit ? '+' : '-'}{formatPaise(e.amount_paise)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[11px] text-paytm-muted">{formatDate(e.created_at)}</span>
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${mcc.bgColor} ${mcc.textColor}`}>
                                {mcc.label}
                              </span>
                            </div>
                            <p className="text-[10px] text-paytm-muted mt-1">Balance: {formatPaise(e.balance_after_paise)}</p>
                          </div>
                          <svg width="14" height="14" fill="none" stroke="#ccc" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0 mt-2"><path d="M9 18l6-6-6-6" /></svg>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

        <div ref={loaderRef}>
          {isLoading && groupedEntries.size > 0 && <LoadingSpinner size="sm" />}
        </div>
      </div>
    </div>
  );
}
