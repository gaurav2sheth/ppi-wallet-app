import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { useBalance } from '../../hooks/useBalance';
import { useAuthStore } from '../../store/auth.store';
import { formatPaise } from '../../utils/format';
import { ROUTES } from '../../utils/constants';
import { mockGetSubWallets, type SubWallet } from '../../api/mock';

export function WalletStrip() {
  const navigate = useNavigate();
  const { walletId } = useAuthStore();
  const { availablePaise, kycTier, isLoading, refetch } = useBalance(walletId);
  const [autoTopUp, setAutoTopUp] = useState(true);
  const [quickAmount, setQuickAmount] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [subWallets, setSubWallets] = useState<SubWallet[]>([]);
  const [benefitsPaise, setBenefitsPaise] = useState(0);

  useEffect(() => {
    const data = mockGetSubWallets();
    setSubWallets(data.sub_wallets);
    setBenefitsPaise(data.total_benefits_paise);
  }, [availablePaise]);

  const quickAmounts = [
    { value: 100, label: '+ ₹100' },
    { value: 500, label: '+ ₹500' },
    { value: 1000, label: '+ ₹1,000', popular: true },
  ];

  const handleQuickAdd = (amount: number) => {
    setQuickAmount(amount);
    navigate(`${ROUTES.ADD_MONEY}?amount=${amount}`);
  };

  const totalPaise = Number(availablePaise || '0') + benefitsPaise;

  return (
    <div className="space-y-3">
      <Card className="!p-0 overflow-hidden">
        {/* Balance Strip — tappable to expand */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full p-4 pb-3 text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-paytm-navy/10 rounded-xl flex items-center justify-center">
                <svg width="22" height="22" fill="none" stroke="#002E6E" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-paytm-muted font-medium">Wallet Balance</p>
                <p className="text-2xl font-bold text-paytm-text">
                  {isLoading ? (
                    <span className="inline-block w-24 h-7 bg-gray-100 rounded animate-pulse" />
                  ) : (
                    formatPaise(String(totalPaise))
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {kycTier && (
                <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                  kycTier === 'FULL' ? 'bg-green-50 text-paytm-green' : 'bg-orange-50 text-paytm-orange'
                }`}>
                  {kycTier === 'FULL' ? 'Full KYC' : 'Min KYC'}
                </span>
              )}
              <svg
                width="16" height="16" fill="none" stroke="#8b949e" strokeWidth="2" viewBox="0 0 24 24"
                className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </div>
        </button>

        {/* Wallet breakdown list — Paytm style vertical list */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="border-t border-gray-100">
            {/* Main Wallet */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-paytm-navy/10 flex items-center justify-center">
                  <svg width="16" height="16" fill="none" stroke="#002E6E" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-paytm-text">Wallet</span>
              </div>
              <span className="text-sm font-bold text-paytm-text">{formatPaise(availablePaise)}</span>
            </div>

            {/* Sub-Wallets */}
            {subWallets.map(sw => {
              const isExpired = sw.type === 'GIFT' && sw.expiry_date && new Date(sw.expiry_date) < new Date();
              return (
                <button
                  key={sw.sub_wallet_id}
                  onClick={() => navigate(`/wallet/sub/${encodeURIComponent(sw.type)}`)}
                  className="w-full flex items-center justify-between px-4 py-3 border-t border-gray-50 hover:bg-gray-50/50 transition-colors active:bg-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-base"
                      style={{ backgroundColor: `${sw.color}15` }}
                    >
                      {sw.icon}
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-medium text-paytm-text">{sw.label} Wallet</span>
                      {isExpired && <span className="ml-1.5 text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">EXPIRED</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: sw.balance_paise > 0 ? sw.color : '#8b949e' }}>
                      {formatPaise(String(sw.balance_paise))}
                    </span>
                    <svg width="12" height="12" fill="none" stroke="#C0C0C0" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Refresh button */}
          <div className="px-4 py-2 border-t border-gray-100 flex justify-center">
            <button onClick={(e) => { e.stopPropagation(); refetch(); }} className="text-[11px] text-paytm-cyan font-medium flex items-center gap-1">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></svg>
              Refresh Balance
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100" />

        {/* Add Money Section */}
        <div className="p-4 pt-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-paytm-text">Add Money to Wallet</p>
            <p className="text-[10px] text-paytm-muted">Withdraw anytime</p>
          </div>

          {/* Quick Add Buttons */}
          <div className="flex gap-2 mb-3">
            {quickAmounts.map(a => (
              <button
                key={a.value}
                onClick={() => handleQuickAdd(a.value)}
                className={`relative flex-1 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                  quickAmount === a.value
                    ? 'border-paytm-navy bg-paytm-navy/5 text-paytm-navy'
                    : 'border-gray-200 text-paytm-text hover:border-paytm-navy/30'
                }`}
              >
                {a.label}
                {a.popular && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] bg-paytm-green text-white px-1.5 py-0.5 rounded-full font-bold">
                    Popular
                  </span>
                )}
              </button>
            ))}
            <button
              onClick={() => navigate(ROUTES.ADD_MONEY)}
              className="flex-1 py-2 rounded-lg border border-gray-200 text-xs font-medium text-paytm-cyan hover:border-paytm-cyan/30 transition-colors"
            >
              Custom
            </button>
          </div>

          {/* Auto Top-up Toggle */}
          <div className="flex items-center gap-2 mb-3 bg-gray-50 rounded-lg p-2.5">
            <button
              onClick={() => setAutoTopUp(!autoTopUp)}
              className={`w-9 h-5 rounded-full transition-colors flex items-center shrink-0 ${autoTopUp ? 'bg-paytm-green' : 'bg-gray-300'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${autoTopUp ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
            </button>
            <p className="text-[11px] text-paytm-text leading-tight">
              Auto add <span className="font-semibold">₹2,000</span> when balance below <span className="font-semibold">₹200</span>
            </p>
            <button className="text-[10px] text-paytm-cyan font-semibold ml-auto shrink-0">Edit</button>
          </div>

          {/* Payment Source */}
          <div className="flex items-center gap-2 p-2.5 border border-gray-100 rounded-lg">
            <div className="w-7 h-7 bg-blue-50 rounded-md flex items-center justify-center">
              <svg width="14" height="14" fill="none" stroke="#002E6E" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 21h18M3 10h18M5 6l7-3 7 3" /></svg>
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-paytm-muted">From</p>
              <p className="text-xs font-medium text-paytm-text">HDFC Bank - 7125</p>
            </div>
            <svg width="14" height="14" fill="none" stroke="#8b949e" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
          </div>
        </div>
      </Card>
    </div>
  );
}
