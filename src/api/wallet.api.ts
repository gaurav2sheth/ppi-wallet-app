import { api, apiReachable } from './client';
import { mockApi } from './mock';
import type { WalletBalanceResponse, LedgerResponse, WalletStatusResponse } from '../types/api.types';

export const walletApi = {
  getBalance: async (walletId: string): Promise<WalletBalanceResponse> => {
    try {
      if (!apiReachable) throw new Error('mock');
      return await api.get(`/wallet/balance/${walletId}`);
    } catch (err) {
      return mockApi.getBalance(walletId);
    }
  },

  getLedger: async (walletId: string, params?: {
    cursor?: string; limit?: number; entry_type?: string; from?: string; to?: string;
  }): Promise<LedgerResponse> => {
    try {
      if (!apiReachable) throw new Error('mock');
      return await api.get(`/wallet/ledger/${walletId}`, { params });
    } catch (err) {
      return mockApi.getLedger(walletId, params);
    }
  },

  getStatus: async (walletId: string): Promise<WalletStatusResponse> => {
    try {
      if (!apiReachable) throw new Error('mock');
      return await api.get(`/wallet/status/${walletId}`);
    } catch (err) {
      return mockApi.getWalletStatus(walletId);
    }
  },
};
