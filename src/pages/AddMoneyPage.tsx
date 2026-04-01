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

export function AddMoneyPage() {
  const navigate = useNavigate();
  const { walletId } = useAuthStore();
  const { availablePaise } = useBalance(walletId);
  const { execute, isLoading, result, error, reset } = useTransaction();
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'input' | 'confirm' | 'result'>('input');

  const paise = rupeesToPaise(amount);

  const handleConfirm = async () => {
    if (!walletId || paise <= 0) return;
    try {
      await execute(() => sagaApi.addMoney(walletId, paise));
      setStep('result');
    } catch {
      setStep('result');
    }
  };

  if (step === 'result') {
    const success = result?.status === 'COMPLETED';
    return (
      <div className="page-enter">
        <Header showBack title="Add Money" />
        <div className="px-4 pt-12 text-center space-y-6">
          <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${success ? 'bg-green-50' : 'bg-red-50'}`}>
            {success ? (
              <svg width="40" height="40" fill="none" stroke="#4CAF50" strokeWidth="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            ) : (
              <svg width="40" height="40" fill="none" stroke="#E53935" strokeWidth="3" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
            )}
          </div>
          <div>
            <p className="text-xl font-bold text-paytm-text">{success ? 'Money Added!' : 'Transaction Failed'}</p>
            <p className="text-2xl font-bold mt-2 text-paytm-text">{formatPaise(String(paise))}</p>
            {!success && <p className="text-sm text-paytm-red mt-2">{error?.message ?? result?.error ?? 'Something went wrong'}</p>}
          </div>
          <div className="space-y-3">
            <Button fullWidth onClick={() => navigate(ROUTES.WALLET)}>Go to Wallet</Button>
            {!success && <Button fullWidth variant="outline" onClick={() => { reset(); setStep('input'); }}>Try Again</Button>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter">
      <Header showBack title="Add Money" />
      <div className="px-4 pt-6 space-y-6">
        <Card>
          <p className="text-xs text-paytm-muted font-medium mb-1">Current Balance</p>
          <p className="text-lg font-bold text-paytm-text">{formatPaise(availablePaise)}</p>
        </Card>

        {step === 'input' && (
          <>
            <AmountInput value={amount} onChange={setAmount} label="Enter amount to add" />
            <Button fullWidth disabled={paise <= 0} onClick={() => setStep('confirm')}>
              Continue
            </Button>
          </>
        )}

        {step === 'confirm' && (
          <div className="space-y-4">
            <Card>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-paytm-muted">Amount</span>
                  <span className="font-semibold text-paytm-text">{formatPaise(String(paise))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-paytm-muted">Current Balance</span>
                  <span className="text-paytm-text">{formatPaise(availablePaise)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-sm">
                  <span className="text-paytm-muted">New Balance</span>
                  <span className="font-bold text-paytm-green">
                    {formatPaise(String(BigInt(availablePaise ?? '0') + BigInt(paise)))}
                  </span>
                </div>
              </div>
            </Card>
            <div className="flex gap-3">
              <Button variant="outline" fullWidth onClick={() => setStep('input')}>Back</Button>
              <Button fullWidth loading={isLoading} onClick={handleConfirm}>Add Money</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
