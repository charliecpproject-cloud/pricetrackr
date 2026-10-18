import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth/viewer";

export default async function ProductMergePage() {
  const viewer = await getViewer();
  if (!viewer.isAdmin) redirect("/");

  return (
    <div className="space-y-6">
      <Link href="/admin" className="inline-block text-sm font-medium text-teal-700">
        ← 管理者ツールに戻る
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-stone-900">商品の統合</h1>
        <p className="mt-1 text-sm text-stone-500">
          同じ商品が重複して登録されたときに、1つにまとめる機能です。
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-panel p-5 shadow-sm">
        <p className="font-bold text-stone-900">準備中</p>
        <p className="mt-1 text-sm text-stone-600">
          この機能はまだ使えません。
        </p>
      </div>
    </div>
  );
}