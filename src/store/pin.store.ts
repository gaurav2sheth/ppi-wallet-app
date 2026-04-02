import { create } from 'zustand';

const STORAGE_KEY = '__wallet_pin';

interface PinState {
  isSet: boolean;
  pin: string | null;
  setPin: (pin: string) => void;
  verify: (input: string) => boolean;
  hydrate: () => void;
}

export const usePinStore = create<PinState>((set, get) => ({
  isSet: false,
  pin: null,

  setPin: (pin: string) => {
    sessionStorage.setItem(STORAGE_KEY, pin);
    set({ isSet: true, pin });
  },

  verify: (input: string) => {
    return input === get().pin;
  },

  hydrate: () => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) set({ isSet: true, pin: stored });
  },
}));
