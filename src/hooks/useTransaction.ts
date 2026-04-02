import { useState, useCallback } from 'react';
import { useAuthStore } from '../store/auth.store';
import { useWalletStore } from '../store/wallet.store';
import { useRewardsStore } from '../store/rewards.store';
import { useNotificationsStore } from '../store/notifications.store';
import type { SagaResponse, ApiError } from '../types/api.types';
import { formatPaise } from '../utils/format';

export function useTransaction() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SagaResponse | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [pendingPin, setPendingPin] = useState<(() => Promise<SagaResponse>) | null>(null);
  const walletId = useAuthStore(s => s.walletId);
  const fetchBalance = useWalletStore(s => s.fetchBalance);
  const addCard = useRewardsStore(s => s.addCard);
  const addNotification = useNotificationsStore(s => s.add);

  const doExecute = async (apiCall: () => Promise<SagaResponse>) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiCall();
      setResult(res);
      if (walletId) fetchBalance(walletId);

      // Trigger scratch card reward
      if (res.status === 'COMPLETED') {
        const amountPaise = parseInt((res.result as Record<string, string>)?.balance_after_paise ?? '0');
        addCard(amountPaise > 0 ? amountPaise : 10000);

        // Add transaction notification
        const type = res.saga_type;
        const isCredit = type === 'ADD_MONEY';
        addNotification({
          title: isCredit ? 'Money Added' : 'Payment Successful',
          body: `${isCredit ? 'Added' : 'Paid'} ${formatPaise((res.result as Record<string, string>)?.balance_after_paise ?? '0')} via ${type.replace(/_/g, ' ').toLowerCase()}`,
          icon: isCredit ? '💰' : '✅',
          type: isCredit ? 'credit' : 'debit',
        });
      }

      return res;
    } catch (err) {
      setError(err as ApiError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const execute = useCallback((apiCall: () => Promise<SagaResponse>) => {
    return doExecute(apiCall);
  }, [walletId]);

  const executeWithPin = useCallback((apiCall: () => Promise<SagaResponse>) => {
    setPendingPin(() => apiCall);
  }, []);

  const onPinVerified = useCallback(async () => {
    if (pendingPin) {
      const call = pendingPin;
      setPendingPin(null);
      return doExecute(call);
    }
  }, [pendingPin, walletId]);

  const cancelPin = useCallback(() => setPendingPin(null), []);

  const reset = () => { setResult(null); setError(null); setIsLoading(false); setPendingPin(null); };

  return {
    execute,
    executeWithPin,
    onPinVerified,
    cancelPin,
    isPinPending: pendingPin !== null,
    isLoading,
    result,
    error,
    reset,
  };
}
