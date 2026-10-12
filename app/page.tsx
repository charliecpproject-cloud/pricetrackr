"use client";

import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { PlusCircle, Search } from "lucide-react";

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
      {/* ヒーローエリア */}
      <div className="w-full max-w-xl mb-8 bg-gradient-to-br from-teal-600 to-teal-500 text-white rounded-3xl p-6 text-center">
        <h1 className="text-3xl font-bold mb-2">PriceTrackr</h1>
        <p className="text-lg">見た価格を記録して、安い店を見つけよう</p>
      </div>

      {/* 大きなカード */}
      <div className="w-full max-w-xl space-y-4">
        <button
          onClick={() => goTo("/prices/new")}
          className="w-full rounded-xl border border-slate-200 bg-white p-6 flex items-center gap-4 text-left shadow-sm hover:bg-slate-100 min-h-[48px]"
        >
          <PlusCircle className="w-6 h-6 text-teal-600 flex-shrink-0" />
          <div>
            <h2 className="text-xl font-semibold text-slate-900">価格入力</h2>
            <p className="mt-1 text-sm text-slate-600">
              店で見た価格を記録
            </p>
          </div>
        </button>

        <button
          onClick={() => goTo("/check")}
          className="w-full rounded-xl border border-slate-200 bg-white p-6 flex items-center gap-4 text-left shadow-sm hover:bg-slate-100 min-h-[48px]"
        >
          <Search className="w-6 h-6 text-teal-600 flex-shrink-0" />
          <div>
            <h2 className="text-xl font-semibold text-slate-900">価格確認</h2>
            <p className="mt-1 text-sm text-slate-600">
              商品の最新価格を調べる
            </p>
          </div>
        </button>
      </div>

      {/* ログアウトボタン（小さなテキストリンク） */}
      <button
        onClick={handleLogout}
        className="mt-8 text-sm text-indigo-600 hover:underline"
      >
        ログアウト
      </button>
    </div>
  );
}
