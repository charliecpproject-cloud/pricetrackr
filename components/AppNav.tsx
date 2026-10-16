"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, Search, Store, Package } from "lucide-react";

export default function AppNav() {
  const pathname = usePathname();

  // /login ページではナビバーを表示しない
  if (pathname === "/login") return null;

  const tabs = [
    {
      href: "/",
      label: "ホーム",
      Icon: Home,
      // ルートは完全一致で判定
      isActive: pathname === "/",
    },
    {
      href: "/prices/new",
      label: "価格入力",
      Icon: PlusCircle,
      isActive: pathname.startsWith("/prices/new"),
    },
    {
      href: "/check",
      label: "価格確認",
      Icon: Search,
      isActive: pathname.startsWith("/check"),
    },
    {
      href: "/stores",
      label: "店舗",
      Icon: Store,
      isActive: pathname.startsWith("/stores"),
    },
    {
      href: "/products",
      label: "商品",
      Icon: Package,
      isActive: pathname.startsWith("/products"),
    },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-stone-200 bg-white/90 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex h-14 max-w-xl items-center">
        {tabs.map(({ href, label, Icon, isActive }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className="flex flex-1 flex-col items-center gap-0.5 py-1 text-xs"
          >
            <span
              className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
                isActive ? "bg-teal-100 text-teal-700" : "text-stone-500"
              }`}
            >
              <Icon size={20} />
            </span>
            <span
              className={isActive ? "font-bold text-teal-700" : "font-medium text-stone-500"}
            >
              {label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}