import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { mockGetSubWalletDetail, type SubWallet } from '../api/mock';
import { formatPaise } from '../utils/format';

export function SubWalletDetailPage() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<SubWallet | null>(null);

  useEffect(() => {
    if (type) {
      const sw = mockGetSubWalletDetail(decodeURIComponent(type));
      setWallet(sw);
    }
  }, [type]);

  if (!wallet) {
    return (
      <div className="page-enter">
        <Header showBack title="Sub-Wallet" />
        <div className="px-4 pt-12 text-center">
          <p className="text-paytm-muted">Sub-wallet not found</p>
        </div>
      </div>
    );
  }

  const isExpired = wallet.type === 'GIFT' && wallet.expiry_date && new Date(wallet.expiry_date) < new Date();
  const expiryStr = wallet.expiry_date
    ? new Date(wallet.expiry_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="page-enter">
      <Header showBack title={`${wallet.icon} ${wallet.label} Wallet`} />

      <div className="px-4 pt-4 space-y-4 pb-24">
        {/* Balance Card */}
        <Card className="!p-0 overflow-hidden">
          <div className="p-5 text-center" style={{ background: `linear-gradient(135deg, ${wallet.color}15, ${wallet.color}05)` }}>
            <span className="text-4xl">{wallet.icon}</span>
            <p className="text-3xl font-bold mt-2" style={{ color: wallet.color }}>
              {formatPaise(String(wallet.balance_paise))}
            </p>
            <p className="text-xs text-paytm-muted mt-1">{wallet.label} Wallet Balance</p>

            {isExpired && (
              <div className="mt-3 inline-block bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full">
                Expired
              </div>
            )}

            {wallet.type === 'GIFT' && !isExpired && expiryStr && (
              <p className="text-[10px] text-paytm-muted mt-2">
                Expires: {expiryStr}
              </p>
            )}
          </div>

          {/* Monthly limit progress */}
          {wallet.monthly_limit_paise > 0 && (
            <div className="px-5 py-3 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-paytm-muted mb-1.5">
                <span>Monthly Loaded</span>
                <span>{formatPaise(String(wallet.monthly_loaded_paise))} / {formatPaise(String(wallet.monthly_limit_paise))}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (wallet.monthly_loaded_paise / wallet.monthly_limit_paise) * 100)}%`,
                    backgroundColor: wallet.color,
                  }}
                />
              </div>
            </div>
          )}

          {/* Loaded by */}
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-paytm-muted">Loaded by</span>
            <span className="text-xs font-medium text-paytm-text">{wallet.loaded_by === 'employer_001' ? 'Paytm' : wallet.loaded_by}</span>
          </div>
        </Card>

        {/* Where can I use this? */}
        <Card>
          <p className="text-xs font-semibold text-paytm-text mb-3">Where can I use this?</p>
          <div className="flex flex-wrap gap-2">
            {wallet.eligible_categories.map(cat => (
              <span key={cat} className="text-[10px] px-2.5 py-1 rounded-full font-medium"
                style={{ backgroundColor: `${wallet.color}15`, color: wallet.color }}>
                {cat}
              </span>
            ))}
          </div>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <p className="text-xs font-semibold text-paytm-text mb-3">Recent Transactions</p>
          {wallet.transactions.length === 0 ? (
            <p className="text-xs text-paytm-muted text-center py-4">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {wallet.transactions.slice(0, 10).map(txn => (
                <div key={txn.txn_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      txn.type === 'credit' ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      {txn.type === 'credit' ? '↓' : '↑'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-paytm-text truncate">{txn.merchant}</p>
                      <p className="text-[10px] text-paytm-muted truncate">{txn.description}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className={`text-xs font-semibold ${txn.type === 'credit' ? 'text-green-600' : 'text-paytm-text'}`}>
                      {txn.type === 'credit' ? '+' : '-'}{formatPaise(String(txn.amount_paise))}
                    </p>
                    <p className="text-[9px] text-paytm-muted">
                      {new Date(txn.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Ask AI */}
        <button
          onClick={() => navigate('/?ai=' + encodeURIComponent(`How much ${wallet.label} wallet balance do I have and where can I use it?`))}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-transform active:scale-[0.98]"
          style={{ backgroundColor: wallet.color }}
        >
          Ask AI about my {wallet.label} wallet
        </button>
      </div>
    </div>
  );
}
