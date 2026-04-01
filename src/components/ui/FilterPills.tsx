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
              ? 'bg-paytm-navy text-white border-paytm-navy'
              : 'bg-white text-paytm-text border-gray-200 hover:border-paytm-navy/30'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
