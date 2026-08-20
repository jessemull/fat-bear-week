import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppProviders } from "@/components/AppProviders";
import { useToast } from "@/components/Toast";

function ToastTrigger({ tone }: { tone?: "default" | "error" }) {
  const { toast } = useToast();

  return (
    <button type="button" onClick={() => toast("Saved.", tone)}>
      Notify
    </button>
  );
}

function DeferredToastTrigger() {
  const { toastAfterNavigation } = useToast();

  return (
    <button type="button" onClick={() => toastAfterNavigation("Redirected.")}>
      Notify after nav
    </button>
  );
}

describe("Toast", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should render default and error toasts through AppProviders", async () => {
    const user = userEvent.setup();

    render(
      <AppProviders>
        <ToastTrigger />
        <ToastTrigger tone="error" />
      </AppProviders>,
    );

    await user.click(screen.getAllByRole("button", { name: "Notify" })[0]!);
    expect(screen.getByRole("status")).toHaveTextContent("Saved.");

    await user.click(screen.getAllByRole("button", { name: "Notify" })[1]!);
    expect(screen.getAllByRole("status")).toHaveLength(2);
  });

  it("should show toastAfterNavigation only after the URL changes", async () => {
    const user = userEvent.setup();

    window.history.pushState({}, "", "/from");

    render(
      <AppProviders>
        <DeferredToastTrigger />
      </AppProviders>,
    );

    await user.click(screen.getByRole("button", { name: "Notify after nav" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    window.history.pushState({}, "", "/to");
    expect(await screen.findByRole("status")).toHaveTextContent("Redirected.");
  });

  it("should show toastAfterNavigation if the URL never changes", async () => {
    vi.useFakeTimers();
    window.history.pushState({}, "", "/from");

    render(
      <AppProviders>
        <DeferredToastTrigger />
      </AppProviders>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Notify after nav" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(8000);
    });
    expect(screen.getByRole("status")).toHaveTextContent("Redirected.");
  });

  it("should throw when useToast is used outside a provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(() => render(<ToastTrigger />)).toThrow(
      "useToast must be used within ToastProvider.",
    );
  });
});
