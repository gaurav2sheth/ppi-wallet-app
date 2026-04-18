import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { mockApi } from '../../api/mock';
import { useAuthStore } from '../../store/auth.store';
import { useWalletStore } from '../../store/wallet.store';
import type { LedgerEntry } from '../../types/api.types';
import axios from 'axios';

interface ChatMessageMeta {
  intent?: string;
  tools_used?: string[];
  resolved?: boolean;
  ticket_id?: string | null;
  suggested_actions?: string[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  meta?: ChatMessageMeta;
}

interface TicketInfo {
  ticket_id: string;
  helpline_info?: string | null;
}

const SUGGESTED_QUESTIONS = [
  'What is my wallet balance?',
  'Why was my payment blocked?',
  'Show my recent transactions',
  'What is my KYC status?',
  'I need to talk to someone',
];

function formatPaise(paise: string | number): string {
  return '₹' + (Number(paise) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function daysAgoLabel(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff === 0) return 'today';
  if (diff === 1) return '1 day ago';
  return `${diff} days ago`;
}

function formatIntent(intent: string): string {
  return intent
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

/** Local fallback responses built from real app data */
function getLocalResponse(message: string, walletId: string, userName: string, balancePaise: string, kycTier: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('balance')) {
    return `Your wallet balance is ${formatPaise(balancePaise)}. Your account status is ACTIVE with ${kycTier} KYC verified.`;
  }

  if (lower.includes('transaction') || lower.includes('history') || lower.includes('recent') || lower.includes('spent') || lower.includes('spend')) {
    const ledger = mockApi.getLedger(walletId, { limit: 30 });
    const entries = ledger.entries;
    if (entries.length === 0) return 'No transactions found in your wallet yet.';

    const debits = entries.filter(e => e.entry_type === 'DEBIT');
    const credits = entries.filter(e => e.entry_type === 'CREDIT');
    const totalSpent = debits.reduce((s, e) => s + Number(e.amount_paise), 0);
    const totalReceived = credits.reduce((s, e) => s + Number(e.amount_paise), 0);

    const recentLines = entries.slice(0, 6).map(e => {
      const sign = e.entry_type === 'CREDIT' ? '+' : '-';
      return `• ${sign}${formatPaise(e.amount_paise)} — ${e.description || e.transaction_type} (${daysAgoLabel(e.created_at)})`;
    });

    const spendingAnalysis = getSpendingAnalysis(debits);

    return `Here's your recent wallet activity, ${userName}:\n\n${recentLines.join('\n')}\n\nSummary: ${debits.length} debits totalling ${formatPaise(totalSpent)} and ${credits.length} credits totalling ${formatPaise(totalReceived)}.${spendingAnalysis}`;
  }

  if (lower.includes('help') || lower.includes('what can')) {
    return `I can help you with:\n\n• Checking your wallet balance (currently ${formatPaise(balancePaise)})\n• Viewing recent transactions\n• Understanding your spending patterns\n\nTry asking "What is my balance?" or "Show my recent transactions".`;
  }

  // Default: show a summary with real data
  const ledger = mockApi.getLedger(walletId, { limit: 10 });
  const lastTxn = ledger.entries[0];
  const lastTxnInfo = lastTxn
    ? `\n\nYour last transaction: ${lastTxn.entry_type === 'CREDIT' ? '+' : '-'}${formatPaise(lastTxn.amount_paise)} — ${lastTxn.description || lastTxn.transaction_type} (${daysAgoLabel(lastTxn.created_at)})`
    : '';

  return `Hi ${userName}! Your current balance is ${formatPaise(balancePaise)}.${lastTxnInfo}\n\nI can help you check your balance, view transactions, and understand your spending. Try asking something specific!`;
}

function getSpendingAnalysis(debits: LedgerEntry[]): string {
  if (debits.length === 0) return '';
  const typeCount: Record<string, { count: number; total: number }> = {};
  for (const d of debits) {
    const type = d.transaction_type;
    if (!typeCount[type]) typeCount[type] = { count: 0, total: 0 };
    typeCount[type].count++;
    typeCount[type].total += Number(d.amount_paise);
  }
  const sorted = Object.entries(typeCount).sort((a, b) => b[1].total - a[1].total);
  const topCategory = sorted[0];
  const label = topCategory[0].replace(/_/g, ' ').toLowerCase();
  return `\n\nTop spend category: ${label} (${topCategory[1].count} txns, ${formatPaise(topCategory[1].total)}).`;
}

export function AiChatCard() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [suggestedActions, setSuggestedActions] = useState<string[]>([]);
  const [ticketInfo, setTicketInfo] = useState<TicketInfo | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const walletId = useAuthStore(s => s.walletId);
  const userName = useAuthStore(s => s.userName);
  const { balancePaise, kycTier } = useWalletStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setSuggestedActions([]);

    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const ledger = mockApi.getLedger(walletId ?? 'demo-wallet', { limit: 15 });
      const res = await axios.post(
        `${apiBase}/api/support/chat`,
        {
          user_id: walletId ?? 'demo-wallet',
          message: text.trim(),
          session_id: sessionId,
          context: {
            balance_paise: balancePaise ?? '0',
            balance_formatted: formatPaise(balancePaise ?? '0'),
            user_name: userName ?? 'User',
            kyc_tier: kycTier ?? 'FULL',
            recent_transactions: ledger.entries.slice(0, 10).map(e => ({
              entry_type: e.entry_type,
              amount_paise: e.amount_paise,
              amount_formatted: formatPaise(e.amount_paise),
              description: e.description,
              transaction_type: e.transaction_type,
              created_at: e.created_at,
            })),
          },
        },
        { timeout: 30000 },
      );

      const data = res.data;

      // Persist session across messages
      if (data.session_id) {
        setSessionId(data.session_id);
      }

      // Build message with metadata
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        text: data.response_text,
        meta: {
          intent: data.intent_detected,
          tools_used: data.tools_used,
          resolved: data.resolved,
          ticket_id: data.ticket_id,
          suggested_actions: data.suggested_actions,
        },
      };
      setMessages(prev => [...prev, assistantMsg]);

