import React, { useState } from "react";
import { useAuth } from "../features/auth/AuthContext";
import { partialReset } from "../lib/resetData";
import { useQueryClient } from "@tanstack/react-query";

export const DashboardShell: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const auth = useAuth();
  const qc = useQueryClient();
  const [resetting, setResetting] = useState(false);
  async function handleReset() {
    if (resetting) return;
    const ok = window.confirm(
      "Reset data? Semua kamar, denda, pengeluaran, pembayaran akan DIHAPUS. Tidak bisa dibatalkan."
    );
    if (!ok) return;
    try {
      setResetting(true);
      await partialReset({ deleteRooms: true });
      // Invalidate caches
      qc.clear();
      window.location.reload();
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : typeof e === "object"
          ? JSON.stringify(e)
          : String(e);
      alert("Gagal reset: " + msg);
    } finally {
      setResetting(false);
    }
  }
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="mb-8 relative">
          <div className="flex justify-center">
            <div className="flex items-center gap-3 text-center">
              <img
                src="/anggur.png"
                alt="Logo"
                className="w-12 h-12 object-contain"
              />
              <h1 className="text-2xl font-semibold text-red-600">
                Dashboard Kos Anggur Merah
              </h1>
            </div>
          </div>
          {auth.signedIn && (
            <div className="absolute top-0 right-0 flex gap-2">
              <button
                onClick={handleReset}
                disabled={resetting}
                className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-md text-xs md:text-sm shadow"
              >
                {resetting ? "Reset..." : "Reset Data"}
              </button>
              <button
                onClick={() => auth.signOut()}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold px-5 py-2 rounded-md text-sm md:text-base shadow"
              >
                Logout
              </button>
            </div>
          )}
        </div>
        {children}
      </main>
      <footer className="text-sm text-gray-600 py-4 text-center">
        2 Korintus 8:21 " Sebab kami berusaha melakukan apa yang baik, bukan
        hanya di hadapan Tuhan, tetapi juga di hadapan manusia. "
      </footer>
    </div>
  );
};
