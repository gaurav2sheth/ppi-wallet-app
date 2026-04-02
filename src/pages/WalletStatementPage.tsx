import { useState } from 'react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/auth.store';
import { useToast } from '../components/ui/Toast';

const periodOptions = [
  { id: '1m', label: 'Last 1 Month', sub: null },
  { id: '3m', label: 'Last 3 Months', sub: null },
  { id: '6m', label: 'Last 6 Months', sub: null },
  { id: '1y', label: 'Last 1 Year', sub: null },
  { id: 'fy', label: 'FY 2025-26 (Tax Purpose)', sub: '01/04/2025 - 31/03/2026' },
  { id: 'custom', label: 'Custom Duration', sub: null },
];

export function WalletStatementPage() {
  const { phone } = useAuthStore();
  const toast = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('1m');
  const [email, setEmail] = useState(`${phone ?? 'user'}@gmail.com`);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [sent, setSent] = useState(false);

  const handleConfirm = () => {
    if (!email.includes('@')) {
      toast.show('Please enter a valid email address', 'error');
      return;
    }
    setSent(true);
    toast.show('Statement will be sent to your email shortly', 'success');
  };

  if (sent) {
    return (
      <div className="page-enter">
        <Header showBack title="Wallet Statement" />
        <div className="px-4 pt-16 text-center space-y-6">
          <div className="w-20 h-20 bg-green-50 rounded-full mx-auto flex items-center justify-center">
            <svg width="40" height="40" fill="none" stroke="#4CAF50" strokeWidth="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <div>
            <p className="text-xl font-bold text-paytm-text">Statement Requested</p>
            <p className="text-sm text-paytm-muted mt-2">
              Your wallet statement for <span className="font-semibold">{periodOptions.find(p => p.id === selectedPeriod)?.label}</span> will be sent to:
            </p>
            <p className="text-sm font-semibold text-paytm-navy mt-1">{email}</p>
          </div>
          <Button fullWidth variant="outline" onClick={() => setSent(false)}>Request Another</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter">
      <Header showBack title="Request Wallet Statement" />
      <div className="px-4 pt-6 space-y-6">
        {/* Period Selection */}
        <div>
          <p className="text-xs font-semibold text-paytm-muted mb-3 tracking-wide">SELECT TIME PERIOD</p>
          <div className="space-y-2">
            {periodOptions.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPeriod(p.id)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-colors text-left ${
                  selectedPeriod === p.id ? 'border-paytm-navy bg-blue-50/50' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selectedPeriod === p.id ? 'border-paytm-navy' : 'border-gray-300'
                }`}>
                  {selectedPeriod === p.id && <div className="w-2.5 h-2.5 rounded-full bg-paytm-navy" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-paytm-text">{p.label}</p>
                  {p.sub && <p className="text-[11px] text-paytm-muted mt-0.5">{p.sub}</p>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Range */}
        {selectedPeriod === 'custom' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-paytm-muted mb-1 block">From</label>
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-paytm-navy text-sm" />
            </div>
            <div>
              <label className="text-xs text-paytm-muted mb-1 block">To</label>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-paytm-navy text-sm" />
            </div>
          </div>
        )}

        {/* Email Input */}
        <div>
          <label className="text-xs font-semibold text-paytm-muted mb-2 block tracking-wide">EMAIL TO RECEIVE STATEMENT</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-paytm-navy transition-colors text-sm"
          />
        </div>

        {/* Info */}
        <Card className="!p-3 bg-blue-50/50 border border-blue-100">
          <div className="flex gap-2">
            <svg width="16" height="16" fill="none" stroke="#003D82" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
            <p className="text-[11px] text-paytm-navy leading-relaxed">
              Statement will be sent as a PDF attachment. It includes all wallet transactions for the selected period.
            </p>
          </div>
        </Card>

        <Button fullWidth onClick={handleConfirm}>Confirm</Button>

        {/* Footer */}
        <p className="text-center text-[10px] text-paytm-muted pb-2">Powered by Paytm</p>
      </div>
    </div>
  );
}
