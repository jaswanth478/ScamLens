'use client';

import { getAnalytics, logEvent, Analytics } from 'firebase/analytics';
import { getFirebaseApp } from './firebase';

let analyticsInstance: Analytics | null = null;

export function initAnalytics(): Analytics | null {
  if (typeof window === 'undefined') return null;
  if (analyticsInstance) return analyticsInstance;
  try {
    const app = getFirebaseApp();
    analyticsInstance = getAnalytics(app);
    return analyticsInstance;
  } catch {
    return null;
  }
}

export function trackEvent(eventName: string, params?: Record<string, string | number | boolean>) {
  const analytics = initAnalytics();
  if (!analytics) return;
  try {
    logEvent(analytics, eventName, params);
  } catch {
    // silently fail if analytics is unavailable
  }
}
