export const roles = ["admin", "editor", "viewer"] as const;
export type Role = (typeof roles)[number];

export const permissions = ["posts:read", "posts:publish", "users:read"] as const;
export type Permission = (typeof permissions)[number];

const rolePermissions: Record<Role, readonly Permission[]> = {
  admin: ["posts:read", "posts:publish", "users:read"],
  editor: ["posts:read", "posts:publish"],
  viewer: ["posts:read"],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}

type ProtectedRoute = {
  path: string;
  permission: Permission;
  label?: string;
};

// A route also covers everything below it, so a new page under /admin is
// gated by the /admin entry until it gets an entry of its own.
export const protectedRoutes: readonly ProtectedRoute[] = [
  { path: "/admin", permission: "posts:read" },
  { path: "/admin/posts", permission: "posts:read", label: "Posts" },
  { path: "/admin/users", permission: "users:read", label: "Users" },
];

// The menu is built from the same map the gate reads. It only spares people
// links that would bounce them; it protects nothing.
export function menuFor(role: Role): { path: string; label: string }[] {
  return protectedRoutes.flatMap((route) =>
    route.label && hasPermission(role, route.permission)
      ? [{ path: route.path, label: route.label }]
      : [],
  );
}

export function requiredPermission(pathname: string): Permission | null {
  let match: ProtectedRoute | null = null;

  for (const route of protectedRoutes) {
    const covers = pathname === route.path || pathname.startsWith(`${route.path}/`);
    if (covers && (match === null || route.path.length > match.path.length)) {
      match = route;
    }
  }

  return match?.permission ?? null;
}
