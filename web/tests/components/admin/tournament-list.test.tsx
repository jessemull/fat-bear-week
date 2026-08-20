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

import type { TournamentRecord } from "@/lib/tournament-types";

import { TournamentList } from "@/components/admin/TournamentList";

const tournaments: TournamentRecord[] = [
  {
    endsAt: "2026-10-08T12:00:00.000Z",
    id: "t-2026",
    startsAt: "2026-10-01T12:00:00.000Z",
    status: "live",
    year: 2026,
  },
  {
    endsAt: null,
    id: "t-2025",
    startsAt: null,
    status: "complete",
    year: 2025,
  },
  {
    endsAt: "nope",
    id: "t-2024",
    startsAt: "not-a-date",
    status: "draft",
    year: 2024,
  },
];

describe("TournamentList", () => {
  beforeEach(() => {
    push.mockReset();
  });

  it("should show an empty status when there are no tournaments", async () => {
    const { container } = render(<TournamentList tournaments={[]} />);

    expect(screen.getByRole("status")).toHaveTextContent("No tournaments yet.");
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.queryByRole("list")).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("should render mobile cards and a desktop table for each tournament", async () => {
    const { container } = render(
      <TournamentList tournaments={tournaments} />,
    );

    const list = screen.getByRole("list");
    const card = within(list).getByRole("link", { name: /2026/ });

    expect(card).toHaveAttribute("href", "/admin/tournaments/t-2026");
    expect(within(card).getByRole("heading", { name: "2026" })).toBeInTheDocument();
    expect(within(card).getByText("Live")).toBeInTheDocument();
    expect(within(card).getByText(/Tournament ·/)).toBeInTheDocument();
    expect(
      within(list).getByRole("link", { name: /2025/ }),
    ).toHaveAttribute("href", "/admin/tournaments/t-2025");
    expect(within(list).getByText("Complete")).toBeInTheDocument();
    expect(
      within(list).getByRole("link", { name: /2024/ }),
    ).toHaveAttribute("href", "/admin/tournaments/t-2024");
    expect(within(list).getAllByText("Tournament · No dates set")).toHaveLength(
      2,
    );

    const table = screen.getByRole("table");

    expect(
      within(table).getByRole("columnheader", { name: "Year" }),
    ).toBeInTheDocument();
    expect(
      within(table).getByRole("link", { name: "Open tournament 2026" }),
    ).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("should open a tournament from a table row", async () => {
    const user = userEvent.setup();

    render(<TournamentList tournaments={tournaments} />);

    await user.click(
      screen.getByRole("link", { name: "Open tournament 2026" }),
    );

    expect(push).toHaveBeenCalledWith("/admin/tournaments/t-2026");
  });

  it("should open a tournament from a table row with the keyboard", async () => {
    const user = userEvent.setup();

    render(<TournamentList tournaments={tournaments} />);

    const row = screen.getByRole("link", { name: "Open tournament 2025" });

    row.focus();
    await user.keyboard("{Enter}");

    expect(push).toHaveBeenCalledWith("/admin/tournaments/t-2025");

    push.mockReset();
    await user.keyboard(" ");

    expect(push).toHaveBeenCalledWith("/admin/tournaments/t-2025");
  });
});
