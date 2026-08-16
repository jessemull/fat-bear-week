"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

interface ToastItem {
  id: string;
  message: string;
  tone: "default" | "error";
}

interface ToastContextValue {
  toast: (message: string, tone?: "default" | "error") => void;
}

const ToastContext = createContext<null | ToastContextValue>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, tone: "default" | "error" = "default") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    setToasts((current) => [...current, { id, message, tone }]);

    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4000);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 bottom-4 z-[200] flex w-full max-w-sm flex-col gap-2"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto rounded-md border border-l-4 px-3.5 py-2.5 text-sm font-medium shadow-lg ${
              item.tone === "error"
                ? "border-red-400/40 border-l-red-500 bg-zinc-100 text-red-900 dark:border-zinc-600 dark:border-l-red-500 dark:bg-zinc-800 dark:text-red-200"
                : "border-amber-400/40 border-l-amber-500 bg-zinc-100 text-zinc-900 dark:border-zinc-600 dark:border-l-amber-500 dark:bg-zinc-800 dark:text-zinc-50"
            }`}
            role="status"
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }

  return context;
}
