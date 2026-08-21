import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { AdminFormSkeleton } from "@/components/admin/AdminFormSkeleton";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";

describe("admin skeletons", () => {
  it("should render table and form skeletons accessibly", async () => {
    const table = render(<AdminTableSkeleton />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading…");
    expect(screen.getByRole("list")).toHaveClass("md:hidden");
    expect(
      screen.getByRole("status").querySelector(".hidden.md\\:block"),
    ).toBeInTheDocument();
    expect(await axe(table.container)).toHaveNoViolations();

    table.unmount();

    const form = render(<AdminFormSkeleton />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading…");
    expect(await axe(form.container)).toHaveNoViolations();
  });
});
