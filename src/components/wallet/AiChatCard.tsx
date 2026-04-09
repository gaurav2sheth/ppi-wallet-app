import { useState, useRef, useEffect } from 'react';
import { Card } from '../ui/Card';
import axios from 'axios';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

const SUGGESTED_QUESTIONS = [
  'What is my wallet balance?',
  'Show my recent transactions',
  'How much did I spend this week?',
];

/** Local fallback responses when Claude API is unavailable (e.g. GitHub Pages) */
function getLocalResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('balance')) {
    return 'Your wallet balance is approximately ₹23,611.00. Your account status is ACTIVE with Full KYC verified. For the most accurate balance, please check the Balance & History section.';
  }
  if (lower.includes('transaction') || lower.includes('history') || lower.includes('recent') || lower.includes('spent') || lower.includes('spend')) {
    return 'Here\'s a quick overview of your recent activity:\n\n• ₹10,000.00 — Wallet top-up via UPI (1 day ago)\n• ₹899.00 — Food delivery - Swiggy (2 days ago)\n• ₹5,000.00 — P2P transfer to Priya Sharma (3 days ago)\n• ₹12,000.00 — Online purchase - Amazon (5 days ago)\n\nYour total spending in the last 7 days is around ₹17,899. For detailed history, visit the Passbook section.';
  }
  if (lower.includes('help') || lower.includes('what can')) {
    return 'I can help you with:\n\n• Checking your wallet balance\n• Viewing recent transactions\n• Understanding your spending patterns\n\nTry asking "What is my balance?" or "Show my recent transactions".';
  }
  return 'I can help you check your balance, view transactions, and understand your spending. Try asking something like "What is my balance?" or "Show my recent transactions".\n\n(Note: Full AI chat requires a local dev server with an Anthropic API key configured.)';
}

export function AiChatCard() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('/api/chat', { message: text.trim() }, { timeout: 30000 });
      setMessages(prev => [...prev, { role: 'assistant', text: res.data.reply }]);
    } catch {
      // Fallback: local response for static deployments
      setMessages(prev => [...prev, { role: 'assistant', text: getLocalResponse(text) }]);
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
          <span className="text-sm font-semibold text-white">AI Assistant</span>
        </div>
        <button onClick={() => setIsExpanded(false)} className="text-white/80 hover:text-white">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

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
            <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-line ${
              msg.role === 'user'
                ? 'bg-violet-500 text-white rounded-br-sm'
                : 'bg-white border border-gray-100 text-paytm-text rounded-bl-sm'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 px-3 py-2 rounded-xl rounded-bl-sm flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-[11px] text-paytm-muted">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

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

      <div className="px-4 pb-2">
        <span className="text-[9px] text-paytm-muted">Powered by Claude AI</span>
      </div>
    </Card>
  );
}
