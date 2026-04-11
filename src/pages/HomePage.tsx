import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { WalletStrip } from '../components/wallet/WalletStrip';
import { SubWalletCards } from '../components/wallet/SubWalletCards';
import { AiSummaryCard } from '../components/wallet/AiSummaryCard';
import { AiChatCard } from '../components/wallet/AiChatCard';
import { useAuthStore } from '../store/auth.store';
import { useNotificationsStore } from '../store/notifications.store';
import { useRewardsStore } from '../store/rewards.store';
import { ROUTES } from '../utils/constants';

const primaryActions = [
  { label: 'Scan QR', path: ROUTES.PAY, color: 'from-blue-500 to-blue-600', icon: (
    <svg width="28" height="28" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
  )},
  { label: 'Pay Anyone', path: ROUTES.SEND, color: 'from-orange-400 to-orange-500', icon: (
    <svg width="28" height="28" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round"><path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 014-4h14" /><path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 01-4 4H3" /></svg>
  )},
  { label: 'Bank Transfer', path: ROUTES.TRANSFER_BANK, color: 'from-paytm-navy to-[#004A8F]', icon: (
    <svg width="28" height="28" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round"><path d="M3 21h18" /><path d="M3 10h18" /><path d="M5 6l7-3 7 3" /><path d="M4 10v11" /><path d="M20 10v11" /><path d="M8 14v3" /><path d="M12 14v3" /><path d="M16 14v3" /></svg>
  )},
  { label: 'Balance & History', path: ROUTES.PASSBOOK, color: 'from-teal-500 to-teal-600', icon: (
    <svg width="28" height="28" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>
  )},
];

const billActions = [
  { label: 'Mobile Recharge', icon: '📱' },
  { label: 'FASTag', icon: '🚗' },
  { label: 'Electricity', icon: '💡' },
  { label: 'Loan EMI', icon: '🏦' },
];

export function HomePage() {
  const navigate = useNavigate();
  const { userName } = useAuthStore();
  const unreadCount = useNotificationsStore(s => s.unreadCount);
  const totalCashback = useRewardsStore(s => s.totalCashback);
  const scratchCardCount = useRewardsStore(s => s.scratchCards.length);

  return (
    <div className="page-enter">
      <Header
        showBranding
        rightActions={
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full hover:bg-gray-100 transition">
              <svg width="20" height="20" fill="none" stroke="#002E6E" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
            </button>
            <button onClick={() => navigate('/notifications')} className="p-2 rounded-full hover:bg-gray-100 transition relative">
              <svg width="20" height="20" fill="none" stroke="#002E6E" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 bg-paytm-red rounded-full flex items-center justify-center text-[9px] text-white font-bold px-1">
                  {unreadCount}
                </span>
              )}
            </button>
            {userName && <Avatar name={userName} size="sm" />}
          </div>
        }
      />

      <div className="px-4 pt-4 space-y-4">
        {/* Wallet Strip (UPI Lite style) */}
        <WalletStrip />

        {/* Benefits Sub-Wallets */}
        <SubWalletCards />

        {/* UPI Money Transfer */}
        <Card>
          <p className="text-xs font-semibold text-paytm-muted mb-4 tracking-wide">MONEY TRANSFER</p>
          <div className="grid grid-cols-4 gap-3">
            {primaryActions.map(a => (
              <button key={a.label} onClick={() => navigate(a.path)} className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${a.color} flex items-center justify-center shadow-md`}>
                  {a.icon}
                </div>
                <span className="text-[11px] font-medium text-paytm-text text-center leading-tight">{a.label}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Recharge & Bills */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <p className="text-xs font-semibold text-paytm-muted tracking-wide">RECHARGE & BILLS</p>
            <button onClick={() => navigate(ROUTES.BILL_PAY)} className="text-xs font-semibold text-paytm-cyan">View More</button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {billActions.map(a => (
              <button key={a.label} onClick={() => navigate(ROUTES.BILL_PAY)} className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-xl">{a.icon}</div>
                <span className="text-[11px] font-medium text-paytm-text text-center leading-tight">{a.label}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Rewards Strip */}
        <Card className="!py-2.5 !px-4" onClick={() => navigate('/rewards')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-base">🎁</span>
                <span className="text-[11px] text-paytm-muted">Cashback:</span>
                <span className="text-[11px] font-bold text-paytm-text">₹{(totalCashback / 100).toFixed(totalCashback % 100 === 0 ? 0 : 2)}</span>
              </div>
              <div className="w-px h-4 bg-paytm-border" />
              <div className="flex items-center gap-1.5">
                <span className="text-base">🎰</span>
                <span className="text-[11px] text-paytm-muted">Cards:</span>
                <span className="text-[11px] font-bold text-paytm-text">{scratchCardCount}</span>
              </div>
            </div>
            <svg width="14" height="14" fill="none" stroke="#707070" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
          </div>
        </Card>

        {/* AI Chat Assistant */}
        <AiChatCard />

        {/* AI Spending Insights */}
        <AiSummaryCard />

        {/* Promo Banner */}
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-sm">Get up to ₹200 Cashback</p>
              <p className="text-xs text-white/70 mt-1">On your first wallet transaction</p>
            </div>
            <button className="bg-white text-blue-600 px-4 py-2 rounded-full text-xs font-bold">Claim Now</button>
          </div>
        </Card>
      </div>
    </div>
  );
}
