import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { backendFetch } from "./backend";
import { userSchema, type User } from "./schemas";

export const sessionCookieName = "session";
const maxAgeSeconds = 60 * 60 * 8;

export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(sessionCookieName)?.value ?? null;
}

// The cookie holds only the opaque token. Who the user is, and which role they
// have, is asked of the backend on every request rather than read from the cookie.
export async function resolveUser(accessToken: string | null): Promise<User | null> {
  if (!accessToken) {
    return null;
  }

  const response = await backendFetch("/auth/me", { accessToken });
  if (!response.ok) {
    return null;
  }
  return userSchema.parse(await response.json());
}

export const getSession = cache(async (): Promise<User | null> => {
  return resolveUser(await getAccessToken());
});

export async function setSessionCookie(accessToken: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
}
