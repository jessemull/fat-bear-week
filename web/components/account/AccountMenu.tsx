"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { AccountInitials } from "@/components/account/AccountInitials";
import { ButtonPendingLabel } from "@/components/ButtonPendingLabel";

interface AccountMenuProps {
  onSignOut: () => void;
  signOutPending: boolean;
  userName: string;
}

const menuItemClassName =
  "block w-full cursor-pointer px-3 py-2 text-left text-sm font-medium text-zinc-800 hover:bg-zinc-100 focus-visible:bg-zinc-100 focus-visible:outline-none dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus-visible:bg-zinc-800";

export function AccountMenu({
  onSignOut,
  signOutPending,
  userName,
}: AccountMenuProps) {
  const pathname = usePathname();
  const buttonId = useId();
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [menuPathname, setMenuPathname] = useState(pathname);

  if (pathname !== menuPathname) {
    setMenuPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    const firstItem =
      menuRef.current?.querySelector<HTMLElement>("[role='menuitem']");

    firstItem?.focus();

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const label = userName.trim() || "Account";

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-controls={menuId}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account menu for ${label}`}
        className="inline-flex cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/60"
        id={buttonId}
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
      >
        <AccountInitials name={userName} />
      </button>
      {open ? (
        <div
          aria-labelledby={buttonId}
          className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
          id={menuId}
          ref={menuRef}
          role="menu"
        >
          <Link
            className={menuItemClassName}
            href="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Account
          </Link>
          <button
            className={menuItemClassName}
            disabled={signOutPending}
            role="menuitem"
            type="button"
            onClick={onSignOut}
          >
            {signOutPending ? (
              <ButtonPendingLabel>Signing out…</ButtonPendingLabel>
            ) : (
              "Sign out"
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
}
