import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { useAuthStore } from '../store/auth.store';
import { useBalance } from '../hooks/useBalance';
import { useLedger } from '../hooks/useLedger';
import { formatPaise, formatTime } from '../utils/format';
import { getMccCategory } from '../utils/mcc';
import { ROUTES } from '../utils/constants';

const actionItems = [
  { label: 'Download Statement', icon: '📄', color: 'text-paytm-cyan', path: '/wallet/statement' },
  { label: 'Send Money to Bank', icon: '🏦', color: 'text-paytm-cyan', path: ROUTES.TRANSFER_BANK },
  { label: 'Add money to Wallet', icon: '➕', color: 'text-paytm-cyan', path: ROUTES.ADD_MONEY },
  { label: 'Automatic Add Money', icon: '🔄', color: 'text-paytm-cyan', path: null, badge: 'Active' },
  { label: 'View Spend Analytics', icon: '📊', color: 'text-paytm-cyan', path: '/analytics' },
];

export function WalletDetailPage() {
  const navigate = useNavigate();
  const { walletId } = useAuthStore();
  const { availablePaise } = useBalance(walletId);
  const { entries, isLoading } = useLedger(walletId, { limit: 10 });

  return (
    <div className="page-enter">
      <Header showBack title="Wallet" variant="gradient" showBranding />
      <div className="px-4 pt-6 space-y-4">
        {/* Balance */}
        <div className="text-center">
          <p className="text-sm text-paytm-muted font-medium">Wallet Balance</p>
          <p className="text-4xl font-bold text-paytm-text mt-1">{formatPaise(availablePaise)}</p>
        </div>

        {/* Actions */}
        <Card className="!p-0 divide-y divide-gray-50">
          {actionItems.map(a => (
            <button
              key={a.label}
              onClick={() => a.path && navigate(a.path)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition active:bg-gray-100"
            >
              <span className="text-lg">{a.icon}</span>
              <span className={`text-sm font-medium flex-1 text-left ${a.color}`}>{a.label}</span>
              {a.badge && (
                <span className="text-[10px] bg-green-50 text-paytm-green px-2 py-0.5 rounded-full font-semibold">{a.badge}</span>
              )}
            </button>
          ))}
        </Card>

        {/* Divider */}
        <div className="h-0.5 bg-gradient-to-r from-paytm-cyan to-blue-400 rounded-full" />

        {/* Recents */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-semibold text-paytm-text">Recents</p>
            <button onClick={() => navigate(ROUTES.PASSBOOK)} className="text-xs font-semibold text-paytm-cyan">View All</button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                  <div className="flex gap-3"><div className="w-10 h-10 bg-gray-100 rounded-full" /><div className="flex-1 space-y-2"><div className="h-4 bg-gray-100 rounded w-3/4" /><div className="h-3 bg-gray-100 rounded w-1/2" /></div></div>
                </div>
              ))}
            </div>
          ) : entries.length === 0 ? (
            <Card className="text-center">
              <p className="text-paytm-muted text-sm">No recent transactions</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {entries.map(e => {
                const isCredit = e.entry_type === 'CREDIT' || e.entry_type === 'HOLD_RELEASE';
                const mcc = getMccCategory(e.transaction_type, e.description, e.entry_type);
                return (
                  <Card key={e.id} className="!p-3">
                    <div className="flex items-start gap-3">
                      <Avatar name={e.description ?? mcc.label} size="md" mcc={mcc} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-medium text-paytm-text truncate">
                            {isCredit ? 'Received' : 'Paid'}{e.description ? ` · ${e.description}` : ''}
                          </p>
                          <p className={`text-sm font-bold shrink-0 ml-2 ${isCredit ? 'text-paytm-green' : 'text-paytm-text'}`}>
                            {isCredit ? '+' : '-'}{formatPaise(e.amount_paise)}
                          </p>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-paytm-muted">{formatTime(e.created_at)}</span>
                            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${mcc.bgColor} ${mcc.textColor}`}>{mcc.label}</span>
                          </div>
                          <span className="text-[10px] text-paytm-muted">Bal: {formatPaise(e.balance_after_paise)}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
