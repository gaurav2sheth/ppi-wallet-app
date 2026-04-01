import { useState } from 'react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { OtpInput } from '../components/ui/OtpInput';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAuthStore } from '../store/auth.store';
import { useKycStatus } from '../hooks/useKycStatus';
import { kycApi } from '../api/kyc.api';
import { v4 as uuidv4 } from 'uuid';

export function KycStatusPage() {
  const { walletId } = useAuthStore();
  const { status, isLoading, refetch } = useKycStatus(walletId);
  const [upgradeStep, setUpgradeStep] = useState<'idle' | 'form' | 'otp' | 'done'>('idle');
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [txnId] = useState(uuidv4());
  const [otpError, setOtpError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleInitiate = async () => {
    if (!walletId || !name || !dob) return;
    setSubmitting(true);
    try {
      await kycApi.initiate({ wallet_id: walletId, name, dob });
      setUpgradeStep('otp');
      if (aadhaar.length === 12) {
        await kycApi.sendAadhaarOtp({ wallet_id: walletId, aadhaar_number: aadhaar, transaction_id: txnId });
      }
    } catch { /* handled by mock */ }
    setSubmitting(false);
  };

  const handleVerifyOtp = async (otp: string) => {
    if (!walletId) return;
    setSubmitting(true);
    setOtpError('');
    try {
      await kycApi.verifyAadhaarOtp({ wallet_id: walletId, aadhaar_number: aadhaar, otp, transaction_id: txnId });
      setUpgradeStep('done');
      refetch();
    } catch {
      setOtpError('Invalid OTP. Please try again.');
    }
    setSubmitting(false);
  };

  if (isLoading) return <><Header showBack title="KYC Verification" /><LoadingSpinner /></>;

  return (
    <div className="page-enter">
      <Header showBack title="KYC Verification" />
      <div className="px-4 pt-6 space-y-4">
        {/* Current Tier */}
        <div className="text-center">
          <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold ${
            status?.kyc_tier === 'FULL' ? 'bg-green-50 text-paytm-green' : 'bg-orange-50 text-paytm-orange'
          }`}>
            {status?.kyc_tier === 'FULL' ? '✓ Full KYC Verified' : '⚠ Minimum KYC'}
          </div>
        </div>

        {/* Status Details */}
        <Card>
          <p className="text-xs font-semibold text-paytm-muted mb-3 tracking-wide">KYC DETAILS</p>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-paytm-muted">KYC State</span>
              <span className="font-medium text-paytm-text">{status?.kyc_state ?? '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-paytm-muted">Aadhaar Verified</span>
              <span className={`font-medium ${status?.aadhaar_verified ? 'text-paytm-green' : 'text-paytm-red'}`}>
                {status?.aadhaar_verified ? '✓ Yes' : '✗ No'}
              </span>
            </div>
            {status?.pan_masked && (
              <div className="flex justify-between text-sm">
                <span className="text-paytm-muted">PAN</span>
                <span className="font-mono text-paytm-text">{status.pan_masked}</span>
              </div>
            )}
            {status?.ckyc_number && (
              <div className="flex justify-between text-sm">
                <span className="text-paytm-muted">CKYC Number</span>
                <span className="font-mono text-paytm-text">{status.ckyc_number}</span>
              </div>
            )}
            {status?.wallet_expiry_date && (
              <div className="flex justify-between text-sm">
                <span className="text-paytm-muted">Wallet Expiry</span>
                <span className="text-paytm-text">{status.wallet_expiry_date}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Limits Info */}
        <Card>
          <p className="text-xs font-semibold text-paytm-muted mb-3 tracking-wide">WALLET LIMITS</p>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-paytm-muted">Max Balance</span>
                <span className="font-medium">{status?.kyc_tier === 'FULL' ? '₹2,00,000' : '₹10,000'}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-paytm-green rounded-full" style={{ width: '40%' }} />
              </div>
            </div>
            {status?.kyc_tier === 'FULL' && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-paytm-muted">Monthly P2P Cap</span>
                  <span className="font-medium">₹1,00,000</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-paytm-cyan rounded-full" style={{ width: '15%' }} />
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Upgrade Flow */}
        {status?.kyc_tier !== 'FULL' && upgradeStep === 'idle' && (
          <Button fullWidth onClick={() => setUpgradeStep('form')}>Upgrade to Full KYC</Button>
        )}

        {upgradeStep === 'form' && (
          <Card>
            <p className="text-sm font-semibold text-paytm-text mb-4">Complete Full KYC</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-paytm-muted mb-1 block">Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="As per Aadhaar"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-paytm-navy transition-colors" />
              </div>
              <div>
                <label className="text-xs text-paytm-muted mb-1 block">Date of Birth</label>
                <input type="date" value={dob} onChange={e => setDob(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-paytm-navy transition-colors" />
              </div>
              <div>
                <label className="text-xs text-paytm-muted mb-1 block">Aadhaar Number</label>
                <input value={aadhaar} onChange={e => setAadhaar(e.target.value.replace(/\D/g, ''))} maxLength={12} placeholder="12-digit Aadhaar"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-paytm-navy transition-colors" />
              </div>
              <Button fullWidth loading={submitting} disabled={!name || !dob || aadhaar.length !== 12} onClick={handleInitiate}>
                Send OTP
              </Button>
            </div>
          </Card>
        )}

        {upgradeStep === 'otp' && (
          <Card>
            <p className="text-sm font-semibold text-paytm-text mb-2">Verify Aadhaar OTP</p>
            <p className="text-xs text-paytm-muted mb-4">Enter the 6-digit OTP sent to your Aadhaar-linked mobile</p>
            <OtpInput onComplete={handleVerifyOtp} error={otpError} />
            {submitting && <LoadingSpinner size="sm" />}
            <p className="text-[10px] text-paytm-muted text-center mt-3">Demo: enter any 6 digits</p>
          </Card>
        )}

        {upgradeStep === 'done' && (
          <Card className="text-center py-6">
            <div className="w-16 h-16 bg-green-50 rounded-full mx-auto flex items-center justify-center mb-3">
              <svg width="32" height="32" fill="none" stroke="#4CAF50" strokeWidth="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <p className="text-lg font-bold text-paytm-text">KYC Upgraded!</p>
            <p className="text-sm text-paytm-muted mt-1">You now have Full KYC access</p>
          </Card>
        )}
      </div>
    </div>
  );
}
