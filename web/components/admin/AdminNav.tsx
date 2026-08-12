import Link from "next/link";

import { SignOutButton } from "@/components/auth/SignOutButton";
import { formLinkClassName } from "@/lib/form-styles";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/tournaments", label: "Tournaments" },
  { href: "/pools", label: "Pools" },
] as const;

export function AdminNav() {
  return (
    <nav
      aria-label="Admin"
      className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-4 dark:border-zinc-700"
    >
      <ul className="flex flex-wrap gap-4">
        {links.map((link) => (
          <li key={link.href}>
            <Link className={formLinkClassName} href={link.href}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
      <SignOutButton />
    </nav>
  );
}
