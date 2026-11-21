import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedPost } from "@/lib/public-posts";

export default async function PostPage({ params }: PageProps<"/posts/[slug]">) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="text-sm font-medium text-accent hover:underline">
        All posts
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">{post.title}</h1>
      <p className="mt-6 leading-7">{post.body}</p>
    </main>
  );
}
