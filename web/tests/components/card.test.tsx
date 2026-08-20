import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import {
  Card,
  CardBadge,
  CardHeader,
  CardList,
  CardMeta,
} from "@/components/Card";

describe("Card", () => {
  it("should render static content when href is omitted", async () => {
    const { container } = render(
      <Card>
        <p>Draft tournament</p>
      </Card>,
    );

    expect(screen.getByText("Draft tournament")).toBeInTheDocument();
    expect(screen.queryByRole("link")).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("should render as a link when href is set", async () => {
    const { container } = render(
      <Card href="/admin/tournaments/t-2026">Open 2026</Card>,
    );

    expect(screen.getByRole("link", { name: "Open 2026" })).toHaveAttribute(
      "href",
      "/admin/tournaments/t-2026",
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("should render a compact title, badge, and meta line", async () => {
    const { container } = render(
      <CardList>
        <li>
          <Card href="/admin/tournaments/t-2026">
            <CardHeader
              badge={<CardBadge tone="accent">Live</CardBadge>}
              title="2026"
            />
            <CardMeta>Tournament · Oct 1 – Oct 8</CardMeta>
          </Card>
        </li>
      </CardList>,
    );

    const list = screen.getByRole("list");
    const card = within(list).getByRole("link", { name: /2026/ });

    expect(card).toHaveAttribute("href", "/admin/tournaments/t-2026");
    expect(within(card).getByText("Live")).toBeInTheDocument();
    expect(within(card).getByText("Tournament · Oct 1 – Oct 8")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
