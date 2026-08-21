import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { type ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/settings",
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

import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { ForgotPasswordPanel } from "@/components/auth/ForgotPasswordPanel";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { ResetPasswordPanel } from "@/components/auth/ResetPasswordPanel";
import { AccountPasswordForm } from "@/components/settings/AccountPasswordForm";
import { AccountProfileForm } from "@/components/settings/AccountProfileForm";
import { ToastProvider } from "@/components/Toast";

function renderWithToast(ui: ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe("account and password-reset forms", () => {
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

  it("should submit forgot-password and show generic success", async () => {
    const user = userEvent.setup();

    renderWithToast(
      <ForgotPasswordForm turnstileToken="test-turnstile-token" />,
    );

    await user.type(screen.getByLabelText("Email"), "otis@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/forgot-password",
      expect.objectContaining({ method: "POST" }),
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "If that email is on an account, we sent a reset link.",
    );
  });

  it("should show forgot-password API errors", async () => {
    const user = userEvent.setup();
    const onBotCheckReset = vi.fn();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ error: "Unable to send reset email right now." }),
        ok: false,
      }),
    );

    renderWithToast(
      <ForgotPasswordForm
        turnstileToken="test-turnstile-token"
        onBotCheckReset={onBotCheckReset}
      />,
    );

    await user.type(screen.getByLabelText("Email"), "otis@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Unable to send reset email right now.",
    );
    expect(onBotCheckReset).toHaveBeenCalled();
  });

  it("should require a bot check on forgot-password", async () => {
    const user = userEvent.setup();

    renderWithToast(<ForgotPasswordForm turnstileToken={null} />);

    await user.type(screen.getByLabelText("Email"), "otis@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Complete the bot check before continuing.",
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should render ForgotPasswordPanel without a11y violations", async () => {
    const { container } = renderWithToast(<ForgotPasswordPanel />);

    expect(
      screen.getByRole("heading", { name: "Forgot password" }),
    ).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("should submit reset-password and go home", async () => {
    const user = userEvent.setup();

    renderWithToast(
      <ResetPasswordForm
        token={"t".repeat(32)}
        turnstileToken="test-turnstile-token"
      />,
    );

    await user.type(screen.getByLabelText("New password"), "password1");
    await user.type(screen.getByLabelText("Confirm password"), "password1");
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/reset-password",
      expect.objectContaining({ method: "POST" }),
    );
    expect(push).toHaveBeenCalledWith("/");
  });

  it("should send reset users to login when session was not created", async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          data: { needsSignIn: true, userId: "u1", userName: "Otis" },
        }),
        ok: true,
      }),
    );

    renderWithToast(
      <ResetPasswordForm
        token={"t".repeat(32)}
        turnstileToken="test-turnstile-token"
      />,
    );

    await user.type(screen.getByLabelText("New password"), "password1");
    await user.type(screen.getByLabelText("Confirm password"), "password1");
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    expect(push).toHaveBeenCalledWith("/login");
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Password updated — sign in to continue.",
    );
  });

  it("should reject mismatched reset passwords", async () => {
    const user = userEvent.setup();

    renderWithToast(
      <ResetPasswordForm
        token={"t".repeat(32)}
        turnstileToken="test-turnstile-token"
      />,
    );

    await user.type(screen.getByLabelText("New password"), "password1");
    await user.type(screen.getByLabelText("Confirm password"), "password2");
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Passwords do not match.",
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should render ResetPasswordPanel without a11y violations", async () => {
    const { container } = renderWithToast(
      <ResetPasswordPanel token={"t".repeat(32)} />,
    );

    expect(
      screen.getByRole("heading", { name: "Reset password" }),
    ).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("should save a display name", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ data: { name: "Otis" } }),
      ok: true,
    });

    vi.stubGlobal("fetch", fetchMock);

    const { container } = renderWithToast(
      <AccountProfileForm email="otis@example.com" name="Otis" />,
    );

    expect(screen.getByText("otis@example.com")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Email" })).toBeNull();
    expect(await axe(container)).toHaveNoViolations();

    await user.clear(screen.getByLabelText("Display name"));
    await user.type(screen.getByLabelText("Display name"), "Chunk");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/account",
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("should reject @ in display names on the profile form", async () => {
    const user = userEvent.setup();

    renderWithToast(
      <AccountProfileForm email="otis@example.com" name="Otis" />,
    );

    await user.clear(screen.getByLabelText("Display name"));
    await user.type(screen.getByLabelText("Display name"), "otis@friends");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Display names cannot include @.",
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should explain when no email is on file", () => {
    renderWithToast(<AccountProfileForm email={null} name="Otis" />);

    expect(screen.getByText("None on file")).toBeInTheDocument();
    expect(
      screen.getByText(/Ask your commissioner for an invite/i),
    ).toBeInTheDocument();
  });

  it("should change password from settings", async () => {
    const user = userEvent.setup();

    const { container } = renderWithToast(<AccountPasswordForm />);

    await user.type(screen.getByLabelText("Current password"), "password1");
    await user.type(screen.getByLabelText("New password"), "password2");
    await user.type(screen.getByLabelText("Confirm new password"), "password2");
    await user.click(screen.getByRole("button", { name: "Change Password" }));

    expect(fetch).toHaveBeenCalledWith(
      "/api/account/password",
      expect.objectContaining({ method: "POST" }),
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("should reject mismatched settings passwords", async () => {
    const user = userEvent.setup();

    renderWithToast(<AccountPasswordForm />);

    await user.type(screen.getByLabelText("Current password"), "password1");
    await user.type(screen.getByLabelText("New password"), "password2");
    await user.type(screen.getByLabelText("Confirm new password"), "password3");
    await user.click(screen.getByRole("button", { name: "Change Password" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Passwords do not match.",
    );
    expect(fetch).not.toHaveBeenCalled();
  });
});
