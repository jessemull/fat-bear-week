import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
}));

import { CreatePoolForm } from "@/components/pools/CreatePoolForm";
import { InviteList } from "@/components/pools/InviteList";
import { MintInviteForm } from "@/components/pools/MintInviteForm";
import { PoolList } from "@/components/pools/PoolList";

const tournamentId = "11111111-1111-4111-8111-111111111111";

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
          emailSent: true,
          inviteUrl: "http://localhost:3000/invite/abc",
        },
      }),
      ok: true,
    };
  });
}

describe("pool components", () => {
  it("should submit CreatePoolForm and MintInviteForm", async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetchWithTournaments();

    vi.stubGlobal("fetch", fetchMock);

    const { rerender } = render(<CreatePoolForm />);

    await waitFor(() => {
      expect(screen.getByLabelText("Tournament")).toHaveTextContent("2026");
    });

    await user.type(screen.getByLabelText("Pool name"), "Friends");
    await user.click(screen.getByRole("button", { name: "Create pool" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/pools",
      expect.objectContaining({ method: "POST" }),
    );

    rerender(
      <MintInviteForm poolId="11111111-1111-4111-8111-111111111111" />,
    );
    await user.type(screen.getByLabelText("Invitee email"), "a@example.com");
    await user.click(screen.getByRole("button", { name: "Send invite" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/pools/11111111-1111-4111-8111-111111111111/invites",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("should resend an unused invite", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ data: { emailSent: true } }),
      ok: true,
    });

    vi.stubGlobal("fetch", fetchMock);

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

    await user.click(screen.getByRole("button", { name: "Resend" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/pools/pool-1/invites/inv-1/resend",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("should show email failure warning on mint", async () => {
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

    render(<MintInviteForm poolId="pool-1" />);
    await user.type(screen.getByLabelText("Invitee email"), "a@example.com");
    await user.click(screen.getByRole("button", { name: "Send invite" }));

    expect(
      screen.getByRole("status"),
    ).toHaveTextContent(/email could not be sent/i);
  });

  it("should render CreatePoolForm without a11y violations", async () => {
    vi.stubGlobal("fetch", mockFetchWithTournaments());

    const { container } = render(<CreatePoolForm />);

    await waitFor(() => {
      expect(screen.getByLabelText("Tournament")).toHaveTextContent("2026");
    });
    expect(screen.getByLabelText("Pool name")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("should render MintInviteForm without a11y violations", async () => {
    const { container } = render(
      <MintInviteForm poolId="11111111-1111-4111-8111-111111111111" />,
    );

    expect(screen.getByLabelText("Invitee email")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("should render empty PoolList status", async () => {
    const { container } = render(<PoolList pools={[]} />);

    expect(screen.getByRole("status")).toHaveTextContent("No pools yet.");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("should link commissioner pools to invite management", () => {
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

    expect(
      screen.getByRole("link", { name: "Manage invites" }),
    ).toHaveAttribute("href", "/admin/pools/pool-1/invites");
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

    expect(screen.getByRole("button", { name: "Resend" })).toBeInTheDocument();
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

    render(<CreatePoolForm />);

    await waitFor(() => {
      expect(screen.getByLabelText("Tournament")).toHaveTextContent("2026");
    });

    await user.type(screen.getByLabelText("Pool name"), "Friends");
    await user.click(screen.getByRole("button", { name: "Create pool" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Unknown tournament.");
  });

  it("should show tournament load errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ error: "Forbidden." }),
        ok: false,
      }),
    );

    render(<CreatePoolForm />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Forbidden.");
    });
  });

  it("should show empty tournament status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ data: { tournaments: [] } }),
        ok: true,
      }),
    );

    render(<CreatePoolForm />);

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(
        "Create a tournament in admin",
      );
    });
  });

  it("should submit with an optional bracket deadline", async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetchWithTournaments();

    vi.stubGlobal("fetch", fetchMock);

    render(<CreatePoolForm />);

    await waitFor(() => {
      expect(screen.getByLabelText("Tournament")).toHaveTextContent("2026");
    });

    await user.type(screen.getByLabelText("Pool name"), "Friends");
    await user.type(
      screen.getByLabelText("Bracket deadline"),
      "2026-10-01T12:00",
    );
    await user.click(screen.getByRole("button", { name: "Create pool" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/pools",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("should omit manage link for member pools", () => {
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
      screen.queryByRole("link", { name: "Manage invites" }),
    ).not.toBeInTheDocument();
  });

  it("should omit resend for used invites", () => {
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

    expect(screen.queryByRole("button", { name: "Resend" })).not.toBeInTheDocument();
  });
});
