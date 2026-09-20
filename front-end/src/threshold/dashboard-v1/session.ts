import { useCallback, useState } from 'react';

const KEY = 'threshold-demo-session';

export interface Session {
  name: string;
  company: string;
  plan: 'Corporate' | 'Business';
  demo: true;
}

export const DEMO_SESSION: Session = { name: 'Avery Demo', company: 'Northfield Data Systems (demo)', plan: 'Corporate', demo: true };

function read(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

/** Fake, browser-local session for the demo. Falls back to in-memory if storage is blocked. */
export function useSession() {
  const [session, setSession] = useState<Session | null>(read);
  const signIn = useCallback((s: Session) => {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage blocked: keep in memory */ }
    setSession(s);
  }, []);
  const signOut = useCallback(() => {
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    setSession(null);
  }, []);
  return { session, signIn, signOut };
}
