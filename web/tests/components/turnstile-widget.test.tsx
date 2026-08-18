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
    expect(renderMock).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ theme: "auto" }),
    );
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
        remove: vi.fn(),
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

  it("should reuse an already-loaded turnstile script without hanging", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key");

    const script = document.createElement("script");

    script.dataset.fbwTurnstile = "ready";
    script.id = "cf-turnstile-script";
    document.head.appendChild(script);

    const renderMock = vi.fn(() => "widget-existing");

    Object.defineProperty(window, "turnstile", {
      configurable: true,
      value: {
        remove: vi.fn(),
        render: renderMock,
        reset: vi.fn(),
      },
    });

    const onToken = vi.fn();

    render(<TurnstileWidget onToken={onToken} />);

    await waitFor(() => {
      expect(renderMock).toHaveBeenCalled();
    });
  });

  it("should recover when an existing script finished loading before remount", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key");

    const script = document.createElement("script");

    script.id = "cf-turnstile-script";
    document.head.appendChild(script);

    const renderMock = vi.fn(() => "widget-remount");

    Object.defineProperty(window, "turnstile", {
      configurable: true,
      value: {
        remove: vi.fn(),
        render: renderMock,
        reset: vi.fn(),
      },
    });

    const onToken = vi.fn();

    render(<TurnstileWidget onToken={onToken} />);

    await waitFor(() => {
      expect(renderMock).toHaveBeenCalled();
    });
  });

  it("should clear the token when an existing script is marked error", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key");

    const script = document.createElement("script");

    script.dataset.fbwTurnstile = "error";
    script.id = "cf-turnstile-script";
    document.head.appendChild(script);

    const onToken = vi.fn();

    render(<TurnstileWidget onToken={onToken} />);

    await waitFor(() => {
      expect(onToken).toHaveBeenCalledWith(null);
    });
  });

  it("should clear the token when ready script lacks the turnstile API", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key");

    const script = document.createElement("script");

    script.dataset.fbwTurnstile = "ready";
    script.id = "cf-turnstile-script";
    document.head.appendChild(script);

    const onToken = vi.fn();

    render(<TurnstileWidget onToken={onToken} />);

    await waitFor(() => {
      expect(onToken).toHaveBeenCalledWith(null);
    });
  });

  it("should clear the token when an existing script errors", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key");

    const script = document.createElement("script");

    script.id = "cf-turnstile-script";
    document.head.appendChild(script);

    const onToken = vi.fn();

    render(<TurnstileWidget onToken={onToken} />);

    await waitFor(() => {
      expect(document.getElementById("cf-turnstile-script")).toBe(script);
    });

    script.dispatchEvent(new Event("error"));

    await waitFor(() => {
      expect(onToken).toHaveBeenCalledWith(null);
      expect(script.dataset.fbwTurnstile).toBe("error");
    });
  });

  it("should clear the token when an existing script loads without turnstile", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key");

    const script = document.createElement("script");

    script.id = "cf-turnstile-script";
    document.head.appendChild(script);

    const onToken = vi.fn();

    render(<TurnstileWidget onToken={onToken} />);

    await waitFor(() => {
      expect(document.getElementById("cf-turnstile-script")).toBe(script);
    });

    script.dispatchEvent(new Event("load"));

    await waitFor(() => {
      expect(onToken).toHaveBeenCalledWith(null);
      expect(script.dataset.fbwTurnstile).toBe("error");
    });
  });

  it("should clear the token when the new script fails to load", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key");

    const onToken = vi.fn();

    render(<TurnstileWidget onToken={onToken} />);

    await waitFor(() => {
      expect(document.getElementById("cf-turnstile-script")).toBeTruthy();
    });

    document
      .getElementById("cf-turnstile-script")
      ?.dispatchEvent(new Event("error"));

    await waitFor(() => {
      expect(onToken).toHaveBeenCalledWith(null);
      expect(
        document.getElementById("cf-turnstile-script")?.dataset.fbwTurnstile,
      ).toBe("error");
    });
  });

  it("should attach to an existing script after its load event provides turnstile", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key");

    const script = document.createElement("script");

    script.id = "cf-turnstile-script";
    document.head.appendChild(script);

    const onToken = vi.fn();
    const renderMock = vi.fn(() => "widget-load-existing");

    render(<TurnstileWidget onToken={onToken} />);

    await waitFor(() => {
      expect(document.getElementById("cf-turnstile-script")).toBe(script);
    });

    Object.defineProperty(window, "turnstile", {
      configurable: true,
      value: {
        remove: vi.fn(),
        render: renderMock,
        reset: vi.fn(),
      },
    });

    script.dispatchEvent(new Event("load"));

    await waitFor(() => {
      expect(renderMock).toHaveBeenCalled();
      expect(script.dataset.fbwTurnstile).toBe("ready");
    });
  });

  it("should reset and remove the widget", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key");

    const reset = vi.fn();
    const remove = vi.fn();
    const renderMock = vi.fn(() => "widget-4");

    Object.defineProperty(window, "turnstile", {
      configurable: true,
      value: {
        remove,
        render: renderMock,
        reset,
      },
    });

    const onToken = vi.fn();
    const { rerender, unmount } = render(
      <TurnstileWidget resetNonce={0} onToken={onToken} />,
    );

    await waitFor(() => {
      expect(renderMock).toHaveBeenCalled();
    });

    rerender(<TurnstileWidget resetNonce={1} onToken={onToken} />);

    await waitFor(() => {
      expect(reset).toHaveBeenCalledWith("widget-4");
      expect(onToken).toHaveBeenCalledWith(null);
    });

    unmount();

    expect(remove).toHaveBeenCalledWith("widget-4");
  });
});
