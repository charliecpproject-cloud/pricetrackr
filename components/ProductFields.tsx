"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Field, controlCls } from "@/components/FormParts";
import CategoryField from "@/components/CategoryField";
import BarcodeInput from "@/components/BarcodeInput";
import { MAX_BARCODES_PER_PRODUCT } from "@/lib/products/barcode";

// The fields of a new product. Used by 商品を追加 (prefix "") and by
// 価格入力 > 新しい商品として登録 (prefix "np_"), so both always match.
export default function ProductFields({
  prefix = "",
  defaultBarcode = "",
}: {
  prefix?: string;
  defaultBarcode?: string;
}) {
  const id = (key: string) => `${prefix}${key}`;
  const [barcodeRows, setBarcodeRows] = useState<number[]>([0]);
  const [nextRow, setNextRow] = useState(1);

  return (
    <>
      <Field
        label="商品名"
        kind="required"
        htmlFor={id("name")}
        hint="日本語でも英語でも入力できます。"
      >
        <input
          id={id("name")}
          name={id("name")}
          required
          maxLength={100}
          placeholder="例：超熟 食パン"
          className={controlCls}
        />
      </Field>

      <Field
        label="英語名・別名"
        kind="optional"
        htmlFor={id("other_name")}
        hint="英語名やニックネームなど、検索に使える別の呼び方を入力できます。"
      >
        <input
          id={id("other_name")}
          name={id("other_name")}
          maxLength={100}
          placeholder="例：Choujuku bread"
          className={controlCls}
        />
      </Field>

      <Field label="ブランド" kind="optional" htmlFor={id("brand")}>
        <input
          id={id("brand")}
          name={id("brand")}
          maxLength={100}
          placeholder="例：パスコ"
          className={controlCls}
        />
      </Field>

      <Field label="カテゴリ" kind="optional" htmlFor={id("category")}>
        <CategoryField id={id("category")} name={id("category")} placeholder="例：パン" />
      </Field>

      <Field
        label="税率"
        kind="optional"
        htmlFor={id("tax_rate")}
        hint="分かるときだけ設定します。税抜き・税不明の価格に、税込の目安を表示するために使います。"
      >
        <select
          id={id("tax_rate")}
          name={id("tax_rate")}
          defaultValue=""
          className={controlCls}
        >
          <option value="">未設定</option>
          <option value="8">8%（軽減税率：食品など）</option>
          <option value="10">10%</option>
          <option value="0">0%（非課税）</option>
        </select>
      </Field>

      <Field
        label="バーコード"
        kind="optional"
        htmlFor={id("barcode-0")}
        hint="複数登録できます。右のボタンでカメラから読み取れます。"
      >
        <div className="space-y-2">
          {barcodeRows.map((row) => (
            <div key={row} className="flex gap-2">
              <div className="min-w-0 flex-1">
                <BarcodeInput
                  id={id(`barcode-${row}`)}
                  name={id("barcode")}
                  defaultValue={row === 0 ? defaultBarcode : ""}
                />
              </div>
              {barcodeRows.length > 1 && (
                <button
                  type="button"
                  aria-label="この行を削除"
                  onClick={() => setBarcodeRows((cur) => cur.filter((r) => r !== row))}
                  className="h-12 w-12 shrink-0 rounded-xl border border-line text-stone-500"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            disabled={barcodeRows.length >= MAX_BARCODES_PER_PRODUCT}
            onClick={() => {
              setBarcodeRows((cur) => [...cur, nextRow]);
              setNextRow((n) => n + 1);
            }}
            className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-stone-600 disabled:opacity-40"
          >
            ＋ バーコードを追加
          </button>
        </div>
      </Field>

      <Field label="メモ" kind="optional" htmlFor={id("memo")}>
        <Textarea
          id={id("memo")}
          name={id("memo")}
          rows={3}
          maxLength={1000}
          placeholder="例：月曜は特売になりやすい"
          className="text-base"
        />
      </Field>
    </>
  );
}