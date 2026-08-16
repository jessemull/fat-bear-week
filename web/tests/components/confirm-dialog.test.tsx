import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import { ConfirmDialog } from "@/components/ConfirmDialog";

describe("ConfirmDialog", () => {
  it("should confirm, cancel, and stay accessible", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onConfirm = vi.fn();

    const { container, rerender } = render(
      <ConfirmDialog
        confirmLabel="Delete"
        description="This cannot be undone."
        open
        title="Delete item"
        tone="danger"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByRole("dialog", { name: "Delete item" })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();

    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalled();

    rerender(
      <ConfirmDialog
        confirmLabel="Delete"
        description="This cannot be undone."
        open
        title="Delete item"
        tone="danger"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();

    rerender(
      <ConfirmDialog
        confirmLabel="Delete"
        description="This cannot be undone."
        open={false}
        title="Delete item"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
