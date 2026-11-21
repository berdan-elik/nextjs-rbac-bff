import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";
import { backendFetch } from "./backend";
import { postSchema, type Post } from "./schemas";

export const postsTag = "posts";

// Both readers share one tag: publishing a post changes the list and the
// post's own page, and unpublishing has to make the page disappear again.
export async function getPublishedPosts(): Promise<Post[]> {
  "use cache";
  cacheTag(postsTag);
  // The tag is how changes get out; the lifetime only bounds how long a missed
  // invalidation could last.
  cacheLife("hours");

  const response = await backendFetch("/public/posts");
  if (!response.ok) {
    throw new Error(`backend refused the public post list with ${response.status}`);
  }
  return z.array(postSchema).parse(await response.json());
}

export async function getPublishedPost(slug: string): Promise<Post | null> {
  "use cache";
  cacheTag(postsTag);
  cacheLife("hours");

  const response = await backendFetch(`/public/posts/${encodeURIComponent(slug)}`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`backend refused the public post with ${response.status}`);
  }
  return postSchema.parse(await response.json());
}
