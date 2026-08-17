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

  it("should show a pending label while working", () => {
    render(
      <ConfirmDialog
        confirmLabel="Delete"
        description="This cannot be undone."
        open
        pending
        title="Delete item"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Working…" }),
    ).toBeInTheDocument();
  });

  it("should cancel on Escape unless pending", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    const { rerender } = render(
      <ConfirmDialog
        description="Continue?"
        open
        title="Confirm"
        onCancel={onCancel}
        onConfirm={vi.fn()}
      />,
    );

    await user.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(1);

    rerender(
      <ConfirmDialog
        description="Continue?"
        open
        pending
        title="Confirm"
        onCancel={onCancel}
        onConfirm={vi.fn()}
      />,
    );

    await user.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
