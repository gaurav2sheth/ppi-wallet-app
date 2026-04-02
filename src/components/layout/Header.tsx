import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showBranding?: boolean;
  rightActions?: React.ReactNode;
  variant?: 'white' | 'gradient';
}

export function Header({ title, showBack, showBranding, rightActions, variant = 'white' }: HeaderProps) {
  const navigate = useNavigate();
  const isGradient = variant === 'gradient';

  return (
    <header className={cn(
      'sticky top-0 z-40 h-14 flex items-center justify-between px-4 shrink-0',
      isGradient
        ? 'bg-gradient-to-r from-paytm-navy to-[#004A8F] text-white'
        : 'bg-white border-b border-paytm-border/50 text-paytm-text'
    )}>
      <div className="flex items-center gap-3">
        {showBack && (
          <button onClick={() => navigate(-1)} className={cn(
            'p-1.5 -ml-1 rounded-full transition',
            isGradient ? 'hover:bg-white/10' : 'hover:bg-gray-100'
          )}>
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}
        {showBranding && (
          <div className="flex items-center gap-2">
            <svg width="28" height="20" viewBox="0 0 28 20" fill="none">
              <rect width="28" height="20" rx="4" fill={isGradient ? 'white' : '#002E6E'} />
              <text x="14" y="14" textAnchor="middle" fontSize="10" fontWeight="800" fill={isGradient ? '#002E6E' : 'white'} fontFamily="Inter, sans-serif">P</text>
            </svg>
            <span className={cn('font-bold text-[17px] tracking-tight', isGradient ? 'text-white' : 'text-paytm-navy')}>Paytm</span>
          </div>
        )}
        {title && <h1 className="font-semibold text-[15px]">{title}</h1>}
      </div>
      <div className="flex items-center gap-1">
        {rightActions}
      </div>
    </header>
  );
}
