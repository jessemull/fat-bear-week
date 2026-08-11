import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import HomePage from "@/app/page";

describe("HomePage", () => {
  it("should render the brand heading", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: "Fat Bear Week" }),
    ).toBeInTheDocument();
  });

  it("should have no accessibility violations", async () => {
    const { container } = render(<HomePage />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
