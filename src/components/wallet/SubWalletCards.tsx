import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockGetSubWallets, type SubWallet } from '../../api/mock';
import { formatPaise } from '../../utils/format';

export function SubWalletCards() {
  const navigate = useNavigate();
  const [subWallets, setSubWallets] = useState<SubWallet[]>([]);
  const [benefitsTotal, setBenefitsTotal] = useState(0);

  useEffect(() => {
    const data = mockGetSubWallets();
    setSubWallets(data.sub_wallets);
    setBenefitsTotal(data.total_benefits_paise);
  }, []);

  if (subWallets.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-paytm-text tracking-wide">YOUR BENEFITS WALLETS</p>
          <p className="text-[10px] text-paytm-muted mt-0.5">
            Total: {formatPaise(String(benefitsTotal))}
          </p>
        </div>
      </div>

      {/* Horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {subWallets.map(sw => (
          <button
            key={sw.sub_wallet_id}
            onClick={() => navigate(`/wallet/sub/${encodeURIComponent(sw.type)}`)}
            className="shrink-0 w-[140px] snap-start rounded-xl p-3 text-left transition-transform active:scale-95 border border-gray-100 shadow-sm"
            style={{ background: `linear-gradient(135deg, ${sw.color}10, ${sw.color}05)` }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl">{sw.icon}</span>
              <StatusBadge status={sw.status} expiry={sw.expiry_date} />
            </div>
            <p className="text-[11px] font-semibold text-paytm-text truncate">{sw.label}</p>
            <p className="text-base font-bold mt-0.5" style={{ color: sw.color }}>
              {formatPaise(String(sw.balance_paise))}
            </p>

            {/* Progress bar for non-GIFT wallets */}
            {sw.monthly_limit_paise > 0 && (
              <div className="mt-2">
                <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (sw.monthly_loaded_paise / sw.monthly_limit_paise) * 100)}%`,
                      backgroundColor: sw.color,
                    }}
                  />
                </div>
                <p className="text-[8px] text-paytm-muted mt-0.5">
                  {formatPaise(String(sw.monthly_loaded_paise))} / {formatPaise(String(sw.monthly_limit_paise))}
                </p>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status, expiry }: { status: string; expiry: string | null }) {
  // Check if expired GIFT
  if (expiry && new Date(expiry) < new Date()) {
    return <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600">EXPIRED</span>;
  }

  if (status === 'ACTIVE') {
    return <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">ACTIVE</span>;
  }
  if (status === 'FROZEN') {
    return <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">FROZEN</span>;
  }
  return <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600">{status}</span>;
}
