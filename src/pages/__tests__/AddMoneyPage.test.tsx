import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AddMoneyPage } from '../AddMoneyPage';

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

// Mock useBalance
vi.mock('../../hooks/useBalance', () => ({
  useBalance: () => ({
    availablePaise: '23611',
    kycTier: 'FULL',
    isLoading: false,
    refetch: vi.fn(),
  }),
}));

// Mock useTransaction
vi.mock('../../hooks/useTransaction', () => ({
  useTransaction: () => ({
    execute: vi.fn(),
    isLoading: false,
    result: null,
    error: null,
    reset: vi.fn(),
  }),
}));

// Mock saga api
vi.mock('../../api/saga.api', () => ({
  sagaApi: {
    addMoney: vi.fn(),
  },
}));

function renderAddMoneyPage() {
  return render(
    <MemoryRouter>
      <AddMoneyPage />
    </MemoryRouter>
  );
}

describe('AddMoneyPage', () => {
  it('renders the Add Money header', () => {
    renderAddMoneyPage();
    expect(screen.getByText('Add Money')).toBeInTheDocument();
  });

  it('renders current balance', () => {
    renderAddMoneyPage();
    expect(screen.getByText('Current Balance')).toBeInTheDocument();
    // ₹236.11
    expect(screen.getByText('₹236.11')).toBeInTheDocument();
  });

  it('renders amount input with label', () => {
    renderAddMoneyPage();
    expect(screen.getByText('Enter amount to add')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0')).toBeInTheDocument();
  });

  it('Continue button is disabled when amount is empty', () => {
    renderAddMoneyPage();
    const button = screen.getByText('Continue');
    expect(button).toBeDisabled();
  });

  it('preset amount buttons are rendered', () => {
    renderAddMoneyPage();
    expect(screen.getByText('₹100')).toBeInTheDocument();
    expect(screen.getByText('₹500')).toBeInTheDocument();
    expect(screen.getByText('₹1,000')).toBeInTheDocument();
    expect(screen.getByText('₹2,000')).toBeInTheDocument();
  });

  it('clicking a preset button fills the amount input', () => {
    renderAddMoneyPage();
    const preset500 = screen.getByText('₹500');
    fireEvent.click(preset500);
    const input = screen.getByPlaceholderText('0') as HTMLInputElement;
    expect(input.value).toBe('500');
  });

  it('Continue button enables when amount is entered', () => {
    renderAddMoneyPage();
    const input = screen.getByPlaceholderText('0');
    fireEvent.change(input, { target: { value: '100' } });
    const button = screen.getByText('Continue');
    expect(button).not.toBeDisabled();
  });

  it('typing non-numeric input is rejected', () => {
    renderAddMoneyPage();
    const input = screen.getByPlaceholderText('0') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'abc' } });
    // AmountInput only allows digits and decimal
    expect(input.value).toBe('');
  });
});
