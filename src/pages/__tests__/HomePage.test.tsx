import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from '../HomePage';

// Mock sync
vi.mock('../../utils/sync', () => ({
  syncTransaction: vi.fn(),
  syncBalanceUpdate: vi.fn(),
  syncUserLogin: vi.fn(),
}));

// Mock useBalance hook
vi.mock('../../hooks/useBalance', () => ({
  useBalance: () => ({
    availablePaise: '23611',
    kycTier: 'FULL',
    isLoading: false,
    refetch: vi.fn(),
  }),
}));

// Mock auth store
vi.mock('../../store/auth.store', () => {
  const state = { walletId: 'test-wallet', isAuthenticated: true, userName: 'Test User', phone: '9999999999' };
  return { useAuthStore: (sel?: (s: typeof state) => unknown) => sel ? sel(state) : state };
});

// Mock notifications store
vi.mock('../../store/notifications.store', () => {
  const state = { unreadCount: 2 };
  return { useNotificationsStore: (sel?: (s: typeof state) => unknown) => sel ? sel(state) : state };
});

// Mock rewards store
vi.mock('../../store/rewards.store', () => {
  const state = { totalCashback: 5000, scratchCards: [1, 2, 3] };
  return { useRewardsStore: (sel?: (s: typeof state) => unknown) => sel ? sel(state) : state };
});

// Mock AiSummaryCard and AiChatCard since they may have complex dependencies
vi.mock('../../components/wallet/AiSummaryCard', () => ({
  AiSummaryCard: () => <div data-testid="ai-summary">AI Summary</div>,
}));

vi.mock('../../components/wallet/AiChatCard', () => ({
  AiChatCard: () => <div data-testid="ai-chat">AI Chat</div>,
}));

function renderHomePage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
  );
}

describe('HomePage', () => {
  it('renders money transfer actions', () => {
    renderHomePage();
    expect(screen.getByText('Scan QR')).toBeInTheDocument();
    expect(screen.getByText('Pay Anyone')).toBeInTheDocument();
    expect(screen.getByText('Bank Transfer')).toBeInTheDocument();
    expect(screen.getByText('Balance & History')).toBeInTheDocument();
  });

  it('renders the MONEY TRANSFER section label', () => {
    renderHomePage();
    expect(screen.getByText('MONEY TRANSFER')).toBeInTheDocument();
  });

  it('renders recharge and bills section', () => {
    renderHomePage();
    expect(screen.getByText('RECHARGE & BILLS')).toBeInTheDocument();
    expect(screen.getByText('Mobile Recharge')).toBeInTheDocument();
    expect(screen.getByText('Electricity')).toBeInTheDocument();
  });

  it('renders promo banner', () => {
    renderHomePage();
    expect(screen.getByText('Get up to ₹200 Cashback')).toBeInTheDocument();
    expect(screen.getByText('Claim Now')).toBeInTheDocument();
  });

  it('renders the WalletStrip (shows Add Money to Wallet)', () => {
    renderHomePage();
    expect(screen.getByText('Add Money to Wallet')).toBeInTheDocument();
  });

  it('renders rewards info', () => {
    renderHomePage();
    // totalCashback is 5000 paise = ₹50
    expect(screen.getByText('₹50')).toBeInTheDocument();
    // 3 scratch cards
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
