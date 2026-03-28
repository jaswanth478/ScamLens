'use client';

import { useEffect } from 'react';
import { initAnalytics, trackEvent } from '@/app/lib/analytics';

export default function FirebaseAnalytics() {
  useEffect(() => {
    initAnalytics();
    trackEvent('page_view', { page: 'home' });
  }, []);

  return null;
}
