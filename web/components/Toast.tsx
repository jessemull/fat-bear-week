"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface ToastItem {
  id: string;
  message: string;
  tone: "default" | "error";
}

interface ToastContextValue {
  toast: (message: string, tone?: "default" | "error") => void;
  toastAfterNavigation: (message: string, tone?: "default" | "error") => void;
}

const ToastContext = createContext<null | ToastContextValue>(null);

const TOAST_DURATION_MS = 4000;

/** How often to check that client navigation updated the URL. */
const TOAST_NAVIGATION_POLL_MS = 50;

/** Give up waiting for a route change so intervals do not leak. */
const TOAST_NAVIGATION_TIMEOUT_MS = 8000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const navigationWaitRef = useRef<{
    intervalId: number;
    timeoutId: number;
  } | null>(null);

  const clearNavigationWait = useCallback(() => {
    if (!navigationWaitRef.current) {
      return;
    }

    window.clearInterval(navigationWaitRef.current.intervalId);
    window.clearTimeout(navigationWaitRef.current.timeoutId);
    navigationWaitRef.current = null;
  }, []);

  const showToast = useCallback(
    (message: string, tone: "default" | "error" = "default") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      setToasts((current) => [...current, { id, message, tone }]);

      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== id));
      }, TOAST_DURATION_MS);
    },
    [],
  );

  const toast = useCallback(
    (message: string, tone: "default" | "error" = "default") => {
      showToast(message, tone);
    },
    [showToast],
  );

  const toastAfterNavigation = useCallback(
    (message: string, tone: "default" | "error" = "default") => {
      clearNavigationWait();

      // Capture before router.push so we can wait for the destination URL.
      const fromPath = window.location.pathname;

      const intervalId = window.setInterval(() => {
        if (window.location.pathname === fromPath) {
          return;
        }

        clearNavigationWait();
        showToast(message, tone);
      }, TOAST_NAVIGATION_POLL_MS);

      const timeoutId = window.setTimeout(() => {
        clearNavigationWait();
        showToast(message, tone);
      }, TOAST_NAVIGATION_TIMEOUT_MS);

      navigationWaitRef.current = { intervalId, timeoutId };
    },
    [clearNavigationWait, showToast],
  );

  useEffect(() => {
    return () => {
      clearNavigationWait();
    };
  }, [clearNavigationWait]);

  const value = useMemo(
    () => ({ toast, toastAfterNavigation }),
    [toast, toastAfterNavigation],
  );

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
                ? "border-red-600/40 border-l-red-600 bg-zinc-100 text-red-600/80 dark:border-zinc-600 dark:border-l-red-600 dark:bg-zinc-800 dark:text-red-600/80"
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
