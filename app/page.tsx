import Link from "next/link";
import { connection } from "next/server";
import { getPublishedPosts } from "@/lib/public-posts";

export default async function HomePage() {
  // The backend is not running during `next build`, so the list is rendered on
  // the first request and comes from the cache after that.
  await connection();
  const posts = await getPublishedPosts();

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Posts</h1>

      {posts.length === 0 ? (
        <p className="mt-2 text-muted">Nothing published yet.</p>
      ) : (
        <ul className="mt-8 space-y-8">
          {posts.map((post) => (
            <li key={post.id}>
              <Link href={`/posts/${post.slug}`} className="text-lg font-medium hover:underline">
                {post.title}
              </Link>
              <p className="mt-1 line-clamp-2 text-muted">{post.body}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
