import { api, apiReachable } from './client';
import { mockApi } from './mock';
import type { WalletBalanceResponse, LedgerResponse, WalletStatusResponse } from '../types/api.types';

export const walletApi = {
  getBalance: async (walletId: string): Promise<WalletBalanceResponse> => {
    try {
      return await api.get(`/wallet/balance/${walletId}`);
    } catch (err) {
      if (!apiReachable) return mockApi.getBalance(walletId);
      throw err;
    }
  },

  getLedger: async (walletId: string, params?: {
    cursor?: string; limit?: number; entry_type?: string; from?: string; to?: string;
  }): Promise<LedgerResponse> => {
    try {
      return await api.get(`/wallet/ledger/${walletId}`, { params });
    } catch (err) {
      if (!apiReachable) return mockApi.getLedger(walletId, params);
      throw err;
    }
  },

  getStatus: async (walletId: string): Promise<WalletStatusResponse> => {
    try {
      return await api.get(`/wallet/status/${walletId}`);
    } catch (err) {
      if (!apiReachable) return mockApi.getWalletStatus(walletId);
      throw err;
    }
  },
};
