import { expect, test, type Page } from "@playwright/test";
import type { Role } from "../lib/permissions";

const draftTitle = "Invalidating by tag instead of by path";

async function signIn(page: Page, role: Role) {
  await page.goto("/login");
  await page.getByRole("radio", { name: new RegExp(`^${role}`, "i") }).check();
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/admin/posts");
  await expect(page.getByRole("listitem").first()).toBeVisible();
}

test("a visitor without a session is sent to the login page", async ({ page }) => {
  await page.goto("/admin/posts");

  await expect(page).toHaveURL("/login?next=%2Fadmin%2Fposts");
});

test("a viewer cannot open the users page or publish", async ({ page }) => {
  await signIn(page, "viewer");

  const menu = page.getByRole("navigation", { name: "Admin" });
  await expect(menu.getByRole("link", { name: "Posts" })).toBeVisible();
  await expect(menu.getByRole("link", { name: "Users" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Publish" })).toHaveCount(0);

  // Typing the address gets past the hidden link, not past the gate.
  await page.goto("/admin/users");
  await expect(page).toHaveURL("/forbidden");

  // Calling the BFF directly gets past the hidden button, not past the backend.
  const response = await page.request.patch("/api/posts/p4", { data: { status: "published" } });
  expect(response.status()).toBe(403);
});

test("an admin sees the users page", async ({ page }) => {
  await signIn(page, "admin");

  await page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: "Users" }).click();

  await expect(page).toHaveURL("/admin/users");
  await expect(page.getByRole("cell", { name: "Deniz Kaya" })).toBeVisible();
});

test("an editor publishes a post and the public pages pick it up", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: draftTitle })).toHaveCount(0);

  await signIn(page, "editor");
  const row = page.getByRole("listitem").filter({ hasText: draftTitle });
  await row.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(row.getByRole("button", { name: "Unpublish" })).toBeEnabled();

  await page.goto("/");
  await page.getByRole("link", { name: draftTitle }).click();
  await expect(page).toHaveURL("/posts/cache-tags");
  await expect(page.getByRole("heading", { name: draftTitle })).toBeVisible();

  await page.goto("/admin/posts");
  await row.getByRole("button", { name: "Unpublish" }).click();
  await expect(row.getByRole("button", { name: "Publish", exact: true })).toBeEnabled();

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Posts" })).toBeVisible();
  await expect(page.getByRole("link", { name: draftTitle })).toHaveCount(0);
});

test("the session cookie is httpOnly and invisible to page scripts", async ({ page, context }) => {
  await signIn(page, "editor");

  const cookie = (await context.cookies()).find((candidate) => candidate.name === "session");
  expect(cookie).toBeDefined();
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.secure).toBe(true);
  expect(cookie?.sameSite).toBe("Lax");

  expect(await page.evaluate(() => document.cookie)).not.toContain("session");
  // The token is not smuggled into the page some other way either.
  expect(await page.content()).not.toContain(cookie?.value);
});
