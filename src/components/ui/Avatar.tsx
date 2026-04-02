import { getInitials } from '../../utils/format';
import { hashColor } from '../../utils/constants';
import type { MccCategory } from '../../utils/mcc';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  mcc?: MccCategory;
}

const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-16 h-16 text-xl' };
const mccSizes = { sm: 'text-sm', md: 'text-lg', lg: 'text-2xl' };

export function Avatar({ name, size = 'md', icon, mcc }: AvatarProps) {
  // MCC-based icon rendering
  if (mcc) {
    return (
      <div className={`${sizes[size]} rounded-full flex items-center justify-center shrink-0 ${mcc.bgColor}`}>
        <span className={mccSizes[size]}>{mcc.icon}</span>
      </div>
    );
  }

  const bg = hashColor(name);
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white shrink-0`}
      style={{ backgroundColor: bg }}
    >
      {icon ?? getInitials(name)}
    </div>
  );
}
