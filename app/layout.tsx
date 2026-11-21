import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { SessionStatus } from "@/components/session-status";
import "./globals.css";

export const metadata: Metadata = {
  title: "nextjs-rbac-bff",
  description: "RBAC checked in three layers, with a BFF session that keeps the token out of the browser.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh font-sans antialiased">
        <header className="border-b border-line">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
            <Link href="/" className="font-semibold tracking-tight">
              Field notes
            </Link>
            {/* Reading the cookie is the only dynamic part of the shell, so it streams in on its own. */}
            <Suspense fallback={null}>
              <SessionStatus />
            </Suspense>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
