import { useState } from 'react';
import { Card } from '../ui/Card';
import { walletApi } from '../../api/wallet.api';
import { useAuthStore } from '../../store/auth.store';
import type { LedgerEntry } from '../../types/api.types';
import axios from 'axios';

function formatPaise(paise: string): string {
  return '₹' + (Number(paise) / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

/** Generates a plain-English summary from ledger entries without needing an API */
function generateLocalSummary(entries: LedgerEntry[]): string {
  if (entries.length === 0) return 'No transactions found to summarise.';

  const debits = entries.filter(e => e.entry_type === 'DEBIT');
  const credits = entries.filter(e => e.entry_type === 'CREDIT');
  const totalSpent = debits.reduce((sum, e) => sum + Number(e.amount_paise), 0);
  const totalReceived = credits.reduce((sum, e) => sum + Number(e.amount_paise), 0);

  const largest = [...entries].sort((a, b) => Number(b.amount_paise) - Number(a.amount_paise))[0];
  const highValue = entries.filter(e => Number(e.amount_paise) >= 500000); // ≥ ₹5,000

  const lines: string[] = [];
  lines.push(`You had ${entries.length} transactions recently — ${debits.length} debits totalling ${formatPaise(totalSpent.toString())} and ${credits.length} credits totalling ${formatPaise(totalReceived.toString())}.`);
  lines.push(`Largest transaction: ${formatPaise(largest.amount_paise)} (${largest.description}) on ${formatDate(largest.created_at)}.`);

  if (highValue.length > 0) {
    lines.push(`${highValue.length} high-value transaction${highValue.length > 1 ? 's' : ''} above ₹5,000 detected.`);
  }

  const typeCount: Record<string, number> = {};
  for (const e of debits) typeCount[e.transaction_type] = (typeCount[e.transaction_type] || 0) + 1;
  const topType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0];
  if (topType) {
    const label = topType[0].replace(/_/g, ' ').toLowerCase();
    lines.push(`Most frequent spend category: ${label} (${topType[1]} transactions).`);
  }

  return lines.join('\n');
}

export function AiSummaryCard() {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAiSummary, setIsAiSummary] = useState(false);
  const walletId = useAuthStore(s => s.walletId);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setSummary(null);
    setIsAiSummary(false);

    try {
      // Fetch recent transactions from the wallet's ledger
      const ledger = await walletApi.getLedger(walletId ?? 'demo-wallet', { limit: 30 });

      // Try Claude API via server-side middleware first
      try {
        const apiBase = import.meta.env.VITE_API_URL || '';
        const res = await axios.post(`${apiBase}/api/summarise-transactions?role=user`, {
          transactions: ledger.entries.map(e => ({
            entry_type: e.entry_type,
            transaction_type: e.transaction_type,
            amount_paise: e.amount_paise,
            description: e.description,
            created_at: e.created_at,
          })),
        }, { timeout: 30000 });

        setSummary(res.data.summary);
        setIsAiSummary(true);
      } catch {
        // Fallback: generate summary locally (works on static deployments)
        setSummary(generateLocalSummary(ledger.entries));
      }
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
        <span className="text-[9px] text-paytm-muted">{isAiSummary ? 'Powered by Claude' : 'Smart Summary'}</span>
      </div>
    </Card>
  );
}
