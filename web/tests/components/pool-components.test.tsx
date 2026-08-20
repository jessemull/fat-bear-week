import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
}));

import type { ReactElement } from "react";

import { CreatePoolForm } from "@/components/pools/CreatePoolForm";
import { DeletePoolButton } from "@/components/pools/DeletePoolButton";
import { parseInviteCsv } from "@/components/pools/InviteCsvUploadDialog";
import { InviteForm } from "@/components/pools/InviteForm";
import { InviteList } from "@/components/pools/InviteList";
import { PoolForm } from "@/components/pools/PoolForm";
import { PoolList } from "@/components/pools/PoolList";
import { ResendInviteButton } from "@/components/pools/ResendInviteButton";
import { SendInvitesPanel } from "@/components/pools/SendInvitesPanel";
import { ToastProvider } from "@/components/Toast";

const tournamentId = "11111111-1111-4111-8111-111111111111";

function renderWithToast(ui: ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

function mockFetchWithTournaments(
  overrides?: (url: string, init?: RequestInit) => unknown,
) {
  return vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
    if (url === "/api/admin/tournaments") {
      return {
        json: async () => ({
          data: {
            tournaments: [
              { id: tournamentId, status: "draft", year: 2026 },
            ],
          },
        }),
        ok: true,
      };
    }

    if (overrides) {
      const custom = overrides(url, init);

      if (custom) {
        return custom;
      }
    }

    return {
      json: async () => ({
        data: {
          created: 1,
          failed: 0,
          results: [
            {
              email: "a@example.com",
              emailSent: true,
              inviteId: "inv-1",
              inviteUrl: "http://localhost:3000/invite/abc",
            },
          ],
        },
      }),
      ok: true,
    };
  });
}

