import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { Card, CardField, CardFields, CardList } from "@/components/Card";

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

  it("should list labeled fields inside cards", async () => {
    const { container } = render(
      <CardList>
        <li>
          <Card href="/admin/tournaments/t-2026">
            <h2>2026</h2>
            <CardFields>
              <CardField label="Status" value="Live" />
              <CardField label="Starts" value="—" />
            </CardFields>
          </Card>
        </li>
      </CardList>,
    );

    const list = screen.getByRole("list");
    const card = within(list).getByRole("link", { name: /2026/ });

    expect(card).toHaveAttribute("href", "/admin/tournaments/t-2026");
    expect(within(card).getByText("Status")).toBeInTheDocument();
    expect(within(card).getByText("Live")).toBeInTheDocument();
    expect(card.querySelector("dl")).toHaveClass("grid-cols-[auto_1fr]");
    expect(await axe(container)).toHaveNoViolations();
  });
});
