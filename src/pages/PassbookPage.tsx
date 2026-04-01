import { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { FilterPills } from '../components/ui/FilterPills';
import { Avatar } from '../components/ui/Avatar';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAuthStore } from '../store/auth.store';
import { useLedger } from '../hooks/useLedger';
import { formatPaise, formatDate } from '../utils/format';
import { TRANSACTION_TYPE_LABELS, TRANSACTION_TYPE_COLORS } from '../utils/constants';

const filterOptions = [
  { label: 'All', value: '' },
  { label: 'Credits', value: 'CREDIT' },
  { label: 'Debits', value: 'DEBIT' },
  { label: 'Holds', value: 'HOLD' },
];

export function PassbookPage() {
  const { walletId } = useAuthStore();
  const [filter, setFilter] = useState('');
  const { groupedEntries, isLoading, hasMore, loadMore } = useLedger(walletId, {
    entry_type: filter || undefined,
    limit: 20,
  });
  const loaderRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (!loaderRef.current || isLoading || !hasMore) return;
    const rect = loaderRef.current.getBoundingClientRect();
    if (rect.top < window.innerHeight + 100) loadMore();
  }, [isLoading, hasMore, loadMore]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div className="page-enter">
      <Header
        showBack
        title="Payment History"
        rightActions={
          <button className="p-2 rounded-full hover:bg-gray-100">
            <svg width="18" height="18" fill="none" stroke="#1A1A2E" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
          </button>
        }
      />
      <div className="px-4 pt-4 space-y-4">
        <FilterPills options={filterOptions} selected={filter} onSelect={setFilter} />

        {isLoading && groupedEntries.size === 0 ? (
          <LoadingSpinner />
        ) : groupedEntries.size === 0 ? (
          <Card className="text-center py-8">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-sm text-paytm-muted">No transactions found</p>
          </Card>
        ) : (
          Array.from(groupedEntries.entries()).map(([month, entries]) => (
            <div key={month}>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-bold text-paytm-text">{month}</p>
              </div>
              <div className="space-y-2">
                {entries.map(e => {
                  const isCredit = e.entry_type === 'CREDIT' || e.entry_type === 'HOLD_RELEASE';
                  const typeLabel = TRANSACTION_TYPE_LABELS[e.transaction_type] ?? e.transaction_type;
                  const typeColor = TRANSACTION_TYPE_COLORS[e.transaction_type] ?? 'bg-gray-50 text-gray-700';
                  const name = e.description ?? typeLabel;

                  return (
                    <Card key={e.id} className="!p-3">
                      <div className="flex items-start gap-3">
                        <Avatar name={name} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-medium text-paytm-text truncate pr-2">{name}</p>
                            <p className={`text-sm font-bold shrink-0 ${isCredit ? 'text-paytm-green' : 'text-paytm-text'}`}>
                              {isCredit ? '+' : '-'}{formatPaise(e.amount_paise)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] text-paytm-muted">{formatDate(e.created_at)}</span>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${typeColor}`}>{typeLabel}</span>
                          </div>
                          <p className="text-[10px] text-paytm-muted mt-1">Balance: {formatPaise(e.balance_after_paise)}</p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))
        )}

        <div ref={loaderRef}>
          {isLoading && groupedEntries.size > 0 && <LoadingSpinner size="sm" />}
        </div>
      </div>
    </div>
  );
}
