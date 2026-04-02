import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import { cn } from '../../utils/cn';

const tabs = [
  { path: ROUTES.HOME, label: 'Home', icon: (active: boolean) => (
    <svg width="22" height="22" fill={active ? '#00B9F1' : 'none'} stroke={active ? '#00B9F1' : '#707070'} strokeWidth="2" viewBox="0 0 24 24" strokeLinejoin="round" strokeLinecap="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    </svg>
  )},
  { path: ROUTES.PAY, label: 'Scan & Pay', icon: (active: boolean) => (
    <svg width="22" height="22" fill="none" stroke={active ? '#00B9F1' : '#707070'} strokeWidth="2" viewBox="0 0 24 24" strokeLinejoin="round" strokeLinecap="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  )},
  { path: ROUTES.PASSBOOK, label: 'Passbook', icon: (active: boolean) => (
    <svg width="22" height="22" fill={active ? '#00B9F1' : 'none'} stroke={active ? '#00B9F1' : '#707070'} strokeWidth="2" viewBox="0 0 24 24" strokeLinejoin="round" strokeLinecap="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  )},
  { path: ROUTES.PROFILE, label: 'Profile', icon: (active: boolean) => (
    <svg width="22" height="22" fill={active ? '#00B9F1' : 'none'} stroke={active ? '#00B9F1' : '#707070'} strokeWidth="2" viewBox="0 0 24 24" strokeLinejoin="round" strokeLinecap="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  )},
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-paytm-border/50 z-50">
      <div className="flex items-center justify-around h-14 px-2">
        {tabs.map(tab => {
          const active = tab.path === '/' ? location.pathname === '/' : location.pathname.startsWith(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center gap-0.5 py-1.5 px-4 transition-colors"
            >
              {tab.icon(active)}
              <span className={cn('text-[10px] font-medium', active ? 'text-paytm-cyan' : 'text-paytm-muted')}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
