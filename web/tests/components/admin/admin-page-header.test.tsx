import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import {
  AdminPageHeader,
  AdminPageHeaderLinkAction,
} from "@/components/admin/AdminPageHeader";
import { adminHeaderPrimaryActionClassName } from "@/lib/form-styles";

describe("AdminPageHeader", () => {
  it("should render title, description, and optional actions", async () => {
    const { container } = render(
      <AdminPageHeader
        action={
          <AdminPageHeaderLinkAction href="/admin/new" label="Create" />
        }
        description="Helper copy for the page."
        title="Title"
      >
        <a href="/admin/example">Action</a>
      </AdminPageHeader>,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Title" })).toHaveClass(
      "text-3xl",
    );
    expect(container.querySelector("header")).toHaveClass("flex", "flex-col");
    expect(screen.getByText("Helper copy for the page.")).toHaveClass("text-sm");
    expect(screen.getByRole("link", { name: "Create" })).toHaveAttribute(
      "href",
      "/admin/new",
    );
    expect(screen.getByRole("link", { name: "Create" })).toHaveClass(
      adminHeaderPrimaryActionClassName,
    );
    expect(screen.getByRole("link", { name: "Action" })).toHaveAttribute(
      "href",
      "/admin/example",
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
