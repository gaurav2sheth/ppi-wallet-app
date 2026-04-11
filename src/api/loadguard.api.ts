import { api, apiReachable } from './client';
import { mockValidateLoad, mockGetMaxLoadRoom, type LoadGuardResult } from './mock';

export async function validateLoad(userId: string, amountRupees: number): Promise<LoadGuardResult> {
  try {
    // Try the vite dev middleware first (same origin)
    const res = await fetch('/api/wallet/validate-load', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, amount: amountRupees }),
    });
    if (res.ok) return res.json();
    // Only trust 400 input validation errors; for 404/500, fall through to mock
    if (res.status === 400) {
      const errData = await res.json().catch(() => null);
      if (errData?.error) return errData;
    }
  } catch {
    // Vite middleware not available — try API server
  }

  try {
    if (apiReachable) {
      return await api.post('/wallet/validate-load', { user_id: userId, amount: amountRupees });
    }
  } catch {
    // API server not available either
  }

  // Fallback to client-side mock validation
  return mockValidateLoad(amountRupees);
}

export function getMaxLoadRoom(): { max_room: number; current_balance: number; monthly_loaded: number; kyc_tier: string } {
  return mockGetMaxLoadRoom();
}
