"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { CHECK_RETURN_KEY } from "@/components/CheckScrollMemory";

// 「← 検索に戻る」 on the detail page: goes back to the search the person came from, with the
// scroll position restored by CheckScrollMemory. Without a saved search it opens /check.
export default function BackToSearchLink({ children }: { children: ReactNode }) {
  const router = useRouter();

  const onClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    try {
      const raw = sessionStorage.getItem(CHECK_RETURN_KEY);
      const saved = raw ? JSON.parse(raw) : null;
      if (!saved || typeof saved.url !== "string" || !saved.url.startsWith("/check")) return;
      event.preventDefault();
      // Exactly one page was opened since the search: going back lands on it.
      if (window.history.length === Number(saved.len) + 1) {
        router.back();
      } else {
        router.push(saved.url);
      }
    } catch {
      // fall through to the normal link
    }
  };

  return (
    <Link
      href="/check"
      onClick={onClick}
      className="inline-block text-sm font-medium text-teal-700"
    >
      {children}
    </Link>
  );
}