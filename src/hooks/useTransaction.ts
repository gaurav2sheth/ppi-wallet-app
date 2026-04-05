import { useState, useRef, useCallback } from 'react';
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
  const [isPinPending, setIsPinPending] = useState(false);
  const pendingCallRef = useRef<(() => Promise<SagaResponse>) | null>(null);

  const doExecute = useCallback(async (apiCall: () => Promise<SagaResponse>) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiCall();
      setResult(res);
      const wid = useAuthStore.getState().walletId;
      if (wid) useWalletStore.getState().fetchBalance(wid);

      if (res.status === 'COMPLETED') {
        const amountPaise = parseInt((res.result as Record<string, string>)?.balance_after_paise ?? '0');
        useRewardsStore.getState().addCard(amountPaise > 0 ? amountPaise : 10000);

        const type = res.saga_type;
        const isCredit = type === 'ADD_MONEY';
        useNotificationsStore.getState().add({
          title: isCredit ? 'Money Added' : 'Payment Successful',
          body: `${isCredit ? 'Added' : 'Paid'} ${formatPaise((res.result as Record<string, string>)?.balance_after_paise ?? '0')} via ${type.replace(/_/g, ' ').toLowerCase()}`,
          icon: isCredit ? '💰' : '✅',
          type: isCredit ? 'credit' : 'debit',
          actionPath: '/passbook',
          actionLabel: 'View History',
        });
      }

      return res;
    } catch (err) {
      setError(err as ApiError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const execute = useCallback((apiCall: () => Promise<SagaResponse>) => {
    return doExecute(apiCall);
  }, [doExecute]);

  const executeWithPin = useCallback((apiCall: () => Promise<SagaResponse>) => {
    pendingCallRef.current = apiCall;
    setIsPinPending(true);
  }, []);

  const onPinVerified = useCallback(async () => {
    const call = pendingCallRef.current;
    pendingCallRef.current = null;
    setIsPinPending(false);
    if (call) return doExecute(call);
  }, [doExecute]);

  const cancelPin = useCallback(() => {
    pendingCallRef.current = null;
    setIsPinPending(false);
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsLoading(false);
    setIsPinPending(false);
    pendingCallRef.current = null;
  }, []);

  return {
    execute,
    executeWithPin,
    onPinVerified,
    cancelPin,
    isPinPending,
    isLoading,
    result,
    error,
    reset,
  };
}
