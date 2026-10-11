"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppNav() {
  const pathname = usePathname();

  // /login ページではナビバーを表示しない
  if (pathname === "/login") return null;

  const links = [
    { href: "/", label: "Home" },
    { href: "/prices/new", label: "Input" },
    { href: "/check", label: "Check" },
    { href: "/stores", label: "Stores" },
    { href: "/products", label: "Products" },
  ];

  return (
    <nav className="sticky top-0 z-10 bg-white border-b border-gray-200">
      <div className="flex items-center h-14 px-4 overflow-x-auto">
        <Link href="/" className="mr-4 font-semibold text-lg text-indigo-600">
          Price Tracker
        </Link>
        <div className="flex space-x-4">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap ${
                  isActive
                    ? "text-indigo-600 font-medium"
                    : "text-gray-600 hover:text-indigo-600"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
