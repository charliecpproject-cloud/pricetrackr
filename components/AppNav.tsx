"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  PlusCircle,
  Search,
  Store,
  Package,
} from "lucide-react";

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
      <div className="mx-auto max-w-xl flex h-14 items-center justify-around">
        {tabs.map(({ href, label, Icon, isActive }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center text-xs"
          >
            <Icon
              size={20}
              className={isActive ? "text-teal-600" : "text-stone-500"}
            />
            <span className={isActive ? "text-teal-600" : "text-stone-500"}>
              {label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
