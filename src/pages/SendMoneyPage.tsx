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

export function SendMoneyPage() {
  const navigate = useNavigate();
  const { walletId } = useAuthStore();
  const { availablePaise, kycTier } = useBalance(walletId);
  const { execute, isLoading, result, error, reset } = useTransaction();
  const [beneficiaryId, setBeneficiaryId] = useState('');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'input' | 'result'>('input');

  const paise = rupeesToPaise(amount);

  // P2P requires FULL KYC
  if (kycTier === 'MINIMUM') {
    return (
      <div className="page-enter">
        <Header showBack title="Send Money" />
        <div className="px-4 pt-16 text-center space-y-6">
          <div className="w-20 h-20 bg-orange-50 rounded-full mx-auto flex items-center justify-center">
            <svg width="40" height="40" fill="none" stroke="#FF9800" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" /></svg>
          </div>
          <div>
            <p className="text-xl font-bold text-paytm-text">Full KYC Required</p>
            <p className="text-sm text-paytm-muted mt-2">P2P money transfers require Full KYC verification as per RBI guidelines.</p>
          </div>
          <Button fullWidth onClick={() => navigate(ROUTES.KYC)}>Upgrade KYC</Button>
          <Button fullWidth variant="ghost" onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  const handleSend = async () => {
    if (!walletId || !beneficiaryId.trim() || paise <= 0) return;
    try {
      await execute(() => sagaApi.p2pTransfer(walletId, beneficiaryId.trim(), paise));
      setStep('result');
    } catch {
      setStep('result');
    }
  };

  if (step === 'result') {
    const success = result?.status === 'COMPLETED';
    return (
      <div className="page-enter">
        <Header showBack title="Send Money" />
        <div className="px-4 pt-12 text-center space-y-6">
          <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${success ? 'bg-green-50' : 'bg-red-50'}`}>
            {success ? (
              <svg width="40" height="40" fill="none" stroke="#4CAF50" strokeWidth="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            ) : (
              <svg width="40" height="40" fill="none" stroke="#E53935" strokeWidth="3" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
            )}
          </div>
          <div>
            <p className="text-xl font-bold">{success ? 'Money Sent!' : 'Transfer Failed'}</p>
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
      <Header showBack title="Send Money" />
      <div className="px-4 pt-6 space-y-6">
        <div>
          <label className="text-xs font-medium text-paytm-muted mb-1 block">Beneficiary Wallet ID</label>
          <input
            value={beneficiaryId}
            onChange={e => setBeneficiaryId(e.target.value)}
            placeholder="Enter wallet UUID"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-paytm-navy transition-colors font-mono text-sm"
          />
        </div>
        <AmountInput value={amount} onChange={setAmount} label="Amount" />
        <Card className="!p-3 bg-gray-50">
          <div className="flex justify-between text-xs">
            <span className="text-paytm-muted">Available Balance</span>
            <span className="font-semibold">{formatPaise(availablePaise)}</span>
          </div>
        </Card>
        <Button fullWidth loading={isLoading} disabled={!beneficiaryId.trim() || paise <= 0} onClick={handleSend}>
          Send {paise > 0 ? formatPaise(String(paise)) : ''}
        </Button>
      </div>
    </div>
  );
}
