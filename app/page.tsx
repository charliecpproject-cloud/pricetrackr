"use client";

import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // カードクリック時のハンドラ
  const goTo = (path: string) => {
    router.push(path);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 flex flex-col items-center">
      {/* ヘッダー */}
      <h1 className="mb-6 text-3xl font-bold text-slate-800">Price Tracker</h1>

      {/* 大きなカード */}
      <div className="w-full max-w-xl space-y-4">
        <button
          onClick={() => goTo("/prices/new")}
          className="w-full rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm hover:bg-slate-100 min-h-[48px] flex flex-col justify-center"
        >
          <h2 className="text-xl font-semibold text-slate-900">Input price</h2>
          <p className="mt-1 text-sm text-slate-600">
            Add a price you saw in a store
          </p>
        </button>

        <button
          onClick={() => goTo("/check")}
          className="w-full rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm hover:bg-slate-100 min-h-[48px] flex flex-col justify-center"
        >
          <h2 className="text-xl font-semibold text-slate-900">Check price</h2>
          <p className="mt-1 text-sm text-slate-600">
            Look up the latest price of a product
          </p>
        </button>
      </div>

      {/* 小さなテキストリンク */}
      <div className="mt-6 flex space-x-4 text-sm">
        <button
          onClick={() => goTo("/stores")}
          className="text-indigo-600 hover:underline"
        >
          Stores
        </button>
        <button
          onClick={() => goTo("/products")}
          className="text-indigo-600 hover:underline"
        >
          Products
        </button>
      </div>

      {/* ログアウトボタンはそのまま */}
      <button
        onClick={handleLogout}
        className="mt-8 rounded-md bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700 min-h-[48px]"
      >
        Logout
      </button>
    </div>
  );
}
