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

import { PoolList } from "@/components/pools/PoolList";

const pools = [
  {
    entryCount: 3,
    id: "pool-1",
    maxPlayers: 10,
    name: "My Pool",
    role: "commissioner" as const,
  },
  {
    entryCount: 1,
    id: "pool-2",
    maxPlayers: 8,
    name: "Friends",
    role: "member" as const,
  },
];

describe("PoolList", () => {
  beforeEach(() => {
    push.mockReset();
  });

  it("should render mobile cards and a desktop table", async () => {
    const { container } = render(<PoolList pools={pools} />);

    const list = screen.getByRole("list");

    expect(
      within(list).getByRole("link", { name: /My Pool/ }),
    ).toHaveAttribute("href", "/admin/pools/pool-1");
    expect(within(list).getByText("3 / 10 players")).toBeInTheDocument();
    expect(within(list).queryByRole("link", { name: /Friends/ })).toBeNull();
    expect(within(list).getByText("Friends").closest("div")).not.toHaveClass(
      "hover:border-amber-600/50",
    );
    expect(within(list).getByText("Member")).toBeInTheDocument();
    expect(within(list).getByText("Admin")).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("should open commissioner pools from a table row only", async () => {
    const user = userEvent.setup();

    render(<PoolList pools={pools} />);

    await user.click(screen.getByRole("link", { name: "Open My Pool" }));

    expect(push).toHaveBeenCalledWith("/admin/pools/pool-1");
    expect(
      screen.queryByRole("link", { name: "Open Friends" }),
    ).toBeNull();
  });
});