      // Update suggested actions for quick-reply buttons
      if (data.suggested_actions && data.suggested_actions.length > 0) {
        setSuggestedActions(data.suggested_actions);
      } else {
        setSuggestedActions([]);
      }

      // Handle escalation / ticket creation
      if (data.escalated && data.ticket_id) {
        setTicketInfo({
          ticket_id: data.ticket_id,
          helpline_info: data.helpline_info,
        });
      }
    } catch {
      // Fallback: use real data from the app's mock layer
      const reply = getLocalResponse(text, walletId ?? 'demo-wallet', userName ?? 'User', balancePaise ?? '0', kycTier ?? 'FULL');
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
      setSuggestedActions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (!isExpanded) {
    return (
      <Card>
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full flex items-center gap-3 py-1"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
          <div className="text-left flex-1">
            <p className="text-sm font-semibold text-paytm-text">Ask AI anything</p>
            <p className="text-[11px] text-paytm-muted">Check balance, transactions, spending insights...</p>
          </div>
          <svg width="16" height="16" fill="none" stroke="#707070" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </Card>
    );
  }

  return (
    <Card className="!p-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-500 to-purple-600">
        <div className="flex items-center gap-2">
          <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          <span className="text-sm font-semibold text-white">AI Support</span>
        </div>
        <button onClick={() => setIsExpanded(false)} className="text-white/80 hover:text-white">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Ticket Banner */}
      {ticketInfo && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-start gap-2">
          <svg width="16" height="16" fill="none" stroke="#B45309" strokeWidth="2" viewBox="0 0 24 24" className="flex-shrink-0 mt-0.5">
            <path d="M12 9v2m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
          </svg>
          <div className="flex-1">
            <p className="text-[11px] font-semibold text-amber-800">
              Ticket #{ticketInfo.ticket_id}
            </p>
            <p className="text-[10px] text-amber-700">
              Your issue has been escalated to our support team. Expected resolution within 24-48 hours.
            </p>
            {ticketInfo.helpline_info && (
              <p className="text-[10px] text-amber-700 mt-0.5">
                Helpline: {ticketInfo.helpline_info}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="max-h-64 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50/50">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-[11px] text-paytm-muted text-center">Try one of these questions:</p>
            {SUGGESTED_QUESTIONS.map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="w-full text-left px-3 py-2 rounded-lg bg-white border border-gray-100 text-xs text-paytm-text hover:border-violet-300 hover:bg-violet-50 transition"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[85%]">
              <div className={`px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-line ${
                msg.role === 'user'
                  ? 'bg-violet-500 text-white rounded-br-sm'
                  : 'bg-white border border-gray-100 text-paytm-text rounded-bl-sm'
              }`}>
                {msg.text}
              </div>
              {/* Intent badge for assistant messages */}
              {msg.role === 'assistant' && msg.meta?.intent && (
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-medium bg-violet-100 text-violet-600">
                    {formatIntent(msg.meta.intent)}
                  </span>
                  {msg.meta.resolved === true && (
                    <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-medium bg-green-100 text-green-600">
                      Resolved
                    </span>
                  )}
                  {msg.meta.resolved === false && (
                    <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-100 text-amber-600">
                      Pending
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 px-3 py-2 rounded-xl rounded-bl-sm flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-[11px] text-paytm-muted">Investigating...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Actions */}
      {suggestedActions.length > 0 && !loading && (
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50 flex flex-wrap gap-1.5">
          {suggestedActions.map(action => (
            <button
              key={action}
              onClick={() => sendMessage(action)}
              className="px-3 py-1 rounded-full text-[11px] font-medium bg-violet-100 text-violet-700 hover:bg-violet-200 active:scale-95 transition"
            >
              {action}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-3 py-2 border-t border-gray-100 bg-white flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your wallet..."
          disabled={loading}
          className="flex-1 text-xs py-2 px-3 rounded-full bg-gray-50 border border-gray-200 outline-none focus:border-violet-400 transition disabled:opacity-50"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform"
        >
          <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round"><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>
        </button>
      </div>

      <div className="px-4 pb-2 flex items-center justify-between">
        <span className="text-[9px] text-paytm-muted">Powered by Claude AI</span>
        <button
          onClick={() => navigate('/support/tickets')}
          className="text-[9px] font-medium text-violet-600 hover:text-violet-800 transition"
        >
          My Tickets
        </button>
      </div>
    </Card>
  );
}
