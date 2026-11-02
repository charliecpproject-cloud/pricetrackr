"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge, controlCls, labelCls } from "@/components/FormParts";
import { countCategories, normalize } from "@/lib/products/category";
import { useToastedActionState } from "@/lib/toast/useToastedActionState";
import { setProductField } from "./tidyActions";

type Field = "brand" | "category";
type Item = {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
};

const FIELD_LABEL: Record<Field, string> = {
  brand: "ブランド",
  category: "カテゴリ",
};
const MAX_SHOWN = 100;
const MAX_PRODUCTS = 500;

const initialState: { error: string | null; message?: string | null } = {
  error: null,
  message: null,
};

const smallBtn =
  "h-9 rounded-lg border border-line bg-panel px-3 text-sm font-medium text-stone-700 active:scale-95";

// One tool for both: choose the products (by tapping an existing value, by ticking single
// products, or both), then give them one new brand or category.
export default function BulkTidyForm({ products }: { products: Item[] }) {
  const [state, formAction, pending] = useToastedActionState(
    setProductField,
    initialState,
  );
  const [field, setField] = useState<Field>("brand");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("");
  const [onlyEmpty, setOnlyEmpty] = useState(false);
  const [value, setValue] = useState("");

  // After a successful change: start again.
  useEffect(() => {
    if (state.message) {
      setSelected(new Set());
      setValue("");
    }
  }, [state]);

  const valueOf = (p: Item) =>
    ((field === "brand" ? p.brand : p.category) ?? "").trim();

  // The values in use with their number of products, and the products of each value.
  const values = useMemo(
    () =>
      countCategories(
        products.map((p) => (field === "brand" ? p.brand : p.category)),
      ).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ja")),
    [products, field],
  );
  const idsByKey = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const p of products) {
      const v = ((field === "brand" ? p.brand : p.category) ?? "").trim();
      if (!v) continue;
      const key = normalize(v);
      map.set(key, [...(map.get(key) ?? []), p.id]);
    }
    return map;
  }, [products, field]);

  const q = normalize(filter);
  const filtered = products.filter(
    (p) =>
      (!onlyEmpty || valueOf(p) === "") &&
      (q === "" ||
        normalize(`${p.name} ${p.brand ?? ""} ${p.category ?? ""}`).includes(
          q,
        )),
  );
  const shown = filtered.slice(0, MAX_SHOWN);

  const toggleId = (id: string) =>
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleValue = (key: string) => {
    const ids = idsByKey.get(key) ?? [];
    setSelected((cur) => {
      const next = new Set(cur);
      if (ids.every((id) => next.has(id))) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const tooMany = selected.size > MAX_PRODUCTS;
  const newValue = value.replace(/\s+/g, " ").trim();
  const canSubmit =
    !pending && selected.size > 0 && newValue !== "" && !tooMany;

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (
          !window.confirm(
            `選んだ${selected.size}件の${FIELD_LABEL[field]}を「${newValue}」にしますか？${
              field === "brand"
                ? "\n使う商品がなくなった元の名前は、別名として残ります。"
                : ""
            }`,
          )
        ) {
          e.preventDefault();
        }
      }}
      className="space-y-5"
    >
      <fieldset className="min-w-0">
        <legend className={labelCls}>整理する項目</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["brand", "category"] as Field[]).map((f) => (
            <label
              key={f}
              className="flex h-10 cursor-pointer items-center justify-center rounded-xl border border-line bg-panel px-3 text-sm text-stone-600 has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50 has-[:checked]:font-bold has-[:checked]:text-teal-700 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal-600"
            >
              <input
                type="radio"
                name="field"
                value={f}
                checked={field === f}
                onChange={() => {
                  setField(f);
                  setValue("");
                  setOnlyEmpty(false);
                }}
                className="sr-only"
              />
              {FIELD_LABEL[f]}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <p className={labelCls}>
          いまある{FIELD_LABEL[field]}（タップで、その商品をすべて選ぶ）
        </p>
        {values.length === 0 ? (
          <p className="text-sm text-stone-500">まだありません。</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {values.map((v) => {
              const key = normalize(v.name);
              const ids = idsByKey.get(key) ?? [];
              const all = ids.length > 0 && ids.every((id) => selected.has(id));
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={all}
                  onClick={() => toggleValue(key)}
                  className={`min-h-9 rounded-xl border px-3 py-1 text-sm transition active:scale-[0.98] ${
                    all
                      ? "border-teal-600 bg-teal-50 font-bold text-teal-700"
                      : "border-line bg-panel text-stone-600"
                  }`}
                >
                  {v.name}（{v.count}）
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className={labelCls}>商品を選ぶ（選択中 {selected.size}件）</p>
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          autoComplete="off"
          maxLength={100}
          aria-label="商品を絞り込む"
          placeholder="商品名・ブランド・カテゴリで絞り込み"
          className={controlCls}
        />
        <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            checked={onlyEmpty}
            onChange={(e) => setOnlyEmpty(e.target.checked)}
            className="h-5 w-5 accent-teal-600"
          />
          {FIELD_LABEL[field]}が未設定の商品だけ
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={smallBtn}
            onClick={() =>
              setSelected((cur) => {
                const next = new Set(cur);
                filtered.forEach((p) => next.add(p.id));
                return next;
              })
            }
          >
            表示中の{filtered.length}件をすべて選ぶ
          </button>
          <button
            type="button"
            className={smallBtn}
            onClick={() => setSelected(new Set())}
          >
            選択を解除
          </button>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-stone-500">該当する商品がありません。</p>
        ) : (
          <ul className="max-h-96 divide-y divide-stone-100 overflow-y-auto rounded-xl border border-line bg-panel">
            {shown.map((p) => (
              <li key={p.id}>
                <label className="flex min-h-12 cursor-pointer items-center gap-3 px-3 py-2 hover:bg-panel-soft">
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggleId(p.id)}
                    className="h-5 w-5 shrink-0 accent-teal-600"
                  />
                  <span className="min-w-0">
                    <span className="block break-words text-sm font-medium text-stone-900">
                      {p.name}
                    </span>
                    <span className="block break-words text-xs text-stone-500">
                      {FIELD_LABEL[field]}：{valueOf(p) || "なし"}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
        {filtered.length > MAX_SHOWN && (
          <p className="text-xs text-stone-500">
            ほかに{filtered.length - MAX_SHOWN}
            件あります。言葉を足して絞り込んでください。
          </p>
        )}
        {tooMany && (
          <p className="text-sm text-red-600">
            一度に変更できる商品は{MAX_PRODUCTS}件までです。
          </p>
        )}
      </div>

      {Array.from(selected).map((id) => (
        <input key={id} type="hidden" name="ids" value={id} />
      ))}

      <div>
        <label htmlFor="tidy_value" className={labelCls}>
          新しい{FIELD_LABEL[field]} <Badge kind="required" />
        </label>
        <datalist id="tidy-values">
          {values.map((v) => (
            <option key={normalize(v.name)} value={v.name} />
          ))}
        </datalist>
        <input
          id="tidy_value"
          name="value"
          list="tidy-values"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={100}
          autoComplete="off"
          placeholder={field === "brand" ? "例：PASCO" : "例：おむつ"}
          className={controlCls}
        />
        <p className="mt-1.5 text-xs text-stone-500">
          {field === "brand"
            ? "別名に登録されている名前を入力すると、その別名のブランドにそろえます。"
            : "すでにあるカテゴリと同じ書き方（全角・半角・大文字小文字）なら、すでにある表記にそろえます。"}
          価格の記録は変わりません。
        </p>
      </div>

      {field === "brand" && (
        <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            name="keep_alias"
            value="1"
            defaultChecked
            className="h-5 w-5 accent-teal-600"
          />
          使う商品がなくなった元の名前を、別名として残す
        </label>
      )}

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={!canSubmit} className="h-12 w-full">
        {pending
          ? "変更しています…"
          : selected.size > 0 && newValue !== ""
            ? `${selected.size}件を「${newValue}」にする`
            : "商品と新しい値を選んでください"}
      </Button>
    </form>
  );
}
