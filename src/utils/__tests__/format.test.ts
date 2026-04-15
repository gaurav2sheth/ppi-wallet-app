import { describe, it, expect } from 'vitest';
import { formatPaise, rupeesToPaise, getInitials, truncateId } from '../format';

describe('formatPaise', () => {
  it('formats paise to rupees with Indian locale', () => {
    expect(formatPaise('23611')).toBe('₹236.11');
  });

  it('handles zero', () => {
    expect(formatPaise('0')).toBe('₹0.00');
  });

  it('handles null/undefined', () => {
    expect(formatPaise(null)).toBe('₹0.00');
    expect(formatPaise(undefined)).toBe('₹0.00');
  });

  it('handles large amounts (1,00,000 rupees)', () => {
    expect(formatPaise('10000000')).toBe('₹1,00,000.00');
  });

  it('handles single paise', () => {
    expect(formatPaise('1')).toBe('₹0.01');
  });

  it('handles amounts with no remainder', () => {
    expect(formatPaise('10000')).toBe('₹100.00');
  });

  it('handles negative amounts', () => {
    const result = formatPaise('-5000');
    expect(result).toBe('-₹50.00');
  });

  it('handles string input for various amounts', () => {
    expect(formatPaise('100')).toBe('₹1.00');
    expect(formatPaise('99')).toBe('₹0.99');
    expect(formatPaise('50000000')).toBe('₹5,00,000.00');
  });
});

describe('rupeesToPaise', () => {
  it('converts rupees string to paise integer', () => {
    expect(rupeesToPaise('100')).toBe(10000);
  });

  it('handles decimal rupees', () => {
    expect(rupeesToPaise('236.11')).toBe(23611);
  });

  it('returns 0 for invalid input', () => {
    expect(rupeesToPaise('abc')).toBe(0);
  });

  it('returns 0 for negative values', () => {
    expect(rupeesToPaise('-50')).toBe(0);
  });

  it('handles zero', () => {
    expect(rupeesToPaise('0')).toBe(0);
  });

  it('rounds correctly for floating point issues', () => {
    // 1.005 * 100 = 100.49999... in float; Math.round should fix
    expect(rupeesToPaise('1.01')).toBe(101);
  });
});

describe('getInitials', () => {
  it('returns initials from full name', () => {
    expect(getInitials('Gaurav Sheth')).toBe('GS');
  });

  it('returns single initial for single name', () => {
    expect(getInitials('Gaurav')).toBe('G');
  });

  it('takes at most 2 initials', () => {
    expect(getInitials('Arun Kumar Sharma')).toBe('AK');
  });

  it('handles empty string', () => {
    expect(getInitials('')).toBe('');
  });
});

describe('truncateId', () => {
  it('truncates long IDs', () => {
    expect(truncateId('abcdefghijklmnop')).toBe('abcdefgh...');
  });

  it('does not truncate short IDs', () => {
    expect(truncateId('abc')).toBe('abc');
  });

  it('respects custom length', () => {
    expect(truncateId('abcdefghij', 4)).toBe('abcd...');
  });
});
