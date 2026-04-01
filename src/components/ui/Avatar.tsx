import { getInitials } from '../../utils/format';
import { hashColor } from '../../utils/constants';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-16 h-16 text-xl' };

export function Avatar({ name, size = 'md', icon }: AvatarProps) {
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
