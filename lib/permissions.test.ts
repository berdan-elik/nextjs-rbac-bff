import { describe, expect, it } from "vitest";
import {
  coversPath,
  hasPermission,
  menuFor,
  permissions,
  protectedRoutes,
  requiredPermission,
  roles,
} from "./permissions";

describe("hasPermission", () => {
  it("gives admin every permission", () => {
    for (const permission of permissions) {
      expect(hasPermission("admin", permission)).toBe(true);
    }
  });

  it("lets editor publish but not see users", () => {
    expect(hasPermission("editor", "posts:read")).toBe(true);
    expect(hasPermission("editor", "posts:publish")).toBe(true);
    expect(hasPermission("editor", "users:read")).toBe(false);
  });

  it("lets viewer read and nothing else", () => {
    expect(hasPermission("viewer", "posts:read")).toBe(true);
    expect(hasPermission("viewer", "posts:publish")).toBe(false);
    expect(hasPermission("viewer", "users:read")).toBe(false);
  });
});

describe("coversPath", () => {
  it("covers the route itself and the paths below it", () => {
    expect(coversPath("/admin/posts", "/admin/posts")).toBe(true);
    expect(coversPath("/admin/posts", "/admin/posts/p1")).toBe(true);
  });

  // The admin menu marks its active tab with this, so a sibling page whose
  // name starts the same way must not light up "Posts".
  it("does not cover a sibling that only shares a prefix", () => {
    expect(coversPath("/admin/posts", "/admin/posts-archive")).toBe(false);
    expect(coversPath("/admin/posts", "/admin")).toBe(false);
  });
});

describe("requiredPermission", () => {
  it("returns null for public paths", () => {
    expect(requiredPermission("/")).toBeNull();
    expect(requiredPermission("/login")).toBeNull();
    expect(requiredPermission("/posts/why-three-checks")).toBeNull();
  });

  it("matches a route exactly", () => {
    expect(requiredPermission("/admin/posts")).toBe("posts:read");
    expect(requiredPermission("/admin/users")).toBe("users:read");
  });

  it("covers paths below a route", () => {
    expect(requiredPermission("/admin/users/42")).toBe("users:read");
    expect(requiredPermission("/admin/users/42/edit")).toBe("users:read");
  });

  it("prefers the longest matching route", () => {
    expect(requiredPermission("/admin")).toBe("posts:read");
    expect(requiredPermission("/admin/users")).toBe("users:read");
  });

  it("falls back to the /admin entry for a page with no entry of its own", () => {
    expect(requiredPermission("/admin/settings")).toBe("posts:read");
  });

  it("matches whole segments only", () => {
    expect(requiredPermission("/administrator")).toBeNull();
    expect(requiredPermission("/admin/users-export")).toBe("posts:read");
  });
});

describe("protectedRoutes", () => {
  it("keeps every route reachable by at least one role", () => {
    for (const route of protectedRoutes) {
      expect(roles.some((role) => hasPermission(role, route.permission))).toBe(true);
    }
  });
});

describe("menuFor", () => {
  it("shows each role only the pages it may open", () => {
    expect(menuFor("admin").map((item) => item.label)).toEqual(["Posts", "Users"]);
    expect(menuFor("editor").map((item) => item.label)).toEqual(["Posts"]);
    expect(menuFor("viewer").map((item) => item.label)).toEqual(["Posts"]);
  });

  it("never lists a page the gate would refuse", () => {
    for (const role of roles) {
      for (const item of menuFor(role)) {
        const permission = requiredPermission(item.path);
        expect(permission).not.toBeNull();
        expect(hasPermission(role, permission!)).toBe(true);
      }
    }
  });
});
