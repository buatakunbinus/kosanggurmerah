import React, { createContext, useContext, useEffect, useState } from "react";
import {
  getCurrentSession,
  onAuthStateChange,
  signInEmail,
  signOut,
} from "../../lib/auth";

interface AuthCtx {
  loading: boolean;
  signedIn: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getCurrentSession().then((session) => {
      if (mounted) {
        setSignedIn(!!session);
        setLoading(false);
      }
    });
    const off = onAuthStateChange((si) => setSignedIn(si));
    return () => {
      mounted = false;
      off();
    };
  }, []);

  async function signIn(email: string, password: string) {
    setError(null);
    try {
      await signInEmail(email, password);
    } catch (e: unknown) {
      if (e && typeof e === "object" && "message" in e) {
        const msg = (e as { message?: string }).message;
        setError(msg || "Login failed");
      } else setError("Login failed");
    }
  }

  async function doSignOut() {
    await signOut();
  }

  return (
    <Ctx.Provider
      value={{
        loading,
        signedIn,
        signIn,
        signOut: doSignOut,
        error,
        clearError: () => setError(null),
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
