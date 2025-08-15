import React, { useState } from "react";
import { useAuth } from "./AuthContext";

export const LoginForm: React.FC = () => {
  const { signIn, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    clearError();
    try {
      await signIn(email.trim(), pw);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-xs space-y-4 bg-white shadow p-6 rounded"
      >
        <div className="flex flex-col items-center gap-2">
          <img
            src="/anggur.png"
            alt="Logo Anggur Merah"
            className="w-16 h-16 object-contain"
          />
          <h1 className="text-lg font-semibold text-center text-red-600">
            Kos Anggur Merah
          </h1>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Email</label>
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring focus:ring-red-200"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Password</label>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring focus:ring-red-200"
          />
        </div>
        {error && <div className="text-xs text-red-600">{error}</div>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded text-sm disabled:opacity-60"
        >
          {submitting ? "Signing in..." : "Sign In"}
        </button>
        <p className="text-[14px] text-gray-600 text-center">
          " Timbangan dan neraca yang betul adalah kepunyaan TUHAN, segala batu
          timbangan di dalam pundi-pundi adalah buatan-Nya. "
        </p>
        <p className="text-[14px] text-gray-600 text-center">Amsal 16:11</p>
      </form>
    </div>
  );
};
