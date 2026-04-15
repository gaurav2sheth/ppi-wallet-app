import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { useNotificationsStore, type Notification } from '../store/notifications.store';
import { formatDate } from '../utils/format';

const typeColors: Record<string, string> = {
  credit: 'bg-green-50',
  debit: 'bg-red-50',
  reward: 'bg-amber-50',
  alert: 'bg-amber-50',
  info: 'bg-blue-50',
};

const isKycNotification = (n: Notification) =>
  n.actionPath === '/kyc' && n.type === 'alert';

export function NotificationsPage() {
  const navigate = useNavigate();
  const { items, markRead, markAllRead, unreadCount } = useNotificationsStore();

  const handleTap = (n: Notification) => {
    markRead(n.id);
    if (n.actionPath) navigate(n.actionPath);
  };

  return (
    <div className="page-enter">
      <Header
        showBack
        title="Notifications"
        rightActions={
          unreadCount > 0 ? (
            <button onClick={markAllRead} className="text-xs font-semibold text-paytm-cyan">Mark all read</button>
          ) : null
        }
      />
      <div className="px-4 pt-4 space-y-2">
        {items.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-3xl mb-2">🔔</p>
            <p className="text-sm text-paytm-muted">No notifications yet</p>
          </Card>
        ) : (
          items.map((n: Notification) => {
            const isKyc = isKycNotification(n);
            return (
              <Card
                key={n.id}
                className={`!p-3 ${isKyc ? 'border-l-3 border-l-amber-500 bg-amber-50/40' : !n.read ? 'border-l-3 border-l-paytm-cyan' : ''}`}
                onClick={() => handleTap(n)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${isKyc ? 'bg-amber-100' : typeColors[n.type] ?? 'bg-gray-50'}`}>
                    {n.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${!n.read ? 'font-semibold' : 'font-medium'} ${isKyc ? 'text-amber-800' : 'text-paytm-text'}`}>{n.title}</p>
                      {!n.read && <span className={`w-2 h-2 ${isKyc ? 'bg-amber-500' : 'bg-paytm-cyan'} rounded-full shrink-0 mt-1.5`} />}
                    </div>
                    <p className="text-xs text-paytm-muted mt-0.5 leading-relaxed">{n.body}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-[10px] text-paytm-muted">{formatDate(n.createdAt)}</p>
                      {isKyc ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); markRead(n.id); navigate('/kyc'); }}
                          className="text-[11px] font-bold text-white bg-[#00B9F1] hover:bg-[#00a5d8] px-4 py-1.5 rounded-full transition"
                        >
                          Upgrade KYC Now →
                        </button>
                      ) : n.actionLabel ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); markRead(n.id); if (n.actionPath) navigate(n.actionPath); }}
                          className="text-[11px] font-semibold text-paytm-cyan bg-paytm-cyan-light px-3 py-1 rounded-full"
                        >
                          {n.actionLabel}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
