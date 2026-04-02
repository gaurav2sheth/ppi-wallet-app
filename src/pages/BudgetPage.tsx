import { useState } from 'react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useBudgetStore } from '../store/budget.store';
import { useAuthStore } from '../store/auth.store';
import { useLedger } from '../hooks/useLedger';
import { useSpendAnalytics } from '../hooks/useSpendAnalytics';
import { formatPaise, rupeesToPaise } from '../utils/format';
import { useToast } from '../components/ui/Toast';

const budgetCategories = [
  { key: 'Food', icon: '🍔' },
  { key: 'Taxi', icon: '🚕' },
  { key: 'Shopping', icon: '🛍️' },
  { key: 'Bill Payment', icon: '📄' },
  { key: 'Entertainment', icon: '🎬' },
  { key: 'Groceries', icon: '🛒' },
  { key: 'Fuel', icon: '⛽' },
  { key: 'Health', icon: '🏥' },
];

export function BudgetPage() {
  const toast = useToast();
  const { limits, monthlyCapPaise, setMonthlyCapPaise, setLimit, removeLimit } = useBudgetStore();
  const { walletId } = useAuthStore();
  const { entries } = useLedger(walletId, { limit: 100 });
  const analytics = useSpendAnalytics(entries, 1);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editingCap, setEditingCap] = useState(false);
  const [capAmount, setCapAmount] = useState('');

  const handleSaveLimit = (category: string, icon: string) => {
    const paise = rupeesToPaise(editAmount);
    if (paise <= 0) { toast.show('Enter a valid amount', 'error'); return; }
    setLimit(category, paise, icon);
    setEditingCat(null);
    setEditAmount('');
    toast.show(`Budget set for ${category}`, 'success');
  };

  const handleSaveCap = () => {
    const paise = rupeesToPaise(capAmount);
    if (paise <= 0) { toast.show('Enter a valid amount', 'error'); return; }
    setMonthlyCapPaise(paise);
    setEditingCap(false);
    setCapAmount('');
    toast.show('Monthly spending cap updated', 'success');
  };

  const totalSpent = analytics.totalSpendPaise;
  const capUsed = monthlyCapPaise > 0 ? Number((totalSpent * 100n) / BigInt(monthlyCapPaise)) : 0;

  return (
    <div className="page-enter">
      <Header showBack title="Budget Controls" />
      <div className="px-4 pt-4 space-y-4">
        {/* Monthly Cap */}
        <Card>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-paytm-muted tracking-wide">MONTHLY SPENDING CAP</p>
            <button onClick={() => { setEditingCap(true); setCapAmount(monthlyCapPaise > 0 ? (monthlyCapPaise / 100).toString() : ''); }} className="text-xs font-semibold text-paytm-cyan">
              {monthlyCapPaise > 0 ? 'Edit' : 'Set'}
            </button>
          </div>
          {monthlyCapPaise > 0 ? (
            <>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-paytm-text font-bold">{formatPaise(totalSpent.toString())}</span>
                <span className="text-paytm-muted">of {formatPaise(monthlyCapPaise.toString())}</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${capUsed > 90 ? 'bg-paytm-red' : capUsed > 70 ? 'bg-paytm-orange' : 'bg-paytm-green'}`} style={{ width: `${Math.min(capUsed, 100)}%` }} />
              </div>
              <p className="text-[10px] text-paytm-muted mt-1">{capUsed}% used this month</p>
            </>
          ) : (
            <p className="text-sm text-paytm-muted">No monthly cap set. Tap "Set" to add one.</p>
          )}
          {editingCap && (
            <div className="mt-3 flex gap-2">
              <div className="flex items-center border border-paytm-border rounded-lg px-3 py-2 flex-1">
                <span className="text-sm text-paytm-muted mr-1">₹</span>
                <input value={capAmount} onChange={e => setCapAmount(e.target.value.replace(/[^\d]/g, ''))} placeholder="10000" className="outline-none text-sm flex-1 bg-transparent" autoFocus />
              </div>
              <Button size="sm" onClick={handleSaveCap}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingCap(false)}>Cancel</Button>
            </div>
          )}
        </Card>

        {/* Category Budgets */}
        <Card>
          <p className="text-xs font-semibold text-paytm-muted mb-3 tracking-wide">CATEGORY BUDGETS</p>
          <div className="space-y-3">
            {budgetCategories.map(cat => {
              const limit = limits.find(l => l.category === cat.key);
              const catSpend = analytics.categoryBreakdown.find(c => c.category.label === cat.key);
              const spentPaise = catSpend ? catSpend.totalPaise : 0n;
              const usage = limit ? Number((spentPaise * 100n) / BigInt(limit.limitPaise)) : 0;
              const isEditing = editingCat === cat.key;

              return (
                <div key={cat.key}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{cat.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-paytm-text">{cat.key}</p>
                        {limit ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-paytm-muted">{formatPaise(spentPaise.toString())} / {formatPaise(limit.limitPaise.toString())}</span>
                            <button onClick={() => removeLimit(cat.key)} className="text-[10px] text-paytm-red">Remove</button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditingCat(cat.key); setEditAmount(''); }} className="text-xs text-paytm-cyan font-semibold">Set Limit</button>
                        )}
                      </div>
                      {limit && (
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
                          <div className={`h-full rounded-full ${usage > 90 ? 'bg-paytm-red' : usage > 70 ? 'bg-paytm-orange' : 'bg-paytm-cyan'}`} style={{ width: `${Math.min(usage, 100)}%` }} />
                        </div>
                      )}
                    </div>
                  </div>
                  {isEditing && (
                    <div className="mt-2 ml-9 flex gap-2">
                      <div className="flex items-center border border-paytm-border rounded-lg px-3 py-1.5 flex-1">
                        <span className="text-xs text-paytm-muted mr-1">₹</span>
                        <input value={editAmount} onChange={e => setEditAmount(e.target.value.replace(/[^\d]/g, ''))} placeholder="5000" className="outline-none text-xs flex-1 bg-transparent" autoFocus />
                      </div>
                      <Button size="sm" onClick={() => handleSaveLimit(cat.key, cat.icon)}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingCat(null)}>×</Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Info */}
        <Card className="!p-3 bg-blue-50/50 border border-blue-100">
          <div className="flex gap-2">
            <span className="text-sm">💡</span>
            <p className="text-[11px] text-paytm-navy leading-relaxed">
              Budget alerts are visual reminders. When you exceed a category limit, the progress bar turns red. Set caps to track your monthly spending goals.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
