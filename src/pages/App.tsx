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
          <div className="space-y-10">
            <RoomsTable />
            <PenaltiesPanel />
            <ExpensesPanel />
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
