"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { coversPath } from "@/lib/permissions";

type AdminNavProps = {
  items: { path: string; label: string }[];
};

export function AdminNav({ items }: AdminNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="flex gap-1 border-b border-line">
      {items.map((item) => {
        const active = coversPath(item.path, pathname);
        return (
          <Link
            key={item.path}
            href={item.path}
            aria-current={active ? "page" : undefined}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
              active ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
