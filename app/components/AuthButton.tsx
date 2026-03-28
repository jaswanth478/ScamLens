'use client';

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { subscribeToAuthState, signInWithGoogle, signOutUser } from '@/app/lib/auth';
import { LogIn, LogOut } from 'lucide-react';
import Image from 'next/image';

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleSignIn = async () => {
    setSigningIn(true);
    await signInWithGoogle();
    setSigningIn(false);
  };

  if (loading) return null;

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {user.photoURL && (
          <Image
            src={user.photoURL}
            alt={`${user.displayName ?? 'User'} profile photo`}
            width={28}
            height={28}
            className="rounded-full"
          />
        )}
        <span className="text-sm text-slate-400 hidden sm:block max-w-[120px] truncate">
          {user.displayName}
        </span>
        <button
          onClick={signOutUser}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          aria-label="Sign out of your account"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          <span className="sr-only">Sign out</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={signingIn}
      className="flex items-center gap-2 px-3 py-1.5 glass-panel rounded-lg text-sm text-slate-300 hover:text-white disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      aria-label="Sign in with Google"
    >
      <LogIn className="w-4 h-4" aria-hidden="true" />
      <span>{signingIn ? 'Signing in…' : 'Sign in with Google'}</span>
    </button>
  );
}
