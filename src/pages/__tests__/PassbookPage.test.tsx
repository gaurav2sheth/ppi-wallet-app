import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PassbookPage } from '../PassbookPage';

// Mock sync
vi.mock('../../utils/sync', () => ({
  syncTransaction: vi.fn(),
  syncBalanceUpdate: vi.fn(),
  syncUserLogin: vi.fn(),
}));

// Mock auth store
vi.mock('../../store/auth.store', () => {
  const state = { walletId: 'test-wallet', isAuthenticated: true };
  return { useAuthStore: (sel?: (s: typeof state) => unknown) => sel ? sel(state) : state };
});

// Mock the useLedger hook with sample data
vi.mock('../../hooks/useLedger', () => ({
  useLedger: () => {
    const entries = [
      {
        id: 'entry-1',
        entry_type: 'DEBIT',
        amount_paise: '6500',
        balance_after_paise: '23611',
        held_paise_after: '0',
        transaction_type: 'MERCHANT_PAY',
        reference_id: null,
        description: 'Uber Ride',
        idempotency_key: 'idem-1',
        hold_id: null,
        created_at: '2026-04-11T10:29:00.000Z',
      },
      {
        id: 'entry-2',
        entry_type: 'CREDIT',
        amount_paise: '200000',
        balance_after_paise: '589411',
        held_paise_after: '0',
        transaction_type: 'ADD_MONEY',
        reference_id: null,
        description: 'Wallet Top-up',
        idempotency_key: 'idem-2',
        hold_id: null,
        created_at: '2026-04-06T15:00:00.000Z',
        payment_source: 'UPI - HDFC Bank 7125',
      },
    ];
    const grouped = new Map<string, typeof entries>();
    grouped.set('April 2026', entries);
    return {
      entries,
      groupedEntries: grouped,
      isLoading: false,
      hasMore: false,
      loadMore: vi.fn(),
      error: null,
      reset: vi.fn(),
    };
  },
}));

function renderPassbookPage() {
  return render(
    <MemoryRouter>
      <PassbookPage />
    </MemoryRouter>
  );
}

describe('PassbookPage', () => {
  it('renders the Payment History header', () => {
    renderPassbookPage();
    expect(screen.getByText('Payment History')).toBeInTheDocument();
  });

  it('renders filter pills', () => {
    renderPassbookPage();
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Credits')).toBeInTheDocument();
    expect(screen.getByText('Debits')).toBeInTheDocument();
  });

  it('renders transaction descriptions', () => {
    renderPassbookPage();
    expect(screen.getByText('Uber Ride')).toBeInTheDocument();
    expect(screen.getByText('Wallet Top-up')).toBeInTheDocument();
  });

  it('renders transaction amounts in rupee format', () => {
    renderPassbookPage();
    // ₹65.00 for 6500 paise and ₹2,000.00 for 200000 paise
    const allText = document.body.textContent || '';
    expect(allText).toContain('₹65.00');
    expect(allText).toContain('₹2,000.00');
  });

  it('renders month group header', () => {
    renderPassbookPage();
    expect(screen.getByText('April 2026')).toBeInTheDocument();
  });
});
