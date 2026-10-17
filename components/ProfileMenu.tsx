"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogIn, LogOut, Settings, User, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function ProfileMenu({
  loggedIn,
  email,
}: {
  loggedIn: boolean;
  email: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // /login ページでは表示しない
  if (pathname === "/login") return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  };

  const itemCls =
    "flex h-12 w-full items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 text-base font-medium text-stone-700 hover:bg-stone-50";

  return (
    <>
      <div className="mx-auto flex w-full max-w-xl justify-end px-4 pt-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="プロフィールと設定"
          aria-expanded={open}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 shadow-sm active:scale-95"
        >
          <User className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="メニュー">
          <button
            type="button"
            aria-label="閉じる"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <aside className="absolute inset-y-0 right-0 flex w-72 max-w-[85%] flex-col gap-4 bg-white p-5 pt-[calc(1.25rem+env(safe-area-inset-top))] shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-stone-900">メニュー</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="閉じる"
                className="flex h-10 w-10 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl bg-stone-50 p-3 text-sm text-stone-600">
              {loggedIn ? (
                <span className="break-all">{email}</span>
              ) : (
                <>
                  <span className="font-bold text-stone-800">デモモード（閲覧のみ）</span>
                  <span className="mt-1 block">ログインすると価格を記録できます。</span>
                </>
              )}
            </div>

            {loggedIn ? (
              <>
                <Link href="/settings" onClick={() => setOpen(false)} className={itemCls}>
                  <Settings className="h-5 w-5 text-stone-500" />
                  設定
                </Link>
                <button type="button" onClick={handleLogout} className={itemCls}>
                  <LogOut className="h-5 w-5 text-stone-500" />
                  ログアウト
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-600 text-base font-bold text-white hover:bg-teal-700"
              >
                <LogIn className="h-5 w-5" />
                ログイン
              </Link>
            )}
          </aside>
        </div>
      )}
    </>
  );
}