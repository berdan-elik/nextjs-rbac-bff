import "server-only";
import { redirect } from "next/navigation";
import { hasPermission, type Permission } from "./permissions";
import type { User } from "./schemas";
import { getSession } from "./session";

// Called by every protected page, even though the proxy already ran: a page
// must not depend on a matcher or a map entry being right to stay closed.
export async function requirePermission(permission: Permission): Promise<User> {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }
  if (!hasPermission(user.role, permission)) {
    redirect("/forbidden");
  }
  return user;
}
