import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { Geist, Geist_Mono } from "next/font/google";

import type { AdminSidebarTournament } from "@/components/admin/AdminSidebar";

import { AppProviders } from "@/components/AppProviders";
import { SiteHeader } from "@/components/SiteHeader";
import { listPoolsForSidebar } from "@/lib/pools.server";
import { getSession } from "@/lib/sessions.server";
import { listTournaments } from "@/lib/tournament.server";

import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  description:
    "Private Fat Bear Week fantasy brackets. Predict the tournament, compete with friends.",
  title: "Fat Bear Week Fantasy Bracket",
};

export const viewport: Viewport = {
  initialScale: 1,
  viewportFit: "cover",
  width: "device-width",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const session = await getSession();

  let adminNav: {
    pools: Awaited<ReturnType<typeof listPoolsForSidebar>>;
    tournaments: AdminSidebarTournament[];
  } | null = null;

  if (session?.isCommissioner) {
    const [pools, tournaments] = await Promise.all([
      listPoolsForSidebar(),
      listTournaments(),
    ]);

    adminNav = {
      pools,
      tournaments: tournaments.map((tournament) => ({
        id: tournament.id,
        status: tournament.status,
        year: tournament.year,
      })),
    };
  }

  return (
    <html
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      lang="en"
    >
      <body className="flex min-h-full flex-col">
        <AppProviders>
          <SiteHeader
            adminNav={adminNav}
            isCommissioner={Boolean(session?.isCommissioner)}
            isSignedIn={Boolean(session)}
            userName={session?.name}
          />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
