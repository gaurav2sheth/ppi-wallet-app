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
      isGradient ? 'bg-gradient-to-r from-paytm-navy to-[#00508F] text-white' : 'bg-white border-b border-gray-100 text-paytm-text'
    )}>
      <div className="flex items-center gap-3">
        {showBack && (
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 rounded-full hover:bg-white/10 transition">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}
        {showBranding && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-paytm-navy rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
              </svg>
            </div>
            <span className={cn('font-bold text-lg', isGradient ? 'text-white' : 'text-paytm-navy')}>Paytm</span>
          </div>
        )}
        {title && <h1 className="font-semibold text-base">{title}</h1>}
      </div>
      <div className="flex items-center gap-2">
        {rightActions}
      </div>
    </header>
  );
}
