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
              ? 'bg-primary-cyan text-white border-primary-cyan'
              : 'bg-white text-primary-text border-primary-border hover:border-primary-cyan/40'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
