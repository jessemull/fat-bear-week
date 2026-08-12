import { render, screen } from "@testing-library/react";
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

import { JoinForm } from "@/components/auth/JoinForm";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignOutButton } from "@/components/auth/SignOutButton";

describe("auth forms", () => {
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

  it("should show join errors from the API", async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ error: "This pool is full." }),
        ok: false,
      }),
    );

    render(
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
    const { container } = render(
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

    render(
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
    expect(push).toHaveBeenCalledWith("/pools");
  });

  it("should reject mismatched passwords on join", async () => {
    const user = userEvent.setup();

    render(
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

    await user.type(screen.getByLabelText("Display Name"), "Otis");
    await user.type(screen.getByLabelText("Password"), "password1");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/sign-in",
      expect.objectContaining({ method: "POST" }),
    );

    rerender(<SignOutButton />);
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
    const { container } = render(<SignOutButton />);

    expect(
      screen.getByRole("button", { name: "Sign out" }),
    ).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("should show sign-in errors from the API", async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ error: "Invalid name or password." }),
        ok: false,
      }),
    );

    render(<SignInForm turnstileToken="test-turnstile-token" />);
    await user.type(screen.getByLabelText("Display Name"), "Otis");
    await user.type(screen.getByLabelText("Password"), "password1");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Invalid name or password.",
    );
  });
});
