import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { Button } from '../components/ui/Button';
import { OtpInput } from '../components/ui/OtpInput';
import { v4 as uuidv4 } from 'uuid';

export function LoginPage() {
  const [step, setStep] = useState<'phone' | 'otp' | 'setup'>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [walletId, setWalletId] = useState(uuidv4());
  const [otpError, setOtpError] = useState('');
  const login = useAuthStore(s => s.login);
  const navigate = useNavigate();

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length === 10) setStep('otp');
  };

  const handleOtpComplete = (otp: string) => {
    if (otp.length === 6) {
      setOtpError('');
      setStep('setup');
    }
  };

  const handleSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && walletId.trim()) {
      login(phone, name.trim(), walletId.trim(), `user-${phone}`);
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-paytm-navy to-[#004A8F] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-[380px]">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#002E6E" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
              <line x1="12" y1="12" x2="12" y2="16" /><line x1="10" y1="14" x2="14" y2="14" />
            </svg>
          </div>
          <h1 className="text-white text-3xl font-bold">Paytm</h1>
          <p className="text-white/60 text-sm mt-1">PPI Wallet</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-2xl">
          {step === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-paytm-text">Welcome</h2>
                <p className="text-sm text-paytm-muted mt-1">Enter your mobile number to get started</p>
              </div>
              <div className="flex items-center gap-3 border-2 border-gray-200 rounded-xl px-4 py-3 focus-within:border-paytm-navy transition-colors">
                <span className="text-paytm-muted font-medium">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="Mobile number"
                  className="flex-1 outline-none text-base font-medium text-paytm-text placeholder:text-gray-300"
                  autoFocus
                />
              </div>
              <Button type="submit" fullWidth disabled={phone.length !== 10}>Get OTP</Button>
            </form>
          )}

          {step === 'otp' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-paytm-text">Verify OTP</h2>
                <p className="text-sm text-paytm-muted mt-1">Enter the 6-digit code sent to +91 {phone}</p>
              </div>
              <OtpInput onComplete={handleOtpComplete} error={otpError} />
              <p className="text-xs text-center text-paytm-muted">For demo: enter any 6 digits</p>
              <button onClick={() => setStep('phone')} className="text-sm text-paytm-cyan font-medium w-full text-center">
                Change number
              </button>
            </div>
          )}

          {step === 'setup' && (
            <form onSubmit={handleSetup} className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-paytm-text">Setup Profile</h2>
                <p className="text-sm text-paytm-muted mt-1">Enter your details to continue</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-paytm-muted mb-1 block">Full Name</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Gaurav Sheth"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-paytm-navy transition-colors text-paytm-text"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-paytm-muted mb-1 block">Wallet ID</label>
                  <input
                    value={walletId}
                    onChange={e => setWalletId(e.target.value)}
                    placeholder="UUID"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-paytm-navy transition-colors text-paytm-text font-mono text-sm"
                  />
                  <p className="text-[10px] text-paytm-muted mt-1">Use an existing wallet UUID from the backend, or keep the generated one for demo</p>
                </div>
              </div>
              <Button type="submit" fullWidth disabled={!name.trim() || !walletId.trim()}>Continue</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
