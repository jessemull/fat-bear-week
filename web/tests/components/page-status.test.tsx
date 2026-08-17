import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { ShieldOff } from "lucide-react";
import { describe, expect, it } from "vitest";

import { PageStatus } from "@/components/PageStatus";

describe("PageStatus", () => {
  it("should render title, description, and stay accessible", async () => {
    const { container } = render(
      <PageStatus
        description="Commissioner role required for administrative access."
        icon={ShieldOff}
        title="Forbidden"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Forbidden" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Commissioner role required for administrative access."),
    ).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
