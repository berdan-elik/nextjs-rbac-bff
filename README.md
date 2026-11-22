# nextjs-rbac-bff

A small Next.js App Router app that checks role-based permissions in three places and keeps the access token out of the browser.

The app is a post list with an admin panel. Three roles can sign in: admin, editor and viewer. A separate in-memory backend in the same repository owns the data and issues the tokens.

## Run it

Needs Node 22.13 or newer and pnpm.

```bash
pnpm install
pnpm dev
```

`pnpm dev` starts the Next.js app on http://localhost:3000 and the backend on http://localhost:4000. No `.env` file is needed. To move the backend to another port, copy `.env.example` to `.env.local` and change both variables; the app and the backend read the same file.

Open http://localhost:3000/login and pick a role. There are no passwords.

```bash
pnpm test        # unit tests (Vitest)
pnpm test:e2e    # browser tests (Playwright) against a production build
pnpm typecheck
pnpm lint
```

The browser tests need Chromium once: `pnpm exec playwright install chromium`.

## What each role can do

| | admin | editor | viewer |
|---|---|---|---|
| Open the post list in the admin panel | yes | yes | yes |
| Publish and unpublish posts | yes | yes | no |
| Open the user list | yes | no | no |

Roles map to permissions (`posts:read`, `posts:publish`, `users:read`) in `lib/permissions.ts`. The code asks for a permission and never compares role names.

## How a request is checked

`lib/permissions.ts` holds one map from route to permission. Three layers read it or repeat its decision:

1. **`proxy.ts`** runs before a page is rendered. It looks up the permission for the path, asks the backend who the cookie belongs to, and redirects to `/login` or `/forbidden`.
2. **`requirePermission()`** is the first line of every protected server component. It makes the same decision again before any data is read.
3. **The backend** resolves the Bearer token and checks the permission in every protected endpoint (`backend/server.ts`).

The admin menu is built from the same map, so a page cannot appear in the menu without being gated, or the other way round.

## How the session works

The browser holds one cookie: `session`, set as `httpOnly`, `SameSite=Lax` and `Secure` in production. Its value is an opaque token issued by the backend. The role is not stored in it.

Client code never calls the backend. It calls route handlers under `app/api/`, which read the cookie, call the backend with `Authorization: Bearer <token>`, and return the parsed response. Signing in and out are Server Actions.

## Design notes

**Why three checks.** Each layer has a way to be skipped that the others do not share.

- The proxy depends on a matcher and on the framework running it. A wrong matcher, or a bug such as the 2025 middleware bypass in Next.js (CVE-2025-29927), lets a request through without it.
- A server component check only protects the page it is written in. It does nothing for a request that goes to the API directly.
- The backend check is the one that protects the data, but on its own it gives a poor experience: the page renders, then every call fails.

**Hiding a menu item is not access control.** The viewer has no publish button and no Users link. Typing `/admin/users` still reaches the proxy, and sending `PATCH /api/posts/p4` from the console still reaches the backend, which answers 403. Both cases are in the Playwright tests.

**What the BFF costs.** Every browser request makes an extra hop: browser to Next.js, then Next.js to the backend. A protected page asks the backend for the user twice, once in the proxy and once in the page, because the two run in separate phases and cannot share a result. In return, a script injected into the page has no token to read, and the backend needs no CORS configuration.

**The cookie carries no role.** Putting the role in a signed cookie would save the lookup, but the cookie would keep the old role until it expired. Here a role change takes effect on the next request.

**CSRF.** There is no CSRF token. `SameSite=Lax` keeps the cookie off cross-site `PATCH` requests, and Next.js checks the `Origin` header on Server Actions.

**Cache invalidation.** The public pages read posts through functions marked `"use cache"` and tagged `posts`. Publishing through the BFF calls `revalidateTag("posts", { expire: 0 })` after the backend has accepted the change. `expire: 0` makes the next request wait for fresh data; the stale-while-revalidate profile would show an unpublished post to one more visitor.

**Optimistic updates.** The post list changes the row before the server answers, cancels any list request already in flight, rolls the row back if the server refuses, and refetches either way.

## Left out on purpose

- **A real identity provider and passwords.** Signing in is choosing a role.
- **A database.** Posts, users and tokens live in memory and reset when the backend restarts.
- **Token expiry and refresh.** A token lives until sign-out or a backend restart.
- **A 404 status for missing posts.** Pages are streamed, so the response has started with `200` before the post is looked up. Next.js renders the not-found page and adds `noindex`.
- **Cache invalidation across instances.** The cache is in the memory of one Next.js process.
- **A separate permission table in the backend.** It imports the role table from `lib/permissions.ts`. A real backend would own its own.
- **i18n.**

## Layout

```
app/            pages, route handlers (app/api), login actions
backend/        the in-memory backend (node:http)
components/     client components for the admin panel, session status
e2e/            Playwright tests
lib/            permission map, session, backend client, schemas
proxy.ts        request gate
```

## License

MIT
