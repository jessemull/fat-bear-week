import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Geist, Geist_Mono } from "next/font/google";

import { SiteHeader } from "@/components/SiteHeader";
import { getSession } from "@/lib/sessions.server";

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

interface RootLayoutProps {
  children: ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const session = await getSession();

  return (
    <html
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      lang="en"
    >
      <body className="flex min-h-full flex-col">
        <SiteHeader
          isCommissioner={Boolean(session?.isCommissioner)}
          isSignedIn={Boolean(session)}
        />
        {children}
      </body>
    </html>
  );
}
