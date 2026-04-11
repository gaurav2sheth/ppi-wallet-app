import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AmountInput } from '../components/ui/AmountInput';
import { mockGetSubWalletDetail, mockAddMoneyToSubWallet, type SubWallet } from '../api/mock';
import { useBalance } from '../hooks/useBalance';
import { useAuthStore } from '../store/auth.store';
import { formatPaise } from '../utils/format';

const SELF_LOAD_TYPES = ['FASTAG', 'NCMC TRANSIT', 'GIFT'];

export function SubWalletDetailPage() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { walletId } = useAuthStore();
  const { availablePaise, refetch: refetchBalance } = useBalance(walletId);
  const [wallet, setWallet] = useState<SubWallet | null>(null);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [addResult, setAddResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showAllTxns, setShowAllTxns] = useState(false);

  const reloadWallet = () => {
    if (type) {
      const sw = mockGetSubWalletDetail(decodeURIComponent(type));
      setWallet(sw);
    }
  };

  useEffect(() => { reloadWallet(); }, [type]);

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

  const canSelfLoad = SELF_LOAD_TYPES.includes(wallet.type);
  const isExpired = wallet.type === 'GIFT' && wallet.expiry_date && new Date(wallet.expiry_date) < new Date();
  const expiryStr = wallet.expiry_date
    ? new Date(wallet.expiry_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  const addPaise = Math.round(Number(addAmount || '0') * 100);
  const mainBalancePaise = Number(availablePaise || '0');

  const handleAddMoney = async () => {
    if (addPaise <= 0) return;
    setIsAdding(true);
    setAddResult(null);

    // Simulate small delay
    await new Promise(r => setTimeout(r, 600));

    const result = mockAddMoneyToSubWallet(wallet.type, addPaise);
    setAddResult(result);
    setIsAdding(false);

    if (result.success) {
      setAddAmount('');
      reloadWallet();
      refetchBalance();
      setTimeout(() => {
        setShowAddMoney(false);
        setAddResult(null);
      }, 2000);
    }
  };

  const displayTxns = showAllTxns ? wallet.transactions : wallet.transactions.slice(0, 5);

  // Presets for add money based on wallet type
  const addPresets = wallet.type === 'FASTAG'
    ? [200, 500, 1000, 2000]
    : wallet.type === 'NCMC TRANSIT'
      ? [100, 200, 500, 1000]
      : [500, 1000, 2000, 5000];

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

            {/* Add Money CTA */}
            {canSelfLoad && !isExpired && (
              <button
                onClick={() => setShowAddMoney(!showAddMoney)}
                className="mt-4 inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-semibold text-white transition-transform active:scale-95"
                style={{ backgroundColor: wallet.color }}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
                Add Money
              </button>
            )}
          </div>

          {/* Add Money Panel — slides in */}
          {showAddMoney && canSelfLoad && (
            <div className="px-4 py-4 border-t border-gray-100 bg-gray-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-paytm-text">Add from Main Wallet</p>
                <p className="text-[10px] text-paytm-muted">
                  Available: {formatPaise(availablePaise)}
                </p>
              </div>

              <AmountInput value={addAmount} onChange={setAddAmount} label="Amount" presets={addPresets} />

              {/* Limit info for non-GIFT */}
              {wallet.monthly_limit_paise > 0 && (
                <p className="text-[10px] text-paytm-muted">
                  Monthly limit remaining: {formatPaise(String(Math.max(0, wallet.monthly_limit_paise - wallet.monthly_loaded_paise)))}
                </p>
              )}

              {addResult && (
                <div className={`text-xs font-medium p-2 rounded-lg text-center ${
                  addResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {addResult.message}
                </div>
              )}

              <Button
                fullWidth
                loading={isAdding}
                disabled={addPaise <= 0 || addPaise > mainBalancePaise}
                onClick={handleAddMoney}
              >
                Add {addPaise > 0 ? formatPaise(String(addPaise)) : ''} to {wallet.label} Wallet
              </Button>
            </div>
          )}

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

        {/* Transaction History — full section */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-paytm-text">Transaction History</p>
            <span className="text-[10px] text-paytm-muted">{wallet.transactions.length} transactions</span>
          </div>
          {wallet.transactions.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-3xl">{wallet.icon}</span>
              <p className="text-xs text-paytm-muted mt-2">No transactions yet</p>
              {canSelfLoad && (
                <button
                  onClick={() => setShowAddMoney(true)}
                  className="mt-3 text-xs font-semibold"
                  style={{ color: wallet.color }}
                >
                  Add money to get started
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-0">
              {displayTxns.map((txn, idx) => (
                <div key={txn.txn_id}
                  className={`flex items-center justify-between py-3 ${idx > 0 ? 'border-t border-gray-50' : ''}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0 ${
                      txn.type === 'credit' ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      {txn.type === 'credit' ? (
                        <svg width="16" height="16" fill="none" stroke="#4CAF50" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
                      ) : (
                        <svg width="16" height="16" fill="none" stroke="#E53935" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-paytm-text truncate">{txn.merchant}</p>
                      <p className="text-[10px] text-paytm-muted truncate">{txn.description}</p>
                      <p className="text-[9px] text-paytm-muted mt-0.5">
                        {new Date(txn.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' '}{new Date(txn.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className={`text-sm font-bold ${txn.type === 'credit' ? 'text-green-600' : 'text-paytm-text'}`}>
                      {txn.type === 'credit' ? '+' : '-'}{formatPaise(String(txn.amount_paise))}
                    </p>
                    <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${
                      txn.status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {txn.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}

              {/* Show more / less */}
              {wallet.transactions.length > 5 && (
                <button
                  onClick={() => setShowAllTxns(!showAllTxns)}
                  className="w-full pt-3 border-t border-gray-100 text-center text-xs font-semibold"
                  style={{ color: wallet.color }}
                >
                  {showAllTxns ? 'Show Less' : `View All ${wallet.transactions.length} Transactions`}
                </button>
              )}
            </div>
          )}
        </Card>

        {/* Ask AI — linked to sub-wallet MCP tools */}
        <Card className="!p-0 overflow-hidden">
          <button
            onClick={() => {
              const query = encodeURIComponent(
                `Tell me about my ${wallet.label} wallet. What is my current balance, recent transactions, and where can I use it? Use the get_sub_wallets and get_sub_wallet_transactions tools for accurate information.`
              );
              navigate(`/?ai=${query}`);
            }}
            className="w-full p-4 flex items-center gap-3 transition-colors active:bg-gray-50"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${wallet.color}15` }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill={wallet.color} fillOpacity="0.15"/>
                <path d="M9 9h.01M15 9h.01M9.5 15.5a5 5 0 005 0" stroke={wallet.color} strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="text-left flex-1">
              <p className="text-xs font-semibold text-paytm-text">Ask AI about {wallet.label} Wallet</p>
              <p className="text-[10px] text-paytm-muted mt-0.5">Get balance info, spending insights & eligible merchants</p>
            </div>
            <svg width="16" height="16" fill="none" stroke="#C0C0C0" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
          </button>

          {/* Quick AI prompts */}
          <div className="px-4 pb-3 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {[
              `What's my ${wallet.label} wallet balance?`,
              `Where can I spend my ${wallet.label} wallet?`,
              `Show my ${wallet.label} wallet transactions`,
            ].map(q => (
              <button
                key={q}
                onClick={() => navigate(`/?ai=${encodeURIComponent(q + ' Use the get_sub_wallets tool.')}`)}
                className="shrink-0 text-[10px] px-3 py-1.5 rounded-full border border-gray-200 text-paytm-muted hover:border-gray-300 transition-colors"
              >
                {q.replace(` Use the get_sub_wallets tool.`, '')}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
