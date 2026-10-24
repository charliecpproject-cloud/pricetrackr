"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToastedActionState } from "@/lib/toast/useToastedActionState";
import ProductPick from "./ProductPick";
import { loadMergePreview, mergeProducts } from "./actions";
import type { MergePreview, MergeProduct } from "./types";

const initialState: { error: string | null; message?: string | null } = {
  error: null,
  message: null,
};

export default function MergeForm() {
  const [state, formAction, pending] = useToastedActionState(mergeProducts, initialState);
  const [loser, setLoser] = useState<MergeProduct | null>(null);
  const [winner, setWinner] = useState<MergeProduct | null>(null);
  const [preview, setPreview] = useState<MergePreview | null>(null);
  const [loading, setLoading] = useState(false);

  // The preview is loaded as soon as both products are chosen.
  useEffect(() => {
    setPreview(null);
    if (!loser || !winner || loser.id === winner.id) return;
    let cancelled = false;
    setLoading(true);
    loadMergePreview(loser.id, winner.id)
      .then((p) => {
        if (!cancelled) setPreview(p);
      })
      .catch(() => {
        if (!cancelled) setPreview(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loser, winner]);

  // After a successful merge the form is ready for the next one.
  useEffect(() => {
    if (state.message) {
      setLoser(null);
      setWinner(null);
      setPreview(null);
    }
  }, [state]);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (
          !loser ||
          !winner ||
          !window.confirm(
            `「${loser.name}」を「${winner.name}」に統合しますか？\n「${loser.name}」は画面から非表示になります。\nこの操作は管理者だけが元に戻せます。`
          )
        ) {
          e.preventDefault();
        }
      }}
      className="space-y-5"
    >
      <input type="hidden" name="loser_id" value={loser?.id ?? ""} />
      <input type="hidden" name="winner_id" value={winner?.id ?? ""} />

      <ProductPick
        id="merge_loser"
        label="なくす商品（重複している方）"
        hint="この商品は非表示になります。価格の記録は消えません。"
        value={loser}
        excludeId={winner?.id ?? null}
        onChange={setLoser}
      />

      <ProductPick
        id="merge_winner"
        label="残す商品"
        hint="こちらの商品名・ブランド・メモなどがそのまま残ります。"
        value={winner}
        excludeId={loser?.id ?? null}
        onChange={setWinner}
      />

      {loading && <p className="text-sm text-stone-500">内容を確認しています…</p>}

      {preview && loser && winner && (
        <div className="space-y-1 rounded-xl border border-line bg-panel-soft p-4 text-sm text-stone-700">
          <p className="font-bold text-stone-900">統合の内容</p>
          <p>
            「{loser.name}」の容量{preview.loserPackages}件・価格の記録{preview.loserEntries}
            件は、そのまま残り、「{winner.name}」の詳細ページで「旧価格」として確認できます。
          </p>
          <p>
            バーコード：{preview.loserBarcodes}件のうち{preview.barcodesMoved}件を移動します
            （残す商品は現在{preview.winnerBarcodes}件）。
            {preview.barcodesStay > 0 && `残り${preview.barcodesStay}件は、非表示になった商品に残ります。`}
          </p>
          <p>お気に入りは引き継がれません。</p>
        </div>
      )}

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <Button
        type="submit"
        disabled={pending || !preview || !loser || !winner}
        className="h-12 w-full"
      >
        {pending ? "統合しています…" : "統合する"}
      </Button>
    </form>
  );
}