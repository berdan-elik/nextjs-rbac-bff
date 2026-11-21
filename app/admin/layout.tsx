import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin-nav";
import { QueryProvider } from "@/components/query-provider";
import { menuFor } from "@/lib/permissions";
import { getSession } from "@/lib/session";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // No permission check here: a layout is not re-rendered on navigation
  // between its pages, so each page calls requirePermission itself.
  const user = await getSession();

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <AdminNav items={user ? menuFor(user.role) : []} />
      <div className="mt-8">
        <QueryProvider>{children}</QueryProvider>
      </div>
    </main>
  );
}
