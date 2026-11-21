import { z } from "zod";
import { backendFetch } from "@/lib/backend";
import { requirePermission } from "@/lib/require-permission";
import { userSchema } from "@/lib/schemas";
import { getAccessToken } from "@/lib/session";

export default async function UsersPage() {
  await requirePermission("users:read");

  const accessToken = (await getAccessToken()) ?? undefined;
  const response = await backendFetch("/users", { accessToken });
  if (!response.ok) {
    throw new Error(`backend refused the user list with ${response.status}`);
  }
  const users = z.array(userSchema).parse(await response.json());

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
      <table className="mt-6 w-full text-left text-sm">
        <thead className="border-b border-line text-muted">
          <tr>
            <th className="py-2 font-medium">Name</th>
            <th className="py-2 font-medium">Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-line">
              <td className="py-3">{user.name}</td>
              <td className="py-3 capitalize">{user.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
