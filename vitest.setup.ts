import '@testing-library/react';
import { vi } from 'vitest';

// Mock IntersectionObserver (not available in jsdom)
global.IntersectionObserver = class IntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(public callback: IntersectionObserverCallback) {}
} as unknown as typeof IntersectionObserver;

// Mock Firebase modules so tests don't need real Firebase credentials
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({})),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  addDoc: vi.fn(() => Promise.resolve()),
  doc: vi.fn(),
  setDoc: vi.fn(() => Promise.resolve()),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => false, data: () => ({}) })),
  increment: vi.fn((n) => n),
  serverTimestamp: vi.fn(() => new Date()),
}));

vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(() => ({})),
  logEvent: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  GoogleAuthProvider: vi.fn(() => ({ addScope: vi.fn() })),
  signInWithPopup: vi.fn(() => Promise.resolve({ user: { uid: '1', displayName: 'Test' } })),
  signOut: vi.fn(() => Promise.resolve()),
  onAuthStateChanged: vi.fn((_, cb) => { cb(null); return () => {}; }),
}));

// Suppress console errors during tests
vi.spyOn(console, 'error').mockImplementation(() => {});
