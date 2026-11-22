import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/require-permission";

export default async function AdminPage() {
  await requirePermission("posts:read");
  redirect("/admin/posts");
}
