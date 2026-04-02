import { useSearchParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { useAuthStore } from '../store/auth.store';
import { useLedger } from '../hooks/useLedger';
import { formatPaise, formatDate, truncateId } from '../utils/format';
import { getMccCategory } from '../utils/mcc';
import { useToast } from '../components/ui/Toast';

export function TransactionDetailPage() {
  const [params] = useSearchParams();
  const txnId = params.get('id');
  const navigate = useNavigate();
  const { walletId } = useAuthStore();
  const { entries } = useLedger(walletId, { limit: 100 });
  const toast = useToast();

  const txn = entries.find(e => e.id === txnId);

  if (!txn) {
    return (
      <div className="page-enter">
        <Header showBack title="Transaction Details" />
        <div className="px-4 pt-16 text-center">
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-sm text-paytm-muted">Transaction not found</p>
          <Button variant="ghost" className="mt-4" onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  const isCredit = txn.entry_type === 'CREDIT' || txn.entry_type === 'HOLD_RELEASE';
  const mcc = getMccCategory(txn.transaction_type, txn.description, txn.entry_type);

  const handleShare = () => {
    const text = `Paytm Wallet Receipt\n${isCredit ? 'Received' : 'Paid'}: ${formatPaise(txn.amount_paise)}\n${txn.description ?? mcc.label}\nDate: ${formatDate(txn.created_at)}\nTxn ID: ${txn.id}\nBalance: ${formatPaise(txn.balance_after_paise)}`;
    if (navigator.share) {
      navigator.share({ title: 'Paytm Receipt', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      toast.show('Receipt copied to clipboard', 'success');
    }
  };

  const statusSteps = [
    { label: 'Initiated', time: formatDate(txn.created_at), done: true },
    { label: 'Processing', time: '', done: true },
    { label: 'Completed', time: formatDate(txn.created_at), done: true },
  ];

  return (
    <div className="page-enter">
      <Header showBack title="Transaction Details" />
      <div className="px-4 pt-6 space-y-4">
        {/* Amount Card */}
        <Card className="text-center py-6">
          <Avatar name={txn.description ?? mcc.label} size="lg" mcc={mcc} />
          <p className="text-sm font-medium text-paytm-text mt-3">{txn.description ?? mcc.label}</p>
          <p className={`text-3xl font-bold mt-2 ${isCredit ? 'text-paytm-green' : 'text-paytm-text'}`}>
            {isCredit ? '+' : '-'}{formatPaise(txn.amount_paise)}
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <span className={`w-2 h-2 rounded-full bg-paytm-green`} />
            <span className="text-xs font-medium text-paytm-green">Completed</span>
          </div>
        </Card>

        {/* Status Timeline */}
        <Card>
          <p className="text-xs font-semibold text-paytm-muted mb-3 tracking-wide">STATUS</p>
          <div className="space-y-0">
            {statusSteps.map((s, i) => (
              <div key={s.label} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${s.done ? 'bg-paytm-green' : 'bg-gray-200'}`} />
                  {i < statusSteps.length - 1 && <div className={`w-0.5 h-8 ${s.done ? 'bg-paytm-green' : 'bg-gray-200'}`} />}
                </div>
                <div className="pb-3">
                  <p className="text-xs font-medium text-paytm-text">{s.label}</p>
                  {s.time && <p className="text-[10px] text-paytm-muted">{s.time}</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Details */}
        <Card>
          <p className="text-xs font-semibold text-paytm-muted mb-3 tracking-wide">DETAILS</p>
          <div className="space-y-3">
            <DetailRow label="Transaction ID" value={truncateId(txn.id, 20)} mono />
            <DetailRow label="Type" value={isCredit ? 'Credit' : 'Debit'} />
            <DetailRow label="Category" value={`${mcc.icon} ${mcc.label}`} />
            <DetailRow label="Date & Time" value={formatDate(txn.created_at)} />
            <DetailRow label="Balance After" value={formatPaise(txn.balance_after_paise)} />
            {txn.reference_id && <DetailRow label="Reference ID" value={txn.reference_id} mono />}
            <DetailRow label="Idempotency Key" value={truncateId(txn.idempotency_key, 20)} mono />
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button fullWidth variant="outline" onClick={handleShare}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="mr-2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
            Share Receipt
          </Button>
          <Button fullWidth variant="ghost" onClick={() => navigate(-1)}>Back</Button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-start">
      <span className="text-xs text-paytm-muted">{label}</span>
      <span className={`text-xs font-medium text-paytm-text text-right max-w-[60%] ${mono ? 'font-mono text-[11px]' : ''}`}>{value}</span>
    </div>
  );
}
