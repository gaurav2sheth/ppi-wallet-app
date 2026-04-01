import { useEffect } from 'react';
import { useWalletStore } from '../store/wallet.store';

export function useBalance(walletId: string | null) {
  const { balancePaise, heldPaise, availablePaise, kycTier, isActive, isLoading, error, fetchBalance } = useWalletStore();

  useEffect(() => {
    if (walletId) fetchBalance(walletId);
  }, [walletId, fetchBalance]);

  return { balancePaise, heldPaise, availablePaise, kycTier, isActive, isLoading, error, refetch: () => walletId ? fetchBalance(walletId) : Promise.resolve() };
}
