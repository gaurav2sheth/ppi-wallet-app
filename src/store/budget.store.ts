import { create } from 'zustand';

const STORAGE_KEY = '__budget_limits';

export interface BudgetLimit {
  category: string;
  limitPaise: number;
  icon: string;
}

interface BudgetState {
  limits: BudgetLimit[];
  monthlyCapPaise: number;
  setMonthlyCapPaise: (paise: number) => void;
  setLimit: (category: string, limitPaise: number, icon: string) => void;
  removeLimit: (category: string) => void;
  hydrate: () => void;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  limits: [],
  monthlyCapPaise: 0,

  setMonthlyCapPaise: (paise: number) => {
    set({ monthlyCapPaise: paise });
    persist(get());
  },

  setLimit: (category: string, limitPaise: number, icon: string) => {
    const limits = get().limits.filter(l => l.category !== category);
    limits.push({ category, limitPaise, icon });
    set({ limits });
    persist(get());
  },

  removeLimit: (category: string) => {
    set({ limits: get().limits.filter(l => l.category !== category) });
    persist(get());
  },

  hydrate: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        set({ limits: data.limits ?? [], monthlyCapPaise: data.monthlyCapPaise ?? 0 });
      }
    } catch { /* ignore */ }
  },
}));

function persist(state: { limits: BudgetLimit[]; monthlyCapPaise: number }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ limits: state.limits, monthlyCapPaise: state.monthlyCapPaise }));
}
