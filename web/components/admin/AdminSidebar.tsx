"use client";

import { PanelLeft, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";

import type { TournamentStatus } from "@/lib/tournament-types";

export interface AdminSidebarTournament {
  id: string;
  status: TournamentStatus;
  year: number;
}

interface AdminSidebarProps {
  tournaments: AdminSidebarTournament[];
}

const navLinkClassName =
  "rounded px-2 py-1 text-sm text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-50";

const nestedLinkClassName =
  "rounded py-1 pr-2 pl-3 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200";

const navLinkActiveClassName =
  "rounded px-2 py-1 text-sm font-medium text-amber-800 dark:text-amber-400";

const nestedLinkActiveClassName =
  "rounded py-1 pr-2 pl-3 text-sm font-medium text-amber-800 dark:text-amber-400";

function isTournamentsIndex(pathname: string): boolean {
  return pathname === "/admin/tournaments";
}

function isCreateTournament(pathname: string): boolean {
  return pathname === "/admin/tournaments/new";
}

function isTournamentOverview(pathname: string, tournamentId: string): boolean {
  return pathname === `/admin/tournaments/${tournamentId}`;
}

function isTournamentBears(pathname: string, tournamentId: string): boolean {
  return pathname.startsWith(`/admin/tournaments/${tournamentId}/bears`);
}

function AdminNav({
  onNavigate,
  pathname,
  tournaments,
}: {
  onNavigate?: () => void;
  pathname: string;
  tournaments: AdminSidebarTournament[];
}) {
  return (
    <nav aria-label="Admin" className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          className={
            isTournamentsIndex(pathname)
              ? navLinkActiveClassName
              : navLinkClassName
          }
          href="/admin/tournaments"
          onClick={onNavigate}
        >
          Tournaments
        </Link>
        <Link
          className={
            isCreateTournament(pathname)
              ? navLinkActiveClassName
              : navLinkClassName
          }
          href="/admin/tournaments/new"
          onClick={onNavigate}
        >
          Create Tournament
        </Link>
      </div>
      {tournaments.map((tournament) => (
        <div key={tournament.id} className="flex flex-col gap-0.5">
          <p className="px-2 pb-1 text-sm font-semibold capitalize text-zinc-900 dark:text-zinc-100">
            {tournament.year} · {tournament.status}
          </p>
          <Link
            className={
              isTournamentOverview(pathname, tournament.id)
                ? nestedLinkActiveClassName
                : nestedLinkClassName
            }
            href={`/admin/tournaments/${tournament.id}`}
            onClick={onNavigate}
          >
            Overview
          </Link>
          <Link
            className={
              isTournamentBears(pathname, tournament.id)
                ? nestedLinkActiveClassName
                : nestedLinkClassName
            }
            href={`/admin/tournaments/${tournament.id}/bears`}
            onClick={onNavigate}
          >
            Bears
          </Link>
        </div>
      ))}
    </nav>
  );
}

export function AdminSidebar({ tournaments }: AdminSidebarProps) {
  const pathname = usePathname();
  const menuId = useId();
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className="md:sticky md:top-16 md:flex md:h-[calc(100dvh-4rem)] md:w-56 md:shrink-0 md:flex-col md:overflow-y-auto md:border-r md:border-zinc-200 dark:md:border-zinc-800">
      <div className="sticky top-16 z-40 border-b border-zinc-200 bg-zinc-50 px-4 py-2 md:hidden dark:border-zinc-800 dark:bg-zinc-950">
        <button
          aria-controls={menuId}
          aria-expanded={menuOpen}
          className="inline-flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm font-medium text-zinc-800 dark:text-zinc-100"
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <X aria-hidden="true" className="size-4" strokeWidth={2} />
          ) : (
            <PanelLeft aria-hidden="true" className="size-4" strokeWidth={2} />
          )}
          Admin menu
        </button>
      </div>

      {menuOpen ? (
        <div className="md:hidden">
          <button
            aria-label="Close admin menu"
            className="fixed inset-x-0 top-16 bottom-0 z-40 cursor-pointer bg-zinc-950/50"
            type="button"
            onClick={closeMenu}
          />
          <div
            className="fixed top-16 bottom-0 left-0 z-50 w-64 overflow-y-auto border-r border-zinc-200 bg-zinc-50 px-3 py-4 dark:border-zinc-800 dark:bg-zinc-950"
            id={menuId}
          >
            <AdminNav
              pathname={pathname}
              tournaments={tournaments}
              onNavigate={closeMenu}
            />
          </div>
        </div>
      ) : null}

      <div className="hidden px-3 py-6 md:block">
        <AdminNav pathname={pathname} tournaments={tournaments} />
      </div>
    </div>
  );
}
