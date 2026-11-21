"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { z } from "zod";
import { postSchema, type Post } from "@/lib/schemas";

const postsKey = ["posts"];
const postsSchema = z.array(postSchema);
const errorSchema = z.object({ error: z.string() });

type StatusUpdate = Pick<Post, "id" | "status">;

async function failure(response: Response): Promise<Error> {
  const body = errorSchema.safeParse(await response.json().catch(() => null));
  return new Error(body.success ? body.data.error : `request failed with ${response.status}`);
}

async function fetchPosts(): Promise<Post[]> {
  const response = await fetch("/api/posts");
  if (!response.ok) {
    throw await failure(response);
  }
  return postsSchema.parse(await response.json());
}

async function updateStatus({ id, status }: StatusUpdate): Promise<Post> {
  const response = await fetch(`/api/posts/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    throw await failure(response);
  }
  return postSchema.parse(await response.json());
}

export function PostList({ canPublish }: { canPublish: boolean }) {
  const queryClient = useQueryClient();
  const posts = useQuery({ queryKey: postsKey, queryFn: fetchPosts });

  const statusChange = useMutation({
    mutationFn: updateStatus,
    onMutate: async ({ id, status }) => {
      // A refetch already in flight would overwrite the optimistic row when it lands.
      await queryClient.cancelQueries({ queryKey: postsKey });
      const previous = queryClient.getQueryData<Post[]>(postsKey);
      queryClient.setQueryData<Post[]>(postsKey, (current) =>
        current?.map((post) => (post.id === id ? { ...post, status } : post)),
      );
      return { previous };
    },
    onError: (_error, _update, context) => {
      queryClient.setQueryData(postsKey, context?.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: postsKey }),
  });

  if (posts.isPending) {
    return <p className="mt-6 text-muted">Loading posts…</p>;
  }
  if (posts.isError) {
    return (
      <p role="alert" className="mt-6 text-red-700">
        Could not load posts: {posts.error.message}
      </p>
    );
  }

  return (
    <>
      {statusChange.isError && (
        <p
          role="alert"
          className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          The change was rolled back: {statusChange.error.message}
        </p>
      )}

      <ul className="mt-6 divide-y divide-line border-y border-line">
        {posts.data.map((post) => {
          const published = post.status === "published";
          const saving = statusChange.isPending && statusChange.variables.id === post.id;

          return (
            <li key={post.id} className="flex items-center justify-between gap-6 py-4">
              <div>
                <p className="font-medium">{post.title}</p>
                <p className="mt-1 text-sm text-muted">
                  <span className={published ? "text-accent" : undefined}>
                    {published ? "Published" : "Draft"}
                  </span>
                  {" · "}
                  {published ? (
                    <Link href={`/posts/${post.slug}`} className="hover:underline">
                      /posts/{post.slug}
                    </Link>
                  ) : (
                    `/posts/${post.slug}`
                  )}
                </p>
              </div>

              {canPublish && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    statusChange.mutate({ id: post.id, status: published ? "draft" : "published" })
                  }
                  className="shrink-0 rounded-md border border-line bg-white px-3 py-1.5 text-sm font-medium hover:border-ink disabled:opacity-60"
                >
                  {published ? "Unpublish" : "Publish"}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {!canPublish && (
        <p className="mt-4 text-sm text-muted">Your role can read this list but not change it.</p>
      )}
    </>
  );
}
