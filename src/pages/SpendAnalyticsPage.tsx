import { useState } from 'react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { FilterPills } from '../components/ui/FilterPills';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAuthStore } from '../store/auth.store';
import { useLedger } from '../hooks/useLedger';
import { useSpendAnalytics } from '../hooks/useSpendAnalytics';
import { formatPaise } from '../utils/format';

const periodOptions = [
  { label: 'This Month', value: '1' },
  { label: '3 Months', value: '3' },
  { label: '6 Months', value: '6' },
  { label: '1 Year', value: '12' },
];

export function SpendAnalyticsPage() {
  const { walletId } = useAuthStore();
  const [period, setPeriod] = useState('1');
  const { entries, isLoading } = useLedger(walletId, { limit: 100 });
  const analytics = useSpendAnalytics(entries, parseInt(period));

  // Build conic-gradient for donut chart
  const donutGradient = (() => {
    if (analytics.categoryBreakdown.length === 0) return 'conic-gradient(#e5e7eb 0deg 360deg)';
    const colors = ['#003D82', '#00BCD4', '#FF9800', '#4CAF50', '#E53935', '#9C27B0', '#FF5722', '#607D8B'];
    const segments: string[] = [];
    let angle = 0;
    analytics.categoryBreakdown.forEach((cat, i) => {
      const deg = (cat.percentage / 100) * 360;
      const color = colors[i % colors.length];
      segments.push(`${color} ${angle}deg ${angle + deg}deg`);
      angle += deg;
    });
    if (angle < 360) segments.push(`#e5e7eb ${angle}deg 360deg`);
    return `conic-gradient(${segments.join(', ')})`;
  })();

  const colors = ['#003D82', '#00BCD4', '#FF9800', '#4CAF50', '#E53935', '#9C27B0', '#FF5722', '#607D8B'];
  const maxDailySpend = analytics.dailySpend.reduce((max, d) => d.totalPaise > max ? d.totalPaise : max, 0n);

  return (
    <div className="page-enter">
      <Header showBack title="Spend Analytics" />
      <div className="px-4 pt-4 space-y-4">
        <FilterPills options={periodOptions} selected={period} onSelect={setPeriod} />

        {isLoading ? <LoadingSpinner /> : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="text-center">
                <p className="text-[10px] text-paytm-muted font-medium">Total Spent</p>
                <p className="text-xl font-bold text-paytm-red mt-1">{formatPaise(analytics.totalSpendPaise.toString())}</p>
                <p className="text-[10px] text-paytm-muted mt-1">{analytics.transactionCount} transactions</p>
              </Card>
              <Card className="text-center">
                <p className="text-[10px] text-paytm-muted font-medium">Total Received</p>
                <p className="text-xl font-bold text-paytm-green mt-1">{formatPaise(analytics.totalIncomePaise.toString())}</p>
              </Card>
            </div>

            {/* Donut Chart */}
            {analytics.categoryBreakdown.length > 0 && (
              <Card>
                <p className="text-xs font-semibold text-paytm-muted mb-4 tracking-wide">SPEND BY CATEGORY</p>
                <div className="flex items-center gap-6">
                  {/* Donut */}
                  <div className="relative w-32 h-32 shrink-0">
                    <div
                      className="w-full h-full rounded-full"
                      style={{ background: donutGradient }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 bg-white rounded-full flex flex-col items-center justify-center">
                        <p className="text-[10px] text-paytm-muted">Total</p>
                        <p className="text-xs font-bold text-paytm-text">{formatPaise(analytics.totalSpendPaise.toString())}</p>
                      </div>
                    </div>
                  </div>
                  {/* Legend */}
                  <div className="flex-1 space-y-2">
                    {analytics.categoryBreakdown.slice(0, 6).map((cat, i) => (
                      <div key={cat.category.label} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
                        <span className="text-[11px] text-paytm-text flex-1 truncate">{cat.category.label}</span>
                        <span className="text-[10px] font-semibold text-paytm-text">{cat.percentage.toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Category Breakdown List */}
            {analytics.categoryBreakdown.length > 0 && (
              <Card>
                <p className="text-xs font-semibold text-paytm-muted mb-3 tracking-wide">CATEGORY DETAILS</p>
                <div className="space-y-3">
                  {analytics.categoryBreakdown.map((cat, i) => (
                    <div key={cat.category.label}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{cat.category.icon}</span>
                        <span className="text-xs font-medium text-paytm-text flex-1">{cat.category.label}</span>
                        <span className="text-xs font-bold text-paytm-text">{formatPaise(cat.totalPaise.toString())}</span>
                        <span className="text-[10px] text-paytm-muted w-10 text-right">{cat.count}x</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${cat.percentage}%`, backgroundColor: colors[i % colors.length] }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Top Merchants */}
            {analytics.topMerchants.length > 0 && (
              <Card>
                <p className="text-xs font-semibold text-paytm-muted mb-3 tracking-wide">TOP MERCHANTS</p>
                <div className="space-y-2.5">
                  {analytics.topMerchants.map((m, i) => (
                    <div key={m.name} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-paytm-muted w-4">{i + 1}</span>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${m.category.bgColor}`}>
                        {m.category.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-paytm-text truncate">{m.name}</p>
                        <p className="text-[10px] text-paytm-muted">{m.count} transaction{m.count > 1 ? 's' : ''}</p>
                      </div>
                      <p className="text-xs font-bold text-paytm-text">{formatPaise(m.totalPaise.toString())}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Daily Spend Trend */}
            <Card>
              <p className="text-xs font-semibold text-paytm-muted mb-3 tracking-wide">DAILY SPEND (LAST 30 DAYS)</p>
              <div className="flex items-end gap-[2px] h-24">
                {analytics.dailySpend.map(d => {
                  const height = maxDailySpend > 0n ? Number((d.totalPaise * 100n) / maxDailySpend) : 0;
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                      <div
                        className={`w-full rounded-t-sm transition-all ${d.totalPaise > 0n ? 'bg-paytm-navy hover:bg-paytm-cyan' : 'bg-gray-100'}`}
                        style={{ height: `${Math.max(height, 2)}%` }}
                      />
                      {/* Tooltip on hover */}
                      {d.totalPaise > 0n && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                          <div className="bg-paytm-text text-white text-[8px] px-1.5 py-0.5 rounded whitespace-nowrap">
                            {formatPaise(d.totalPaise.toString())}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[8px] text-paytm-muted">{analytics.dailySpend[0]?.dayLabel}</span>
                <span className="text-[8px] text-paytm-muted">Today</span>
              </div>
            </Card>

            {/* Empty state */}
            {analytics.categoryBreakdown.length === 0 && (
              <Card className="text-center py-8">
                <p className="text-3xl mb-2">📊</p>
                <p className="text-sm text-paytm-muted">No spending data for this period</p>
                <p className="text-xs text-paytm-muted mt-1">Make some transactions to see analytics</p>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
