import { beforeEach, describe, expect, it, vi } from "vitest";
import { backendFetch } from "@/lib/backend";
import { clearSessionCookie, getAccessToken } from "@/lib/session";
import { logout } from "./actions";

vi.mock("@/lib/backend", () => ({ backendFetch: vi.fn() }));
vi.mock("@/lib/session", () => ({
  signedInHome: "/admin/posts",
  getAccessToken: vi.fn(),
  setSessionCookie: vi.fn(),
  clearSessionCookie: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
}));

describe("logout", () => {
  beforeEach(() => {
    vi.mocked(backendFetch).mockReset();
    vi.mocked(clearSessionCookie).mockReset();
    vi.mocked(getAccessToken).mockReset().mockResolvedValue("token");
  });

  it("revokes the token, clears the cookie and goes home", async () => {
    vi.mocked(backendFetch).mockResolvedValue(new Response(null, { status: 204 }));

    await expect(logout()).rejects.toThrow("redirect:/");

    expect(backendFetch).toHaveBeenCalledWith("/auth/logout", { method: "POST", accessToken: "token" });
    expect(clearSessionCookie).toHaveBeenCalledOnce();
  });

  it("clears the cookie even when the backend cannot be reached", async () => {
    vi.mocked(backendFetch).mockRejectedValue(new Error("fetch failed"));

    await expect(logout()).rejects.toThrow("fetch failed");

    expect(clearSessionCookie).toHaveBeenCalledOnce();
  });
});
