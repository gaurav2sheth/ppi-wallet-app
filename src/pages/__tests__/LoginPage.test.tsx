import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../LoginPage';

// Mock sync
vi.mock('../../utils/sync', () => ({
  syncTransaction: vi.fn(),
  syncBalanceUpdate: vi.fn(),
  syncUserLogin: vi.fn(),
}));

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
}

describe('LoginPage', () => {
  it('renders the welcome screen with phone input', () => {
    renderLoginPage();
    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.getByText('Enter your mobile number to get started')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Mobile number')).toBeInTheDocument();
    expect(screen.getByText('+91')).toBeInTheDocument();
  });

  it('renders the Paytm branding', () => {
    renderLoginPage();
    expect(screen.getByText('Paytm')).toBeInTheDocument();
    expect(screen.getByText('PPI Wallet')).toBeInTheDocument();
  });

  it('Get OTP button is disabled when phone is empty', () => {
    renderLoginPage();
    const button = screen.getByText('Get OTP');
    expect(button).toBeDisabled();
  });

  it('Get OTP button is disabled for incomplete phone number', () => {
    renderLoginPage();
    const input = screen.getByPlaceholderText('Mobile number');
    fireEvent.change(input, { target: { value: '98765' } });
    const button = screen.getByText('Get OTP');
    expect(button).toBeDisabled();
  });

  it('Get OTP button enables when 10-digit phone is entered', () => {
    renderLoginPage();
    const input = screen.getByPlaceholderText('Mobile number');
    fireEvent.change(input, { target: { value: '9876543210' } });
    const button = screen.getByText('Get OTP');
    expect(button).not.toBeDisabled();
  });

  it('submitting valid phone advances to OTP step', () => {
    renderLoginPage();
    const input = screen.getByPlaceholderText('Mobile number');
    fireEvent.change(input, { target: { value: '9876543210' } });
    const form = input.closest('form')!;
    fireEvent.submit(form);

    expect(screen.getByText('Verify OTP')).toBeInTheDocument();
    expect(screen.getByText(/Enter the 6-digit code/)).toBeInTheDocument();
  });

  it('strips non-digit characters from phone input', () => {
    renderLoginPage();
    const input = screen.getByPlaceholderText('Mobile number') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '98abc76543210' } });
    // Only digits are kept, maxLength=10
    expect(input.value).toBe('9876543210');
  });
});
