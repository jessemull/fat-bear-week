import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { PawPrint } from "lucide-react";
import { describe, expect, it } from "vitest";

import { PageStatus } from "@/components/PageStatus";

describe("PageStatus", () => {
  it("should render title, description, and stay accessible", async () => {
    const { container } = render(
      <PageStatus
        description="Commissioner role required. This den is for rangers only."
        icon={PawPrint}
        title="Closed Den"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Closed Den" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Commissioner role required. This den is for rangers only.",
      ),
    ).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
