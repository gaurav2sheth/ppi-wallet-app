import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { useNotificationsStore, type Notification } from '../store/notifications.store';
import { formatDate } from '../utils/format';

const typeColors: Record<string, string> = {
  credit: 'bg-green-50',
  debit: 'bg-red-50',
  reward: 'bg-amber-50',
  alert: 'bg-orange-50',
  info: 'bg-blue-50',
};

export function NotificationsPage() {
  const { items, markRead, markAllRead, unreadCount } = useNotificationsStore();

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
          items.map((n: Notification) => (
            <Card
              key={n.id}
              className={`!p-3 ${!n.read ? 'border-l-3 border-l-paytm-cyan' : ''}`}
              onClick={() => markRead(n.id)}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${typeColors[n.type] ?? 'bg-gray-50'}`}>
                  {n.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${!n.read ? 'font-semibold' : 'font-medium'} text-paytm-text`}>{n.title}</p>
                    {!n.read && <span className="w-2 h-2 bg-paytm-cyan rounded-full shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-xs text-paytm-muted mt-0.5 leading-relaxed">{n.body}</p>
                  <p className="text-[10px] text-paytm-muted mt-1">{formatDate(n.createdAt)}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
