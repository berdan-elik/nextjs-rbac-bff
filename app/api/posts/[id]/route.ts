import { NextResponse } from "next/server";
import { forward } from "@/lib/bff";
import { postSchema, postStatusUpdateSchema } from "@/lib/schemas";

export async function PATCH(request: Request, context: RouteContext<"/api/posts/[id]">) {
  const update = postStatusUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!update.success) {
    return NextResponse.json({ error: "status must be draft or published" }, { status: 400 });
  }

  const { id } = await context.params;
  const action = update.data.status === "published" ? "publish" : "unpublish";
  return forward(`/posts/${encodeURIComponent(id)}/${action}`, postSchema, "POST");
}
