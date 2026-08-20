"use client";

import { Menu, PawPrint, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";

import {
  AdminNavBody,
  type AdminSidebarPool,
  type AdminSidebarTournament,
} from "@/components/admin/AdminSidebar";
import { ButtonPendingLabel } from "@/components/ButtonPendingLabel";
import { useToast } from "@/components/Toast";

interface SiteHeaderProps {
  adminNav?: {
    pools: AdminSidebarPool[];
    tournaments: AdminSidebarTournament[];
  } | null;
  isCommissioner?: boolean;
  isSignedIn: boolean;
}

interface NavItem {
  disabled?: boolean;
  href?: string;
  label: string;
}

const PRIMARY_NAV: NavItem[] = [
  { href: "/", label: "Home" },
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
  "cursor-pointer text-base font-medium text-amber-800 underline transition-colors hover:text-amber-950 dark:text-amber-400 dark:hover:text-amber-300";

function NavItems({
  isCommissioner,
  onNavigate,
}: {
  isCommissioner: boolean;
  onNavigate?: () => void;
}) {
  const items: NavItem[] = isCommissioner
    ? [...PRIMARY_NAV, { href: "/admin/tournaments", label: "Admin" }]
    : PRIMARY_NAV;

  return (
    <>
      {items.map((item) => {
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

export function SiteHeader({
  adminNav = null,
  isCommissioner = false,
  isSignedIn,
}: SiteHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const menuId = useId();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signOutPending, setSignOutPending] = useState(false);

  async function onSignOut() {
    setSignOutPending(true);

    try {
      const response = await fetch("/api/auth/sign-out", { method: "POST" });

      if (!response.ok) {
        toast("Unable to sign out. Try again.", "error");
        return;
      }

      setMenuOpen(false);
      router.push("/login");
      router.refresh();
    } catch {
      toast("Unable to sign out. Try again.", "error");
    } finally {
      setSignOutPending(false);
    }
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.classList.add("overflow-hidden");

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("overflow-hidden");
    };
  }, [menuOpen]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-amber-600/80 bg-zinc-50 lg:sticky dark:bg-zinc-950">
        <div className="relative flex w-full items-center gap-5 px-5 py-4 sm:px-6">
          <button
            aria-controls={menuId}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="inline-flex cursor-pointer items-center justify-center rounded p-1 text-zinc-800 transition-colors hover:bg-zinc-200 lg:hidden dark:text-zinc-100 dark:hover:bg-zinc-800"
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
            <span className="text-xl font-semibold tracking-tight">
              Fat Bear Week
            </span>
          </Link>

          <nav
            aria-label="Primary"
            className="ml-3 hidden items-center gap-6 lg:flex"
          >
            <NavItems isCommissioner={isCommissioner} />
          </nav>

          <div className="ml-auto hidden lg:block">
            {isSignedIn ? (
              <button
                className={authLinkClassName}
                disabled={signOutPending}
                type="button"
                onClick={() => void onSignOut()}
              >
                {signOutPending ? (
                  <ButtonPendingLabel>Signing out…</ButtonPendingLabel>
                ) : (
                  "Sign out"
                )}
              </button>
            ) : (
              <Link className={authLinkClassName} href="/login">
                Sign In
              </Link>
            )}
          </div>

          {menuOpen ? (
            <>
              <button
                aria-label="Dismiss menu"
                className="fixed inset-0 z-40 cursor-pointer bg-zinc-950/50 lg:hidden"
                type="button"
                onClick={closeMenu}
              />
              <nav
                aria-label="Mobile"
                className="fixed inset-x-0 top-16 bottom-0 z-50 flex flex-col gap-3 overflow-y-auto bg-zinc-50 px-5 pb-4 pt-2 sm:px-6 lg:hidden dark:bg-zinc-950"
                id={menuId}
              >
                <NavItems
                  isCommissioner={isCommissioner}
                  onNavigate={closeMenu}
                />
                {isSignedIn ? (
                  <button
                    className={`${authLinkClassName} text-left`}
                    disabled={signOutPending}
                    type="button"
                    onClick={() => void onSignOut()}
                  >
                    {signOutPending ? (
                      <ButtonPendingLabel>Signing out…</ButtonPendingLabel>
                    ) : (
                      "Sign out"
                    )}
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
                {adminNav ? (
                  <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
                    <p className="px-2 pb-2 text-xs font-semibold tracking-[0.14em] text-zinc-500 uppercase">
                      Admin
                    </p>
                    <AdminNavBody
                      pathname={pathname}
                      pools={adminNav.pools}
                      tournaments={adminNav.tournaments}
                      onNavigate={closeMenu}
                    />
                  </div>
                ) : null}
              </nav>
            </>
          ) : null}
        </div>
      </header>
      <div aria-hidden="true" className="h-16 shrink-0 lg:hidden" />
    </>
  );
}
