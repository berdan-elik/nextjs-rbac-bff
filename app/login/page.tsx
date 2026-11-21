import { redirect } from "next/navigation";
import { roles, type Role } from "@/lib/permissions";
import { getSession } from "@/lib/session";
import { login } from "./actions";

const roleNotes: Record<Role, string> = {
  admin: "Reads and publishes posts, sees the user list.",
  editor: "Reads and publishes posts.",
  viewer: "Reads the post list, cannot change anything.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getSession()) {
    redirect("/");
  }
  const { next } = await searchParams;

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-muted">There are no passwords here. Pick the role to sign in as.</p>

      <form action={login} className="mt-8">
        {typeof next === "string" && <input type="hidden" name="next" value={next} />}
        <fieldset className="space-y-3">
          <legend className="sr-only">Role</legend>
          {roles.map((role) => (
            <label
              key={role}
              className="flex cursor-pointer items-start gap-3 rounded-md border border-line bg-white p-4 has-checked:border-accent"
            >
              <input
                type="radio"
                name="role"
                value={role}
                defaultChecked={role === "editor"}
                className="mt-1 accent-accent"
              />
              <span>
                <span className="block font-medium capitalize">{role}</span>
                <span className="block text-sm text-muted">{roleNotes[role]}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <button
          type="submit"
          className="mt-6 w-full rounded-md bg-accent px-4 py-2.5 font-medium text-white hover:opacity-90"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
