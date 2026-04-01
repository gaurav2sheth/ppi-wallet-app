import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { StatusBanner } from '../components/ui/StatusBanner';
import { useAuthStore } from '../store/auth.store';
import { useBalance } from '../hooks/useBalance';
import { formatPaise } from '../utils/format';
import { ROUTES } from '../utils/constants';

const quickActions = [
  { label: 'Pay', path: ROUTES.PAY, icon: (
    <svg width="24" height="24" fill="none" stroke="#003D82" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
  )},
  { label: 'Transfer to Bank', path: ROUTES.TRANSFER_BANK, icon: (
    <svg width="24" height="24" fill="none" stroke="#003D82" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round"><path d="M3 21h18M3 10h18M5 6l7-3 7 3" /><path d="M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" /></svg>
  )},
  { label: 'FASTag', path: ROUTES.BILL_PAY, icon: (
    <svg width="24" height="24" fill="none" stroke="#003D82" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" /></svg>
  )},
  { label: 'Passbook', path: ROUTES.PASSBOOK, icon: (
    <svg width="24" height="24" fill="none" stroke="#003D82" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>
  )},
];

export function WalletOverviewPage() {
  const navigate = useNavigate();
  const { walletId, userName } = useAuthStore();
  const { availablePaise, kycTier, isLoading } = useBalance(walletId);

  return (
    <div className="page-enter">
      <Header
        showBack
        showBranding
        variant="gradient"
        rightActions={
          <div className="flex gap-3">
            <button className="text-xs text-white/80 font-medium">Help</button>
            <button className="text-xs text-white/80 font-medium" onClick={() => navigate(ROUTES.PROFILE)}>Settings</button>
          </div>
        }
      />
      <div className="px-4 pt-4 space-y-4">
        <StatusBanner variant="info" title="Important Update">
          As per RBI directive, wallet balance can be used for payments and transfers. Upgrade your KYC for higher transaction limits.
        </StatusBanner>

        {/* Balance Card */}
        <Card className="text-center" onClick={() => navigate(ROUTES.WALLET_DETAIL)}>
          <p className="text-xs text-paytm-muted font-medium">Total Wallet Balance</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <svg width="20" height="20" fill="none" stroke="#003D82" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
            </svg>
            <span className="text-4xl font-bold text-paytm-text">
              {isLoading ? <span className="inline-block w-36 h-10 bg-gray-100 rounded animate-pulse" /> : formatPaise(availablePaise)}
            </span>
            <svg width="16" height="16" fill="none" stroke="#8b949e" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
          </div>
          {kycTier && (
            <span className={`inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full ${
              kycTier === 'FULL' ? 'bg-green-50 text-paytm-green' : 'bg-orange-50 text-paytm-orange'
            }`}>
              {kycTier === 'FULL' ? 'Full KYC Verified' : 'Minimum KYC'}
            </span>
          )}
        </Card>

        {/* Quick Actions */}
        <Card>
          <div className="grid grid-cols-4 gap-2">
            {quickActions.map(a => (
              <button key={a.label} onClick={() => navigate(a.path)} className="flex flex-col items-center gap-2 py-2 active:scale-95 transition-transform">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                  {a.icon}
                </div>
                <span className="text-[11px] font-medium text-paytm-text text-center leading-tight">{a.label}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Customer Rights Card */}
        <Card className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-paytm-navy/10 rounded-full flex items-center justify-center shrink-0 mt-1">
              <svg width="20" height="20" fill="none" stroke="#003D82" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm text-paytm-text">Charter of Customer Rights</p>
              <p className="text-xs text-paytm-muted mt-1">Your Rights. Our Promise.</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {['Fair Treatment', 'Transparency', 'Grievance Redress'].map(r => (
                  <span key={r} className="text-[10px] bg-white px-2 py-0.5 rounded-full text-paytm-navy font-medium">{r}</span>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Wallet Card Info */}
        <Card>
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs font-semibold text-paytm-muted tracking-wide">WALLET & NCMC CARD</p>
            <button className="text-xs font-semibold text-paytm-cyan">Manage</button>
          </div>
          <div className="bg-gradient-to-r from-paytm-navy to-[#00508F] rounded-xl p-4 text-white">
            <p className="text-[10px] text-white/60 mb-1">Card Holder</p>
            <p className="font-semibold text-sm">{userName?.toUpperCase() ?? 'WALLET USER'}</p>
            <p className="text-xs text-white/60 mt-3 font-mono tracking-widest">•••• •••• •••• {walletId?.slice(-4) ?? '0000'}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
