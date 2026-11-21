import { randomBytes } from "node:crypto";
import type { Role } from "../lib/permissions";
import type { Post, User } from "../lib/schemas";

const users: Record<Role, User> = {
  admin: { id: "u1", name: "Deniz Kaya", role: "admin" },
  editor: { id: "u2", name: "Elif Aydin", role: "editor" },
  viewer: { id: "u3", name: "Mert Demir", role: "viewer" },
};

const seededAt = new Date().toISOString();

const posts: Post[] = [
  {
    id: "p1",
    slug: "why-three-checks",
    title: "Why the same permission is checked three times",
    body: "The request gate keeps unauthorised users away from the page, the server component refuses to render without the permission, and the backend refuses the call itself. Each one covers a path the other two cannot see.",
    status: "published",
    updatedAt: seededAt,
  },
  {
    id: "p2",
    slug: "tokens-stay-on-the-server",
    title: "Tokens stay on the server",
    body: "The browser holds an httpOnly cookie and nothing else. Route handlers read it and call the backend with a Bearer token, so a script running in the page has nothing to steal.",
    status: "published",
    updatedAt: seededAt,
  },
  {
    id: "p3",
    slug: "hiding-a-menu-item",
    title: "Hiding a menu item is not access control",
    body: "The menu is filtered by permission so people are not shown links that lead nowhere. The link being absent stops nobody from typing the address.",
    status: "draft",
    updatedAt: seededAt,
  },
  {
    id: "p4",
    slug: "cache-tags",
    title: "Invalidating by tag instead of by path",
    body: "Public pages are cached under a tag. Publishing a post marks the tag stale, and every page that read posts picks up the change without anyone listing paths.",
    status: "draft",
    updatedAt: seededAt,
  },
];

const sessions = new Map<string, User>();

export function createSession(role: Role) {
  const accessToken = randomBytes(32).toString("base64url");
  const user = users[role];
  sessions.set(accessToken, user);
  return { accessToken, user };
}

export function findSession(accessToken: string): User | undefined {
  return sessions.get(accessToken);
}

export function deleteSession(accessToken: string): void {
  sessions.delete(accessToken);
}

export function listUsers(): User[] {
  return Object.values(users);
}

export function listPosts(): Post[] {
  return posts;
}

export function listPublishedPosts(): Post[] {
  return posts.filter((post) => post.status === "published");
}

export function findPublishedPost(slug: string): Post | undefined {
  return listPublishedPosts().find((post) => post.slug === slug);
}

export function setPostStatus(id: string, status: Post["status"]): Post | undefined {
  const post = posts.find((candidate) => candidate.id === id);
  if (post && post.status !== status) {
    post.status = status;
    post.updatedAt = new Date().toISOString();
  }
  return post;
}
