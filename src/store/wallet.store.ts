import { create } from 'zustand';
import { walletApi } from '../api/wallet.api';

interface WalletState {
  balancePaise: string | null;
  heldPaise: string | null;
  availablePaise: string | null;
  kycTier: 'MINIMUM' | 'FULL' | null;
  isActive: boolean;
  isLoading: boolean;
  error: string | null;
  fetchBalance: (walletId: string) => Promise<void>;
  reset: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  balancePaise: null,
  heldPaise: null,
  availablePaise: null,
  kycTier: null,
  isActive: false,
  isLoading: false,
  error: null,

  fetchBalance: async (walletId: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await walletApi.getBalance(walletId);
      set({
        balancePaise: data.balance_paise,
        heldPaise: data.held_paise,
        availablePaise: data.available_paise,
        kycTier: data.kyc_tier,
        isActive: data.is_active,
        isLoading: false,
      });
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? 'Failed to fetch balance';
      set({ error: message, isLoading: false });
    }
  },

  reset: () => set({
    balancePaise: null, heldPaise: null, availablePaise: null,
    kycTier: null, isActive: false, isLoading: false, error: null,
  }),
}));
