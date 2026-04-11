import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AmountInput } from '../components/ui/AmountInput';
import { useAuthStore } from '../store/auth.store';
import { useBalance } from '../hooks/useBalance';
import { useTransaction } from '../hooks/useTransaction';
import { PinModal } from '../components/ui/PinModal';
import { sagaApi } from '../api/saga.api';
import { validateLoad, getMaxLoadRoom } from '../api/loadguard.api';
import { formatPaise, rupeesToPaise } from '../utils/format';
import { ROUTES } from '../utils/constants';

type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'paylater';

interface PayMethod {
  id: PaymentMethod;
  label: string;
  subtitle: string;
  icon: string;
  available: boolean;
}

interface LoadGuardBlock {
  blocked_by: string;
  user_message: string;
  suggestion: string;
  max_allowed: number;
}

export function PaymentGatewayPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetAmount = searchParams.get('amount');
  const { walletId, userId } = useAuthStore();
  const { availablePaise, kycTier } = useBalance(walletId);
  const { executeWithPin, onPinVerified, cancelPin, isPinPending, isLoading, result, error, reset } = useTransaction();

  const [amount, setAmount] = useState(presetAmount ?? '');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('upi');
  const [step, setStep] = useState<'amount' | 'method' | 'result'>(presetAmount ? 'method' : 'amount');

  // Load Guard state
  const [isValidating, setIsValidating] = useState(false);
  const [guardBlock, setGuardBlock] = useState<LoadGuardBlock | null>(null);

  const paise = rupeesToPaise(amount);

  // Calculate max room available for loading
  const loadRoom = useMemo(() => {
    try {
      return getMaxLoadRoom();
    } catch {
      return { max_room: 100000, current_balance: 0, monthly_loaded: 0, kyc_tier: 'FULL' };
    }
  }, [availablePaise]);

  const paymentMethods: PayMethod[] = [
    { id: 'upi', label: 'UPI', subtitle: 'HDFC Bank - 7125', icon: '🏧', available: true },
    { id: 'card', label: 'Debit / Credit Card', subtitle: 'Visa, Mastercard, RuPay', icon: '💎', available: true },
    { id: 'netbanking', label: 'Net Banking', subtitle: '50+ banks supported', icon: '🏦', available: true },
    { id: 'paylater', label: 'Paytm Postpaid', subtitle: 'Pay next month', icon: '📅', available: false },
  ];

  const getSourceLabel = () => {
    const method = paymentMethods.find(m => m.id === selectedMethod);
    if (!method) return undefined;
    if (selectedMethod === 'upi') return 'UPI - HDFC Bank 7125';
    return method.label;
  };

  // Validate load amount before proceeding to payment method selection
  const handleContinue = async () => {
    if (paise <= 0) return;
    setGuardBlock(null);
    setIsValidating(true);

    try {
      const amountRupees = paise / 100;
      const guardResult = await validateLoad(userId || 'user_001', amountRupees);

      if (guardResult.allowed) {
        setStep('method');
      } else {
        setGuardBlock({
          blocked_by: guardResult.blocked_by || 'UNKNOWN',
          user_message: guardResult.user_message || 'This transaction exceeds your wallet limit.',
          suggestion: guardResult.suggestion || '',
          max_allowed: guardResult.max_allowed ?? 0,
        });
      }
    } catch {
      // If validation fails entirely, allow proceeding (fail-open for UX, backend will still validate)
      setStep('method');
    } finally {
      setIsValidating(false);
    }
  };

  const handlePay = () => {
    if (!walletId || paise <= 0) return;
    executeWithPin(() => sagaApi.addMoney(walletId, paise, getSourceLabel()));
  };

  const handlePinVerified = async () => {
    try {
      await onPinVerified();
      setStep('result');
    } catch { setStep('result'); }
  };

  // "Add max amount instead" button handler
  const handleAddMaxInstead = () => {
    if (guardBlock && guardBlock.max_allowed > 0) {
      setAmount(guardBlock.max_allowed.toString());
      setGuardBlock(null);
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
            {success && Boolean(result?.result?.balance_after_paise) && (
              <p className="text-sm text-green-600 mt-2 font-medium">New balance: {formatPaise(String(result!.result!.balance_after_paise as string))}</p>
            )}
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
      <PinModal isOpen={isPinPending} onVerified={handlePinVerified} onCancel={cancelPin} title="Authorize Payment" />
      <Header showBack title="Add Money to Wallet" />
      <div className="px-4 pt-6 space-y-5">
        {step === 'amount' && (
          <>
            <Card>
              <p className="text-xs text-paytm-muted font-medium mb-1">Current Wallet Balance</p>
              <p className="text-lg font-bold text-paytm-text">{formatPaise(availablePaise)}</p>
            </Card>
            <AmountInput value={amount} onChange={(v) => { setAmount(v); setGuardBlock(null); }} label="Enter amount to add" />

            {/* Live helper text — remaining room */}
            <div className="space-y-1">
              <p className="text-[11px] text-paytm-muted text-center">
                Max wallet balance: ₹1,00,000{kycTier === 'MINIMUM' ? ' (₹10,000 for Min KYC)' : ''}
              </p>
              {loadRoom.max_room > 0 ? (
                <p className="text-[11px] text-center text-green-600 font-medium">
                  You can add up to ₹{loadRoom.max_room.toLocaleString('en-IN')} right now
                </p>
              ) : (
                <p className="text-[11px] text-center text-red-500 font-medium">
                  Wallet is at capacity — you cannot add money right now
                </p>
              )}
            </div>

            {/* Load Guard Block Message */}
            {guardBlock && (
              <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg width="14" height="14" fill="none" stroke="#DC2626" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="text-sm text-red-800">{guardBlock.user_message}</p>
                </div>
                {guardBlock.suggestion && (
                  <p className="text-sm font-semibold text-red-700">{guardBlock.suggestion}</p>
                )}
                <div className="flex gap-2">
                  {guardBlock.max_allowed > 0 && (
                    <button
                      onClick={handleAddMaxInstead}
                      className="flex-1 py-2.5 px-4 rounded-lg bg-paytm-cyan text-white text-sm font-medium hover:bg-paytm-cyan/90 transition-colors"
                    >
                      Add ₹{guardBlock.max_allowed.toLocaleString('en-IN')} instead
                    </button>
                  )}
                  {guardBlock.max_allowed === 0 && guardBlock.blocked_by === 'MIN_KYC_CAP' && (
                    <button
                      onClick={() => navigate('/kyc')}
                      className="flex-1 py-2.5 px-4 rounded-lg bg-paytm-navy text-white text-sm font-medium hover:bg-paytm-navy/90 transition-colors"
                    >
                      Upgrade to Full KYC
                    </button>
                  )}
                </div>
              </div>
            )}

            <Button fullWidth disabled={paise <= 0 || isValidating} loading={isValidating} onClick={handleContinue}>
              {isValidating ? 'Checking limits...' : 'Continue'}
            </Button>
          </>
        )}

        {step === 'method' && (
          <>
            {/* Amount Summary */}
            <Card className="bg-gradient-to-r from-paytm-navy to-[#004A8F] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/70">Adding to Wallet</p>
                  <p className="text-2xl font-bold mt-0.5">{formatPaise(String(paise))}</p>
                </div>
                <button onClick={() => { setStep('amount'); setGuardBlock(null); }} className="text-xs text-white/80 underline">Change</button>
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
