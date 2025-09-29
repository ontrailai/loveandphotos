import { describe, it, expect } from 'vitest';
import { formatUSPhone, isValidUSPhone, extractDigits } from '../../src/utils/formatPhone';

describe('formatUSPhone', () => {
  it('formats complete 10-digit phone number', () => {
    const result = formatUSPhone('5551234567');
    expect(result.digits).toBe('5551234567');
    expect(result.formatted).toBe('(555) 123-4567');
  });

  it('formats as user types - area code only', () => {
    const result = formatUSPhone('555');
    expect(result.digits).toBe('555');
    expect(result.formatted).toBe('(555');
  });

  it('formats as user types - area code plus partial', () => {
    const result = formatUSPhone('55512');
    expect(result.digits).toBe('55512');
    expect(result.formatted).toBe('(555) 12');
  });

  it('formats as user types - area code plus first 3', () => {
    const result = formatUSPhone('555123');
    expect(result.digits).toBe('555123');
    expect(result.formatted).toBe('(555) 123');
  });

  it('formats as user types - partial last 4', () => {
    const result = formatUSPhone('55512345');
    expect(result.digits).toBe('55512345');
    expect(result.formatted).toBe('(555) 123-45');
  });

  it('strips non-numeric characters', () => {
    const result = formatUSPhone('(555) 123-4567');
    expect(result.digits).toBe('5551234567');
    expect(result.formatted).toBe('(555) 123-4567');
  });

  it('caps at 10 digits', () => {
    const result = formatUSPhone('55512345678901234');
    expect(result.digits).toBe('5551234567');
    expect(result.formatted).toBe('(555) 123-4567');
  });

  it('handles empty input', () => {
    const result = formatUSPhone('');
    expect(result.digits).toBe('');
    expect(result.formatted).toBe('');
  });

  it('handles null/undefined input', () => {
    const result = formatUSPhone(null as any);
    expect(result.digits).toBe('');
    expect(result.formatted).toBe('');
  });

  it('handles mixed input with letters and symbols', () => {
    const result = formatUSPhone('abc(555)def-123ghi4567jkl');
    expect(result.digits).toBe('5551234567');
    expect(result.formatted).toBe('(555) 123-4567');
  });

  it('handles international format with +1', () => {
    const result = formatUSPhone('+1 555 123 4567');
    expect(result.digits).toBe('1555123456');
    expect(result.formatted).toBe('(155) 512-3456');
  });

  it('formats partial numbers correctly', () => {
    expect(formatUSPhone('5').formatted).toBe('(5');
    expect(formatUSPhone('55').formatted).toBe('(55');
    expect(formatUSPhone('5551').formatted).toBe('(555) 1');
    expect(formatUSPhone('55512').formatted).toBe('(555) 12');
    expect(formatUSPhone('5551234').formatted).toBe('(555) 123-4');
  });
});

describe('isValidUSPhone', () => {
  it('returns true for valid 10-digit phone', () => {
    expect(isValidUSPhone('5551234567')).toBe(true);
    expect(isValidUSPhone('(555) 123-4567')).toBe(true);
    expect(isValidUSPhone('555-123-4567')).toBe(true);
    expect(isValidUSPhone('555.123.4567')).toBe(true);
  });

  it('returns false for invalid phone numbers', () => {
    expect(isValidUSPhone('555123456')).toBe(false);  // 9 digits
    expect(isValidUSPhone('55512345678')).toBe(false); // 11 digits
    expect(isValidUSPhone('')).toBe(false);
    expect(isValidUSPhone('abc')).toBe(false);
    expect(isValidUSPhone('555-CALL')).toBe(false);
  });
});

describe('extractDigits', () => {
  it('extracts digits from formatted phone', () => {
    expect(extractDigits('(555) 123-4567')).toBe('5551234567');
    expect(extractDigits('555-123-4567')).toBe('5551234567');
    expect(extractDigits('555.123.4567')).toBe('5551234567');
  });

  it('caps at 10 digits', () => {
    expect(extractDigits('555123456789012')).toBe('5551234567');
  });

  it('handles empty/null input', () => {
    expect(extractDigits('')).toBe('');
    expect(extractDigits(null as any)).toBe('');
  });
});