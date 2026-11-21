import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { backendFetch } from "./backend";
import { getAccessToken } from "./session";

// Swaps the session cookie for a Bearer token and relays the backend's answer.
// Permission is not decided here: the backend's 401 and 403 pass straight through.
export async function forward(
  path: string,
  schema: z.ZodType,
  method: "GET" | "POST" = "GET",
): Promise<NextResponse> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "not signed in" }, { status: 401 });
  }

  let response: Response;
  try {
    response = await backendFetch(path, { method, accessToken });
  } catch {
    return NextResponse.json({ error: "backend unavailable" }, { status: 502 });
  }

  const body: unknown = await response.json();
  if (!response.ok) {
    return NextResponse.json(body, { status: response.status });
  }
  // Parsing drops any field the schema does not name, so the browser only
  // receives what the UI was written against.
  return NextResponse.json(schema.parse(body));
}
