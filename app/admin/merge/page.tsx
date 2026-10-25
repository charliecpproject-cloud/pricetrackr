import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth/viewer";
import MergeForm from "./MergeForm";

export const metadata = { title: "商品の統合" };

export default async function ProductMergePage() {
  const viewer = await getViewer();
  if (!viewer.isAdmin) redirect("/");

  return (
    <div className="space-y-6">
      <Link
        href="/admin"
        className="inline-block text-sm font-medium text-teal-700"
      >
        ← 管理者ツールに戻る
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-stone-900">商品の統合</h1>
        <p className="mt-1 text-sm text-stone-500">
          同じ商品が重複して登録されたときに、1つにまとめます。ブランドの書き方がちがうだけの重複は、先に「ブランドの管理」でそろえると見つけやすくなります。
        </p>
      </div>

      <section className="rounded-2xl border border-line bg-panel p-4 shadow-sm">
        <MergeForm />
      </section>

      <p className="text-xs text-stone-500">
        統合した商品の容量・価格の記録は削除されず、残した商品の詳細ページに「旧価格」として表示されます。
      </p>
    </div>
  );
}
