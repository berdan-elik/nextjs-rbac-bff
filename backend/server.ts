import { createServer, type IncomingMessage } from "node:http";
import { hasPermission, type Permission } from "../lib/permissions";
import { loginRequestSchema, type User } from "../lib/schemas";
import * as store from "./store";

type Reply = { status: number; body?: unknown };

type Call = {
  param: string;
  body: unknown;
  accessToken: string | null;
};

type Route = {
  method: "GET" | "POST";
  path: RegExp;
  handle: (call: Call) => Reply;
};

class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// The backend does not trust that the caller already checked anything:
// every protected endpoint resolves the token and the permission itself.
function authorize(accessToken: string | null, permission?: Permission): User {
  const user = accessToken ? store.findSession(accessToken) : undefined;
  if (!user) {
    throw new HttpError(401, "missing or invalid token");
  }
  if (permission && !hasPermission(user.role, permission)) {
    throw new HttpError(403, `missing permission: ${permission}`);
  }
  return user;
}

function postOr404(post: ReturnType<typeof store.setPostStatus>): Reply {
  if (!post) {
    throw new HttpError(404, "post not found");
  }
  return { status: 200, body: post };
}

const routes: Route[] = [
  {
    method: "POST",
    path: /^\/auth\/login$/,
    handle: ({ body }) => {
      const parsed = loginRequestSchema.safeParse(body);
      if (!parsed.success) {
        throw new HttpError(400, "role must be admin, editor or viewer");
      }
      return { status: 200, body: store.createSession(parsed.data.role) };
    },
  },
  {
    method: "POST",
    path: /^\/auth\/logout$/,
    handle: ({ accessToken }) => {
      if (accessToken) {
        store.deleteSession(accessToken);
      }
      return { status: 204 };
    },
  },
  {
    method: "GET",
    path: /^\/auth\/me$/,
    handle: ({ accessToken }) => ({ status: 200, body: authorize(accessToken) }),
  },
  {
    method: "GET",
    path: /^\/posts$/,
    handle: ({ accessToken }) => {
      authorize(accessToken, "posts:read");
      return { status: 200, body: store.listPosts() };
    },
  },
  {
    method: "POST",
    path: /^\/posts\/([^/]+)\/publish$/,
    handle: ({ accessToken, param }) => {
      authorize(accessToken, "posts:publish");
      return postOr404(store.setPostStatus(param, "published"));
    },
  },
  {
    method: "POST",
    path: /^\/posts\/([^/]+)\/unpublish$/,
    handle: ({ accessToken, param }) => {
      authorize(accessToken, "posts:publish");
      return postOr404(store.setPostStatus(param, "draft"));
    },
  },
  {
    method: "GET",
    path: /^\/users$/,
    handle: ({ accessToken }) => {
      authorize(accessToken, "users:read");
      return { status: 200, body: store.listUsers() };
    },
  },
  {
    method: "GET",
    path: /^\/public\/posts$/,
    handle: () => ({ status: 200, body: store.listPublishedPosts() }),
  },
  {
    method: "GET",
    path: /^\/public\/posts\/([^/]+)$/,
    handle: ({ param }) => postOr404(store.findPublishedPost(param)),
  },
];

function bearerToken(request: IncomingMessage): string | null {
  const header = request.headers.authorization;
  return header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(chunk as Buffer);
  }
  if (chunks.length === 0) {
    return undefined;
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "body is not valid json");
  }
}

async function dispatch(request: IncomingMessage): Promise<Reply> {
  const { pathname } = new URL(request.url ?? "/", "http://backend");

  for (const route of routes) {
    const match = route.method === request.method ? route.path.exec(pathname) : null;
    if (match) {
      return route.handle({
        param: match[1] ?? "",
        body: await readJson(request),
        accessToken: bearerToken(request),
      });
    }
  }

  throw new HttpError(404, "not found");
}

const server = createServer(async (request, response) => {
  let reply: Reply;
  try {
    reply = await dispatch(request);
  } catch (error) {
    if (!(error instanceof HttpError)) {
      console.error(error);
    }
    reply =
      error instanceof HttpError
        ? { status: error.status, body: { error: error.message } }
        : { status: 500, body: { error: "internal error" } };
  }

  if (reply.body === undefined) {
    response.writeHead(reply.status).end();
  } else {
    response
      .writeHead(reply.status, { "content-type": "application/json" })
      .end(JSON.stringify(reply.body));
  }
});

const port = Number(process.env.BACKEND_PORT ?? 4000);

server.listen(port, () => {
  console.log(`backend listening on http://localhost:${port}`);
});
