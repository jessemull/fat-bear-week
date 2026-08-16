import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ButtonPendingLabel } from "@/components/ButtonPendingLabel";

describe("ButtonPendingLabel", () => {
  it("should render the label text", () => {
    render(<ButtonPendingLabel>Saving…</ButtonPendingLabel>);

    expect(screen.getByText("Saving…")).toBeInTheDocument();
  });
});
