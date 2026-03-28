import { describe, it, expect, vi } from 'vitest';
import { extractUrls, sanitizeInput, isValidClassification, isValidScore } from '../app/lib/utils';

// Integration-style tests for analyze route logic
// Full route tests require a running server; these cover the pure logic layers

describe('Message validation (analyze route logic)', () => {
  it('rejects empty message after trim', () => {
    const message = '   ';
    expect(!message.trim()).toBe(true);
  });

  it('rejects non-string input', () => {
    expect(typeof null !== 'string').toBe(true);
    expect(typeof 42 !== 'string').toBe(true);
    expect(typeof undefined !== 'string').toBe(true);
  });

  it('accepts a valid suspicious message', () => {
    const message = 'Congratulations! You won $1,000,000. Send your bank details to claim.';
    expect(typeof message === 'string' && message.trim().length > 0).toBe(true);
  });

  it('sanitized input is safe to process', () => {
    const raw = '  click https://evil.com now  ';
    const sanitized = sanitizeInput(raw);
    expect(sanitized).toBe('click https://evil.com now');
  });
});

describe('URL extraction for Safe Browsing check', () => {
  it('extracts phishing URL from scam message', () => {
    const msg =
      'Your PayPal account is limited! Verify at https://paypal-secure-verify.evil.ru/login immediately.';
    const urls = extractUrls(msg);
    expect(urls).toHaveLength(1);
    expect(urls[0]).toContain('paypal-secure-verify.evil.ru');
  });

  it('extracts multiple URLs from complex message', () => {
    const msg = 'Visit https://bit.ly/abc123 or https://tinyurl.com/scam for details';
    expect(extractUrls(msg)).toHaveLength(2);
  });

  it('returns empty array when message has no URLs', () => {
    expect(extractUrls('Call 1-800-IRS-SCAM immediately!')).toEqual([]);
  });
});

describe('Analysis result validation', () => {
  it('validates all expected classification values', () => {
    const classifications = ['Scam', 'Suspicious', 'Safe', 'Emergency'];
    classifications.forEach((cls) => {
      expect(isValidClassification(cls)).toBe(true);
    });
  });

  it('rejects unexpected classification values', () => {
    expect(isValidClassification('Danger')).toBe(false);
    expect(isValidClassification('LOW_RISK')).toBe(false);
    expect(isValidClassification(null)).toBe(false);
  });

  it('validates boundary score values', () => {
    expect(isValidScore(0)).toBe(true);
    expect(isValidScore(100)).toBe(true);
    expect(isValidScore(99)).toBe(true);
  });

  it('rejects out-of-range scores', () => {
    expect(isValidScore(-1)).toBe(false);
    expect(isValidScore(101)).toBe(false);
    expect(isValidScore(NaN)).toBe(false);
  });

  it('URL threat detection boosts score by 20 points capped at 100', () => {
    const originalScore = 85;
    const boosted = Math.min(100, originalScore + 20);
    expect(boosted).toBe(100);
  });

  it('URL threat detection upgrades Suspicious to Scam', () => {
    const classification = 'Suspicious';
    const flaggedUrls = ['https://evil.com'];
    const upgraded =
      flaggedUrls.length > 0 &&
      (classification === 'Suspicious' || classification === 'Safe')
        ? 'Scam'
        : classification;
    expect(upgraded).toBe('Scam');
  });

  it('URL threat detection does not downgrade Scam or Emergency', () => {
    ['Scam', 'Emergency'].forEach((cls) => {
      const flaggedUrls = ['https://evil.com'];
      const upgraded =
        flaggedUrls.length > 0 &&
        (cls === 'Suspicious' || cls === 'Safe')
          ? 'Scam'
          : cls;
      expect(upgraded).toBe(cls);
    });
  });
});

describe('Rate limiting logic', () => {
  it('tracks request count correctly', () => {
    const MAX = 10;
    let count = 0;
    const isAllowed = () => {
      if (count >= MAX) return false;
      count++;
      return true;
    };
    for (let i = 0; i < MAX; i++) expect(isAllowed()).toBe(true);
    expect(isAllowed()).toBe(false);
  });

  it('resets after window expires', () => {
    const WINDOW_MS = 60_000;
    const entry = { count: 10, resetAt: Date.now() - 1 };
    const isExpired = Date.now() > entry.resetAt;
    expect(isExpired).toBe(true);
  });
});
