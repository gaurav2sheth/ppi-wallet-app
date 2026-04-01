import { useState, useEffect, useCallback } from 'react';
import { kycApi } from '../api/kyc.api';
import type { KycStatusResponse } from '../types/api.types';

export function useKycStatus(walletId: string | null) {
  const [status, setStatus] = useState<KycStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!walletId) return;
    setIsLoading(true);
    try {
      const data = await kycApi.getStatus(walletId);
      setStatus(data);
      setError(null);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Failed to fetch KYC status');
    } finally {
      setIsLoading(false);
    }
  }, [walletId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { status, isLoading, error, refetch: fetch };
}
