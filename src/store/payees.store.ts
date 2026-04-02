import { create } from 'zustand';

const STORAGE_KEY = '__recent_payees';

export interface Payee {
  id: string;
  name: string;
  type: 'p2p' | 'merchant' | 'bank';
  detail: string; // wallet ID, merchant ID, or account number
  lastUsed: string;
  count: number;
}

interface PayeesState {
  payees: Payee[];
  addPayee: (payee: Omit<Payee, 'lastUsed' | 'count'>) => void;
  getRecent: (type?: Payee['type']) => Payee[];
  hydrate: () => void;
}

export const usePayeesStore = create<PayeesState>((set, get) => ({
  payees: [],

  addPayee: (p) => {
    const existing = get().payees.find(x => x.id === p.id && x.type === p.type);
    let payees: Payee[];
    if (existing) {
      payees = get().payees.map(x =>
        x.id === p.id && x.type === p.type
          ? { ...x, lastUsed: new Date().toISOString(), count: x.count + 1, name: p.name, detail: p.detail }
          : x
      );
    } else {
      payees = [{ ...p, lastUsed: new Date().toISOString(), count: 1 }, ...get().payees];
    }
    payees = payees.sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()).slice(0, 20);
    set({ payees });
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payees));
  },

  getRecent: (type) => {
    const all = get().payees;
    return type ? all.filter(p => p.type === type) : all;
  },

  hydrate: () => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) set({ payees: JSON.parse(stored) });
    } catch { /* ignore */ }
  },
}));
