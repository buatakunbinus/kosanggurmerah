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
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 pt-5 pb-8">
        <header className="mb-6 relative">
          <div className="flex flex-col items-center gap-3 md:gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <img
                src="/anggur.png"
                alt="Logo"
                className="w-10 h-10 md:w-12 md:h-12 object-contain drop-shadow-sm"
                draggable={false}
              />
              <h1 className="text-xl md:text-2xl font-semibold text-red-600 leading-snug text-center">
                <span className="block md:inline">Dashboard</span>{" "}
                <span className="block md:inline">Kos Anggur Merah</span>
              </h1>
            </div>
            {auth.signedIn && (
              <div className="flex w-full flex-wrap justify-center gap-2 md:hidden">
                <button
                  onClick={handleReset}
                  disabled={resetting}
                  className="flex-1 min-w-[120px] bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-md text-xs shadow"
                >
                  {resetting ? "Reset..." : "Reset Data"}
                </button>
                <button
                  onClick={() => auth.signOut()}
                  className="flex-1 min-w-[120px] bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-md text-xs shadow"
                >
                  Logout
                </button>
              </div>
            )}
            {/* Desktop action buttons */}
            {auth.signedIn && (
              <div className="hidden md:flex absolute top-0 right-0 gap-2">
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
        </header>
        {children}
      </main>
      <footer className="text-xs md:text-sm text-gray-600 py-4 px-4 text-center leading-relaxed">
        2 Korintus 8:21 " Sebab kami berusaha melakukan apa yang baik, bukan
        hanya di hadapan Tuhan, tetapi juga di hadapan manusia. "
      </footer>
    </div>
  );
};
