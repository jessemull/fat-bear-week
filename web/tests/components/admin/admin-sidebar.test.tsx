import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";

const usePathname = vi.fn(() => "/admin/tournaments");

vi.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
}));

import { AdminSidebar } from "@/components/admin/AdminSidebar";

const pools = [
  { id: "pool-1", name: "My Pool" },
  { id: "pool-2", name: "Friends" },
];

const tournaments = [
  { id: "t-2026", status: "live" as const, year: 2026 },
  { id: "t-2025", status: "draft" as const, year: 2025 },
];

function renderSidebar() {
  return render(<AdminSidebar pools={pools} tournaments={tournaments} />);
}

describe("AdminSidebar", () => {
  beforeEach(() => {
    usePathname.mockReturnValue("/admin/tournaments");
  });

  it("should render tournament and pool links", async () => {
    const { container } = renderSidebar();

    const desktopNav = screen.getByRole("navigation", { name: "Admin" });

    expect(
      within(desktopNav).getByRole("link", { name: "Tournaments" }),
    ).toHaveAttribute("href", "/admin/tournaments");
    expect(
      within(desktopNav).getByRole("link", { name: "All Tournaments" }),
    ).toHaveAttribute("href", "/admin/tournaments");
    expect(
      within(desktopNav).getByRole("link", { name: "Create Tournament" }),
    ).toHaveAttribute("href", "/admin/tournaments/new");
    expect(within(desktopNav).getByText("2026 · Live")).toBeInTheDocument();
    expect(
      within(desktopNav).getAllByRole("link", { name: "Overview" })[0],
    ).toHaveAttribute("href", "/admin/tournaments/t-2026");
    expect(
      within(desktopNav).getAllByRole("link", { name: "Bears" })[0],
    ).toHaveAttribute("href", "/admin/tournaments/t-2026/bears");
    expect(
      within(desktopNav).getByRole("link", { name: "Pools" }),
    ).toHaveAttribute("href", "/admin/pools");
    expect(
      within(desktopNav).getByRole("link", { name: "All Pools" }),
    ).toHaveAttribute("href", "/admin/pools");
    expect(
      within(desktopNav).getByRole("link", { name: "Create Pool" }),
    ).toHaveAttribute("href", "/admin/pools/new");
    expect(within(desktopNav).getByText("My Pool")).toBeInTheDocument();
    expect(
      within(desktopNav)
        .getAllByRole("link", { name: "Overview" })
        .some((link) => link.getAttribute("href") === "/admin/pools/pool-1"),
    ).toBe(true);
    expect(
      within(desktopNav).getAllByRole("link", { name: "Invites" })[0],
    ).toHaveAttribute("href", "/admin/pools/pool-1/invites");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("should highlight bears for the current tournament", () => {
    usePathname.mockReturnValue("/admin/tournaments/t-2025/bears/new");

    renderSidebar();

    const desktopNav = screen.getByRole("navigation", { name: "Admin" });
    const bearsLinks = within(desktopNav).getAllByRole("link", {
      name: "Bears",
    });

    expect(bearsLinks[1]).toHaveClass("text-amber-800");
    expect(bearsLinks[0]).not.toHaveClass("text-amber-800");
  });

  it("should highlight create and overview routes", () => {
    const { rerender } = renderSidebar();

    usePathname.mockReturnValue("/admin/tournaments/new");
    rerender(<AdminSidebar pools={pools} tournaments={tournaments} />);

    expect(
      screen.getAllByRole("link", { name: "Create Tournament" })[0],
    ).toHaveClass("text-amber-800");

    usePathname.mockReturnValue("/admin/tournaments/t-2026");
    rerender(<AdminSidebar pools={pools} tournaments={tournaments} />);

    expect(
      screen.getAllByRole("link", { name: "Overview" })[0],
    ).toHaveClass("text-amber-800");

    usePathname.mockReturnValue("/admin/pools/pool-2");
    rerender(<AdminSidebar pools={pools} tournaments={tournaments} />);

    expect(
      screen
        .getAllByRole("link", { name: "Overview" })
        .find((link) => link.getAttribute("href") === "/admin/pools/pool-2"),
    ).toHaveClass("text-amber-800");

    usePathname.mockReturnValue("/admin/pools/pool-2/invites");
    rerender(<AdminSidebar pools={pools} tournaments={tournaments} />);

    expect(
      screen.getAllByRole("link", { name: "Invites" })[1],
    ).toHaveClass("text-amber-800");
  });

  it("should not render a separate mobile admin menu button", () => {
    renderSidebar();

    expect(screen.queryByRole("button", { name: "Admin menu" })).toBeNull();
    expect(screen.getByRole("navigation", { name: "Admin" })).toBeInTheDocument();
  });
});
