import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: (href: string) => {
      push(href);
      window.history.pushState({}, "", href);
    },
    refresh,
    replace: vi.fn(),
  }),
}));

vi.mock("@/components/auth/TurnstileWidget", () => ({
  TurnstileWidget: ({
    onToken,
  }: {
    onToken: (token: null | string) => void;
  }) => {
    onToken("test-turnstile-token");

    return <div data-testid="turnstile-mock" />;
  },
}));

import type { ReactElement } from "react";

import { JoinForm } from "@/components/auth/JoinForm";
import { JoinPanel } from "@/components/auth/JoinPanel";
import { LoginPanel } from "@/components/auth/LoginPanel";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { ToastProvider } from "@/components/Toast";

function renderWithToast(ui: ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe("auth forms", () => {
  beforeEach(() => {
    push.mockReset();
    refresh.mockReset();
    window.history.pushState({}, "", "/invite/test-token");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ data: { ok: true } }),
        ok: true,
      }),
    );
  });

  it("should show join errors from the API", async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ error: "This pool is full." }),
        ok: false,
      }),
    );

    renderWithToast(
      <JoinForm
        email="otis@example.com"
        token={"t".repeat(32)}
        turnstileToken="test-turnstile-token"
      />,
    );
    await user.type(screen.getByLabelText("Display name"), "Otis");
    await user.type(screen.getByLabelText("Password"), "password1");
    await user.type(screen.getByLabelText("Confirm password"), "password1");
    await user.click(screen.getByRole("button", { name: "Join pool" }));

    expect(screen.getByRole("alert")).toHaveTextContent("This pool is full.");
  });

  it("should render JoinForm without a11y violations", async () => {
    const { container } = renderWithToast(
      <JoinForm
        email="jess@example.com"
        nameHint="Jess"
        token={"t".repeat(32)}
        turnstileToken="test-turnstile-token"
      />,
    );

    expect(screen.getByLabelText("Display name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveValue("jess@example.com");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("should submit JoinForm", async () => {
    const user = userEvent.setup();

    renderWithToast(
      <JoinForm
        email="otis@example.com"
        token={"t".repeat(32)}
        turnstileToken="test-turnstile-token"
      />,
    );

    await user.type(screen.getByLabelText("Display name"), "Otis");
    await user.type(screen.getByLabelText("Password"), "password1");
    await user.type(screen.getByLabelText("Confirm password"), "password1");
    await user.click(screen.getByRole("button", { name: "Join pool" }));

    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/join",
      expect.objectContaining({ method: "POST" }),
    );
    expect(push).toHaveBeenCalledWith("/");
  });

  it("should send JoinForm users to login when session was not created", async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          data: {
            entryId: "e1",
            needsSignIn: true,
            poolId: "p1",
            userId: "u1",
            userName: "Otis",
          },
        }),
        ok: true,
      }),
    );

    renderWithToast(
      <JoinForm
        email="otis@example.com"
        token={"t".repeat(32)}
        turnstileToken="test-turnstile-token"
      />,
    );

    await user.type(screen.getByLabelText("Display name"), "Otis");
    await user.type(screen.getByLabelText("Password"), "password1");
    await user.type(screen.getByLabelText("Confirm password"), "password1");
    await user.click(screen.getByRole("button", { name: "Join pool" }));

    expect(push).toHaveBeenCalledWith("/login?joined=1");
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Account ready — sign in to continue.",
    );
  });

  it("should join with an existing account using current password", async () => {
    const user = userEvent.setup();
    const onBotCheckReset = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ error: "Incorrect password for this account." }),
      ok: false,
    });

    vi.stubGlobal("fetch", fetchMock);

    renderWithToast(
      <JoinForm
        email="otis@example.com"
        existingAccount
        existingName="otis@friends"
        token={"t".repeat(32)}
        turnstileToken="test-turnstile-token"
        onBotCheckReset={onBotCheckReset}
      />,
    );

    expect(screen.getByLabelText("Display name")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Display name")).toHaveValue("otis@friends");
    expect(screen.queryByLabelText("Confirm password")).toBeNull();
    expect(
      screen.getByText(/existing display name will be used/i),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText("Password"), "password1");
    await user.click(screen.getByRole("button", { name: "Join pool" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/join",
      expect.objectContaining({
        body: expect.stringContaining('"passwordConfirm":"password1"'),
        method: "POST",
      }),
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toMatchObject({
      name: "otis@friends",
      password: "password1",
      passwordConfirm: "password1",
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Incorrect password for this account.",
    );
    expect(onBotCheckReset).toHaveBeenCalled();
  });

  it("should reject @ in display names for new joins", async () => {
    const user = userEvent.setup();

    renderWithToast(
      <JoinForm
        email="otis@example.com"
        token={"t".repeat(32)}
        turnstileToken="test-turnstile-token"
      />,
    );

    await user.type(screen.getByLabelText("Display name"), "otis@friends");
    await user.type(screen.getByLabelText("Password"), "password1");
    await user.type(screen.getByLabelText("Confirm password"), "password1");
    await user.click(screen.getByRole("button", { name: "Join pool" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Display names cannot include @.",
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should reset Turnstile from JoinPanel after a failed submit", async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ error: "This pool is full." }),
        ok: false,
      }),
    );

    renderWithToast(
      <JoinPanel
        email="a@example.com"
        existingAccount
        existingName="Alex"
        poolName="Friends"
        token={"t".repeat(32)}
      />,
    );

    expect(
      screen.getByText(/Enter your existing password/i),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText("Password"), "password1");
    await user.click(screen.getByRole("button", { name: "Join pool" }));

    expect(screen.getByRole("alert")).toHaveTextContent("This pool is full.");
  });

  it("should show joined messaging on LoginPanel", () => {
    renderWithToast(<LoginPanel joined />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Your account is ready. Sign in to continue.",
    );
  });

  it("should reject mismatched passwords on join", async () => {
    const user = userEvent.setup();

    renderWithToast(
      <JoinForm
        email="otis@example.com"
        token={"t".repeat(32)}
        turnstileToken="test-turnstile-token"
      />,
    );

    await user.type(screen.getByLabelText("Display name"), "Otis");
    await user.type(screen.getByLabelText("Password"), "password1");
    await user.type(screen.getByLabelText("Confirm password"), "password2");
    await user.click(screen.getByRole("button", { name: "Join pool" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Passwords do not match.",
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should submit SignInForm and SignOutButton", async () => {
    const user = userEvent.setup();

    const { rerender } = render(
      <SignInForm turnstileToken="test-turnstile-token" />,
    );

    await user.type(screen.getByLabelText("Display Name / Email"), "Otis");
    await user.type(screen.getByLabelText("Password"), "password1");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/sign-in",
      expect.objectContaining({ method: "POST" }),
    );

    rerender(
      <ToastProvider>
        <SignOutButton />
      </ToastProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Sign out" }));

    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/sign-out",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("should toggle password visibility on SignInForm", async () => {
    const user = userEvent.setup();

    render(<SignInForm turnstileToken="test-turnstile-token" />);

    const password = screen.getByLabelText("Password");

    expect(password).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Show password" }));

    expect(password).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: "Hide password" }));

    expect(password).toHaveAttribute("type", "password");
  });

  it("should render SignInForm without a11y violations", async () => {
    const { container } = render(
      <SignInForm turnstileToken="test-turnstile-token" />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it("should render SignOutButton without a11y violations", async () => {
    const { container } = render(
      <ToastProvider>
        <SignOutButton />
      </ToastProvider>,
    );

    expect(
      screen.getByRole("button", { name: "Sign out" }),
    ).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("should toast when SignOutButton fails", async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ error: "Invalid request origin." }),
        ok: false,
      }),
    );

    render(
      <ToastProvider>
        <SignOutButton />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Sign out" }));

    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Unable to sign out. Try again.",
    );
  });

  it("should show sign-in errors from the API", async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ error: "Invalid name, email, or password." }),
        ok: false,
      }),
    );

    render(<SignInForm turnstileToken="test-turnstile-token" />);
    await user.type(
      screen.getByLabelText("Display Name / Email"),
      "otis@example.com",
    );
    await user.type(screen.getByLabelText("Password"), "password1");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Invalid name, email, or password.",
    );
  });

  it("should render JoinPanel and LoginPanel shells", async () => {
    const { container: joinContainer } = renderWithToast(
      <JoinPanel
        email="a@example.com"
        nameHint="Alex"
        poolName="Friends"
        token="invite-token"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Join Friends" }),
    ).toBeInTheDocument();
    expect(await axe(joinContainer)).toHaveNoViolations();

    const { container: loginContainer } = renderWithToast(<LoginPanel />);

    expect(screen.getByRole("heading", { name: "Sign In" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Forgot password?" }),
    ).toHaveAttribute("href", "/forgot-password");
    expect(screen.getByRole("link", { name: "Back home" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(await axe(loginContainer)).toHaveNoViolations();
  });
});
