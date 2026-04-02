import { cn } from '../../utils/cn';

interface FilterPillsProps {
  options: { label: string; value: string }[];
  selected: string;
  onSelect: (v: string) => void;
}

export function FilterPills({ options, selected, onSelect }: FilterPillsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onSelect(o.value)}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border',
            o.value === selected
              ? 'bg-paytm-cyan text-white border-paytm-cyan'
              : 'bg-white text-paytm-text border-paytm-border hover:border-paytm-cyan/40'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
