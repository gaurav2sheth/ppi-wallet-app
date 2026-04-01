import { api, apiReachable } from './client';
import { mockApi } from './mock';
import type { LimitsCheckResponse, LimitsUsageResponse } from '../types/api.types';

export const limitsApi = {
  check: async (body: { wallet_id: string; txn_type: string; amount_paise: number }): Promise<LimitsCheckResponse> => {
    try {
      return await api.post('/limits/check', body);
    } catch (err) {
      if (!apiReachable) return {
        success: true, allowed: true, wallet_id: body.wallet_id,
        kyc_tier: 'FULL', txn_type: body.txn_type, amount_paise: body.amount_paise.toString(),
      };
      throw err;
    }
  },

  getUsage: async (walletId: string): Promise<LimitsUsageResponse> => {
    try {
      return await api.get(`/limits/usage/${walletId}`);
    } catch (err) {
      if (!apiReachable) return mockApi.getLimitsUsage(walletId);
      throw err;
    }
  },
};
