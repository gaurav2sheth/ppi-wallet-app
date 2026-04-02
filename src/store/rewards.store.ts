import { create } from 'zustand';

export interface ScratchCard {
  id: string;
  amount: number; // cashback in paise
  label: string;
  scratched: boolean;
  createdAt: string;
}

interface RewardsState {
  scratchCards: ScratchCard[];
  totalCashback: number; // paise
  pendingCard: ScratchCard | null;
  addCard: (txnAmount: number) => void;
  scratchCard: (id: string) => void;
  dismissCard: () => void;
}

function randomCashback(txnPaise: number): number {
  const rate = Math.random();
  if (rate < 0.3) return 0; // 30% no cashback
  if (rate < 0.7) return Math.min(Math.round(txnPaise * 0.02), 5000); // 40% get 2% up to ₹50
  if (rate < 0.9) return Math.min(Math.round(txnPaise * 0.05), 10000); // 20% get 5% up to ₹100
  return Math.min(Math.round(txnPaise * 0.10), 20000); // 10% get 10% up to ₹200
}

function cashbackLabel(paise: number): string {
  if (paise === 0) return 'Better luck next time!';
  const rupees = (paise / 100).toFixed(paise % 100 === 0 ? 0 : 2);
  return `₹${rupees} Cashback!`;
}

export const useRewardsStore = create<RewardsState>((set, get) => ({
  scratchCards: [],
  totalCashback: 0,
  pendingCard: null,

  addCard: (txnAmount: number) => {
    const amount = randomCashback(txnAmount);
    const card: ScratchCard = {
      id: Date.now().toString(),
      amount,
      label: cashbackLabel(amount),
      scratched: false,
      createdAt: new Date().toISOString(),
    };
    set({ pendingCard: card, scratchCards: [card, ...get().scratchCards].slice(0, 20) });
  },

  scratchCard: (id: string) => {
    const cards = get().scratchCards.map(c => c.id === id ? { ...c, scratched: true } : c);
    const card = cards.find(c => c.id === id);
    set({
      scratchCards: cards,
      totalCashback: get().totalCashback + (card?.amount ?? 0),
    });
  },

  dismissCard: () => set({ pendingCard: null }),
}));
