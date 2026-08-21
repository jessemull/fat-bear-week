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

import { BearList } from "@/components/admin/BearList";

const bears = [
  { id: "bear-1", name: "Grazer", nickname: "Chunk" },
  { id: "bear-2", name: "Otis", nickname: null },
];

describe("BearList", () => {
  beforeEach(() => {
    push.mockReset();
  });

  it("should show an empty status when there are no bears", async () => {
    const { container } = render(
      <BearList bears={[]} tournamentId="t-2026" />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("No bears yet.");
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.queryByRole("list")).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("should render mobile cards and a desktop table", async () => {
    const { container } = render(
      <BearList bears={bears} tournamentId="t-2026" />,
    );

    const list = screen.getByRole("list");
    const card = within(list).getByRole("link", { name: /Grazer/ });

    expect(card).toHaveAttribute(
      "href",
      "/admin/tournaments/t-2026/bears/bear-1",
    );
    expect(within(card).getByText("Chunk")).toBeInTheDocument();
    expect(within(list).getByText("No nickname")).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: "Open bear Grazer" }),
    ).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("should open a bear from a table row", async () => {
    const user = userEvent.setup();

    render(<BearList bears={bears} tournamentId="t-2026" />);

    await user.click(screen.getByRole("link", { name: "Open bear Otis" }));

    expect(push).toHaveBeenCalledWith("/admin/tournaments/t-2026/bears/bear-2");
  });
});
