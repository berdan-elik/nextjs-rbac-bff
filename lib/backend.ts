import "server-only";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

type BackendRequest = {
  method?: "GET" | "POST";
  accessToken?: string;
  body?: unknown;
};

export function backendFetch(path: string, request: BackendRequest = {}): Promise<Response> {
  const headers = new Headers();
  if (request.accessToken) {
    headers.set("authorization", `Bearer ${request.accessToken}`);
  }
  if (request.body !== undefined) {
    headers.set("content-type", "application/json");
  }

  return fetch(`${backendUrl}${path}`, {
    method: request.method ?? "GET",
    headers,
    body: request.body === undefined ? undefined : JSON.stringify(request.body),
  });
}
