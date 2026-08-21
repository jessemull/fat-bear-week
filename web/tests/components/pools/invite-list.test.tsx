import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
}));

import { InviteList } from "@/components/pools/InviteList";

const invites = [
  {
    email: "player@example.com",
    expiresAt: "2026-10-01T12:00:00.000Z",
    id: "invite-1",
    nameHint: "Alex",
    status: "unused" as const,
  },
  {
    email: null,
    expiresAt: null,
    id: "invite-2",
    nameHint: null,
    status: "used" as const,
  },
];

describe("InviteList", () => {
  beforeEach(() => {
    push.mockReset();
  });

  it("should render mobile cards and a desktop table", async () => {
    const { container } = render(
      <InviteList invites={invites} poolId="pool-1" />,
    );

    const list = screen.getByRole("list");
    const card = within(list).getByRole("link", { name: /player@example.com/ });

    expect(card).toHaveAttribute("href", "/admin/pools/pool-1/invites/invite-1");
    expect(within(card).getByText(/Alex · Expires/)).toBeInTheDocument();
    expect(within(card).getByText("Pending")).toBeInTheDocument();
    expect(
      within(list).getByRole("link", { name: /No email/ }),
    ).toHaveAttribute("href", "/admin/pools/pool-1/invites/invite-2");
    expect(within(list).getByText("Used")).toBeInTheDocument();
    expect(within(list).getByText("No name hint")).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("should open an invite from a table row", async () => {
    const user = userEvent.setup();

    render(<InviteList invites={invites} poolId="pool-1" />);

    await user.click(
      screen.getByRole("link", { name: "Open invite player@example.com" }),
    );

    expect(push).toHaveBeenCalledWith("/admin/pools/pool-1/invites/invite-1");
  });
});
