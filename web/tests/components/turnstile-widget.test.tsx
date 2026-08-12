import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TurnstileWidget } from "@/components/auth/TurnstileWidget";

describe("TurnstileWidget", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    document.getElementById("cf-turnstile-script")?.remove();
    Reflect.deleteProperty(window, "turnstile");
  });

  it("should warn when the site key is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");

    const onToken = vi.fn();

    render(<TurnstileWidget onToken={onToken} />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Turnstile is not configured",
    );
  });

  it("should render the widget when turnstile is available", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key");

    const renderMock = vi.fn(
      (
        _el: HTMLElement,
        options: {
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
        },
      ) => {
        options.callback?.("tok");

        return "widget-1";
      },
    );

    Object.defineProperty(window, "turnstile", {
      configurable: true,
      value: {
        render: renderMock,
        reset: vi.fn(),
      },
    });

    const onToken = vi.fn();

    render(<TurnstileWidget onToken={onToken} />);

    await waitFor(() => {
      expect(renderMock).toHaveBeenCalled();
      expect(onToken).toHaveBeenCalledWith("tok");
    });
  });

  it("should clear the token on error and expired callbacks", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key");

    const renderMock = vi.fn(
      (
        _el: HTMLElement,
        options: {
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
        },
      ) => {
        options["error-callback"]?.();
        options["expired-callback"]?.();

        return "widget-2";
      },
    );

    Object.defineProperty(window, "turnstile", {
      configurable: true,
      value: {
        render: renderMock,
        reset: vi.fn(),
      },
    });

    const onToken = vi.fn();

    render(<TurnstileWidget onToken={onToken} />);

    await waitFor(() => {
      expect(onToken).toHaveBeenCalledWith(null);
    });
  });

  it("should load the turnstile script when missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key");

    const onToken = vi.fn();
    const renderMock = vi.fn(() => "widget-3");

    render(<TurnstileWidget onToken={onToken} />);

    await waitFor(() => {
      expect(document.getElementById("cf-turnstile-script")).toBeTruthy();
    });

    Object.defineProperty(window, "turnstile", {
      configurable: true,
      value: {
        render: renderMock,
        reset: vi.fn(),
      },
    });

    document.getElementById("cf-turnstile-script")?.dispatchEvent(
      new Event("load"),
    );

    await waitFor(() => {
      expect(renderMock).toHaveBeenCalled();
    });
  });
});
