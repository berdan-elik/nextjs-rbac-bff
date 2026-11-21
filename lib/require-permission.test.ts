import { beforeEach, describe, expect, it, vi } from "vitest";
import { requirePermission } from "./require-permission";
import type { User } from "./schemas";
import { getSession } from "./session";

vi.mock("server-only", () => ({}));
vi.mock("./session", () => ({ getSession: vi.fn() }));
// The real redirect() throws to stop rendering; the mock throws the target so
// a test can assert where the user was sent.
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
}));

const editor: User = { id: "u2", name: "Elif Aydin", role: "editor" };

describe("requirePermission", () => {
  beforeEach(() => {
    vi.mocked(getSession).mockReset();
  });

  it("sends a visitor without a session to the login page", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    await expect(requirePermission("posts:read")).rejects.toThrow("redirect:/login");
  });

  it("sends a user without the permission to the forbidden page", async () => {
    vi.mocked(getSession).mockResolvedValue(editor);

    await expect(requirePermission("users:read")).rejects.toThrow("redirect:/forbidden");
  });

  it("returns the user when the role holds the permission", async () => {
    vi.mocked(getSession).mockResolvedValue(editor);

    await expect(requirePermission("posts:publish")).resolves.toEqual(editor);
  });
});