describe("pool components", () => {
  it("should submit CreatePoolForm and SendInvitesPanel", async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetchWithTournaments();

    vi.stubGlobal("fetch", fetchMock);
    push.mockClear();

    const { rerender } = renderWithToast(<CreatePoolForm tournaments={[{ id: tournamentId, status: "draft", year: 2026 }]} />);

    await waitFor(() => {
      expect(screen.getByLabelText("Tournament")).toHaveTextContent("2026");
    });

    await user.type(screen.getByLabelText("Pool name"), "Friends");
    await user.click(screen.getByRole("button", { name: "Create Pool" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/pools",
      expect.objectContaining({ method: "POST" }),
    );

    rerender(
      <ToastProvider>
        <SendInvitesPanel poolId="11111111-1111-4111-8111-111111111111" />
      </ToastProvider>,
    );
    await user.type(screen.getByLabelText("Email 1"), "a@example.com");
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.type(screen.getByLabelText("Email 2"), "b@example.com");
    await user.click(screen.getByRole("button", { name: "Send Invites" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/pools/11111111-1111-4111-8111-111111111111/invites",
      expect.objectContaining({ method: "POST" }),
    );
    expect(push).toHaveBeenCalledWith(
      "/admin/pools/11111111-1111-4111-8111-111111111111/invites",
    );
  });

  it("should open an invite from the list", async () => {
    const user = userEvent.setup();

    push.mockClear();

    render(
      <InviteList
        invites={[
          {
            email: "a@example.com",
            expiresAt: null,
            id: "inv-1",
            nameHint: "Alex",
            status: "unused",
          },
        ]}
        poolId="pool-1"
      />,
    );

    await user.click(
      screen.getByRole("link", { name: "Open invite a@example.com" }),
    );

    expect(push).toHaveBeenCalledWith("/admin/pools/pool-1/invites/inv-1");
  });

  it("should open an invite with the keyboard", async () => {
    const user = userEvent.setup();

    push.mockClear();

    render(
      <InviteList
        invites={[
          {
            email: "a@example.com",
            expiresAt: "not-a-date",
            id: "inv-1",
            nameHint: null,
            status: "unused",
          },
        ]}
        poolId="pool-1"
      />,
    );

    screen
      .getByRole("link", { name: "Open invite a@example.com" })
      .focus();
    await user.keyboard("{Enter}");

    expect(push).toHaveBeenCalledWith("/admin/pools/pool-1/invites/inv-1");
  });

  it("should reject empty bulk invite submissions", async () => {
    const user = userEvent.setup();

    renderWithToast(<SendInvitesPanel poolId="pool-1" />);
    await user.click(screen.getByRole("button", { name: "Send Invites" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter at least one email address.",
    );
  });

  it("should save an invite and toast", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        data: {
          invite: {
            email: "b@example.com",
            id: "inv-1",
            nameHint: "Bea",
            status: "unused",
            tokenRotated: true,
          },
        },
      }),
      ok: true,
    });

    vi.stubGlobal("fetch", fetchMock);

    renderWithToast(
      <InviteForm
        invite={{
          email: "a@example.com",
          id: "inv-1",
          nameHint: "Alex",
          status: "unused",
        }}
        poolId="pool-1"
      />,
    );

    expect(screen.getByLabelText("Status")).toHaveValue("Unused");

    await user.clear(screen.getByLabelText("Invitee email"));
    await user.type(screen.getByLabelText("Invitee email"), "b@example.com");
    await user.click(screen.getByRole("button", { name: "Save Invite" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/pools/pool-1/invites/inv-1",
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Invite saved. The old link is invalid — use Resend Invite for the new address.",
    );
  });

  it("should toast a simple save message when the token is not rotated", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        data: {
          invite: {
            email: "a@example.com",
            id: "inv-1",
            nameHint: "Alexandra",
            status: "unused",
            tokenRotated: false,
          },
        },
      }),
      ok: true,
    });

    vi.stubGlobal("fetch", fetchMock);

    renderWithToast(
      <InviteForm
        invite={{
          email: "a@example.com",
          id: "inv-1",
          nameHint: "Alex",
          status: "unused",
        }}
        poolId="pool-1"
      />,
    );

    await user.clear(screen.getByLabelText("Name Hint"));
    await user.type(screen.getByLabelText("Name Hint"), "Alexandra");
    await user.click(screen.getByRole("button", { name: "Save Invite" }));

    expect(screen.getByRole("status")).toHaveTextContent("Invite saved.");
  });

  it("should show InviteForm API errors", async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ error: "Unable to save invite." }),
        ok: false,
      }),
    );

    renderWithToast(
      <InviteForm
        invite={{
          email: "a@example.com",
          id: "inv-1",
          nameHint: "Alex",
          status: "unused",
        }}
        poolId="pool-1"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Save Invite" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Unable to save invite.");
  });

  it("should show InviteForm network errors", async () => {
    const user = userEvent.setup();

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    renderWithToast(
      <InviteForm
        invite={{
          email: "a@example.com",
          id: "inv-1",
          nameHint: "Alex",
          status: "unused",
        }}
        poolId="pool-1"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Save Invite" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Unable to save invite right now.",
    );
  });

  it("should resend an invite from the header button", async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ data: { emailSent: true } }),
        ok: true,
      }),
    );

    renderWithToast(
      <ResendInviteButton inviteId="inv-1" poolId="pool-1" />,
    );

    await user.click(screen.getByRole("button", { name: "Resend Invite" }));

    expect(screen.getByRole("status")).toHaveTextContent("Invite resent.");
  });

  it("should toast when resend email delivery fails", async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          data: {
            emailSent: false,
            inviteUrl: "http://localhost:3000/invite/abc",
          },
        }),
        ok: true,
      }),
    );

    renderWithToast(
      <ResendInviteButton inviteId="inv-1" poolId="pool-1" />,
    );

    await user.click(screen.getByRole("button", { name: "Resend Invite" }));

    expect(screen.getByLabelText("Invite link")).toHaveValue(
      "http://localhost:3000/invite/abc",
    );
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);

    const writeText = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    await user.click(screen.getByRole("button", { name: "Copy link" }));

    expect(writeText).toHaveBeenCalledWith("http://localhost:3000/invite/abc");
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();

    writeText.mockRejectedValueOnce(new Error("denied"));
    await user.click(screen.getByRole("button", { name: "Copied" }));
    expect(screen.getByRole("button", { name: "Copy link" })).toBeInTheDocument();
    expect(screen.getByText(/Copy failed/)).toBeInTheDocument();
  });

  it("should show an error for an empty CSV", async () => {
    const user = userEvent.setup();

    renderWithToast(<SendInvitesPanel poolId="pool-1" />);
    await user.click(screen.getByRole("button", { name: "Upload" }));

    const file = new File(["email\n"], "empty.csv", { type: "text/csv" });

    await user.upload(screen.getByLabelText("Email list file"), file);
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Upload",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /No email addresses found/i,
    );
  });

  it("should warn when some bulk invites fail", async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          data: {
            created: 1,
            failed: 1,
            results: [
              {
                email: "a@example.com",
                emailSent: true,
                inviteId: "inv-1",
              },
              {
                email: "b@example.com",
                error: "An unused invite already exists for that email.",
              },
            ],
          },
        }),
        ok: true,
      }),
    );

    renderWithToast(<SendInvitesPanel poolId="pool-1" />);
    await user.type(screen.getByLabelText("Email 1"), "a@example.com");
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.type(screen.getByLabelText("Email 2"), "b@example.com");
    await user.click(screen.getByRole("button", { name: "Send Invites" }));

    expect(screen.getByRole("status")).toHaveTextContent(/Skipped/);
  });

  it("should parse invite CSV text", () => {
    expect(
      parseInviteCsv("email,name\na@example.com,Alex\nb@example.com,Bea\n"),
    ).toEqual([
      { email: "a@example.com", nameHint: "Alex" },
      { email: "b@example.com", nameHint: "Bea" },
    ]);
    expect(
      parseInviteCsv("a@example.com, Alice\nbob@example.com"),
    ).toEqual([
      { email: "a@example.com", nameHint: "Alice" },
      { email: "bob@example.com", nameHint: null },
    ]);
    expect(
      parseInviteCsv("a@example.com, b@example.com, c@example.com"),
    ).toEqual([
      { email: "a@example.com", nameHint: null },
      { email: "b@example.com", nameHint: null },
      { email: "c@example.com", nameHint: null },
    ]);

    const many = Array.from(
      { length: 101 },
      (_, index) => `user${index}@example.com`,
    ).join("\n");

    expect(parseInviteCsv(many)).toHaveLength(101);
  });

  it("should reject TextEdit RTF uploads with a plain-text hint", async () => {
    const user = userEvent.setup();

    renderWithToast(<SendInvitesPanel poolId="pool-1" />);
    await user.click(screen.getByRole("button", { name: "Upload" }));

    const file = new File(
      ["{\\rtf1\\ansi hello a@example.com}"],
      "invites.rtf",
      { type: "text/rtf" },
    );

    await user.upload(screen.getByLabelText("Email list file"), file);
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Upload",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /Make Plain Text/i,
    );
  });

  it("should reject CSV imports over the bulk invite cap", async () => {
    const user = userEvent.setup();

    renderWithToast(<SendInvitesPanel poolId="pool-1" />);
    await user.click(screen.getByRole("button", { name: "Upload" }));

    const body = Array.from(
      { length: 101 },
      (_, index) => `user${index}@example.com`,
    ).join("\n");
    const file = new File([body], "invites.csv", { type: "text/csv" });

    await user.upload(screen.getByLabelText("Email list file"), file);
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Upload",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "You can send at most 100 invites at once.",
    );
  });

  it("should reset upload modal errors when cancelled and reopened", async () => {
    const user = userEvent.setup();

    renderWithToast(<SendInvitesPanel poolId="pool-1" />);
    await user.click(screen.getByRole("button", { name: "Upload" }));

    const file = new File(["not-an-email"], "empty.txt", {
      type: "text/plain",
    });

    await user.upload(screen.getByLabelText("Email list file"), file);
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Upload",
      }),
    );
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Cancel",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Upload" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("should import emails from a CSV upload", async () => {
    const user = userEvent.setup();

    renderWithToast(<SendInvitesPanel poolId="pool-1" />);
    await user.click(screen.getByRole("button", { name: "Upload" }));

    const file = new File(
      ["email,name\na@example.com,Alex\nb@example.com,Bea\n"],
      "invites.csv",
      {
        type: "text/csv",
      },
    );

    await user.upload(screen.getByLabelText("Email list file"), file);
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Upload",
      }),
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Email 1")).toHaveValue("a@example.com");
    });
    expect(screen.getByLabelText("Name Hint 1")).toHaveValue("Alex");
    expect(screen.getByLabelText("Email 2")).toHaveValue("b@example.com");
    expect(screen.getByLabelText("Name Hint 2")).toHaveValue("Bea");
    expect(screen.getByRole("status")).toHaveTextContent(/Loaded 2 invites/);
  });

  it("should import emails from a txt upload", async () => {
    const user = userEvent.setup();

    renderWithToast(<SendInvitesPanel poolId="pool-1" />);
    await user.click(screen.getByRole("button", { name: "Upload" }));

    const file = new File(["a@example.com\nb@example.com\n"], "invites.txt", {
      type: "text/plain",
    });

    await user.upload(screen.getByLabelText("Email list file"), file);
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Upload",
      }),
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Email 1")).toHaveValue("a@example.com");
    });
    expect(screen.getByLabelText("Email 2")).toHaveValue("b@example.com");
  });

  it("should reject Excel uploads in the CSV dialog", async () => {
    const user = userEvent.setup();

    renderWithToast(<SendInvitesPanel poolId="pool-1" />);
    await user.click(screen.getByRole("button", { name: "Upload" }));

    const input = screen.getByLabelText("Email list file");
    const file = new File(["unused"], "invites.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    Object.defineProperty(input, "files", {
      configurable: true,
      value: [file],
    });
    input.dispatchEvent(new Event("change", { bubbles: true }));

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent(/Excel files are not supported/);
  });

  it("should remove an email row", async () => {
    const user = userEvent.setup();

    renderWithToast(<SendInvitesPanel poolId="pool-1" />);
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByLabelText("Email 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove invitee 2" }));
    expect(screen.queryByLabelText("Email 2")).not.toBeInTheDocument();
  });

  it("should render CreatePoolForm without a11y violations", async () => {
    vi.stubGlobal("fetch", mockFetchWithTournaments());

    const { container } = renderWithToast(<CreatePoolForm tournaments={[{ id: tournamentId, status: "draft", year: 2026 }]} />);

    await waitFor(() => {
      expect(screen.getByLabelText("Tournament")).toHaveTextContent("2026");
    });
    expect(screen.getByLabelText("Pool name")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("should render SendInvitesPanel without a11y violations", async () => {
    const { container } = renderWithToast(
      <SendInvitesPanel poolId="11111111-1111-4111-8111-111111111111" />,
    );

    expect(screen.getByLabelText("Email 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload" })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("should render empty PoolList status", async () => {
    const { container } = render(<PoolList pools={[]} />);

    expect(screen.getByRole("status")).toHaveTextContent("No pools yet.");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("should open commissioner pools to overview", async () => {
    const user = userEvent.setup();

    push.mockClear();

    render(
      <PoolList
        pools={[
          {
            entryCount: 1,
            id: "pool-1",
            maxPlayers: 10,
            name: "Friends",
            role: "commissioner",
          },
        ]}
      />,
    );

    await user.click(screen.getByRole("link", { name: "Open Friends" }));

    expect(push).toHaveBeenCalledWith("/admin/pools/pool-1");
  });

  it("should open commissioner pools with the keyboard", async () => {
    const user = userEvent.setup();

    push.mockClear();

    render(
      <PoolList
        pools={[
          {
            entryCount: 1,
            id: "pool-1",
            maxPlayers: 10,
            name: "Friends",
            role: "commissioner",
          },
        ]}
      />,
    );

    screen.getByRole("link", { name: "Open Friends" }).focus();
    await user.keyboard("{Enter}");

    expect(push).toHaveBeenCalledWith("/admin/pools/pool-1");
  });

  it("should render InviteList without a11y violations", async () => {
    const { container } = render(
      <InviteList
        invites={[
          {
            email: "a@example.com",
            expiresAt: null,
            id: "inv-1",
            nameHint: "Alex",
            status: "unused",
          },
        ]}
        poolId="pool-1"
      />,
    );

    expect(
      screen.getByRole("link", { name: "Open invite a@example.com" }),
    ).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("should show create pool API errors", async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      "fetch",
      mockFetchWithTournaments((url) => {
        if (url === "/api/pools") {
          return {
            json: async () => ({ error: "Unknown tournament." }),
            ok: false,
          };
        }

        return null;
      }),
    );

    renderWithToast(<CreatePoolForm tournaments={[{ id: tournamentId, status: "draft", year: 2026 }]} />);

    await waitFor(() => {
      expect(screen.getByLabelText("Tournament")).toHaveTextContent("2026");
    });

    await user.type(screen.getByLabelText("Pool name"), "Friends");
    await user.click(screen.getByRole("button", { name: "Create Pool" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Unknown tournament.");
  });

  it("should show empty tournament status", async () => {
    renderWithToast(<CreatePoolForm tournaments={[]} />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Create a tournament in admin",
    );
  });

  it("should submit with an optional bracket deadline", async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetchWithTournaments();

    vi.stubGlobal("fetch", fetchMock);

    renderWithToast(<CreatePoolForm tournaments={[{ id: tournamentId, status: "draft", year: 2026 }]} />);

    await waitFor(() => {
      expect(screen.getByLabelText("Tournament")).toHaveTextContent("2026");
    });

    await user.type(screen.getByLabelText("Pool name"), "Friends");
    await user.type(
      screen.getByLabelText("Bracket deadline"),
      "2026-10-01T12:00",
    );
    await user.click(screen.getByRole("button", { name: "Create Pool" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/pools",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("should omit open link for member pools", () => {
    render(
      <PoolList
        pools={[
          {
            entryCount: 1,
            id: "pool-1",
            maxPlayers: 10,
            name: "Friends",
            role: "member",
          },
        ]}
      />,
    );

    expect(
      screen.queryByRole("link", { name: "Open Friends" }),
    ).not.toBeInTheDocument();
    expect(within(screen.getByRole("table")).getByText("Friends")).toBeInTheDocument();
  });

  it("should render empty InviteList status", async () => {
    const { container } = render(<InviteList invites={[]} poolId="pool-1" />);

    expect(screen.getByRole("status")).toHaveTextContent("No invites yet.");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("should show InviteForm read-only state for used invites", () => {
    renderWithToast(
      <InviteForm
        invite={{
          email: "a@example.com",
          id: "inv-1",
          nameHint: null,
          status: "used",
        }}
        poolId="pool-1"
      />,
    );

    expect(screen.getByLabelText("Invitee email")).toBeDisabled();
    expect(screen.getByLabelText("Status")).toHaveValue("Used");
    expect(screen.getByLabelText("Status")).toBeDisabled();
    expect(
      screen.getByText("Used invites cannot be edited."),
    ).toBeInTheDocument();
  });

  it("should open used invites for viewing", () => {
    render(
      <InviteList
        invites={[
          {
            email: null,
            expiresAt: "2026-08-25T00:00:00.000Z",
            id: "inv-1",
            nameHint: null,
            status: "used",
          },
        ]}
        poolId="pool-1"
      />,
    );

    expect(
      screen.getByRole("link", { name: "Open invite inv-1" }),
    ).toBeInTheDocument();
    expect(within(screen.getByRole("table")).getByText("Used")).toBeInTheDocument();
  });

  it("should delete a pool after confirm", async () => {
    const user = userEvent.setup();

    push.mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ data: { deleted: true } }),
        ok: true,
      }),
    );

    renderWithToast(<DeletePoolButton name="Friends" poolId="pool-1" />);

    await user.click(screen.getByRole("button", { name: "Delete Pool" }));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Delete Pool",
      }),
    );

    expect(push).toHaveBeenCalledWith("/admin/pools");
  });

  it("should save pool edits", async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetchWithTournaments((url) => {
      if (url === "/api/pools/pool-1") {
        return {
          json: async () => ({
            data: { pool: { id: "pool-1" } },
          }),
          ok: true,
        };
      }

      return null;
    });

    vi.stubGlobal("fetch", fetchMock);

    renderWithToast(
      <PoolForm
        mode="edit"
        pool={{
          bracketDeadline: "2026-10-01T19:00:00.000Z",
          id: "pool-1",
          maxPlayers: 50,
          name: "Friends",
          scoringSystem: "standard_1_2_4_8",
          showBracketsBeforeLock: false,
          tournamentId: tournamentId,
        }}
        tournaments={[{ id: tournamentId, status: "draft", year: 2026 }]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Tournament")).toHaveTextContent("2026");
    });

    await user.clear(screen.getByLabelText("Pool name"));
    await user.type(screen.getByLabelText("Pool name"), "Renamed");
    await user.click(screen.getByRole("button", { name: "Save Pool" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/pools/pool-1",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("should show delete pool errors", async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ error: "Unable to delete pool." }),
        ok: false,
      }),
    );

    renderWithToast(<DeletePoolButton name="Friends" poolId="pool-1" />);

    await user.click(screen.getByRole("button", { name: "Delete Pool" }));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Delete Pool",
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Unable to delete pool.",
    );
  });
});
