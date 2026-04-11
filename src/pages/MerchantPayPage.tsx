import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AmountInput } from '../components/ui/AmountInput';
import { useAuthStore } from '../store/auth.store';
import { useBalance } from '../hooks/useBalance';
import { useTransaction } from '../hooks/useTransaction';
import { usePayeesStore } from '../store/payees.store';
import { PinModal } from '../components/ui/PinModal';
import { RecentPayees } from '../components/wallet/RecentPayees';
import { sagaApi } from '../api/saga.api';
import { formatPaise, rupeesToPaise } from '../utils/format';
import { ROUTES } from '../utils/constants';
import { mockFindBestSubWallet } from '../api/mock';
import { getMccCategory } from '../utils/mcc';

export function MerchantPayPage() {
  const navigate = useNavigate();
  const { walletId } = useAuthStore();
  const { availablePaise } = useBalance(walletId);
  const { executeWithPin, onPinVerified, cancelPin, isPinPending, isLoading, result, error, reset } = useTransaction();
  const addPayee = usePayeesStore(s => s.addPayee);
  const [merchantId, setMerchantId] = useState('');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'input' | 'result'>('input');
  const [, setUseSubWallet] = useState(false);

  const paise = rupeesToPaise(amount);

  // Auto-detect merchant category & suggest sub-wallet
  const merchantCategory = merchantId ? getMccCategory('MERCHANT_PAY', merchantId, 'DEBIT').label : '';
  const detectedWallet = merchantId ? mockFindBestSubWallet(merchantCategory) : null;

  const handlePay = () => {
    if (!walletId || !merchantId.trim() || paise <= 0) return;
    executeWithPin(() => sagaApi.merchantPay(walletId, merchantId.trim(), paise));
  };

  const handlePinVerified = async () => {
    try {
      await onPinVerified();
      addPayee({ id: merchantId.trim(), name: merchantId.trim(), type: 'merchant', detail: merchantId.trim() });
      setStep('result');
    } catch {
      setStep('result');
    }
  };

  if (step === 'result') {
    const success = result?.status === 'COMPLETED';
    return (
      <div className="page-enter">
        <Header showBack title="Merchant Payment" />
        <div className="px-4 pt-12 text-center space-y-6">
          <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${success ? 'bg-green-50' : 'bg-red-50'}`}>
            {success ? (
              <svg width="40" height="40" fill="none" stroke="#4CAF50" strokeWidth="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            ) : (
              <svg width="40" height="40" fill="none" stroke="#E53935" strokeWidth="3" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
            )}
          </div>
          <div>
            <p className="text-xl font-bold">{success ? 'Payment Successful!' : 'Payment Failed'}</p>
            <p className="text-2xl font-bold mt-2">{formatPaise(String(paise))}</p>
            <p className="text-sm text-paytm-muted mt-1">to {merchantId}</p>
            {!success && <p className="text-sm text-paytm-red mt-2">{error?.message ?? result?.error}</p>}
          </div>
          <div className="space-y-3">
            <Button fullWidth onClick={() => navigate(ROUTES.HOME)}>Done</Button>
            {!success && <Button fullWidth variant="outline" onClick={() => { reset(); setStep('input'); }}>Retry</Button>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter">
      <PinModal isOpen={isPinPending} onVerified={handlePinVerified} onCancel={cancelPin} title="Authorize Payment" />
      <Header showBack title="Pay Merchant" />
      <div className="px-4 pt-6 space-y-6">
        {/* QR Placeholder */}
        <Card className="text-center py-8">
          <div className="w-24 h-24 mx-auto border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center mb-3">
            <svg width="40" height="40" fill="none" stroke="#8b949e" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
          </div>
          <p className="text-sm text-paytm-muted">Scan QR Code</p>
          <p className="text-xs text-paytm-muted mt-1">Camera not available in web preview</p>
        </Card>

        {/* Recent Merchants */}
        <RecentPayees type="merchant" onSelect={(p) => setMerchantId(p.detail)} />

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" /><span className="text-xs text-paytm-muted">Or pay using details</span><div className="flex-1 h-px bg-gray-200" />
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-paytm-muted mb-1 block">Merchant ID</label>
            <input
              value={merchantId}
              onChange={e => setMerchantId(e.target.value)}
              placeholder="Enter merchant ID"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-paytm-navy transition-colors"
            />
          </div>
          <AmountInput value={amount} onChange={setAmount} label="Amount" presets={[50, 100, 200, 500]} />
          <Card className="!p-3 bg-gray-50">
            <div className="flex justify-between text-xs">
              <span className="text-paytm-muted">Available Balance</span>
              <span className="font-semibold text-paytm-text">{formatPaise(availablePaise)}</span>
            </div>
          </Card>

          {/* Sub-wallet suggestion */}
          {detectedWallet && paise > 0 && merchantCategory && (
            <div
              className="p-3 rounded-xl border-2"
              style={{ borderColor: detectedWallet.color + '40', backgroundColor: detectedWallet.color + '08' }}
            >
              <p className="text-[10px] text-paytm-muted mb-1.5">
                Merchant: {merchantId} ({merchantCategory})
              </p>
              {detectedWallet.balance_paise >= paise ? (
                <>
                  <p className="text-xs font-medium text-paytm-text">
                    Use your {detectedWallet.icon} {detectedWallet.label} Wallet ({formatPaise(String(detectedWallet.balance_paise))} available)?
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setUseSubWallet(true)}
                      className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold text-white"
                      style={{ backgroundColor: detectedWallet.color }}
                    >
                      Use {detectedWallet.label} Wallet
                    </button>
                    <button
                      onClick={() => setUseSubWallet(false)}
                      className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold border border-gray-300 text-paytm-text"
                    >
                      Use Main Wallet
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-xs font-medium text-paytm-text">
                  {detectedWallet.icon} {detectedWallet.label}: {formatPaise(String(detectedWallet.balance_paise))} + Main: {formatPaise(String(paise - detectedWallet.balance_paise))} = {formatPaise(String(paise))} ✓
                </p>
              )}
            </div>
          )}

          <Button fullWidth loading={isLoading} disabled={!merchantId.trim() || paise <= 0} onClick={handlePay}>
            Pay {paise > 0 ? formatPaise(String(paise)) : ''}
          </Button>
        </div>
      </div>
    </div>
  );
}
