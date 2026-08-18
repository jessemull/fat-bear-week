import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

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

describe("Toast", () => {
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

  it("should throw when useToast is used outside a provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(() => render(<ToastTrigger />)).toThrow(
      "useToast must be used within ToastProvider.",
    );
  });
});
