import { describe, it, expect, beforeEach } from 'vitest';
import {
  mockApi,
  mockGetSubWallets,
  mockGetSubWalletDetail,
  mockAddMoneyToSubWallet,
  mockFastagTransaction,
  mockIssueFastag,
  mockValidateLoad,
  mockCheckEligibility,
  mockFindBestSubWallet,
  type SubWallet,
} from '../mock';

// We need to mock the sync module since it uses import.meta.env
vi.mock('../../utils/sync', () => ({
  syncTransaction: vi.fn(),
  syncBalanceUpdate: vi.fn(),
  syncUserLogin: vi.fn(),
}));

describe('Mock Data Layer', () => {
  describe('Initial seeding', () => {
    it('seeds default balance of 23611 paise (₹236.11)', () => {
      const balance = mockApi.getBalance('test-wallet');
      expect(balance.balance_paise).toBe('23611');
      expect(balance.success).toBe(true);
      expect(balance.kyc_tier).toBe('FULL');
      expect(balance.is_active).toBe(true);
    });

    it('seeds 12 historical ledger entries', () => {
      const ledger = mockApi.getLedger('test-wallet');
      expect(ledger.entries.length).toBe(12);
      expect(ledger.success).toBe(true);
    });

    it('ledger entries have required fields', () => {
      const ledger = mockApi.getLedger('test-wallet');
      const entry = ledger.entries[0];
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('entry_type');
      expect(entry).toHaveProperty('amount_paise');
      expect(entry).toHaveProperty('balance_after_paise');
      expect(entry).toHaveProperty('transaction_type');
      expect(entry).toHaveProperty('idempotency_key');
      expect(entry).toHaveProperty('created_at');
    });

    it('ledger supports entry_type filtering', () => {
      const credits = mockApi.getLedger('test-wallet', { entry_type: 'CREDIT' });
      credits.entries.forEach(e => expect(e.entry_type).toBe('CREDIT'));
      const debits = mockApi.getLedger('test-wallet', { entry_type: 'DEBIT' });
      debits.entries.forEach(e => expect(e.entry_type).toBe('DEBIT'));
    });
  });

  describe('sagaSuccess', () => {
    it('creates a CREDIT entry for ADD_MONEY and increases balance', () => {
      const initialBalance = Number(mockApi.getBalance('w').balance_paise);
      const result = mockApi.sagaSuccess('ADD_MONEY', 10000, true, 'Wallet Top-up', 'UPI');
      expect(result.success).toBe(true);
      expect(result.status).toBe('COMPLETED');
      expect(result.saga_type).toBe('ADD_MONEY');

      const newBalance = Number(mockApi.getBalance('w').balance_paise);
      expect(newBalance).toBe(initialBalance + 10000);

      // Verify ledger entry was created
      const ledger = mockApi.getLedger('w');
      const latest = ledger.entries[0];
      expect(latest.entry_type).toBe('CREDIT');
      expect(latest.amount_paise).toBe('10000');
      expect(latest.transaction_type).toBe('ADD_MONEY');
      expect(latest.payment_source).toBe('UPI');
    });

    it('creates a DEBIT entry for MERCHANT_PAY and decreases balance', () => {
      const initialBalance = Number(mockApi.getBalance('w').balance_paise);
      const result = mockApi.sagaSuccess('MERCHANT_PAY', 5000, false, 'Swiggy Order');
      expect(result.success).toBe(true);

      const newBalance = Number(mockApi.getBalance('w').balance_paise);
      expect(newBalance).toBe(initialBalance - 5000);

      const ledger = mockApi.getLedger('w');
      const latest = ledger.entries[0];
      expect(latest.entry_type).toBe('DEBIT');
      expect(latest.amount_paise).toBe('5000');
      expect(latest.transaction_type).toBe('MERCHANT_PAY');
    });

    it('throws error for insufficient balance', () => {
      // Set balance to something small
      mockApi.sagaSuccess('ADD_MONEY', 0, true); // trigger seed
      const balance = Number(mockApi.getBalance('w').balance_paise);
      expect(() => {
        mockApi.sagaSuccess('MERCHANT_PAY', balance + 100000, false, 'Too expensive');
      }).toThrow();
    });
  });

  describe('Sub-wallets', () => {
    it('getSubWallets returns 5 sub-wallets', () => {
      const data = mockGetSubWallets();
      expect(data.sub_wallets).toHaveLength(5);
      const types = data.sub_wallets.map(s => s.type);
      expect(types).toContain('FOOD');
      expect(types).toContain('NCMC TRANSIT');
      expect(types).toContain('FASTAG');
      expect(types).toContain('GIFT');
      expect(types).toContain('FUEL');
    });

    it('getSubWallets returns correct seed balances', () => {
      const data = mockGetSubWallets();
      const byType = (t: string) => data.sub_wallets.find(s => s.type === t)!;
      expect(byType('FOOD').balance_paise).toBe(120000);     // ₹1,200
      expect(byType('NCMC TRANSIT').balance_paise).toBe(180000); // ₹1,800
      expect(byType('FASTAG').balance_paise).toBe(60000);    // ₹600
      expect(byType('GIFT').balance_paise).toBe(200000);     // ₹2,000
      expect(byType('FUEL').balance_paise).toBe(150000);     // ₹1,500
    });

    it('getSubWalletDetail returns correct sub-wallet by type', () => {
      const food = mockGetSubWalletDetail('FOOD');
      expect(food).not.toBeNull();
      expect(food!.type).toBe('FOOD');
      expect(food!.label).toBe('Food');
    });

    it('getSubWalletDetail returns null for non-existent type', () => {
      const notFound = mockGetSubWalletDetail('NONEXISTENT');
      expect(notFound).toBeNull();
    });

    it('total_benefits_paise sums all sub-wallet balances', () => {
      const data = mockGetSubWallets();
      const expected = data.sub_wallets.reduce((s, w) => s + w.balance_paise, 0);
      expect(data.total_benefits_paise).toBe(expected);
    });
  });

  describe('NCMC sub-wallet', () => {
    it('caps balance at ₹3,000 (300000 paise)', () => {
      // Ensure main wallet has enough balance first
      mockApi.sagaSuccess('ADD_MONEY', 500000, true);

      const ncmc = mockGetSubWalletDetail('NCMC TRANSIT')!;
      expect(ncmc.max_balance_paise).toBe(300000);

      // Current balance 180000, headroom is 120000
      const headroom = 300000 - ncmc.balance_paise;
      expect(headroom).toBe(120000);

      // Try to add more than headroom
      const result = mockAddMoneyToSubWallet('NCMC TRANSIT', headroom + 10000);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Can only add');
    });

    it('allows adding money up to the cap', () => {
      // Seed main wallet with enough balance
      mockApi.sagaSuccess('ADD_MONEY', 500000, true);
      const ncmc = mockGetSubWalletDetail('NCMC TRANSIT')!;
      const headroom = 300000 - ncmc.balance_paise;
      const result = mockAddMoneyToSubWallet('NCMC TRANSIT', headroom);
      expect(result.success).toBe(true);

      const updated = mockGetSubWalletDetail('NCMC TRANSIT')!;
      expect(updated.balance_paise).toBe(300000);
    });

    it('rejects load when already at max balance', () => {
      // First fill it up
      mockApi.sagaSuccess('ADD_MONEY', 500000, true);
      const ncmc = mockGetSubWalletDetail('NCMC TRANSIT')!;
      const headroom = 300000 - ncmc.balance_paise;
      if (headroom > 0) mockAddMoneyToSubWallet('NCMC TRANSIT', headroom);

      const result = mockAddMoneyToSubWallet('NCMC TRANSIT', 1000);
      expect(result.success).toBe(false);
      expect(result.message).toContain('maximum balance');
    });
  });

  describe('FASTag sub-wallet', () => {
    it('has security deposit fields', () => {
      const fastag = mockGetSubWalletDetail('FASTAG')!;
      expect(fastag.is_security_deposit).toBe(true);
      expect(fastag.vehicle_count).toBe(2);
      expect(fastag.security_deposit_per_vehicle_paise).toBe(30000);
      expect(fastag.security_deposit_used_paise).toBe(0);
    });

    it('toll transaction deducts from main wallet first', () => {
      // Ensure main wallet has funds
      mockApi.sagaSuccess('ADD_MONEY', 100000, true);
      const mainBefore = Number(mockApi.getBalance('w').balance_paise);
      const fastagBefore = mockGetSubWalletDetail('FASTAG')!.balance_paise;

      const result = mockFastagTransaction(5000, 'Mumbai Expressway');
      expect(result.success).toBe(true);
      expect(result.source).toBe('Main Wallet');

      const mainAfter = Number(mockApi.getBalance('w').balance_paise);
      expect(mainAfter).toBe(mainBefore - 5000);

      // FASTag deposit should be unchanged
      const fastagAfter = mockGetSubWalletDetail('FASTAG')!.balance_paise;
      expect(fastagAfter).toBe(fastagBefore);
    });

    it('falls back to security deposit when main wallet is 0', () => {
      // Drain main wallet to 0
      const mainBal = Number(mockApi.getBalance('w').balance_paise);
      if (mainBal > 0) {
        mockApi.sagaSuccess('MERCHANT_PAY', mainBal, false, 'Drain');
      }
      expect(Number(mockApi.getBalance('w').balance_paise)).toBe(0);

      const fastagBefore = mockGetSubWalletDetail('FASTAG')!.balance_paise;
      const result = mockFastagTransaction(10000, 'Toll Plaza');
      expect(result.success).toBe(true);
      expect(result.source).toBe('Security Deposit');

      const fastagAfter = mockGetSubWalletDetail('FASTAG')!;
      expect(fastagAfter.balance_paise).toBe(fastagBefore - 10000);
      expect(fastagAfter.security_deposit_used_paise).toBe(10000);
    });

    it('Add Money refills security deposit first', () => {
      // Drain main wallet
      const mainBal = Number(mockApi.getBalance('w').balance_paise);
      if (mainBal > 0) {
        mockApi.sagaSuccess('MERCHANT_PAY', mainBal, false, 'Drain');
      }
      // Use some security deposit
      mockFastagTransaction(15000, 'Toll');

      const fastagBefore = mockGetSubWalletDetail('FASTAG')!;
      const depositUsed = fastagBefore.security_deposit_used_paise!;
      expect(depositUsed).toBeGreaterThan(0);

      // Add money to FASTag (goes to main + refills deposit)
      const result = mockAddMoneyToSubWallet('FASTAG', 50000);
      expect(result.success).toBe(true);

      const fastagAfter = mockGetSubWalletDetail('FASTAG')!;
      // Deposit should be refilled (used reduced)
      expect(fastagAfter.security_deposit_used_paise!).toBeLessThan(depositUsed);
    });

    it('mockIssueFastag creates new vehicle with ₹300 deposit', () => {
      // Ensure main wallet has enough
      mockApi.sagaSuccess('ADD_MONEY', 100000, true);
      const mainBefore = Number(mockApi.getBalance('w').balance_paise);
      const fastagBefore = mockGetSubWalletDetail('FASTAG')!;
      const vehiclesBefore = fastagBefore.vehicle_count!;

      const result = mockIssueFastag('MH-01-ZZ-9999');
      expect(result.success).toBe(true);
      expect(result.message).toContain('MH-01-ZZ-9999');

      const fastagAfter = mockGetSubWalletDetail('FASTAG')!;
      expect(fastagAfter.vehicle_count).toBe(vehiclesBefore + 1);
      expect(fastagAfter.balance_paise).toBe(fastagBefore.balance_paise + 30000);

      // Main wallet should be deducted ₹300
      const mainAfter = Number(mockApi.getBalance('w').balance_paise);
      expect(mainAfter).toBe(mainBefore - 30000);
    });

    it('mockIssueFastag fails with insufficient main wallet balance', () => {
      // Drain main wallet
      const mainBal = Number(mockApi.getBalance('w').balance_paise);
      if (mainBal > 0) {
        mockApi.sagaSuccess('MERCHANT_PAY', mainBal, false, 'Drain');
      }
      const result = mockIssueFastag('MH-01-AA-0000');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Insufficient');
    });
  });

  describe('Self-load restrictions', () => {
    it('rejects self-load for FOOD wallet', () => {
      const result = mockAddMoneyToSubWallet('FOOD', 10000);
      expect(result.success).toBe(false);
      expect(result.message).toContain('not allowed');
    });

    it('rejects self-load for FUEL wallet', () => {
      const result = mockAddMoneyToSubWallet('FUEL', 10000);
      expect(result.success).toBe(false);
      expect(result.message).toContain('not allowed');
    });

    it('allows self-load for GIFT wallet', () => {
      mockApi.sagaSuccess('ADD_MONEY', 500000, true);
      const result = mockAddMoneyToSubWallet('GIFT', 10000);
      expect(result.success).toBe(true);
    });
  });

  describe('Load Guard (mockValidateLoad)', () => {
    it('allows a valid small load', () => {
      const result = mockValidateLoad(100); // ₹100
      expect(result.allowed).toBe(true);
    });

    it('blocks load exceeding balance cap (₹1,00,000)', () => {
      // Current balance is ~₹236.11, try to add ₹1,00,000
      const result = mockValidateLoad(100000);
      expect(result.allowed).toBe(false);
      expect(result.blocked_by).toBe('BALANCE_CAP');
    });
  });

  describe('Merchant eligibility', () => {
    it('matches Food wallet for restaurant category', () => {
      const result = mockCheckEligibility('Restaurants', 'FOOD');
      expect(result.eligible).toBe(true);
    });

    it('Gift wallet is eligible for all categories', () => {
      const result = mockCheckEligibility('Random Store', 'GIFT');
      expect(result.eligible).toBe(true);
    });

    it('Fuel wallet matches HP petrol', () => {
      const result = mockCheckEligibility('HP', 'FUEL');
      expect(result.eligible).toBe(true);
    });

    it('findBestSubWallet returns Food wallet for food category', () => {
      const wallet = mockFindBestSubWallet('Food & Dining');
      expect(wallet).not.toBeNull();
      expect(wallet!.type).toBe('FOOD');
    });

    it('findBestSubWallet falls back to Gift wallet for unknown category', () => {
      const wallet = mockFindBestSubWallet('Random Unknown Category');
      // Gift is the universal fallback
      expect(wallet).not.toBeNull();
      expect(wallet!.type).toBe('GIFT');
    });
  });

  describe('Wallet status', () => {
    it('returns ACTIVE state', () => {
      const status = mockApi.getWalletStatus('w');
      expect(status.state).toBe('ACTIVE');
      expect(status.is_active).toBe(true);
      expect(status.kyc_tier).toBe('FULL');
    });
  });

  describe('KYC status', () => {
    it('returns FULL KYC with aadhaar verified', () => {
      const kyc = mockApi.getKycStatus('w');
      expect(kyc.kyc_tier).toBe('FULL');
      expect(kyc.kyc_state).toBe('FULL_KYC');
      expect(kyc.aadhaar_verified).toBe(true);
    });
  });
});
