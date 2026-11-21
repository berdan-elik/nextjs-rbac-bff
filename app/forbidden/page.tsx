import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Not allowed</h1>
      <p className="mt-2 text-muted">Your role does not have the permission this page needs.</p>
      <Link href="/" className="mt-6 inline-block font-medium text-accent hover:underline">
        Back to posts
      </Link>
    </main>
  );
}
