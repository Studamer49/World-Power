import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi, setCountrySession, clearCountrySession } from '../api/client';

type AuthContextValue = {
  countryId: string | null;
  countryName: string | null;
  loggedIn: boolean;
  loginCountry: (name: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logoutCountry: () => void;
};

const AuthContext = createContext<AuthContextValue>({
  countryId: null,
  countryName: null,
  loggedIn: false,
  loginCountry: async () => ({ ok: true }),
  logoutCountry: () => {},
});

type StoredSession = { id: string; name: string } | null;

function loadSession(): StoredSession {
  try {
    const raw = localStorage.getItem('wp-country-session');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.id && parsed.name) return parsed;
    return null;
  } catch {
    return null;
  }
}

function saveSession(session: StoredSession) {
  if (session) {
    localStorage.setItem('wp-country-session', JSON.stringify(session));
  } else {
    localStorage.removeItem('wp-country-session');
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [countryId, setCountryId] = useState<string | null>(null);
  const [countryName, setCountryName] = useState<string | null>(null);

  // Restore a previously saved country session on load.
  useEffect(() => {
    const saved = loadSession();
    if (saved) {
      setCountryId(saved.id);
      setCountryName(saved.name);
    }
  }, []);

  const loginCountry = async (name: string, password: string) => {
    try {
      const res = await authApi.countryLogin(name, password);
      setCountrySession(res.token, res.countryId);
      saveSession({ id: res.countryId, name: res.countryName || name });
      setCountryId(res.countryId);
      setCountryName(res.countryName || name);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message || 'Login failed' };
    }
  };

  const logoutCountry = () => {
    clearCountrySession();
    saveSession(null);
    setCountryId(null);
    setCountryName(null);
  };

  return (
    <AuthContext.Provider value={{ countryId, countryName, loggedIn: !!countryId, loginCountry, logoutCountry }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
