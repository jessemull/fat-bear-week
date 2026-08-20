import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

describe("AdminPageHeader", () => {
  it("should render title, description, and optional actions", async () => {
    const { container } = render(
      <AdminPageHeader
        action={<a href="/admin/new">Create</a>}
        description="Helper copy for the page."
        title="Title"
      >
        <a href="/admin/example">Action</a>
      </AdminPageHeader>,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Title" })).toHaveClass(
      "text-3xl",
    );
    expect(container.querySelector("header")).toHaveClass(
      "@container",
      "grid-cols-1",
      "@min-[512px]:grid-cols-[minmax(0,1fr)_auto]",
    );
    expect(screen.getByText("Helper copy for the page.")).toHaveClass(
      "@min-[512px]:col-start-1",
      "@min-[512px]:row-start-2",
    );
    expect(screen.getByRole("link", { name: "Create" }).parentElement).toHaveClass(
      "@min-[512px]:col-start-2",
      "@min-[512px]:row-start-1",
      "w-full",
    );
    expect(screen.getByText("Helper copy for the page.")).toHaveClass("text-sm");
    expect(screen.getByRole("link", { name: "Create" })).toHaveAttribute(
      "href",
      "/admin/new",
    );
    expect(screen.getByRole("link", { name: "Action" })).toHaveAttribute(
      "href",
      "/admin/example",
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
