import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import {
  FormShell,
  FormStandaloneAction,
  FormWidthShell,
} from "@/components/FormShell";
import { formWidthShellClassNames } from "@/lib/form-styles";

describe("FormShell", () => {
  it("should apply the default lg width tier when none is passed", () => {
    render(
      <FormShell>
        <label htmlFor="year">Year</label>
        <input id="year" />
      </FormShell>,
    );

    expect(screen.getByLabelText("Year").closest("div")).toHaveClass(
      formWidthShellClassNames.lg,
    );
  });

  it("should apply an explicit width tier shell", async () => {
    const { container } = render(
      <FormShell tier="sm">
        <label htmlFor="year">Year</label>
        <input id="year" />
      </FormShell>,
    );

    expect(container.firstElementChild).toHaveClass(
      formWidthShellClassNames.sm,
      "flex",
      "flex-col",
      "gap-4",
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("should render a form element when requested", () => {
    render(
      <FormShell as="form" tier="lg">
        <button type="submit">Save</button>
      </FormShell>,
    );

    expect(screen.getByRole("button", { name: "Save" }).closest("form")).toHaveClass(
      formWidthShellClassNames.lg,
    );
  });

  it("should align standalone actions with the same tier", () => {
    const { container } = render(
      <FormStandaloneAction tier="xs">
        <button type="button">Delete</button>
      </FormStandaloneAction>,
    );

    expect(container.firstElementChild).toHaveClass(formWidthShellClassNames.xs);
    expect(
      container.querySelector(".flex.w-full.flex-col.items-stretch"),
    ).toBeInTheDocument();
  });

  it("should expose a width-only shell", () => {
    const { container } = render(
      <FormWidthShell tier="md">
        <p>Dialog body</p>
      </FormWidthShell>,
    );

    expect(container.firstElementChild).toHaveClass(formWidthShellClassNames.md);
  });
});
