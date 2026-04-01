import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import { cn } from '../../utils/cn';

const tabs = [
  { path: ROUTES.HOME, label: 'Home', icon: (active: boolean) => (
    <svg width="24" height="24" fill={active ? '#003D82' : 'none'} stroke={active ? '#003D82' : '#8b949e'} strokeWidth="2" viewBox="0 0 24 24">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )},
  { path: ROUTES.PAY, label: 'Scan & Pay', icon: (active: boolean) => (
    <svg width="24" height="24" fill="none" stroke={active ? '#003D82' : '#8b949e'} strokeWidth="2" viewBox="0 0 24 24" strokeLinejoin="round" strokeLinecap="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  )},
  { path: ROUTES.PASSBOOK, label: 'Passbook', icon: (active: boolean) => (
    <svg width="24" height="24" fill={active ? '#003D82' : 'none'} stroke={active ? '#003D82' : '#8b949e'} strokeWidth="2" viewBox="0 0 24 24" strokeLinejoin="round" strokeLinecap="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  )},
  { path: ROUTES.PROFILE, label: 'Profile', icon: (active: boolean) => (
    <svg width="24" height="24" fill={active ? '#003D82' : 'none'} stroke={active ? '#003D82' : '#8b949e'} strokeWidth="2" viewBox="0 0 24 24" strokeLinejoin="round" strokeLinecap="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  )},
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-100 z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map(tab => {
          const active = tab.path === '/' ? location.pathname === '/' : location.pathname.startsWith(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn('flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors', active && 'text-paytm-navy')}
            >
              {tab.icon(active)}
              <span className={cn('text-[10px] font-medium', active ? 'text-paytm-navy' : 'text-paytm-muted')}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
