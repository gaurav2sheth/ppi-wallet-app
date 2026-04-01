import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AmountInput } from '../components/ui/AmountInput';
import { useAuthStore } from '../store/auth.store';
import { useBalance } from '../hooks/useBalance';
import { useTransaction } from '../hooks/useTransaction';
import { sagaApi } from '../api/saga.api';
import { formatPaise, rupeesToPaise } from '../utils/format';
import { ROUTES } from '../utils/constants';

const categories = [
  { id: 'electricity', label: 'Electricity', icon: '💡' },
  { id: 'water', label: 'Water', icon: '💧' },
  { id: 'gas', label: 'Gas', icon: '🔥' },
  { id: 'dth', label: 'DTH', icon: '📺' },
  { id: 'broadband', label: 'Broadband', icon: '📡' },
  { id: 'insurance', label: 'Insurance', icon: '🛡️' },
];

export function BillPayPage() {
  const navigate = useNavigate();
  const { walletId } = useAuthStore();
  const { availablePaise } = useBalance(walletId);
  const { execute, isLoading, result, error, reset } = useTransaction();
  const [category, setCategory] = useState('');
  const [billerId, setBillerId] = useState('');
  const [billerRef, setBillerRef] = useState('');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'input' | 'result'>('input');

  const paise = rupeesToPaise(amount);

  const handlePay = async () => {
    if (!walletId || !billerId.trim() || !billerRef.trim() || paise <= 0) return;
    try {
      await execute(() => sagaApi.billPay(walletId, billerId.trim(), billerRef.trim(), paise));
      setStep('result');
    } catch {
      setStep('result');
    }
  };

  if (step === 'result') {
    const success = result?.status === 'COMPLETED';
    return (
      <div className="page-enter">
        <Header showBack title="Bill Payment" />
        <div className="px-4 pt-12 text-center space-y-6">
          <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${success ? 'bg-green-50' : 'bg-red-50'}`}>
            {success ? (
              <svg width="40" height="40" fill="none" stroke="#4CAF50" strokeWidth="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            ) : (
              <svg width="40" height="40" fill="none" stroke="#E53935" strokeWidth="3" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
            )}
          </div>
          <div>
            <p className="text-xl font-bold">{success ? 'Bill Paid!' : 'Payment Failed'}</p>
            <p className="text-2xl font-bold mt-2">{formatPaise(String(paise))}</p>
            {!success && <p className="text-sm text-paytm-red mt-2">{error?.message ?? result?.error}</p>}
          </div>
          <Button fullWidth onClick={() => navigate(ROUTES.HOME)}>Done</Button>
          {!success && <Button fullWidth variant="outline" onClick={() => { reset(); setStep('input'); }}>Retry</Button>}
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter">
      <Header showBack title="Bill Payment" />
      <div className="px-4 pt-6 space-y-5">
        {/* Categories */}
        <div>
          <p className="text-xs font-semibold text-paytm-muted mb-3 tracking-wide">SELECT CATEGORY</p>
          <div className="grid grid-cols-3 gap-3">
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => { setCategory(c.id); setBillerId(`${c.id}-provider`); }}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-colors ${
                  category === c.id ? 'border-paytm-navy bg-blue-50' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <span className="text-2xl">{c.icon}</span>
                <span className="text-xs font-medium text-paytm-text">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-paytm-muted mb-1 block">Biller / Provider ID</label>
          <input
            value={billerId}
            onChange={e => setBillerId(e.target.value)}
            placeholder="e.g. MSEDC-Mumbai"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-paytm-navy transition-colors"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-paytm-muted mb-1 block">Consumer / Reference Number</label>
          <input
            value={billerRef}
            onChange={e => setBillerRef(e.target.value)}
            placeholder="e.g. 1234567890"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-paytm-navy transition-colors"
          />
        </div>
        <AmountInput value={amount} onChange={setAmount} label="Bill Amount" presets={[200, 500, 1000, 2000]} />
        <Card className="!p-3 bg-gray-50">
          <div className="flex justify-between text-xs">
            <span className="text-paytm-muted">Available Balance</span>
            <span className="font-semibold">{formatPaise(availablePaise)}</span>
          </div>
        </Card>
        <Button fullWidth loading={isLoading} disabled={!billerId.trim() || !billerRef.trim() || paise <= 0} onClick={handlePay}>
          Pay Bill {paise > 0 ? formatPaise(String(paise)) : ''}
        </Button>
      </div>
    </div>
  );
}
