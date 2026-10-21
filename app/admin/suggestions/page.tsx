import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth/viewer";
import { loadSuggestionSettings } from "@/lib/search/loadSuggestions";
import { visibleSuggestions } from "@/lib/search/suggestions";
import SuggestionForm from "./SuggestionForm";

const chipCls =
  "inline-flex h-8 items-center rounded-full border border-line bg-panel px-3 text-sm text-stone-600";

export default async function SuggestionsPage() {
  const viewer = await getViewer();
  if (!viewer.isAdmin) redirect("/");

  const supabase = await createSupabaseServerClient();
  const settings = await loadSuggestionSettings(supabase);
  const shown = visibleSuggestions(settings.terms, settings.count);
  const held = settings.terms.slice(shown.length);

  const cardCls = "rounded-2xl border border-line bg-panel p-4 shadow-sm";

  return (
    <div className="space-y-6">
      <Link href="/admin" className="inline-block text-sm font-medium text-teal-700">
        ← 管理者ツールに戻る
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-stone-900">検索のおすすめ</h1>
        <p className="mt-1 text-sm text-stone-500">
          価格確認の検索ボックスの近くに表示する「おすすめの言葉」を決めます。押すと、その言葉で検索します。
        </p>
      </div>

      <section className={cardCls}>
        <h2 className="mb-3 text-lg font-bold text-stone-900">設定</h2>
        <SuggestionForm count={settings.count} terms={settings.terms} />
      </section>

      <section className={cardCls}>
        <h2 className="text-lg font-bold text-stone-900">いま表示されるおすすめ</h2>
        {shown.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">
            まだ言葉がありません。上で言葉を登録すると、価格確認に表示されます。
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {shown.map((term) => (
              <span key={term} className={chipCls}>
                {term}
              </span>
            ))}
          </div>
        )}

        {held.length > 0 && (
          <>
            <h3 className="mt-5 text-sm font-medium text-stone-700">
              表示されない言葉（表示する数を超えた分）
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {held.map((term) => (
                <span key={term} className={`${chipCls} opacity-60`}>
                  {term}
                </span>
              ))}
            </div>
          </>
        )}
      </section>

      <p className="text-xs text-stone-500">
        おすすめの変更は管理者だけができます。言葉を押すと、その言葉をすべての項目から検索します。
      </p>
    </div>
  );
}