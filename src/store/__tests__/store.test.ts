import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../auth.store';
import { useWalletStore } from '../wallet.store';

// Mock sync module
vi.mock('../../utils/sync', () => ({
  syncTransaction: vi.fn(),
  syncBalanceUpdate: vi.fn(),
  syncUserLogin: vi.fn(),
}));

describe('Auth Store', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('starts unauthenticated', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.walletId).toBeNull();
    expect(state.userId).toBeNull();
    expect(state.userName).toBeNull();
    expect(state.phone).toBeNull();
  });

  it('login sets all fields and persists to localStorage', () => {
    useAuthStore.getState().login('9876543210', 'Gaurav Sheth', 'wallet-123', 'user-123');
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.phone).toBe('9876543210');
    expect(state.userName).toBe('Gaurav Sheth');
    expect(state.walletId).toBe('wallet-123');
    expect(state.userId).toBe('user-123');

    // Check localStorage
    expect(localStorage.getItem('ppsl_phone')).toBe('9876543210');
    expect(localStorage.getItem('ppsl_user_name')).toBe('Gaurav Sheth');
    expect(localStorage.getItem('ppsl_wallet_id')).toBe('wallet-123');
    expect(localStorage.getItem('ppsl_user_id')).toBe('user-123');
  });

  it('logout clears all fields and localStorage', () => {
    useAuthStore.getState().login('9876543210', 'Test', 'w-1', 'u-1');
    useAuthStore.getState().logout();
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.phone).toBeNull();
    expect(state.walletId).toBeNull();
    expect(localStorage.getItem('ppsl_wallet_id')).toBeNull();
  });

  it('hydrate restores state from localStorage', () => {
    localStorage.setItem('ppsl_wallet_id', 'hydrated-wallet');
    localStorage.setItem('ppsl_user_id', 'hydrated-user');
    localStorage.setItem('ppsl_user_name', 'Hydrated');
    localStorage.setItem('ppsl_phone', '1111111111');

    useAuthStore.getState().hydrate();
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.walletId).toBe('hydrated-wallet');
    expect(state.userId).toBe('hydrated-user');
    expect(state.userName).toBe('Hydrated');
  });

  it('hydrate does not authenticate if no walletId', () => {
    useAuthStore.getState().hydrate();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});

describe('Wallet Store', () => {
  beforeEach(() => {
    useWalletStore.getState().reset();
  });

  it('starts with null values', () => {
    const state = useWalletStore.getState();
    expect(state.balancePaise).toBeNull();
    expect(state.heldPaise).toBeNull();
    expect(state.availablePaise).toBeNull();
    expect(state.kycTier).toBeNull();
    expect(state.isActive).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('reset clears all state back to defaults', () => {
    // Manually set some state via the store internals
    useWalletStore.setState({ balancePaise: '50000', isLoading: true, error: 'test' });
    useWalletStore.getState().reset();
    const state = useWalletStore.getState();
    expect(state.balancePaise).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });
});
