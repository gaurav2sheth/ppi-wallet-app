import { useState } from 'react';
import { Card } from '../ui/Card';
import { walletApi } from '../../api/wallet.api';
import { useAuthStore } from '../../store/auth.store';
import axios from 'axios';

export function AiSummaryCard() {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const walletId = useAuthStore(s => s.walletId);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setSummary(null);

    try {
      // Fetch recent transactions from the wallet's ledger
      const ledger = await walletApi.getLedger(walletId ?? 'demo-wallet', { limit: 30 });

      const res = await axios.post('/api/summarise-transactions', {
        transactions: ledger.entries.map(e => ({
          entry_type: e.entry_type,
          transaction_type: e.transaction_type,
          amount_paise: e.amount_paise,
          description: e.description,
          created_at: e.created_at,
        })),
      }, { timeout: 30000 });

      setSummary(res.data.summary);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to generate summary';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">🤖</span>
        <p className="text-xs font-semibold text-paytm-muted tracking-wide">AI SPENDING INSIGHTS</p>
      </div>

      {!summary && !loading && !error && (
        <p className="text-[11px] text-paytm-muted mb-3">
          Get a personalised summary of your recent transactions powered by Claude AI.
        </p>
      )}

      {!summary && !loading && (
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-paytm-cyan to-blue-500 text-white text-sm font-semibold active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          Generate Summary
        </button>
      )}

      {loading && (
        <div className="flex items-center gap-3 py-3">
          <div className="w-5 h-5 border-2 border-paytm-cyan border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-paytm-muted">Analysing your transactions...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
          <p className="text-xs text-paytm-red">{error}</p>
          <button
            onClick={handleGenerate}
            className="text-xs font-semibold text-paytm-cyan mt-2"
          >
            Try Again
          </button>
        </div>
      )}

      {summary && !loading && (
        <>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
            <p className="text-xs text-paytm-text leading-relaxed whitespace-pre-line">{summary}</p>
          </div>
          <button
            onClick={handleGenerate}
            className="text-xs font-semibold text-paytm-cyan mt-2"
          >
            Regenerate
          </button>
        </>
      )}

      <div className="flex justify-end mt-2">
        <span className="text-[9px] text-paytm-muted">Powered by Claude</span>
      </div>
    </Card>
  );
}
