import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock process.env before importing component
vi.stubEnv('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', 'test-key');

// Mock fetch for /api/stats
const mockStatsResponse = {
  totalAnalyses: 142,
  scamCount: 87,
  suspiciousCount: 31,
  safeCount: 22,
  emergencyCount: 2,
};

global.fetch = vi.fn().mockResolvedValue({
  json: () => Promise.resolve(mockStatsResponse),
  ok: true,
} as Response);

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ alt, src, ...props }: { alt: string; src: string; [key: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} {...props} />
  ),
}));

// Mock analytics
vi.mock('../app/lib/analytics', () => ({
  trackEvent: vi.fn(),
  initAnalytics: vi.fn(),
}));

import ScamStats from '../app/components/ScamStats';

describe('ScamStats', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the main section heading', () => {
    render(<ScamStats />);
    expect(screen.getByRole('heading', { name: /Global Scam Crisis/i })).toBeDefined();
  });

  it('renders the live money counter label', () => {
    render(<ScamStats />);
    expect(screen.getByText(/Lost to Scams Today/i)).toBeDefined();
  });

  it('renders all four stat cards', () => {
    render(<ScamStats />);
    expect(screen.getByText(/Fraud Reports in 2023/i)).toBeDefined();
    expect(screen.getByText(/Annual Losses/i)).toBeDefined();
    expect(screen.getByText(/Victims Per Day/i)).toBeDefined();
    expect(screen.getByText(/Median Loss/i)).toBeDefined();
  });

  it('renders scam category breakdown section', () => {
    render(<ScamStats />);
    expect(screen.getByText(/Top Scam Categories/i)).toBeDefined();
    expect(screen.getByText(/Imposter Scams/i)).toBeDefined();
    expect(screen.getByText(/Investment Fraud/i)).toBeDefined();
    expect(screen.getByText(/Romance Scams/i)).toBeDefined();
  });

  it('renders real scam examples section', () => {
    render(<ScamStats />);
    expect(screen.getByText(/Real Scam Examples/i)).toBeDefined();
  });

  it('has accessible tablist for alert navigation', () => {
    render(<ScamStats />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBeGreaterThan(0);
  });

  it('allows keyboard navigation of alert tabs', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    render(<ScamStats />);
    const tabs = screen.getAllByRole('tab');
    await user.click(tabs[1]);
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
  }, 10000);

  it('shows community stats from Firestore after fetch', async () => {
    vi.useRealTimers();
    render(<ScamStats />);
    await waitFor(
      () => {
        expect(screen.getByText(/Messages Analyzed/i)).toBeDefined();
        expect(screen.getByText(/Scams Detected/i)).toBeDefined();
      },
      { timeout: 8000 }
    );
  }, 10000);

  it('renders progress bars for scam types with accessibility attributes', () => {
    render(<ScamStats />);
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBe(5);
    progressBars.forEach((bar) => {
      expect(bar.getAttribute('aria-valuemin')).toBe('0');
      expect(bar.getAttribute('aria-valuemax')).toBe('100');
    });
  });

  it('renders Google Maps image when API key is present', () => {
    render(<ScamStats />);
    const mapImg = screen.queryByAltText(/World map showing major scam hotspot/i);
    expect(mapImg).not.toBeNull();
  });

  it('has aria-live region on counter for screen reader updates', () => {
    render(<ScamStats />);
    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();
  });
});
