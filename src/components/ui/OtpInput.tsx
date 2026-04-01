import { useRef, useState, useEffect } from 'react';

interface OtpInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  error?: string;
}

export function OtpInput({ length = 6, onComplete, error }: OtpInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { refs.current[0]?.focus(); }, []);

  const handleChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...values];
    next[idx] = val;
    setValues(next);
    if (val && idx < length - 1) refs.current[idx + 1]?.focus();
    if (next.every(v => v)) onComplete(next.join(''));
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !values[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    const next = [...values];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setValues(next);
    if (next.every(v => v)) onComplete(next.join(''));
    else refs.current[text.length]?.focus();
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-3 justify-center" onPaste={handlePaste}>
        {values.map((v, i) => (
          <input
            key={i}
            ref={el => { refs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={v}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-xl outline-none transition-colors ${
              error ? 'border-paytm-red' : v ? 'border-paytm-navy' : 'border-gray-200 focus:border-paytm-navy'
            }`}
          />
        ))}
      </div>
      {error && <p className="text-sm text-paytm-red text-center">{error}</p>}
    </div>
  );
}
