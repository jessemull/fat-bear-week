"use client";

import { Menu, PawPrint, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

interface SiteHeaderProps {
  isSignedIn: boolean;
}

interface NavItem {
  disabled?: boolean;
  href?: string;
  label: string;
}

const PRIMARY_NAV: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/pools", label: "Pools" },
  { disabled: true, label: "Bracket" },
  { disabled: true, label: "Leaderboard" },
  { disabled: true, label: "Bears" },
  { disabled: true, label: "About" },
];

const linkClassName =
  "text-base font-medium text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-50";

const disabledClassName =
  "cursor-not-allowed text-base font-medium text-zinc-400 dark:text-zinc-600";

const authLinkClassName =
  "text-base font-medium text-amber-800 underline dark:text-amber-400";

function NavItems({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  return (
    <>
      {PRIMARY_NAV.map((item) => {
        if (item.disabled || !item.href) {
          return (
            <span
              key={item.label}
              aria-disabled="true"
              className={disabledClassName}
            >
              {item.label}
            </span>
          );
        }

        return (
          <Link
            key={item.label}
            className={linkClassName}
            href={item.href}
            onClick={onNavigate}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function SiteHeader({ isSignedIn }: SiteHeaderProps) {
  const router = useRouter();
  const menuId = useId();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signOutPending, setSignOutPending] = useState(false);

  async function onSignOut() {
    setSignOutPending(true);

    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
      setMenuOpen(false);
      router.push("/login");
      router.refresh();
    } finally {
      setSignOutPending(false);
    }
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="border-b border-amber-600/80 bg-zinc-50 dark:bg-zinc-950">
      <div className="flex w-full items-center gap-5 px-5 py-4 sm:px-8">
        <button
          aria-controls={menuId}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className="inline-flex items-center justify-center rounded p-1 text-zinc-800 md:hidden dark:text-zinc-100"
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <X aria-hidden="true" className="size-6" strokeWidth={2} />
          ) : (
            <Menu aria-hidden="true" className="size-6" strokeWidth={2} />
          )}
        </button>

        <Link
          className="flex items-center gap-2.5 text-zinc-900 dark:text-zinc-50"
          href="/"
          onClick={closeMenu}
        >
          <PawPrint
            aria-hidden="true"
            className="size-6 text-amber-700 dark:text-amber-400"
            strokeWidth={1.75}
          />
          <span className="text-base font-semibold tracking-tight">
            Fat Bear Week
          </span>
        </Link>

        <nav
          aria-label="Primary"
          className="ml-3 hidden items-center gap-6 md:flex"
        >
          <NavItems />
        </nav>

        <div className="ml-auto hidden md:block">
          {isSignedIn ? (
            <button
              className={authLinkClassName}
              disabled={signOutPending}
              type="button"
              onClick={() => void onSignOut()}
            >
              {signOutPending ? "Signing out…" : "Sign out"}
            </button>
          ) : (
            <Link className={authLinkClassName} href="/login">
              Sign In
            </Link>
          )}
        </div>
      </div>

      {menuOpen ? (
        <nav
          aria-label="Mobile"
          className="flex flex-col gap-3 border-t border-zinc-200 px-5 py-4 sm:px-8 md:hidden dark:border-zinc-800"
          id={menuId}
        >
          <NavItems onNavigate={closeMenu} />
          {isSignedIn ? (
            <button
              className={`${authLinkClassName} text-left`}
              disabled={signOutPending}
              type="button"
              onClick={() => void onSignOut()}
            >
              {signOutPending ? "Signing out…" : "Sign out"}
            </button>
          ) : (
            <Link
              className={authLinkClassName}
              href="/login"
              onClick={closeMenu}
            >
              Sign In
            </Link>
          )}
        </nav>
      ) : null}
    </header>
  );
}
