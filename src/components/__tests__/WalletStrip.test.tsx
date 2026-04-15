import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { WalletStrip } from '../wallet/WalletStrip';

// Mock the sync module
vi.mock('../../utils/sync', () => ({
  syncTransaction: vi.fn(),
  syncBalanceUpdate: vi.fn(),
  syncUserLogin: vi.fn(),
}));

// Mock the useBalance hook to avoid async wallet API calls
vi.mock('../../hooks/useBalance', () => ({
  useBalance: () => ({
    availablePaise: '23611',
    kycTier: 'FULL',
    isLoading: false,
    refetch: vi.fn(),
  }),
}));

// Mock auth store — Zustand stores can be called with or without a selector
vi.mock('../../store/auth.store', () => {
  const state = { walletId: 'test-wallet', isAuthenticated: true, userName: 'Test' };
  return { useAuthStore: (selector?: (s: typeof state) => unknown) => selector ? selector(state) : state };
});

function renderWalletStrip() {
  return render(
    <MemoryRouter>
      <WalletStrip />
    </MemoryRouter>
  );
}

describe('WalletStrip', () => {
  it('renders wallet balance label', () => {
    renderWalletStrip();
    expect(screen.getByText('Wallet Balance')).toBeInTheDocument();
  });

  it('shows KYC tier badge', () => {
    renderWalletStrip();
    expect(screen.getByText('Full KYC')).toBeInTheDocument();
  });

  it('renders Add Money section', () => {
    renderWalletStrip();
    expect(screen.getByText('Add Money to Wallet')).toBeInTheDocument();
  });

  it('renders quick add buttons', () => {
    renderWalletStrip();
    expect(screen.getByText('+ ₹100')).toBeInTheDocument();
    expect(screen.getByText('+ ₹500')).toBeInTheDocument();
    expect(screen.getByText('+ ₹1,000')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('shows sub-wallet list when expanded', () => {
    renderWalletStrip();
    // Click the balance button to expand
    const balanceButton = screen.getByText('Wallet Balance').closest('button')!;
    fireEvent.click(balanceButton);

    // Sub-wallets should now be visible
    expect(screen.getByText('Food Wallet')).toBeInTheDocument();
    expect(screen.getByText('NCMC Transit Wallet')).toBeInTheDocument();
    expect(screen.getByText('FASTag Wallet')).toBeInTheDocument();
    expect(screen.getByText('Gift Wallet')).toBeInTheDocument();
    expect(screen.getByText('Fuel Wallet')).toBeInTheDocument();
  });

  it('FASTag shows (Deposit) label', () => {
    renderWalletStrip();
    const balanceButton = screen.getByText('Wallet Balance').closest('button')!;
    fireEvent.click(balanceButton);
    expect(screen.getByText('(Deposit)')).toBeInTheDocument();
  });

  it('shows Popular badge on ₹1,000 button', () => {
    renderWalletStrip();
    expect(screen.getByText('Popular')).toBeInTheDocument();
  });
});
