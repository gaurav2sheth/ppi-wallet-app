import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AmountInput } from '../components/ui/AmountInput';
import { mockGetSubWalletDetail, mockAddMoneyToSubWallet, mockIssueFastag, type SubWallet } from '../api/mock';
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
  const [addResult, setAddResult] = useState<{ success: boolean; message: string; detail?: string } | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showAllTxns, setShowAllTxns] = useState(false);
  const [showNewVehicle, setShowNewVehicle] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleResult, setVehicleResult] = useState<{ success: boolean; message: string } | null>(null);

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
  const isFastag = wallet.type === 'FASTAG';
  const isNcmc = wallet.type === 'NCMC TRANSIT';
  const isExpired = wallet.type === 'GIFT' && wallet.expiry_date && new Date(wallet.expiry_date) < new Date();
  const expiryStr = wallet.expiry_date
    ? new Date(wallet.expiry_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  const addPaise = Math.round(Number(addAmount || '0') * 100);
  const mainBalancePaise = Number(availablePaise || '0');

  // NCMC: calculate headroom
  const ncmcMaxBalance = wallet.max_balance_paise || 300000;
  const ncmcHeadroom = isNcmc ? ncmcMaxBalance - wallet.balance_paise : Infinity;

  // FASTag: security deposit info
  const totalDeposit = isFastag ? (wallet.vehicle_count || 0) * (wallet.security_deposit_per_vehicle_paise || 30000) : 0;
  const depositUsed = isFastag ? (wallet.security_deposit_used_paise || 0) : 0;

  const handleAddMoney = async () => {
    if (addPaise <= 0) return;
    setIsAdding(true);
    setAddResult(null);
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
      }, 2500);
    }
  };

  const handleIssueVehicle = async () => {
    if (!vehicleNumber.trim()) return;
    setIsAdding(true);
    await new Promise(r => setTimeout(r, 600));
    const result = mockIssueFastag(vehicleNumber.trim().toUpperCase());
    setVehicleResult(result);
    setIsAdding(false);
    if (result.success) {
      setVehicleNumber('');
      reloadWallet();
      refetchBalance();
      setTimeout(() => {
        setShowNewVehicle(false);
        setVehicleResult(null);
      }, 2500);
    }
  };

  const displayTxns = showAllTxns ? wallet.transactions : wallet.transactions.slice(0, 5);

  // Presets for add money
  const addPresets = isFastag
    ? [200, 500, 1000, 2000]
    : isNcmc
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

            {isFastag ? (
              /* FASTag: show security deposit */
              <>
                <p className="text-3xl font-bold mt-2" style={{ color: wallet.color }}>
                  {formatPaise(String(wallet.balance_paise))}
                </p>
                <p className="text-xs text-paytm-muted mt-1">Security Deposit</p>
                <div className="flex justify-center gap-4 mt-2">
                  <div className="text-center">
                    <p className="text-lg font-bold text-paytm-text">{wallet.vehicle_count || 0}</p>
                    <p className="text-[10px] text-paytm-muted">Vehicles</p>
                  </div>
                  <div className="w-px h-8 bg-gray-200" />
                  <div className="text-center">
                    <p className="text-lg font-bold text-paytm-text">₹300</p>
                    <p className="text-[10px] text-paytm-muted">Per Vehicle</p>
                  </div>
                  {depositUsed > 0 && (
                    <>
                      <div className="w-px h-8 bg-gray-200" />
                      <div className="text-center">
                        <p className="text-lg font-bold text-red-500">{formatPaise(String(depositUsed))}</p>
                        <p className="text-[10px] text-paytm-muted">Deposit Used</p>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : isNcmc ? (
              /* NCMC: show balance with cap */
              <>
                <p className="text-3xl font-bold mt-2" style={{ color: wallet.color }}>
                  {formatPaise(String(wallet.balance_paise))}
                </p>
                <p className="text-xs text-paytm-muted mt-1">NCMC Transit Balance</p>
                <p className="text-[10px] text-paytm-muted mt-1">
                  Max balance: {formatPaise(String(ncmcMaxBalance))}
                </p>
              </>
            ) : (
              /* Default: standard balance */
              <>
                <p className="text-3xl font-bold mt-2" style={{ color: wallet.color }}>
                  {formatPaise(String(wallet.balance_paise))}
                </p>
                <p className="text-xs text-paytm-muted mt-1">{wallet.label} Wallet Balance</p>
              </>
            )}

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
              <div className="mt-4 flex justify-center gap-2">
                <button
                  onClick={() => { setShowAddMoney(!showAddMoney); setShowNewVehicle(false); }}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-semibold text-white transition-transform active:scale-95"
                  style={{ backgroundColor: wallet.color }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
                  {isFastag ? 'Top Up Wallet' : 'Add Money'}
                </button>
                {isFastag && (
                  <button
                    onClick={() => { setShowNewVehicle(!showNewVehicle); setShowAddMoney(false); }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border-2 transition-transform active:scale-95"
                    style={{ borderColor: wallet.color, color: wallet.color }}
                  >
                    🚗 New Vehicle
                  </button>
                )}
              </div>
            )}
          </div>

          {/* FASTag: How it works info box */}
          {isFastag && (
            <div className="px-4 py-3 border-t border-gray-100 bg-green-50/50">
              <p className="text-[10px] font-semibold text-paytm-text mb-1.5">How FASTag works</p>
              <div className="space-y-1">
                <p className="text-[10px] text-paytm-muted">• Toll payments deduct from your <b>main wallet</b></p>
                <p className="text-[10px] text-paytm-muted">• If main wallet is zero, <b>security deposit</b> is used</p>
                <p className="text-[10px] text-paytm-muted">• On next top-up, security deposit is <b>refilled first</b> (₹300)</p>
                <p className="text-[10px] text-paytm-muted">• New vehicle = additional ₹300 security deposit</p>
              </div>
            </div>
          )}

          {/* NCMC: How it works */}
          {isNcmc && (
            <div className="px-4 py-3 border-t border-gray-100 bg-indigo-50/50">
              <p className="text-[10px] font-semibold text-paytm-text mb-1.5">How NCMC Transit works</p>
              <div className="space-y-1">
                <p className="text-[10px] text-paytm-muted">• NCMC has its own <b>₹3,000 balance limit</b></p>
                <p className="text-[10px] text-paytm-muted">• Transit payments (Metro, Bus, etc.) use <b>only NCMC balance</b></p>
                <p className="text-[10px] text-paytm-muted">• Top up anytime from your main wallet</p>
              </div>
            </div>
          )}

          {/* Add Money Panel */}
          {showAddMoney && canSelfLoad && (
            <div className="px-4 py-4 border-t border-gray-100 bg-gray-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-paytm-text">
                  {isFastag ? 'Top Up (loads main wallet)' : 'Add from Main Wallet'}
                </p>
                <p className="text-[10px] text-paytm-muted">
                  {isFastag ? `Main: ${formatPaise(availablePaise)}` : `Available: ${formatPaise(availablePaise)}`}
                </p>
              </div>

              {isFastag && depositUsed > 0 && (
                <div className="text-[10px] p-2 rounded-lg bg-amber-50 text-amber-700 font-medium">
                  ⚠️ Security deposit shortfall: {formatPaise(String(depositUsed))}. This will be refilled first from your top-up.
                </div>
              )}

              <AmountInput value={addAmount} onChange={setAddAmount} label="Amount" presets={addPresets} />

              {/* NCMC balance cap info */}
              {isNcmc && (
                <p className="text-[10px] text-paytm-muted">
                  Can add up to: {formatPaise(String(Math.max(0, ncmcHeadroom)))} (max ₹3,000 balance)
                </p>
              )}

              {addResult && (
                <div className={`text-xs font-medium p-2 rounded-lg text-center ${
                  addResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  <p>{addResult.message}</p>
                  {addResult.detail && <p className="text-[10px] mt-0.5 opacity-80">{addResult.detail}</p>}
                </div>
              )}

              <Button
                fullWidth
                loading={isAdding}
                disabled={addPaise <= 0 || (!isFastag && addPaise > mainBalancePaise) || (isNcmc && addPaise > ncmcHeadroom)}
                onClick={handleAddMoney}
              >
                {isFastag
                  ? `Top Up ${addPaise > 0 ? formatPaise(String(addPaise)) : ''}`
                  : `Add ${addPaise > 0 ? formatPaise(String(addPaise)) : ''} to ${wallet.label} Wallet`
                }
              </Button>
            </div>
          )}

          {/* FASTag: Issue New Vehicle Panel */}
          {showNewVehicle && isFastag && (
            <div className="px-4 py-4 border-t border-gray-100 bg-gray-50/50 space-y-3">
              <p className="text-xs font-semibold text-paytm-text">Issue FASTag for New Vehicle</p>
              <p className="text-[10px] text-paytm-muted">₹300 security deposit will be deducted from main wallet</p>

              <div>
                <label className="text-[10px] font-medium text-paytm-muted mb-1 block">Vehicle Number</label>
                <input
                  value={vehicleNumber}
                  onChange={e => setVehicleNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. MH-01-AB-1234"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400 transition-colors uppercase"
                />
              </div>

              {vehicleResult && (
                <div className={`text-xs font-medium p-2 rounded-lg text-center ${
                  vehicleResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {vehicleResult.message}
                </div>
              )}

              <Button
                fullWidth
                loading={isAdding}
                disabled={!vehicleNumber.trim() || mainBalancePaise < 30000}
                onClick={handleIssueVehicle}
              >
                Issue FASTag (₹300 deposit)
              </Button>
            </div>
          )}

          {/* NCMC: Balance progress toward cap */}
          {isNcmc && (
            <div className="px-5 py-3 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-paytm-muted mb-1.5">
                <span>Balance</span>
                <span>{formatPaise(String(wallet.balance_paise))} / {formatPaise(String(ncmcMaxBalance))}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (wallet.balance_paise / ncmcMaxBalance) * 100)}%`,
                    backgroundColor: wallet.color,
                  }}
                />
              </div>
            </div>
          )}

          {/* FASTag: Security deposit status */}
          {isFastag && (
            <div className="px-5 py-3 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-paytm-muted mb-1.5">
                <span>Security Deposit</span>
                <span>{formatPaise(String(wallet.balance_paise))} / {formatPaise(String(totalDeposit))}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${totalDeposit > 0 ? Math.min(100, (wallet.balance_paise / totalDeposit) * 100) : 0}%`,
                    backgroundColor: depositUsed > 0 ? '#EF4444' : wallet.color,
                  }}
                />
              </div>
              {depositUsed > 0 && (
                <p className="text-[10px] text-red-500 mt-1 font-medium">
                  ⚠️ {formatPaise(String(depositUsed))} used from deposit — will be refilled on next top-up
                </p>
              )}
            </div>
          )}

          {/* Monthly limit progress (for Food, Fuel) */}
          {!isFastag && !isNcmc && wallet.monthly_limit_paise > 0 && (
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

          {/* Loaded by (hide for FASTag since it's self-loaded) */}
          {!isFastag && (
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-paytm-muted">Loaded by</span>
              <span className="text-xs font-medium text-paytm-text">{wallet.loaded_by === 'employer_001' ? 'Paytm' : wallet.loaded_by === 'self' ? 'Self' : wallet.loaded_by}</span>
            </div>
          )}
        </Card>

        {/* Where can I use this? */}
        <Card>
          <p className="text-xs font-semibold text-paytm-text mb-3">
            {isFastag ? 'Accepted at' : isNcmc ? 'Use NCMC balance at' : 'Where can I use this?'}
          </p>
          <div className="flex flex-wrap gap-2">
            {wallet.eligible_categories.map(cat => (
              <span key={cat} className="text-[10px] px-2.5 py-1 rounded-full font-medium"
                style={{ backgroundColor: `${wallet.color}15`, color: wallet.color }}>
                {cat}
              </span>
            ))}
          </div>
          {isFastag && (
            <p className="text-[10px] text-paytm-muted mt-2 italic">
              Toll charges are deducted from your main wallet. Security deposit is used only when main wallet balance is zero.
            </p>
          )}
          {isNcmc && (
            <p className="text-[10px] text-paytm-muted mt-2 italic">
              Transit charges are deducted only from NCMC balance — not from your main wallet.
            </p>
          )}
        </Card>

        {/* Transaction History */}
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
                  {isFastag ? 'Top up to get started' : 'Add money to get started'}
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

        {/* Ask AI */}
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

          <div className="px-4 pb-3 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {[
              `What's my ${wallet.label} wallet balance?`,
              isFastag ? 'How does my FASTag security deposit work?' : `Where can I spend my ${wallet.label} wallet?`,
              `Show my ${wallet.label} wallet transactions`,
            ].map(q => (
              <button
                key={q}
                onClick={() => navigate(`/?ai=${encodeURIComponent(q + ' Use the get_sub_wallets tool.')}`)}
                className="shrink-0 text-[10px] px-3 py-1.5 rounded-full border border-gray-200 text-paytm-muted hover:border-gray-300 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
