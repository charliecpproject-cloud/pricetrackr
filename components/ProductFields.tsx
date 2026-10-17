"use client";

import { Textarea } from "@/components/ui/textarea";
import { Field, controlCls } from "@/components/FormParts";
import CategoryField from "@/components/CategoryField";

// The fields of a new product. Used by 商品を追加 (prefix "") and by
// 価格入力 > 新しい商品として登録 (prefix "np_"), so both always match.
export default function ProductFields({ prefix = "" }: { prefix?: string }) {
  const id = (key: string) => `${prefix}${key}`;

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