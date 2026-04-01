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

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export function TransferToBankPage() {
  const navigate = useNavigate();
  const { walletId } = useAuthStore();
  const { availablePaise } = useBalance(walletId);
  const { execute, isLoading, result, error, reset } = useTransaction();
  const [bankAccount, setBankAccount] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [amount, setAmount] = useState('');
  const [ifscError, setIfscError] = useState('');
  const [step, setStep] = useState<'input' | 'result'>('input');

  const paise = rupeesToPaise(amount);

  const validateIfsc = (v: string) => {
    const upper = v.toUpperCase();
    setIfsc(upper);
    if (upper.length === 11 && !IFSC_REGEX.test(upper)) {
      setIfscError('Invalid IFSC format (e.g., HDFC0001234)');
    } else {
      setIfscError('');
    }
  };

  const handleTransfer = async () => {
    if (!walletId || !bankAccount.trim() || !IFSC_REGEX.test(ifsc) || paise <= 0) return;
    try {
      await execute(() => sagaApi.walletToBank(walletId, paise, bankAccount.trim(), ifsc));
      setStep('result');
    } catch {
      setStep('result');
    }
  };

  if (step === 'result') {
    const success = result?.status === 'COMPLETED';
    return (
      <div className="page-enter">
        <Header showBack title="Bank Transfer" />
        <div className="px-4 pt-12 text-center space-y-6">
          <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${success ? 'bg-green-50' : 'bg-red-50'}`}>
            {success ? (
              <svg width="40" height="40" fill="none" stroke="#4CAF50" strokeWidth="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            ) : (
              <svg width="40" height="40" fill="none" stroke="#E53935" strokeWidth="3" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
            )}
          </div>
          <div>
            <p className="text-xl font-bold">{success ? 'Transfer Successful!' : 'Transfer Failed'}</p>
            <p className="text-2xl font-bold mt-2">{formatPaise(String(paise))}</p>
            <p className="text-sm text-paytm-muted mt-1">to A/C {bankAccount}</p>
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
      <Header showBack title="Transfer to Bank" />
      <div className="px-4 pt-6 space-y-5">
        <div>
          <label className="text-xs font-medium text-paytm-muted mb-1 block">Bank Account Number</label>
          <input
            value={bankAccount}
            onChange={e => setBankAccount(e.target.value.replace(/\D/g, ''))}
            maxLength={20}
            placeholder="Enter account number"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-paytm-navy transition-colors"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-paytm-muted mb-1 block">IFSC Code</label>
          <input
            value={ifsc}
            onChange={e => validateIfsc(e.target.value)}
            maxLength={11}
            placeholder="e.g. HDFC0001234"
            className={`w-full border-2 rounded-xl px-4 py-3 outline-none transition-colors uppercase ${
              ifscError ? 'border-paytm-red' : 'border-gray-200 focus:border-paytm-navy'
            }`}
          />
          {ifscError && <p className="text-xs text-paytm-red mt-1">{ifscError}</p>}
        </div>
        <AmountInput value={amount} onChange={setAmount} label="Amount" presets={[500, 1000, 5000, 10000]} />
        <Card className="!p-3 bg-gray-50">
          <div className="flex justify-between text-xs">
            <span className="text-paytm-muted">Available Balance</span>
            <span className="font-semibold">{formatPaise(availablePaise)}</span>
          </div>
        </Card>
        <Button
          fullWidth
          loading={isLoading}
          disabled={!bankAccount.trim() || !IFSC_REGEX.test(ifsc) || paise <= 0}
          onClick={handleTransfer}
        >
          Transfer {paise > 0 ? formatPaise(String(paise)) : ''}
        </Button>
      </div>
    </div>
  );
}
