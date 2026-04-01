import { cn } from '../../utils/cn';

interface AmountInputProps {
  value: string;
  onChange: (val: string) => void;
  presets?: number[];
  error?: string;
  label?: string;
}

export function AmountInput({ value, onChange, presets = [100, 500, 1000, 2000], error, label }: AmountInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v === '' || /^\d*\.?\d{0,2}$/.test(v)) onChange(v);
  };

  return (
    <div className="space-y-3">
      {label && <p className="text-sm text-paytm-muted font-medium">{label}</p>}
      <div className="flex items-center gap-2 border-b-2 border-gray-200 focus-within:border-paytm-navy pb-2 transition-colors">
        <span className="text-2xl text-paytm-muted font-light">₹</span>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          placeholder="0"
          className="flex-1 text-3xl font-bold text-paytm-text outline-none bg-transparent placeholder:text-gray-300"
        />
      </div>
      {error && <p className="text-sm text-paytm-red">{error}</p>}
      <div className="flex gap-2 flex-wrap">
        {presets.map(p => (
          <button
            key={p}
            onClick={() => onChange(p.toString())}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium border transition-colors',
              value === p.toString()
                ? 'bg-paytm-navy/10 border-paytm-navy text-paytm-navy'
                : 'border-gray-200 text-paytm-text hover:border-paytm-navy/30'
            )}
          >
            ₹{p.toLocaleString('en-IN')}
          </button>
        ))}
      </div>
    </div>
  );
}
