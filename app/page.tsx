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
    <div className="min-h-screen bg-gray-50 p-4 flex flex-col items-center">
      {/* ヘッダー */}
      <h1 className="mb-6 text-3xl font-bold">Price Tracker</h1>

      {/* 大きなカード */}
      <div className="w-full max-w-md space-y-4">
        <button
          onClick={() => goTo("/prices/new")}
          className="w-full rounded-lg border border-gray-300 bg-white p-6 text-left shadow-sm hover:bg-gray-100"
        >
          <h2 className="text-xl font-semibold">Input price</h2>
          <p className="mt-1 text-sm text-gray-600">
            Add a price you saw in a store
          </p>
        </button>

        <button
          onClick={() => goTo("/check")}
          className="w-full rounded-lg border border-gray-300 bg-white p-6 text-left shadow-sm hover:bg-gray-100"
        >
          <h2 className="text-xl font-semibold">Check price</h2>
          <p className="mt-1 text-sm text-gray-600">
            Look up the latest price of a product
          </p>
        </button>
      </div>

      {/* 小さなテキストリンク */}
      <div className="mt-6 flex space-x-4 text-sm">
        <button
          onClick={() => goTo("/stores")}
          className="text-blue-600 hover:underline"
        >
          Stores
        </button>
        <button
          onClick={() => goTo("/products")}
          className="text-blue-600 hover:underline"
        >
          Products
        </button>
      </div>

      {/* ログアウトボタンはそのまま */}
      <button
        onClick={handleLogout}
        className="mt-8 rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
      >
        Logout
      </button>
    </div>
  );
}
