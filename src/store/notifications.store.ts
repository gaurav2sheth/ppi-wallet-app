import { create } from 'zustand';

export interface Notification {
  id: string;
  title: string;
  body: string;
  icon: string;
  type: 'credit' | 'debit' | 'reward' | 'alert' | 'info';
  read: boolean;
  createdAt: string;
  actionPath?: string; // Route to navigate on tap
  actionLabel?: string; // Button label
}

interface NotificationsState {
  items: Notification[];
  unreadCount: number;
  add: (n: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  items: [
    { id: 'notif-kyc-upgrade-1', title: '⚠️ KYC Expiring Soon', body: 'Your KYC expires in 5 days. Upgrade now to keep your ₹236.11 balance safe.', icon: '⚠️', type: 'alert', read: false, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), actionPath: '/kyc', actionLabel: 'Upgrade KYC Now' },
    { id: 'notif-kyc-upgrade-2', title: '🔒 Upgrade to Full KYC', body: 'Unlock higher limits up to ₹2,00,000 and enable P2P transfers with Full KYC verification.', icon: '🔒', type: 'alert', read: false, createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), actionPath: '/kyc', actionLabel: 'Upgrade KYC Now' },
    { id: '1', title: 'Welcome to Paytm Wallet', body: 'Your wallet is ready. Add money to get started!', icon: '👋', type: 'info', read: false, createdAt: new Date(Date.now() - 3600000).toISOString(), actionPath: '/wallet/add-money', actionLabel: 'Add Money' },
    { id: '2', title: 'KYC Verified', body: 'Your Full KYC is complete. Enjoy higher limits!', icon: '✅', type: 'info', read: true, createdAt: new Date(Date.now() - 86400000).toISOString(), actionPath: '/kyc', actionLabel: 'View KYC' },
    { id: '3', title: 'Set your budget', body: 'Track spending by category. Set monthly limits to stay on target.', icon: '🎯', type: 'info', read: false, createdAt: new Date(Date.now() - 7200000).toISOString(), actionPath: '/budget', actionLabel: 'Set Budget' },
  ],
  unreadCount: 4,

  add: (n) => {
    const notification: Notification = {
      ...n,
      id: Date.now().toString(),
      read: false,
      createdAt: new Date().toISOString(),
    };
    const items = [notification, ...get().items].slice(0, 50);
    set({ items, unreadCount: items.filter(i => !i.read).length });
  },

  markRead: (id) => {
    const items = get().items.map(i => i.id === id ? { ...i, read: true } : i);
    set({ items, unreadCount: items.filter(i => !i.read).length });
  },

  markAllRead: () => {
    const items = get().items.map(i => ({ ...i, read: true }));
    set({ items, unreadCount: 0 });
  },
}));
