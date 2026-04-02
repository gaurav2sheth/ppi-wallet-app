import { Avatar } from '../ui/Avatar';
import { usePayeesStore, type Payee } from '../../store/payees.store';
import { truncateId } from '../../utils/format';

interface RecentPayeesProps {
  type: Payee['type'];
  onSelect: (payee: Payee) => void;
}

export function RecentPayees({ type, onSelect }: RecentPayeesProps) {
  const recent = usePayeesStore(s => s.getRecent(type));

  if (recent.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-semibold text-paytm-muted mb-2 tracking-wide">RECENT</p>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {recent.slice(0, 6).map(p => (
          <button
            key={`${p.type}-${p.id}`}
            onClick={() => onSelect(p)}
            className="flex flex-col items-center gap-1.5 min-w-[60px] active:scale-95 transition-transform"
          >
            <Avatar name={p.name} size="md" />
            <span className="text-[10px] font-medium text-paytm-text text-center leading-tight w-16 truncate">
              {p.name}
            </span>
            <span className="text-[8px] text-paytm-muted font-mono truncate w-16 text-center">
              {truncateId(p.detail, 8)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
