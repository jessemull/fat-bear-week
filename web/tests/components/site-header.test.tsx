import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { type ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const refresh = vi.fn();
const pathnameMock = vi.fn(() => "/");

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
  useRouter: () => ({
    push,
    refresh,
    replace: vi.fn(),
  }),
}));

import { SiteHeader } from "@/components/SiteHeader";
import { ToastProvider } from "@/components/Toast";

function renderHeader(ui: ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe("SiteHeader", () => {
  beforeEach(() => {
    pathnameMock.mockReturnValue("/");
    push.mockReset();
    refresh.mockReset();
    document.body.classList.remove("overflow-hidden");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ data: { ok: true } }),
        ok: true,
      }),
    );
  });

  it("should render enabled and disabled nav items when signed out", async () => {
    const { container } = renderHeader(<SiteHeader isSignedIn={false} />);

    expect(container.querySelector("header")).toHaveClass("fixed", "top-0");

    const desktopNav = screen.getByRole("navigation", { name: "Primary" });

    expect(within(desktopNav).getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(
      within(desktopNav).queryByRole("link", { name: "Pools" }),
    ).toBeNull();
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

    renderHeader(<SiteHeader isSignedIn={true} />);

    const signOut = screen.getByRole("button", { name: "Sign out" });

    await user.click(signOut);

    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/sign-out",
      expect.objectContaining({ method: "POST" }),
    );
    expect(push).toHaveBeenCalledWith("/login");
    expect(refresh).toHaveBeenCalled();
  });

  it("should not redirect when sign-out fails", async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ error: "Invalid request origin." }),
        ok: false,
      }),
    );

    renderHeader(<SiteHeader isSignedIn={true} />);

    await user.click(screen.getByRole("button", { name: "Sign out" }));

    expect(push).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Unable to sign out. Try again.",
    );
  });

  it("should toast when sign-out fetch throws", async () => {
    const user = userEvent.setup();

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

    renderHeader(<SiteHeader isSignedIn={true} />);

    await user.click(screen.getByRole("button", { name: "Sign out" }));

    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Unable to sign out. Try again.",
    );
  });

  it("should show Admin link only for commissioners", () => {
    const { rerender } = renderHeader(
      <SiteHeader isCommissioner={false} isSignedIn={true} />,
    );

    expect(screen.queryByRole("link", { name: "Admin" })).toBeNull();

    rerender(
      <ToastProvider>
        <SiteHeader isCommissioner={true} isSignedIn={true} />
      </ToastProvider>,
    );

    expect(screen.getByRole("link", { name: "Admin" })).toHaveAttribute(
      "href",
      "/admin/tournaments",
    );
  });

  it("should open the mobile menu with the same links", async () => {
    const user = userEvent.setup();

    renderHeader(<SiteHeader isCommissioner={true} isSignedIn={false} />);

    await user.click(screen.getByRole("button", { name: "Open menu" }));

    const mobileNav = screen.getByRole("dialog", { name: "Mobile" });

    expect(within(mobileNav).getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(within(mobileNav).queryByRole("link", { name: "Pools" })).toBeNull();
    expect(
      within(mobileNav).getByRole("link", { name: "Admin" }),
    ).toHaveAttribute("href", "/admin/tournaments");
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
    expect(
      screen.getByRole("button", { name: "Dismiss menu" }),
    ).toBeInTheDocument();
  });

  it("should include admin nav in the hamburger without visiting /admin first", async () => {
    const user = userEvent.setup();

    const { container } = renderHeader(
      <SiteHeader
        adminNav={{
          pools: [{ id: "pool-1", name: "My Pool" }],
          tournaments: [{ id: "t-2026", status: "live", year: 2026 }],
        }}
        isCommissioner={true}
        isSignedIn={true}
      />,
    );

    expect(screen.queryByRole("button", { name: "Admin menu" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Open menu" }));

    const mobileNav = screen.getByRole("dialog", { name: "Mobile" });

    expect(mobileNav).toHaveAttribute("aria-modal", "true");
    expect(mobileNav.className).toContain(
      "top-[calc(4rem+env(safe-area-inset-top,0px))]",
    );
    expect(
      within(mobileNav).getByRole("link", { name: "Home" }),
    ).toBeInTheDocument();
    expect(
      within(mobileNav).queryByRole("link", { name: "Admin" }),
    ).toBeNull();
    expect(
      within(mobileNav).getByRole("link", { name: "All Tournaments" }),
    ).toHaveAttribute("href", "/admin/tournaments");
    expect(within(mobileNav).getByText("My Pool")).toBeInTheDocument();
    expect(document.body).toHaveClass("overflow-hidden");
    expect(await axe(container)).toHaveNoViolations();

    await user.click(within(mobileNav).getByRole("link", { name: "All Pools" }));

    expect(
      screen.queryByRole("dialog", { name: "Mobile" }),
    ).not.toBeInTheDocument();
    expect(document.body).not.toHaveClass("overflow-hidden");
  });

  it("should close the mobile menu on Escape and overlay dismiss", async () => {
    const user = userEvent.setup();

    renderHeader(
      <SiteHeader
        adminNav={{
          pools: [{ id: "pool-1", name: "My Pool" }],
          tournaments: [{ id: "t-2026", status: "live", year: 2026 }],
        }}
        isCommissioner={true}
        isSignedIn={true}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByRole("dialog", { name: "Mobile" })).toBeInTheDocument();
    expect(document.body).toHaveClass("overflow-hidden");

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Mobile" })).toBeNull();
    expect(document.body).not.toHaveClass("overflow-hidden");

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.click(screen.getByRole("button", { name: "Dismiss menu" }));
    expect(screen.queryByRole("dialog", { name: "Mobile" })).toBeNull();
    expect(document.body).not.toHaveClass("overflow-hidden");
  });

  it("should close the mobile menu when the pathname changes", async () => {
    const user = userEvent.setup();
    const header = (
      <SiteHeader
        adminNav={{
          pools: [{ id: "pool-1", name: "My Pool" }],
          tournaments: [{ id: "t-2026", status: "live", year: 2026 }],
        }}
        isCommissioner={true}
        isSignedIn={true}
      />
    );

    const { rerender } = renderHeader(header);

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByRole("dialog", { name: "Mobile" })).toBeInTheDocument();

    pathnameMock.mockReturnValue("/admin/tournaments");
    rerender(
      <ToastProvider>
        <SiteHeader
          adminNav={{
            pools: [{ id: "pool-1", name: "My Pool" }],
            tournaments: [{ id: "t-2026", status: "live", year: 2026 }],
          }}
          isCommissioner={true}
          isSignedIn={true}
        />
      </ToastProvider>,
    );

    expect(screen.queryByRole("dialog", { name: "Mobile" })).toBeNull();
    expect(document.body).not.toHaveClass("overflow-hidden");
  });
});
