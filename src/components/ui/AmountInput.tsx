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
      {label && <p className="text-sm text-primary-muted font-medium">{label}</p>}
      <div className="flex items-center gap-2 border-b-2 border-primary-border focus-within:border-primary-cyan pb-2 transition-colors">
        <span className="text-2xl text-primary-muted font-light">₹</span>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          placeholder="0"
          className="flex-1 text-3xl font-bold text-primary-text outline-none bg-transparent placeholder:text-gray-300"
        />
      </div>
      {error && <p className="text-sm text-primary-red">{error}</p>}
      <div className="flex gap-2 flex-wrap">
        {presets.map(p => (
          <button
            key={p}
            onClick={() => onChange(p.toString())}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium border transition-colors',
              value === p.toString()
                ? 'bg-primary-cyan-light border-primary-cyan text-primary-cyan'
                : 'border-primary-border text-primary-text hover:border-primary-cyan/40'
            )}
          >
            ₹{p.toLocaleString('en-IN')}
          </button>
        ))}
      </div>
    </div>
  );
}
