"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId } from "react";

import {
  formatTournamentStatus,
  type TournamentStatus,
} from "@/lib/tournament-types";

export interface AdminSidebarPool {
  id: string;
  name: string;
}

export interface AdminSidebarTournament {
  id: string;
  status: TournamentStatus;
  year: number;
}

interface AdminSidebarProps {
  pools: AdminSidebarPool[];
  tournaments: AdminSidebarTournament[];
}

const childLinkActiveClassName =
  "bg-amber-500/15 font-medium text-amber-800 dark:text-amber-400";
const childLinkClassName =
  "block rounded-md px-2 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";
const childLinkInactiveClassName = "font-normal";

const nestedLinkActiveClassName =
  "bg-amber-500/15 font-medium text-amber-800 dark:text-amber-400";
const nestedLinkClassName =
  "block rounded-md px-2 py-1 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200";
const nestedLinkInactiveClassName = "font-normal";

const sectionLinkActiveClassName = "text-amber-800 dark:text-amber-400";
const sectionLinkClassName =
  "block px-2 text-xs font-semibold tracking-[0.14em] text-zinc-700 uppercase transition-colors hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white";
const sectionLinkInactiveClassName = "";

function linkClassName(
  active: boolean,
  base: string,
  activeClass: string,
  inactiveClass: string,
): string {
  return `${base} ${active ? activeClass : inactiveClass}`;
}

export function AdminNavBody({
  onNavigate,
  pathname,
  pools,
  tournaments,
}: {
  onNavigate?: () => void;
  pathname: string;
  pools: AdminSidebarPool[];
  tournaments: AdminSidebarTournament[];
}) {
  const poolsHeadingId = useId();
  const tournamentsHeadingId = useId();

  return (
    <div className="space-y-6">
      <section aria-labelledby={tournamentsHeadingId}>
        <h2 className="sr-only" id={tournamentsHeadingId}>
          Tournaments
        </h2>
        <Link
          className={linkClassName(
            pathname === "/admin/tournaments",
            sectionLinkClassName,
            sectionLinkActiveClassName,
            sectionLinkInactiveClassName,
          )}
          href="/admin/tournaments"
          onClick={onNavigate}
        >
          Tournaments
        </Link>
        <ul className="mt-2 space-y-0.5 pl-3">
          <li>
            <Link
              className={linkClassName(
                pathname === "/admin/tournaments",
                childLinkClassName,
                childLinkActiveClassName,
                childLinkInactiveClassName,
              )}
              href="/admin/tournaments"
              onClick={onNavigate}
            >
              All Tournaments
            </Link>
          </li>
          <li>
            <Link
              className={linkClassName(
                pathname === "/admin/tournaments/new",
                childLinkClassName,
                childLinkActiveClassName,
                childLinkInactiveClassName,
              )}
              href="/admin/tournaments/new"
              onClick={onNavigate}
            >
              Create Tournament
            </Link>
          </li>
          {tournaments.map((tournament) => {
            const bearsHref = `/admin/tournaments/${tournament.id}/bears`;
            const overviewHref = `/admin/tournaments/${tournament.id}`;
            const bearsActive =
              pathname === bearsHref || pathname.startsWith(`${bearsHref}/`);
            const overviewActive = pathname === overviewHref;

            return (
              <li key={tournament.id} className="pt-2">
                <p className="px-2 py-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {tournament.year} · {formatTournamentStatus(tournament.status)}
                </p>
                <ul className="mt-0.5 space-y-0.5 pl-3">
                  <li>
                    <Link
                      className={linkClassName(
                        overviewActive,
                        nestedLinkClassName,
                        nestedLinkActiveClassName,
                        nestedLinkInactiveClassName,
                      )}
                      href={overviewHref}
                      onClick={onNavigate}
                    >
                      Overview
                    </Link>
                  </li>
                  <li>
                    <Link
                      className={linkClassName(
                        bearsActive,
                        nestedLinkClassName,
                        nestedLinkActiveClassName,
                        nestedLinkInactiveClassName,
                      )}
                      href={bearsHref}
                      onClick={onNavigate}
                    >
                      Bears
                    </Link>
                  </li>
                </ul>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby={poolsHeadingId}>
        <h2 className="sr-only" id={poolsHeadingId}>
          Pools
        </h2>
        <Link
          className={linkClassName(
            pathname === "/admin/pools",
            sectionLinkClassName,
            sectionLinkActiveClassName,
            sectionLinkInactiveClassName,
          )}
          href="/admin/pools"
          onClick={onNavigate}
        >
          Pools
        </Link>
        <ul className="mt-2 space-y-0.5 pl-3">
          <li>
            <Link
              className={linkClassName(
                pathname === "/admin/pools",
                childLinkClassName,
                childLinkActiveClassName,
                childLinkInactiveClassName,
              )}
              href="/admin/pools"
              onClick={onNavigate}
            >
              All Pools
            </Link>
          </li>
          <li>
            <Link
              className={linkClassName(
                pathname === "/admin/pools/new",
                childLinkClassName,
                childLinkActiveClassName,
                childLinkInactiveClassName,
              )}
              href="/admin/pools/new"
              onClick={onNavigate}
            >
              Create Pool
            </Link>
          </li>
          {pools.map((pool) => {
            const overviewHref = `/admin/pools/${pool.id}`;
            const invitesHref = `/admin/pools/${pool.id}/invites`;
            const overviewActive = pathname === overviewHref;
            const invitesActive =
              pathname === invitesHref || pathname.startsWith(`${invitesHref}/`);

            return (
              <li key={pool.id} className="pt-2">
                <p className="px-2 py-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {pool.name}
                </p>
                <ul className="mt-0.5 space-y-0.5 pl-3">
                  <li>
                    <Link
                      className={linkClassName(
                        overviewActive,
                        nestedLinkClassName,
                        nestedLinkActiveClassName,
                        nestedLinkInactiveClassName,
                      )}
                      href={overviewHref}
                      onClick={onNavigate}
                    >
                      Overview
                    </Link>
                  </li>
                  <li>
                    <Link
                      className={linkClassName(
                        invitesActive,
                        nestedLinkClassName,
                        nestedLinkActiveClassName,
                        nestedLinkInactiveClassName,
                      )}
                      href={invitesHref}
                      onClick={onNavigate}
                    >
                      Invites
                    </Link>
                  </li>
                </ul>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

export function AdminSidebar({ pools, tournaments }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 pl-5 lg:block lg:pl-6">
      <nav aria-label="Admin" className="sticky top-24">
        <AdminNavBody
          pathname={pathname}
          pools={pools}
          tournaments={tournaments}
        />
      </nav>
    </aside>
  );
}
