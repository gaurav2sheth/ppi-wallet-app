import { create } from 'zustand';
import { STORAGE_KEYS } from '../utils/constants';

interface AuthState {
  isAuthenticated: boolean;
  walletId: string | null;
  userId: string | null;
  userName: string | null;
  phone: string | null;
  login: (phone: string, name: string, walletId: string, userId: string) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  walletId: null,
  userId: null,
  userName: null,
  phone: null,

  login: (phone, name, walletId, userId) => {
    localStorage.setItem(STORAGE_KEYS.PHONE, phone);
    localStorage.setItem(STORAGE_KEYS.USER_NAME, name);
    localStorage.setItem(STORAGE_KEYS.WALLET_ID, walletId);
    localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
    set({ isAuthenticated: true, phone, userName: name, walletId, userId });
  },

  logout: () => {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
    set({ isAuthenticated: false, phone: null, userName: null, walletId: null, userId: null });
  },

  hydrate: () => {
    const walletId = localStorage.getItem(STORAGE_KEYS.WALLET_ID);
    const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    const userName = localStorage.getItem(STORAGE_KEYS.USER_NAME);
    const phone = localStorage.getItem(STORAGE_KEYS.PHONE);
    if (walletId && userId) {
      set({ isAuthenticated: true, walletId, userId, userName, phone });
    }
  },
}));
