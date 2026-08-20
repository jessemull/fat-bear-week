import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { type ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const refresh = vi.fn();
const back = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    back,
    push,
    refresh,
    replace: vi.fn(),
  }),
}));

import { BearForm } from "@/components/admin/BearForm";
import { BearList } from "@/components/admin/BearList";
import { CreateTournamentForm } from "@/components/admin/CreateTournamentForm";
import { DeleteBearButton } from "@/components/admin/DeleteBearButton";
import { DeleteTournamentButton } from "@/components/admin/DeleteTournamentButton";
import { TournamentList } from "@/components/admin/TournamentList";
import { TournamentStatusControls } from "@/components/admin/TournamentStatusControls";
import { ToastProvider } from "@/components/Toast";

const tournamentId = "11111111-1111-4111-8111-111111111111";
const bearAId = "22222222-2222-4222-8222-222222222222";

function renderWithToast(ui: ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe("admin forms", () => {
  beforeEach(() => {
    back.mockReset();
    push.mockReset();
    refresh.mockReset();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ data: { ok: true } }),
        ok: true,
      }),
    );
  });

  it("should render CreateTournamentForm without a11y violations", async () => {
    const { container } = renderWithToast(<CreateTournamentForm />);

    expect(screen.getByLabelText("Year")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("should render TournamentList table and open on row click", async () => {
    const user = userEvent.setup();
    const empty = render(<TournamentList tournaments={[]} />);

    expect(screen.getByRole("status")).toHaveTextContent("No tournaments yet.");
    expect(await axe(empty.container)).toHaveNoViolations();

    empty.unmount();

    const { container } = render(
      <TournamentList
        tournaments={[
          {
            endsAt: "2026-10-10T00:00:00.000Z",
            id: tournamentId,
            startsAt: null,
            status: "live",
            year: 2026,
          },
          {
            endsAt: "not-a-date",
            id: "55555555-5555-4555-8555-555555555555",
            startsAt: "2025-10-01T00:00:00.000Z",
            status: "draft",
            year: 2025,
          },
        ]}
      />,
    );

    expect(screen.getByRole("columnheader", { name: "Year" })).toBeInTheDocument();
    expect(screen.getAllByText("2026").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Live").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2025").length).toBeGreaterThan(0);
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);

    const row = screen.getByRole("link", { name: "Open tournament 2026" });

    await user.click(row);

    expect(push).toHaveBeenCalledWith(`/admin/tournaments/${tournamentId}`);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("should open TournamentList rows with the keyboard", async () => {
    const user = userEvent.setup();

    render(
      <TournamentList
        tournaments={[
          {
            endsAt: null,
            id: tournamentId,
            startsAt: null,
            status: "draft",
            year: 2026,
          },
        ]}
      />,
    );

    const row = screen.getByRole("link", { name: "Open tournament 2026" });

    row.focus();
    await user.keyboard("{Enter}");

    expect(push).toHaveBeenCalledWith(`/admin/tournaments/${tournamentId}`);
  });

  it("should submit CreateTournamentForm and show API errors", async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          data: { tournament: { id: tournamentId } },
        }),
        ok: true,
      }),
    );

    renderWithToast(<CreateTournamentForm />);

    const yearInput = screen.getByLabelText("Year");

    await user.clear(yearInput);
    await user.type(yearInput, "2026");
    await user.click(
      screen.getByRole("button", { name: "Create Tournament" }),
    );

    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/tournaments",
      expect.objectContaining({ method: "POST" }),
    );
    expect(push).toHaveBeenCalledWith(`/admin/tournaments/${tournamentId}`);
    expect(refresh).toHaveBeenCalled();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ error: "Year taken." }),
        ok: false,
      }),
    );

    await user.click(
      screen.getByRole("button", { name: "Create Tournament" }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Year taken.");
  });

  it("should render BearForm without a11y violations", async () => {
    const { container } = renderWithToast(
      <BearForm mode="create" tournamentId={tournamentId} />,
    );

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Identification")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("should go back when Cancel is clicked on BearForm", async () => {
    const user = userEvent.setup();

    renderWithToast(<BearForm mode="create" tournamentId={tournamentId} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(back).toHaveBeenCalled();
  });

  it("should submit BearForm create and redirect", async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ data: { bear: { id: bearAId } } }),
        ok: true,
      }),
    );

    renderWithToast(<BearForm mode="create" tournamentId={tournamentId} />);

    await user.type(screen.getByLabelText("Name"), "Otis");
    await user.type(screen.getByLabelText("Nickname"), "The Boss");
    await user.type(
      screen.getByLabelText("Identification"),
      "Dark fur.",
    );
    await user.type(
      screen.getByLabelText("Biography"),
      "Brooks River.",
    );
    await user.click(screen.getByRole("button", { name: "Create Bear" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `/api/admin/tournaments/${tournamentId}/bears`,
        expect.objectContaining({ method: "POST" }),
      );
    });
    expect(push).toHaveBeenCalledWith(
      `/admin/tournaments/${tournamentId}/bears/${bearAId}`,
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("should submit BearForm edit", async () => {
    const user = userEvent.setup();

    renderWithToast(
      <BearForm
        bear={{
          biography: null,
          id: bearAId,
          identification: null,
          name: "Otis",
          nickname: null,
        }}
        mode="edit"
        tournamentId={tournamentId}
      />,
    );

    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "480 Otis");
    await user.click(screen.getByRole("button", { name: "Save Bear" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `/api/admin/bears/${bearAId}`,
        expect.objectContaining({ method: "PATCH" }),
      );
    });
    expect(refresh).toHaveBeenCalled();
  });

  it("should render BearList table and open on row click", async () => {
    const user = userEvent.setup();
    const empty = render(
      <BearList bears={[]} tournamentId={tournamentId} />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("No bears yet.");
    expect(await axe(empty.container)).toHaveNoViolations();

    empty.unmount();

    const { container } = render(
      <BearList
        bears={[
          {
            id: bearAId,
            name: "Otis",
            nickname: "Boss",
          },
        ]}
        tournamentId={tournamentId}
      />,
    );

    const table = screen.getByRole("table");

    expect(within(table).getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
    expect(within(table).getByText("Otis")).toBeInTheDocument();
    expect(within(table).getByText("Boss")).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Open bear Otis" }));

    expect(push).toHaveBeenCalledWith(
      `/admin/tournaments/${tournamentId}/bears/${bearAId}`,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("should open BearList rows with the keyboard", async () => {
    const user = userEvent.setup();

    render(
      <BearList
        bears={[
          {
            id: bearAId,
            name: "Otis",
            nickname: null,
          },
        ]}
        tournamentId={tournamentId}
      />,
    );

    const row = screen.getByRole("link", { name: "Open bear Otis" });

    row.focus();
    await user.keyboard("{Enter}");

    expect(push).toHaveBeenCalledWith(
      `/admin/tournaments/${tournamentId}/bears/${bearAId}`,
    );

    push.mockReset();
    row.focus();
    await user.keyboard(" ");

    expect(push).toHaveBeenCalledWith(
      `/admin/tournaments/${tournamentId}/bears/${bearAId}`,
    );
  });

  it("should show BearForm create API errors", async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ error: "Unable to create bear." }),
        ok: false,
      }),
    );

    renderWithToast(<BearForm mode="create" tournamentId={tournamentId} />);

    await user.type(screen.getByLabelText("Name"), "Otis");
    await user.click(screen.getByRole("button", { name: "Create Bear" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to create bear.",
    );
  });

  it("should delete a bear after confirm", async () => {
    const user = userEvent.setup();

    renderWithToast(
      <DeleteBearButton
        bearId={bearAId}
        name="Otis"
        tournamentId={tournamentId}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Delete Bear" }));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Delete Bear",
      }),
    );

    expect(fetch).toHaveBeenCalledWith(
      `/api/admin/bears/${bearAId}`,
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(push).toHaveBeenCalledWith(
      `/admin/tournaments/${tournamentId}/bears`,
    );
  });

  it("should show DeleteBearButton API errors", async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ error: "Bear is used in a matchup." }),
        ok: false,
      }),
    );

    renderWithToast(
      <DeleteBearButton
        bearId={bearAId}
        name="Otis"
        tournamentId={tournamentId}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Delete Bear" }));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Delete Bear",
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Bear is used in a matchup.",
    );
  });

  it("should transition tournament status", async () => {
    const user = userEvent.setup();
    const { container } = renderWithToast(
      <TournamentStatusControls
        status="draft"
        tournamentId={tournamentId}
      />,
    );

    expect(await axe(container)).toHaveNoViolations();
    expect(screen.getByLabelText("Status")).toHaveTextContent("Draft");
    expect(screen.getByLabelText("Status").closest("div.flex")).toHaveClass(
      "@container",
      "w-full",
      "max-w-lg",
    );

    await user.click(screen.getByLabelText("Status"));
    await user.click(screen.getByRole("option", { name: "Live" }));

    expect(fetch).toHaveBeenCalledWith(
      `/api/admin/tournaments/${tournamentId}/status`,
      expect.objectContaining({ method: "POST" }),
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("should show status transition errors", async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ error: "That status transition is not allowed." }),
        ok: false,
      }),
    );

    renderWithToast(
      <TournamentStatusControls
        status="draft"
        tournamentId={tournamentId}
      />,
    );

    await user.click(screen.getByLabelText("Status"));
    await user.click(screen.getByRole("option", { name: "Locked" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "That status transition is not allowed.",
    );
  });

  it("should delete a tournament after confirm", async () => {
    const user = userEvent.setup();

    const { container } = renderWithToast(
      <DeleteTournamentButton tournamentId={tournamentId} year={2026} />,
    );

    await user.click(
      screen.getByRole("button", { name: "Delete Tournament" }),
    );
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Delete Tournament",
      }),
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `/api/admin/tournaments/${tournamentId}`,
        expect.objectContaining({ method: "DELETE" }),
      );
    });
    expect(push).toHaveBeenCalledWith("/admin/tournaments");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("should show delete errors and cancel without calling API", async () => {
    const user = userEvent.setup();

    renderWithToast(<DeleteTournamentButton tournamentId={tournamentId} year={2026} />);
    await user.click(
      screen.getByRole("button", { name: "Delete Tournament" }),
    );
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Cancel",
      }),
    );

    expect(fetch).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ error: "Still in use." }),
        ok: false,
      }),
    );

    await user.click(
      screen.getByRole("button", { name: "Delete Tournament" }),
    );
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Delete Tournament",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Still in use.");
  });
});
