import { describe, it, expect } from 'vitest';
import {
  extractUrls,
  formatMoney,
  getLostToday,
  getRiskScoreColor,
  sanitizeInput,
  isValidClassification,
  isValidScore,
  LOSS_PER_SECOND,
  DAILY_LOSS_USD,
} from '../app/lib/utils';

describe('extractUrls', () => {
  it('extracts a single HTTPS URL', () => {
    const result = extractUrls('Visit https://example.com for more info');
    expect(result).toEqual(['https://example.com']);
  });

  it('extracts multiple URLs from text', () => {
    const result = extractUrls('Go to https://google.com and https://evil.com/phish?steal=true');
    expect(result).toHaveLength(2);
    expect(result[0]).toBe('https://google.com');
  });

  it('extracts HTTP URLs', () => {
    const result = extractUrls('click http://unsecure.link now');
    expect(result).toHaveLength(1);
    expect(result[0]).toContain('http://');
  });

  it('returns empty array when no URLs present', () => {
    expect(extractUrls('No links here at all')).toEqual([]);
  });

  it('handles URLs embedded in scam messages', () => {
    const scamMsg =
      'Your account is compromised! Click https://fake-bank.evil.com/login?next=steal to verify.';
    const result = extractUrls(scamMsg);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toContain('fake-bank.evil.com');
  });

  it('handles message with no URLs gracefully', () => {
    expect(extractUrls('')).toEqual([]);
  });
});

describe('formatMoney', () => {
  it('formats amounts under 1B as USD currency', () => {
    expect(formatMoney(1_000)).toBe('$1,000');
    expect(formatMoney(27_945_205)).toContain('$');
  });

  it('formats billion+ amounts with B suffix', () => {
    expect(formatMoney(10_200_000_000)).toBe('$10.20B');
    expect(formatMoney(5_600_000_000)).toBe('$5.60B');
  });

  it('formats zero correctly', () => {
    expect(formatMoney(0)).toBe('$0');
  });

  it('formats negative values', () => {
    const result = formatMoney(-100);
    expect(result).toContain('$');
  });
});

describe('getLostToday', () => {
  it('returns a positive number', () => {
    expect(getLostToday()).toBeGreaterThan(0);
  });

  it('returns less than or equal to daily total loss', () => {
    expect(getLostToday()).toBeLessThanOrEqual(DAILY_LOSS_USD);
  });

  it('increases with time (LOSS_PER_SECOND is positive)', () => {
    expect(LOSS_PER_SECOND).toBeGreaterThan(0);
  });

  it('has a reasonable loss-per-second rate (~$323)', () => {
    expect(LOSS_PER_SECOND).toBeGreaterThan(300);
    expect(LOSS_PER_SECOND).toBeLessThan(400);
  });
});

describe('getRiskScoreColor', () => {
  it('returns danger color for scores above 70', () => {
    expect(getRiskScoreColor(71)).toBe('text-rose-500');
    expect(getRiskScoreColor(100)).toBe('text-rose-500');
  });

  it('returns warning color for scores 31–70', () => {
    expect(getRiskScoreColor(31)).toBe('text-amber-500');
    expect(getRiskScoreColor(70)).toBe('text-amber-500');
    expect(getRiskScoreColor(50)).toBe('text-amber-500');
  });

  it('returns safe color for scores 0–30', () => {
    expect(getRiskScoreColor(0)).toBe('text-emerald-500');
    expect(getRiskScoreColor(30)).toBe('text-emerald-500');
  });
});

describe('sanitizeInput', () => {
  it('trims leading and trailing whitespace', () => {
    expect(sanitizeInput('  hello world  ')).toBe('hello world');
  });

  it('truncates strings exceeding 10,000 characters', () => {
    const oversized = 'a'.repeat(15_000);
    expect(sanitizeInput(oversized)).toHaveLength(10_000);
  });

  it('leaves short strings unchanged', () => {
    expect(sanitizeInput('hello')).toBe('hello');
  });

  it('handles empty string', () => {
    expect(sanitizeInput('')).toBe('');
  });
});

describe('isValidClassification', () => {
  it('accepts valid classifications', () => {
    expect(isValidClassification('Scam')).toBe(true);
    expect(isValidClassification('Suspicious')).toBe(true);
    expect(isValidClassification('Safe')).toBe(true);
    expect(isValidClassification('Emergency')).toBe(true);
  });

  it('rejects invalid classifications', () => {
    expect(isValidClassification('Unknown')).toBe(false);
    expect(isValidClassification('')).toBe(false);
    expect(isValidClassification(null)).toBe(false);
    expect(isValidClassification(42)).toBe(false);
  });
});

describe('isValidScore', () => {
  it('accepts valid scores 0–100', () => {
    expect(isValidScore(0)).toBe(true);
    expect(isValidScore(50)).toBe(true);
    expect(isValidScore(100)).toBe(true);
  });

  it('rejects scores outside 0–100', () => {
    expect(isValidScore(-1)).toBe(false);
    expect(isValidScore(101)).toBe(false);
  });

  it('rejects non-numeric values', () => {
    expect(isValidScore('high')).toBe(false);
    expect(isValidScore(null)).toBe(false);
    expect(isValidScore(undefined)).toBe(false);
  });
});
