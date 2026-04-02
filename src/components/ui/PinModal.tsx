import { useState } from 'react';
import { OtpInput } from './OtpInput';
import { Button } from './Button';
import { usePinStore } from '../../store/pin.store';

interface PinModalProps {
  isOpen: boolean;
  onVerified: () => void;
  onCancel: () => void;
  title?: string;
}

export function PinModal({ isOpen, onVerified, onCancel, title }: PinModalProps) {
  const { isSet, setPin, verify } = usePinStore();
  const [error, setError] = useState('');
  const [step, setStep] = useState<'enter' | 'setup' | 'confirm'>(!isSet ? 'setup' : 'enter');
  const [newPin, setNewPin] = useState('');

  if (!isOpen) return null;

  const handleComplete = (pin: string) => {
    if (step === 'setup') {
      setNewPin(pin);
      setStep('confirm');
      setError('');
      return;
    }
    if (step === 'confirm') {
      if (pin === newPin) {
        setPin(pin);
        setError('');
        onVerified();
      } else {
        setError('PINs do not match. Try again.');
        setStep('setup');
        setNewPin('');
      }
      return;
    }
    // step === 'enter'
    if (verify(pin)) {
      setError('');
      onVerified();
    } else {
      setError('Incorrect PIN. Try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 animate-[fadeIn_0.15s_ease-out]">
      <div className="bg-white rounded-t-3xl w-full max-w-[430px] p-6 pb-8 animate-[slideUp_0.2s_ease-out]">
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-5" />

        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-paytm-navy/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" fill="none" stroke="#002E6E" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
          </div>
          <p className="text-base font-bold text-paytm-text">
            {step === 'setup' ? 'Set Transaction PIN' : step === 'confirm' ? 'Confirm PIN' : (title ?? 'Enter Transaction PIN')}
          </p>
          <p className="text-xs text-paytm-muted mt-1">
            {step === 'setup' ? 'Create a 4-digit PIN to secure your payments'
              : step === 'confirm' ? 'Re-enter your PIN to confirm'
              : 'Enter your 4-digit PIN to authorize'}
          </p>
        </div>

        <OtpInput length={4} onComplete={handleComplete} error={error} key={step + error} />

        <div className="mt-5">
          <Button fullWidth variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        </div>
      </div>

      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </div>
  );
}
