import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { useAuthStore } from '../store/auth.store';

interface SupportTicket {
  ticket_id: string;
  user_id: string;
  name: string;
  issue_type: string;
  issue_summary: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  created_at: string;
  sla_resolve_by: string;
  resolved_at: string | null;
  resolution_notes: string | null;
}

const ISSUE_TYPE_LABELS: Record<string, string> = {
  PAYMENT_BLOCKED: 'Payment Blocked',
  TRANSACTION_INQUIRY: 'Transaction Inquiry',
  BALANCE_QUERY: 'Balance Query',
  KYC_STATUS: 'KYC Status',
  SUB_WALLET_QUERY: 'Sub-Wallet Query',
  ESCALATION_REQUEST: 'Escalation Request',
  GENERAL_HELP: 'General Help',
};

function formatIssueType(type: string): string {
  return ISSUE_TYPE_LABELS[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-amber-100 text-amber-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  RESOLVED: 'bg-green-100 text-green-800',
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
};

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  LOW: 'bg-gray-100 text-gray-600',
};

function formatTicketDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatTimeRemaining(slaIso: string): string {
  const now = Date.now();
  const sla = new Date(slaIso).getTime();
  const diff = sla - now;

  if (diff <= 0) return 'Overdue';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h remaining`;
  }
  return `${hours}h ${minutes}m remaining`;
}

export function SupportTicketsPage() {
  const navigate = useNavigate();
  const { walletId } = useAuthStore();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const apiBase = import.meta.env.VITE_API_URL || '';

  const fetchTickets = useCallback(async () => {
    if (!walletId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/support/tickets/user/${walletId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setTickets(data.tickets ?? []);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [apiBase, walletId]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return (
    <div className="page-enter">
      <Header
        showBack
        title="My Tickets"
        rightActions={
          <button
            onClick={fetchTickets}
            className="text-xs font-semibold text-paytm-cyan"
          >
            Refresh
          </button>
        }
      />

      <div className="px-4 pt-4 pb-24 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-paytm-cyan border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-sm font-medium text-paytm-text mb-1">
              No support tickets yet
            </p>
            <p className="text-xs text-paytm-muted mb-4">
              Chat with our AI assistant if you need help!
            </p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-paytm-cyan hover:bg-[#00a5d8] px-5 py-2 rounded-full transition"
            >
              Chat with AI
            </button>
          </Card>
        ) : (
          tickets.map((ticket) => (
            <Card key={ticket.ticket_id} className="!p-0 overflow-hidden">
              <div className="p-4">
                {/* Top row: badges */}
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_STYLES[ticket.status]}`}
                  >
                    {STATUS_LABELS[ticket.status] ?? ticket.status}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${PRIORITY_STYLES[ticket.priority]}`}
                  >
                    {ticket.priority}
                  </span>
                  <span className="ml-auto text-[10px] font-mono text-paytm-muted truncate max-w-[100px]">
                    {ticket.ticket_id}
                  </span>
                </div>

                {/* Issue type */}
                <p className="text-sm font-semibold text-paytm-text mb-0.5">
                  {formatIssueType(ticket.issue_type)}
                </p>

                {/* Summary */}
                <p className="text-xs text-paytm-muted leading-relaxed line-clamp-2 mb-2">
                  {ticket.issue_summary}
                </p>

                {/* Footer: dates */}
                <div className="flex items-center justify-between text-[10px] text-paytm-muted">
                  <span>Created {formatTicketDate(ticket.created_at)}</span>
                  {ticket.status !== 'RESOLVED' && ticket.sla_resolve_by && (
                    <span
                      className={
                        new Date(ticket.sla_resolve_by).getTime() < Date.now()
                          ? 'text-red-600 font-semibold'
                          : 'text-paytm-muted'
                      }
                    >
                      {formatTimeRemaining(ticket.sla_resolve_by)}
                    </span>
                  )}
                </div>
              </div>

              {/* Resolved section */}
              {ticket.status === 'RESOLVED' && (
                <div className="bg-green-50 border-t border-green-100 px-4 py-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#12B76A"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    <span className="text-[11px] font-semibold text-green-700">
                      Resolved
                      {ticket.resolved_at
                        ? ` on ${formatTicketDate(ticket.resolved_at)}`
                        : ''}
                    </span>
                  </div>
                  {ticket.resolution_notes && (
                    <p className="text-xs text-green-800 leading-relaxed">
                      {ticket.resolution_notes}
                    </p>
                  )}
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
