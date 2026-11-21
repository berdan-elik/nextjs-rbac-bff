"use server";

import { redirect } from "next/navigation";
import { backendFetch } from "@/lib/backend";
import { loginRequestSchema, loginResponseSchema } from "@/lib/schemas";
import { clearSessionCookie, getAccessToken, setSessionCookie } from "@/lib/session";

// Only same-site paths are accepted, so the login form cannot be used to
// bounce someone to another origin.
function safePath(value: FormDataEntryValue | null): string {
  return typeof value === "string" && /^\/(?![/\\])/.test(value) ? value : "/admin/posts";
}

export async function login(formData: FormData): Promise<void> {
  const request = loginRequestSchema.safeParse({ role: formData.get("role") });
  if (!request.success) {
    redirect("/login");
  }

  const response = await backendFetch("/auth/login", { method: "POST", body: request.data });
  if (!response.ok) {
    throw new Error(`backend login failed with ${response.status}`);
  }

  // Only the token goes into the cookie; the response body never reaches the browser.
  const { accessToken } = loginResponseSchema.parse(await response.json());
  await setSessionCookie(accessToken);
  redirect(safePath(formData.get("next")));
}

export async function logout(): Promise<void> {
  const accessToken = await getAccessToken();
  if (accessToken) {
    await backendFetch("/auth/logout", { method: "POST", accessToken });
  }
  await clearSessionCookie();
  redirect("/");
}
