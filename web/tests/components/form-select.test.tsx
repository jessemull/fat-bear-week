import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import { FormSelect } from "@/components/FormSelect";

describe("FormSelect", () => {
  it("should open options and call onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    const { container } = render(
      <FormSelect
        label="Status"
        options={[
          { label: "draft", value: "draft" },
          { label: "live", value: "live" },
        ]}
        value="draft"
        valueClassName="capitalize"
        onChange={onChange}
      />,
    );

    expect(screen.getByLabelText("Status")).toHaveTextContent("draft");
    expect(screen.getByLabelText("Status")).toHaveClass("w-full");
    expect(screen.getByLabelText("Status").parentElement).toHaveClass("w-full");
    expect(await axe(container)).toHaveNoViolations();

    await user.click(screen.getByLabelText("Status"));
    await user.click(screen.getByRole("option", { name: "live" }));

    expect(onChange).toHaveBeenCalledWith("live");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("should close on Escape and outside click", async () => {
    const user = userEvent.setup();

    render(
      <div>
        <button type="button">Outside</button>
        <FormSelect
          label="Status"
          options={[
            { label: "draft", value: "draft" },
            { label: "live", value: "live" },
          ]}
          value="draft"
          onChange={vi.fn()}
        />
      </div>,
    );

    await user.click(screen.getByLabelText("Status"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("Status"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Outside" }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("should show a placeholder for unknown or empty values", () => {
    const { rerender } = render(
      <FormSelect
        label="Status"
        options={[{ label: "draft", value: "draft" }]}
        value="missing"
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Status")).toHaveTextContent("…");

    rerender(
      <FormSelect
        label="Status"
        options={[{ label: "draft", value: "draft" }]}
        value=""
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Status")).toHaveTextContent("");
  });
});
