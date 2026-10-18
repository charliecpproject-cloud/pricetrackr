import Image from "next/image";
import Link from "next/link";
import { ChevronRight, PlusCircle, ScanLine, Search, ShieldCheck } from "lucide-react";
import { getViewer } from "@/lib/auth/viewer";

const actions = [
  {
    href: "/prices/new",
    title: "価格入力",
    description: "店で見た価格を記録",
    Icon: PlusCircle,
  },
  {
    href: "/check",
    title: "価格確認",
    description: "商品の最新価格を調べる",
    Icon: Search,
  },
  {
    href: "/scan",
    title: "バーコード",
    description: "読み取って商品を開く",
    Icon: ScanLine,
  },
];

// Shown at the bottom, for admin accounts only.
const adminAction = {
  href: "/admin",
  title: "管理者ツール",
  description: "商品の統合など",
  Icon: ShieldCheck,
};

export default async function HomePage() {
  const viewer = await getViewer();
  const cards = viewer.isAdmin ? [...actions, adminAction] : actions;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 rounded-3xl bg-gradient-to-br from-teal-600 to-teal-500 p-5 text-white shadow-sm">
        <Image
          src="/icons/icon-192.png"
          alt=""
          width={48}
          height={48}
          className="rounded-xl bg-white"
        />
        <h1 className="text-2xl font-bold">PriceTrackr</h1>
      </div>

      <div className="space-y-3">
        {cards.map(({ href, title, description, Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex min-h-12 items-center gap-4 rounded-2xl border border-line bg-panel p-5 shadow-sm transition hover:bg-panel-soft active:scale-[0.99]"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <Icon className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-bold text-stone-900">{title}</span>
              <span className="block text-sm text-stone-500">{description}</span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-stone-400" />
          </Link>
        ))}
      </div>
    </div>
  );
}