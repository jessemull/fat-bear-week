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
    expect(await axe(container)).toHaveNoViolations();

    await user.click(screen.getByLabelText("Status"));
    await user.click(screen.getByRole("option", { name: "live" }));

    expect(onChange).toHaveBeenCalledWith("live");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
