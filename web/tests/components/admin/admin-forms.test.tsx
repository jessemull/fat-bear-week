import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    refresh,
    replace: vi.fn(),
  }),
}));

import { BearForm } from "@/components/admin/BearForm";
import { BearList } from "@/components/admin/BearList";
import { BracketSeedForm } from "@/components/admin/BracketSeedForm";
import { CreateTournamentForm } from "@/components/admin/CreateTournamentForm";
import { DeleteBearButton } from "@/components/admin/DeleteBearButton";
import { DeleteTournamentButton } from "@/components/admin/DeleteTournamentButton";
import { SetWinnerForm } from "@/components/admin/SetWinnerForm";
import { TournamentList } from "@/components/admin/TournamentList";
import { TournamentStatusControls } from "@/components/admin/TournamentStatusControls";

const tournamentId = "11111111-1111-4111-8111-111111111111";
const bearAId = "22222222-2222-4222-8222-222222222222";
const bearBId = "33333333-3333-4333-8333-333333333333";
const matchupId = "44444444-4444-4444-8444-444444444444";

describe("admin forms", () => {
  beforeEach(() => {
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
    const { container } = render(<CreateTournamentForm />);

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
    expect(screen.getByText("2026")).toBeInTheDocument();
    expect(screen.getByText("live")).toBeInTheDocument();
    expect(screen.getByText("2025")).toBeInTheDocument();
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

    render(<CreateTournamentForm />);

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
    const { container } = render(
      <BearForm mode="create" tournamentId={tournamentId} />,
    );

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Identification (optional)")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
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

    render(<BearForm mode="create" tournamentId={tournamentId} />);

    await user.type(screen.getByLabelText("Name"), "Otis");
    await user.type(screen.getByLabelText("Nickname (optional)"), "The Boss");
    await user.type(
      screen.getByLabelText("Identification (optional)"),
      "Dark fur.",
    );
    await user.type(
      screen.getByLabelText("Biography (optional)"),
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

    render(
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

    expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
    expect(screen.getByText("Otis")).toBeInTheDocument();
    expect(screen.getByText("Boss")).toBeInTheDocument();

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

    render(<BearForm mode="create" tournamentId={tournamentId} />);

    await user.type(screen.getByLabelText("Name"), "Otis");
    await user.click(screen.getByRole("button", { name: "Create Bear" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to create bear.",
    );
  });

  it("should delete a bear after confirm", async () => {
    const user = userEvent.setup();

    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));

    render(
      <DeleteBearButton
        bearId={bearAId}
        name="Otis"
        tournamentId={tournamentId}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Delete Bear" }));

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

    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ error: "Bear is used in a matchup." }),
        ok: false,
      }),
    );

    render(
      <DeleteBearButton
        bearId={bearAId}
        name="Otis"
        tournamentId={tournamentId}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Delete Bear" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Bear is used in a matchup.",
    );
  });

  it("should seed a bracket from selected bears", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <BracketSeedForm
        bears={[
          { id: bearAId, name: "Otis" },
          { id: bearBId, name: "Chunk" },
        ]}
        tournamentId={tournamentId}
      />,
    );

    expect(await axe(container)).toHaveNoViolations();

    await user.click(screen.getByLabelText("Otis"));
    await user.click(screen.getByLabelText("Chunk"));
    await user.click(screen.getAllByRole("button", { name: "Down" })[0]);
    await user.click(screen.getAllByRole("button", { name: "Up" })[1]);
    await user.click(screen.getByRole("button", { name: "Seed bracket" }));

    expect(fetch).toHaveBeenCalledWith(
      `/api/admin/tournaments/${tournamentId}/bracket`,
      expect.objectContaining({ method: "PUT" }),
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("should prompt when no bears exist for seeding", () => {
    render(<BracketSeedForm bears={[]} tournamentId={tournamentId} />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Add bears before seeding the bracket.",
    );
  });

  it("should transition tournament status", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TournamentStatusControls
        status="draft"
        tournamentId={tournamentId}
      />,
    );

    expect(await axe(container)).toHaveNoViolations();
    expect(screen.getByLabelText("Status")).toHaveValue("draft");

    await user.selectOptions(screen.getByLabelText("Status"), "live");

    expect(fetch).toHaveBeenCalledWith(
      `/api/admin/tournaments/${tournamentId}/status`,
      expect.objectContaining({ method: "POST" }),
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("should set a matchup winner", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <SetWinnerForm
        bearAId={bearAId}
        bearALabel="#480 Otis"
        bearBId={bearBId}
        bearBLabel="#32 Chunk"
        matchupId={matchupId}
      />,
    );

    expect(await axe(container)).toHaveNoViolations();

    await user.click(screen.getByLabelText("#32 Chunk"));
    await user.type(screen.getByLabelText("Votes A (optional)"), "100");
    await user.type(screen.getByLabelText("Votes B (optional)"), "200");
    await user.click(screen.getByRole("button", { name: "Set winner" }));

    expect(fetch).toHaveBeenCalledWith(
      `/api/admin/matchups/${matchupId}/result`,
      expect.objectContaining({ method: "POST" }),
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("should show SetWinnerForm API errors", async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ error: "Invalid winner." }),
        ok: false,
      }),
    );

    render(
      <SetWinnerForm
        bearAId={bearAId}
        bearALabel="#480 Otis"
        bearBId={bearBId}
        bearBLabel="#32 Chunk"
        matchupId={matchupId}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Set winner" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Invalid winner.");
  });

  it("should wait when SetWinnerForm has no bears", () => {
    render(
      <SetWinnerForm
        bearAId={null}
        bearALabel="TBD"
        bearBId={null}
        bearBLabel="TBD"
        matchupId={matchupId}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Waiting for both sides.",
    );
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

    render(
      <TournamentStatusControls
        status="draft"
        tournamentId={tournamentId}
      />,
    );

    await user.selectOptions(screen.getByLabelText("Status"), "locked");

    expect(screen.getByRole("alert")).toHaveTextContent(
      "That status transition is not allowed.",
    );
  });

  it("should show bracket seed errors", async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ error: "Invalid bear list for seeding." }),
        ok: false,
      }),
    );

    render(
      <BracketSeedForm
        bears={[
          { id: bearAId, name: "Otis" },
          { id: bearBId, name: "Chunk" },
        ]}
        tournamentId={tournamentId}
      />,
    );

    const checkboxes = screen.getAllByRole("checkbox");

    await user.click(checkboxes[0]);
    await user.click(checkboxes[1]);
    await user.click(screen.getByRole("button", { name: "Seed bracket" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Invalid bear list for seeding.",
    );
  });

  it("should delete a tournament after confirm", async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      "confirm",
      vi.fn().mockReturnValue(true),
    );

    const { container } = render(
      <DeleteTournamentButton tournamentId={tournamentId} year={2026} />,
    );

    await user.click(
      screen.getByRole("button", { name: "Delete Tournament" }),
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

    vi.stubGlobal("confirm", vi.fn().mockReturnValue(false));

    render(<DeleteTournamentButton tournamentId={tournamentId} year={2026} />);
    await user.click(
      screen.getByRole("button", { name: "Delete Tournament" }),
    );

    expect(fetch).not.toHaveBeenCalled();

    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
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

    expect(await screen.findByRole("alert")).toHaveTextContent("Still in use.");
  });
});
