import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

export interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
  ttl?: number; // ms
}

interface ToastContextValue {
  push: (t: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, ttl: 4000, ...t }]);
  }, []);

  useEffect(() => {
    if (!toasts.length) return;
    const timers = toasts.map((toast) =>
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, toast.ttl || 4000)
    );
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [toasts]);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        className="fixed z-50 bottom-4 right-4 flex flex-col gap-2 w-72"
        role="region"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`text-xs px-3 py-2 rounded shadow border bg-white flex items-start gap-2 ${
              t.type === "success"
                ? "border-green-300"
                : t.type === "error"
                ? "border-red-300"
                : "border-gray-300"
            }`}
          >
            <span
              className={`inline-block w-2 h-2 mt-1 rounded-full ${
                t.type === "success"
                  ? "bg-green-500"
                  : t.type === "error"
                  ? "bg-red-500"
                  : "bg-gray-400"
              }`}
            />
            <div className="flex-1 leading-snug">{t.message}</div>
            <button
              aria-label="Close"
              onClick={() =>
                setToasts((prev) => prev.filter((x) => x.id !== t.id))
              }
              className="text-[10px] text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
