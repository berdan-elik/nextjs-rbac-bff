import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { forward } from "@/lib/bff";
import { postsTag } from "@/lib/public-posts";
import { postSchema, postStatusUpdateSchema } from "@/lib/schemas";

export async function PATCH(request: Request, context: RouteContext<"/api/posts/[id]">) {
  const update = postStatusUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!update.success) {
    return NextResponse.json({ error: "status must be draft or published" }, { status: 400 });
  }

  const { id } = await context.params;
  const action = update.data.status === "published" ? "publish" : "unpublish";
  const response = await forward(`/posts/${encodeURIComponent(id)}/${action}`, postSchema, "POST");

  if (response.ok) {
    // expire: 0 instead of the "max" profile: an unpublished post must not be
    // served stale to the next visitor while a refresh runs in the background.
    revalidateTag(postsTag, { expire: 0 });
  }
  return response;
}
