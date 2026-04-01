import { useState } from 'react';
import { useAuthStore } from '../store/auth.store';
import { useWalletStore } from '../store/wallet.store';
import type { SagaResponse, ApiError } from '../types/api.types';

export function useTransaction() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SagaResponse | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const walletId = useAuthStore(s => s.walletId);
  const fetchBalance = useWalletStore(s => s.fetchBalance);

  const execute = async (apiCall: () => Promise<SagaResponse>) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiCall();
      setResult(res);
      if (walletId) fetchBalance(walletId);
      return res;
    } catch (err) {
      setError(err as ApiError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => { setResult(null); setError(null); setIsLoading(false); };

  return { execute, isLoading, result, error, reset };
}
