import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, GitMerge } from "lucide-react";
import { getViewer } from "@/lib/auth/viewer";

// Add future admin tools (price approval, ...) to this list.
const tools = [
  {
    href: "/admin/merge",
    title: "商品の統合",
    description: "重複して登録された商品を1つにまとめる",
    Icon: GitMerge,
    ready: false,
  },
];

export default async function AdminPage() {
  const viewer = await getViewer();
  if (!viewer.isAdmin) redirect("/");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">管理者ツール</h1>
        <p className="mt-1 text-sm text-stone-500">管理者アカウントだけが使えます。</p>
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
              <span className="block text-sm text-stone-500">{description}</span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-stone-400" />
          </Link>
        ))}
      </div>
    </div>
  );
}