import { PostList } from "@/components/post-list";
import { hasPermission } from "@/lib/permissions";
import { requirePermission } from "@/lib/require-permission";

export default async function PostsPage() {
  const user = await requirePermission("posts:read");

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Posts</h1>
      <PostList canPublish={hasPermission(user.role, "posts:publish")} />
    </>
  );
}
