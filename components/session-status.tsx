import Link from "next/link";
import { logout } from "@/app/login/actions";
import { getSession } from "@/lib/session";

export async function SessionStatus() {
  const user = await getSession();

  if (!user) {
    return (
      <Link href="/login" className="text-sm font-medium text-accent hover:underline">
        Sign in
      </Link>
    );
  }

  return (
    <form action={logout} className="flex items-center gap-4 text-sm">
      <Link href="/admin/posts" className="font-medium hover:underline">
        Admin
      </Link>
      <span className="text-muted">
        {user.name} · {user.role}
      </span>
      <button type="submit" className="font-medium text-accent hover:underline">
        Sign out
      </button>
    </form>
  );
}
