import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DashboardShell } from "../ui/DashboardShell";
import { RoomsTable } from "../features/rooms";
import { PenaltiesPanel } from "../features/penalties/PenaltiesPanel";
import { ExpensesPanel } from "../features/expenses/ExpensesPanel";
import { SummaryDashboard } from "../features/summary/SummaryDashboard";
import { ToastProvider } from "../ui/ToastProvider";
import { ErrorBoundary } from "../ui/ErrorBoundary";
// Application root
import { MonthProvider } from "../ui/MonthContext";
import { supabaseHealthCheck } from "../lib/health";
import { useToast } from "../ui/ToastProvider";
import { AuthProvider, useAuth } from "../features/auth/AuthContext";
import { LoginForm } from "../features/auth/LoginForm";

const queryClient = new QueryClient();

const ProtectedArea: React.FC = () => {
  const { loading, signedIn } = useAuth();
  if (loading) return <div className="p-6 text-sm">Loading...</div>;
  if (!signedIn) return <LoginForm />;
  return (
    <MonthProvider>
      <DashboardShell>
        <HealthGate />
        <div className="space-y-10 pb-10">
          <SummaryDashboard />
          {/* Mobile quick jump buttons */}
          <div className="flex md:hidden gap-2 px-1 -mt-4">
            <button
              onClick={() => {
                const el = document.getElementById("penalties-section");
                if (el)
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="flex-1 bg-orange-500 text-white rounded px-3 py-2 text-[11px] font-medium shadow active:scale-[.97]"
            >
              ↓ Denda
            </button>
            <button
              onClick={() => {
                const el = document.getElementById("expenses-section");
                if (el)
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="flex-1 bg-indigo-600 text-white rounded px-3 py-2 text-[11px] font-medium shadow active:scale-[.97]"
            >
              ↓ Pengeluaran
            </button>
          </div>
          <div className="space-y-10">
            <RoomsTable />
            <div id="penalties-section" className="scroll-mt-20">
              <PenaltiesPanel />
            </div>
            <div id="expenses-section" className="scroll-mt-20">
              <ExpensesPanel />
            </div>
          </div>
        </div>
      </DashboardShell>
    </MonthProvider>
  );
};

export const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <ToastProvider>
      <ErrorBoundary>
        <AuthProvider>
          <ProtectedArea />
        </AuthProvider>
      </ErrorBoundary>
    </ToastProvider>
  </QueryClientProvider>
);

const HealthGate: React.FC = () => {
  const { push } = useToast();
  useEffect(() => {
    supabaseHealthCheck().then((res) => {
      if (!res.ok) {
        push({
          type: "error",
          message: "Supabase connection failed: " + res.error,
        });
      }
    });
  }, [push]);
  return null;
};
