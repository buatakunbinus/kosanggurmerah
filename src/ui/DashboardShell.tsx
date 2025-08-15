import React from "react";
import { useAuth } from "../features/auth/AuthContext";

export const DashboardShell: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const auth = useAuth();
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
            <button
              onClick={() => auth.signOut()}
              className="absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white font-semibold px-5 py-2 rounded-md text-sm md:text-base shadow"
            >
              Logout
            </button>
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
