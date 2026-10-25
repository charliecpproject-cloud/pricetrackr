import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Flame, GitMerge, Ruler, Tag, Tags } from "lucide-react";
import { getViewer } from "@/lib/auth/viewer";

// Add future admin tools (price approval, ...) to this list.
const tools = [
  {
    href: "/admin/brands",
    title: "ブランドの管理",
    description:
      "同じブランドの別の書き方（PASCO とパスコ）をまとめ、別名を登録する",
    Icon: Tag,
    ready: true,
  },
  {
    href: "/admin/merge",
    title: "商品の統合",
    description: "重複して登録された商品を1つにまとめる",
    Icon: GitMerge,
    ready: true,
  },
  {
    href: "/admin/aliases",
    title: "検索の別名",
    description: "別名（例：離乳食）で検索しても見つかるようにする",
    Icon: Tags,
    ready: true,
  },
  {
    href: "/admin/units",
    title: "単位の言葉",
    description:
      "容量の単位に使う言葉（本・玉・パックなど）を表示・非表示・追加・削除する",
    Icon: Ruler,
    ready: true,
  },
  {
    href: "/admin/suggestions",
    title: "検索のおすすめ",
    description:
      "価格確認の検索ボックスの近くに出す、おすすめの言葉と表示する数を決める",
    Icon: Flame,
    ready: true,
  },
];

export const metadata = { title: "管理者ツール" };

export default async function AdminPage() {
  const viewer = await getViewer();
  if (!viewer.isAdmin) redirect("/");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">管理者ツール</h1>
        <p className="mt-1 text-sm text-stone-500">
          管理者アカウントだけが使えます。
        </p>
      </div>

      <div className="space-y-3">
        {tools.map(({ href, title, description, Icon, ready }) => (
          <Link
            key={href}
            href={href}
            className="flex min-h-12 items-center gap-4 rounded-2xl border border-line bg-panel p-5 shadow-sm transition hover:bg-panel-soft active:scale-[0.99]"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <Icon className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-bold text-stone-900">
                {title}
                {!ready && (
                  <span className="ml-2 rounded-md bg-chip px-1.5 py-0.5 text-xs font-bold text-stone-600">
                    準備中
                  </span>
                )}
              </span>
              <span className="block text-sm text-stone-500">
                {description}
              </span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-stone-400" />
          </Link>
        ))}
      </div>
    </div>
  );
}
