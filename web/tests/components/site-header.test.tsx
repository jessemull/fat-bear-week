import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    refresh,
    replace: vi.fn(),
  }),
}));

import { SiteHeader } from "@/components/SiteHeader";

describe("SiteHeader", () => {
  beforeEach(() => {
    push.mockReset();
    refresh.mockReset();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ data: { ok: true } }),
        ok: true,
      }),
    );
  });

  it("should render enabled and disabled nav items when signed out", async () => {
    const { container } = render(<SiteHeader isSignedIn={false} />);

    const desktopNav = screen.getByRole("navigation", { name: "Primary" });

    expect(within(desktopNav).getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(
      within(desktopNav).getByRole("link", { name: "Pools" }),
    ).toHaveAttribute("href", "/pools");
    expect(within(desktopNav).getByText("Bracket")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(within(desktopNav).getByText("Leaderboard")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByRole("link", { name: "Sign In" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.queryByRole("button", { name: "Sign out" })).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("should show Sign out when signed in", async () => {
    const user = userEvent.setup();

    render(<SiteHeader isSignedIn={true} />);

    const signOut = screen.getByRole("button", { name: "Sign out" });

    await user.click(signOut);

    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/sign-out",
      expect.objectContaining({ method: "POST" }),
    );
    expect(push).toHaveBeenCalledWith("/login");
    expect(refresh).toHaveBeenCalled();
  });

  it("should show Admin link only for commissioners", () => {
    const { rerender } = render(
      <SiteHeader isCommissioner={false} isSignedIn={true} />,
    );

    expect(screen.queryByRole("link", { name: "Admin" })).toBeNull();

    rerender(<SiteHeader isCommissioner={true} isSignedIn={true} />);

    expect(screen.getByRole("link", { name: "Admin" })).toHaveAttribute(
      "href",
      "/admin",
    );
  });

  it("should open the mobile menu with the same links", async () => {
    const user = userEvent.setup();

    render(<SiteHeader isCommissioner={true} isSignedIn={false} />);

    await user.click(screen.getByRole("button", { name: "Open menu" }));

    const mobileNav = screen.getByRole("navigation", { name: "Mobile" });

    expect(within(mobileNav).getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(within(mobileNav).getByRole("link", { name: "Pools" })).toBeInTheDocument();
    expect(within(mobileNav).getByRole("link", { name: "Admin" })).toHaveAttribute(
      "href",
      "/admin",
    );
    expect(within(mobileNav).getByText("About")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(
      within(mobileNav).getByRole("link", { name: "Sign In" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close menu" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });
});
