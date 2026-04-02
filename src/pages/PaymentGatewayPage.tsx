import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

type PaymentMethod = 'wallet' | 'upi' | 'card' | 'netbanking' | 'paylater';

interface PayMethod {
  id: PaymentMethod;
  label: string;
  subtitle: string;
  icon: string;
  available: boolean;
}

export function PaymentGatewayPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetAmount = searchParams.get('amount');
  const { walletId } = useAuthStore();
  const { availablePaise } = useBalance(walletId);
  const { execute, isLoading, result, error, reset } = useTransaction();

  const [amount, setAmount] = useState(presetAmount ?? '');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('upi');
  const [step, setStep] = useState<'amount' | 'method' | 'result'>(presetAmount ? 'method' : 'amount');

  const paise = rupeesToPaise(amount);

  const paymentMethods: PayMethod[] = [
    { id: 'wallet', label: 'Paytm Wallet', subtitle: `Balance: ${formatPaise(availablePaise)}`, icon: '💳', available: true },
    { id: 'upi', label: 'UPI', subtitle: 'HDFC Bank - 7125', icon: '🏧', available: true },
    { id: 'card', label: 'Debit / Credit Card', subtitle: 'Visa, Mastercard, RuPay', icon: '💎', available: true },
    { id: 'netbanking', label: 'Net Banking', subtitle: '50+ banks supported', icon: '🏦', available: true },
    { id: 'paylater', label: 'Paytm Postpaid', subtitle: 'Pay next month', icon: '📅', available: false },
  ];

  const handlePay = async () => {
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
            <p className="text-2xl font-bold mt-2">{formatPaise(String(paise))}</p>
            <p className="text-xs text-paytm-muted mt-1">via {paymentMethods.find(m => m.id === selectedMethod)?.label}</p>
            {!success && <p className="text-sm text-paytm-red mt-2">{error?.message ?? result?.error}</p>}
          </div>
          <div className="space-y-3">
            <Button fullWidth onClick={() => navigate(ROUTES.HOME)}>Done</Button>
            {!success && <Button fullWidth variant="outline" onClick={() => { reset(); setStep('amount'); }}>Retry</Button>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter">
      <Header showBack title="Add Money to Wallet" />
      <div className="px-4 pt-6 space-y-5">
        {step === 'amount' && (
          <>
            <Card>
              <p className="text-xs text-paytm-muted font-medium mb-1">Current Wallet Balance</p>
              <p className="text-lg font-bold text-paytm-text">{formatPaise(availablePaise)}</p>
            </Card>
            <AmountInput value={amount} onChange={setAmount} label="Enter amount to add" />
            <p className="text-[11px] text-paytm-muted text-center">Wallet can hold maximum ₹2,00,000 (Full KYC)</p>
            <Button fullWidth disabled={paise <= 0} onClick={() => setStep('method')}>
              Continue
            </Button>
          </>
        )}

        {step === 'method' && (
          <>
            {/* Amount Summary */}
            <Card className="bg-gradient-to-r from-paytm-navy to-[#00508F] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/70">Adding to Wallet</p>
                  <p className="text-2xl font-bold mt-0.5">{formatPaise(String(paise))}</p>
                </div>
                <button onClick={() => setStep('amount')} className="text-xs text-white/80 underline">Change</button>
              </div>
            </Card>

            {/* Payment Methods */}
            <div>
              <p className="text-xs font-semibold text-paytm-muted mb-3 tracking-wide">SELECT PAYMENT METHOD</p>
              <div className="space-y-2">
                {paymentMethods.map(m => (
                  <Card
                    key={m.id}
                    className={`!p-3 border-2 transition-colors ${
                      selectedMethod === m.id ? 'border-paytm-navy' : 'border-transparent'
                    } ${!m.available ? 'opacity-50' : ''}`}
                    onClick={() => m.available && setSelectedMethod(m.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl">
                        {m.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-paytm-text">{m.label}</p>
                        <p className="text-[11px] text-paytm-muted">{m.subtitle}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedMethod === m.id ? 'border-paytm-navy' : 'border-gray-300'
                      }`}>
                        {selectedMethod === m.id && <div className="w-2.5 h-2.5 rounded-full bg-paytm-navy" />}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Secure Badge */}
            <div className="flex items-center justify-center gap-2 py-2">
              <svg width="14" height="14" fill="none" stroke="#4CAF50" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              <p className="text-[10px] text-paytm-muted">100% Secure Payment · RBI Regulated</p>
            </div>

            <Button fullWidth loading={isLoading} onClick={handlePay}>
              Pay {formatPaise(String(paise))} via {paymentMethods.find(m => m.id === selectedMethod)?.label}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
