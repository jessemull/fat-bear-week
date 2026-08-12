import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import HomePage from "@/app/page";

describe("HomePage", () => {
  it("should render the brand heading without a hero sign-in link", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: "Fat Bear Week" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Fantasy Bracket")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sign in" })).toBeNull();
  });

  it("should have no accessibility violations", async () => {
    const { container } = render(<HomePage />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
