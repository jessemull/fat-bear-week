"use client";

import { useEffect, useId, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      remove: (widgetId?: string) => void;
      render: (
        element: HTMLElement,
        options: {
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          sitekey: string;
          theme?: "auto" | "dark" | "light";
        },
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

interface TurnstileWidgetProps {
  onToken: (token: null | string) => void;
  resetNonce?: number;
}

const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function waitForExistingTurnstileScript(
  script: HTMLScriptElement,
): Promise<void> {
  if (window.turnstile) {
    return Promise.resolve();
  }

  if (script.dataset.fbwTurnstile === "ready") {
    return Promise.reject(new Error("turnstile_script_failed"));
  }

  if (script.dataset.fbwTurnstile === "error") {
    return Promise.reject(new Error("turnstile_script_failed"));
  }

  return new Promise((resolve, reject) => {
    let settled = false;

    const succeed = () => {
      if (settled) {
        return;
      }

      settled = true;
      script.dataset.fbwTurnstile = "ready";
      resolve();
    };

    const fail = () => {
      if (settled) {
        return;
      }

      settled = true;
      script.dataset.fbwTurnstile = "error";
      reject(new Error("turnstile_script_failed"));
    };

    script.addEventListener(
      "load",
      () => {
        if (window.turnstile) {
          succeed();
        } else {
          fail();
        }
      },
      { once: true },
    );
    script.addEventListener("error", fail, { once: true });

    // Load/error may have already fired before listeners were attached.
    queueMicrotask(() => {
      if (settled) {
        return;
      }

      if (window.turnstile) {
        succeed();
      }
    });
  });
}

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.turnstile) {
    return Promise.resolve();
  }

  const existing = document.getElementById(SCRIPT_ID);

  if (existing instanceof HTMLScriptElement) {
    return waitForExistingTurnstileScript(existing);
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");

    script.async = true;
    script.dataset.fbwTurnstile = "loading";
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.addEventListener(
      "load",
      () => {
        script.dataset.fbwTurnstile = "ready";
        resolve();
      },
      { once: true },
    );
    script.addEventListener(
      "error",
      () => {
        script.dataset.fbwTurnstile = "error";
        reject(new Error("turnstile_script_failed"));
      },
      { once: true },
    );
    document.head.appendChild(script);
  });
}

/**
 * Cloudflare Turnstile widget. Requires NEXT_PUBLIC_TURNSTILE_SITE_KEY.
 */
export function TurnstileWidget({
  onToken,
  resetNonce = 0,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onTokenRef = useRef(onToken);
  const widgetIdRef = useRef<null | string>(null);
  const reactId = useId();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!siteKey || !containerRef.current) {
      onTokenRef.current(null);

      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        await loadTurnstileScript();

        if (cancelled || !containerRef.current || !window.turnstile) {
          return;
        }

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          callback: (token) => onTokenRef.current(token),
          "error-callback": () => onTokenRef.current(null),
          "expired-callback": () => onTokenRef.current(null),
          sitekey: siteKey,
          theme: "auto",
        });
      } catch {
        onTokenRef.current(null);
      }
    })();

    return () => {
      cancelled = true;

      if (widgetIdRef.current && window.turnstile?.remove) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey]);

  useEffect(() => {
    if (resetNonce < 1) {
      return;
    }

    if (widgetIdRef.current && window.turnstile?.reset) {
      window.turnstile.reset(widgetIdRef.current);
      onTokenRef.current(null);
    }
  }, [resetNonce]);

  if (!siteKey) {
    return (
      <p className="text-sm text-amber-800 dark:text-amber-400" role="status">
        Turnstile is not configured (missing site key).
      </p>
    );
  }

  return <div data-turnstile={reactId} ref={containerRef} />;
}
