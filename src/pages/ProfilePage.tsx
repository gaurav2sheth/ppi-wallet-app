import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/auth.store';
import { useBalance } from '../hooks/useBalance';
import { formatPaise, truncateId } from '../utils/format';
import { ROUTES } from '../utils/constants';

const menuItems = [
  { label: 'KYC Status', path: ROUTES.KYC, icon: '🛡️' },
  { label: 'Transaction History', path: ROUTES.PASSBOOK, icon: '📋' },
  { label: 'Wallet Details', path: ROUTES.WALLET, icon: '💳' },
  { label: 'Help & Support', path: null, icon: '💬' },
  { label: 'About', path: null, icon: 'ℹ️' },
];

export function ProfilePage() {
  const navigate = useNavigate();
  const { userName, phone, walletId, userId, logout } = useAuthStore();
  const { availablePaise, kycTier } = useBalance(walletId);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="page-enter">
      <Header title="Profile" />
      <div className="px-4 pt-6 space-y-4">
        {/* User Info */}
        <Card className="text-center py-6">
          <div className="flex justify-center mb-3">
            <Avatar name={userName ?? 'User'} size="lg" />
          </div>
          <p className="text-lg font-bold text-paytm-text">{userName ?? 'User'}</p>
          <p className="text-sm text-paytm-muted">+91 {phone ?? '...'}</p>
        </Card>

        {/* Wallet Info */}
        <Card>
          <p className="text-xs font-semibold text-paytm-muted mb-3 tracking-wide">WALLET INFO</p>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-paytm-muted">Wallet ID</span>
              <span className="font-mono text-xs text-paytm-text">{truncateId(walletId ?? '', 16)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-paytm-muted">User ID</span>
              <span className="font-mono text-xs text-paytm-text">{truncateId(userId ?? '', 16)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-paytm-muted">Balance</span>
              <span className="font-bold text-paytm-text">{formatPaise(availablePaise)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-paytm-muted">KYC Tier</span>
              <span className={`font-semibold text-xs px-2 py-0.5 rounded-full ${
                kycTier === 'FULL' ? 'bg-green-50 text-paytm-green' : 'bg-orange-50 text-paytm-orange'
              }`}>
                {kycTier === 'FULL' ? 'Full KYC' : kycTier === 'MINIMUM' ? 'Min KYC' : '...'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-paytm-muted">Status</span>
              <span className="text-paytm-green font-medium">Active</span>
            </div>
          </div>
        </Card>

        {/* Menu */}
        <Card className="!p-0 divide-y divide-gray-50">
          {menuItems.map(item => (
            <button
              key={item.label}
              onClick={() => item.path && navigate(item.path)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition active:bg-gray-100"
            >
              <span className="text-lg">{item.icon}</span>
              <span className="flex-1 text-sm font-medium text-paytm-text text-left">{item.label}</span>
              <svg width="16" height="16" fill="none" stroke="#8b949e" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          ))}
        </Card>

        {/* Logout */}
        <Button fullWidth variant="danger" onClick={handleLogout}>Logout</Button>

        <p className="text-center text-[10px] text-paytm-muted pb-4">Paytm PPI Wallet v1.0.0</p>
      </div>
    </div>
  );
}
