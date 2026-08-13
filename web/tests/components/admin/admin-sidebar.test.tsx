import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";

const usePathname = vi.fn(() => "/admin/tournaments");

vi.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
}));

import { AdminSidebar } from "@/components/admin/AdminSidebar";

const tournaments = [
  { id: "t-2026", status: "live" as const, year: 2026 },
  { id: "t-2025", status: "draft" as const, year: 2025 },
];

describe("AdminSidebar", () => {
  beforeEach(() => {
    usePathname.mockReturnValue("/admin/tournaments");
  });

  it("should render tournament links and highlight the index", async () => {
    const { container } = render(<AdminSidebar tournaments={tournaments} />);

    const desktopNav = screen.getAllByRole("navigation", { name: "Admin" })[0];

    expect(
      within(desktopNav).getByRole("link", { name: "Tournaments" }),
    ).toHaveAttribute("href", "/admin/tournaments");
    expect(
      within(desktopNav).getByRole("link", { name: "Create Tournament" }),
    ).toHaveAttribute("href", "/admin/tournaments/new");
    expect(within(desktopNav).getByText("2026 · live")).toBeInTheDocument();
    expect(
      within(desktopNav).getAllByRole("link", { name: "Overview" })[0],
    ).toHaveAttribute("href", "/admin/tournaments/t-2026");
    expect(
      within(desktopNav).getAllByRole("link", { name: "Bears" })[0],
    ).toHaveAttribute("href", "/admin/tournaments/t-2026/bears");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("should highlight bears for the current tournament", () => {
    usePathname.mockReturnValue("/admin/tournaments/t-2025/bears/new");

    render(<AdminSidebar tournaments={tournaments} />);

    const desktopNav = screen.getAllByRole("navigation", { name: "Admin" })[0];
    const bearsLinks = within(desktopNav).getAllByRole("link", {
      name: "Bears",
    });

    expect(bearsLinks[1]).toHaveClass("text-amber-800");
    expect(bearsLinks[0]).not.toHaveClass("text-amber-800");
  });

  it("should highlight create and overview routes", () => {
    const { rerender } = render(<AdminSidebar tournaments={tournaments} />);

    usePathname.mockReturnValue("/admin/tournaments/new");
    rerender(<AdminSidebar tournaments={tournaments} />);

    expect(
      screen.getAllByRole("link", { name: "Create Tournament" })[0],
    ).toHaveClass("text-amber-800");

    usePathname.mockReturnValue("/admin/tournaments/t-2026");
    rerender(<AdminSidebar tournaments={tournaments} />);

    expect(
      screen.getAllByRole("link", { name: "Overview" })[0],
    ).toHaveClass("text-amber-800");
  });

  it("should open and close the mobile admin menu", async () => {
    const user = userEvent.setup();

    render(<AdminSidebar tournaments={tournaments} />);

    await user.click(screen.getByRole("button", { name: "Admin menu" }));

    expect(screen.getByRole("button", { name: "Admin menu" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    const drawerNav = screen.getAllByRole("navigation", { name: "Admin" })[0];

    expect(
      within(drawerNav).getByRole("link", { name: "Create Tournament" }),
    ).toBeInTheDocument();

    await user.click(
      within(drawerNav).getByRole("link", { name: "Tournaments" }),
    );

    expect(screen.getByRole("button", { name: "Admin menu" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});
