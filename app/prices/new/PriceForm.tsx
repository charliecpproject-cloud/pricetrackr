"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { addPriceObservation } from "@/app/prices/actions";
import ChainExtras from "./ChainExtras";
import { TAX_BASES, TAX_RADIO_LABEL } from "@/lib/prices/tax";
import NewPackageFields, { type ProductOption } from "./NewPackageFields";
import { Badge, Field, NewToggle, controlCls, labelCls } from "@/components/FormParts";

type Pkg = { id: string; label: string; search: string };
type Chain = {
  id: string;
  name: string;
  memberPercent: number | null;
  hasBonusPoints: boolean;
};
type Branch = { id: string; chainId: string; name: string };

const initialState: {
  error: string | null;
  message?: string | null;
  packageId?: string | null;
} = { error: null, message: null, packageId: null };

// Current date and time in Japan, formatted for a datetime-local input.
function nowInJapan(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export default function PriceForm({
  packages,
  products,
  chains,
  branches,
}: {
  packages: Pkg[];
  products: ProductOption[];
  chains: Chain[];
  branches: Branch[];
}) {
  const [state, formAction, pending] = useActionState(addPriceObservation, initialState);
  const [search, setSearch] = useState("");
  const [packageId, setPackageId] = useState("");
  const [isNewPackage, setIsNewPackage] = useState(false);
  const [chainId, setChainId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [isNewBranch, setIsNewBranch] = useState(false);
  const [newBranch, setNewBranch] = useState("");
  const [price, setPrice] = useState("");
  const [observedAt, setObservedAt] = useState("");

  // Default time is set after mount, so server and browser output match.
  useEffect(() => {
    setObservedAt(nowInJapan());
  }, []);

  // After a successful save: clear the price and go back to the dropdowns,
  // with the package just used (or just created) selected.
  useEffect(() => {
    if (state.message) {
      setPrice("");
      setIsNewBranch(false);
      setNewBranch("");
      if (state.packageId) {
        setPackageId(state.packageId);
        setIsNewPackage(false);
        setSearch("");
      }
    }
  }, [state]);

  const keyword = search.trim().toLowerCase();
  const filtered = keyword
    ? packages.filter((p) => `${p.label} ${p.search}`.toLowerCase().includes(keyword))
    : packages;
  const selectedPackage = filtered.some((p) => p.id === packageId) ? packageId : "";

  const branchOptions = branches.filter((b) => b.chainId === chainId);
  const selectedBranch = branchOptions.some((b) => b.id === branchId) ? branchId : "";
  const selectedChain = chains.find((c) => c.id === chainId);

  return (
    <form action={formAction} className="space-y-5">
      <p className="flex items-center text-sm text-stone-500">
        <Badge kind="required" />
        <span className="ml-1">は必ず入力してください。</span>
      </p>

      {isNewPackage ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className={`${labelCls} mb-0`}>新しい商品・容量を登録</span>
            <NewToggle checked onChange={setIsNewPackage} />
          </div>
          <NewPackageFields products={products} />
        </div>
      ) : (
        <>
          <Field label="商品を検索" kind="optional" htmlFor="search">
            <input
              id="search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="商品名・ブランドで絞り込み"
              className={controlCls}
            />
          </Field>

          <Field
            label="商品・容量"
            kind="required"
            htmlFor="product_package_id"
            hint={
              filtered.length === 0
                ? "該当する商品がありません。右の「新規」から登録できます。"
                : "リストにない場合は「新規」で商品・容量を登録できます。"
            }
          >
            <div className="flex gap-2">
              <select
                id="product_package_id"
                name="product_package_id"
                required
                value={selectedPackage}
                onChange={(e) => setPackageId(e.target.value)}
                className={controlCls}
              >
                <option value="">商品・容量を選択</option>
                {filtered.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
              <NewToggle checked={false} onChange={setIsNewPackage} />
            </div>
          </Field>
        </>
      )}

      <Field label="チェーン" kind="required" htmlFor="store_chain_id">
        <select
          id="store_chain_id"
          name="store_chain_id"
          required
          value={chainId}
          onChange={(e) => {
            setChainId(e.target.value);
            setBranchId("");
          }}
          className={controlCls}
        >
          <option value="">チェーンを選択</option>
          {chains.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="支店"
        kind="optional"
        htmlFor={isNewBranch ? "new_shop_name" : "shop_id"}
      >
        <div className="flex gap-2">
          {isNewBranch ? (
            <input
              id="new_shop_name"
              name="new_shop_name"
              type="text"
              value={newBranch}
              onChange={(e) => setNewBranch(e.target.value)}
              maxLength={100}
              placeholder="新しい支店名（例：練馬店）"
              className={controlCls}
            />
          ) : (
            <select
              id="shop_id"
              name="shop_id"
              value={selectedBranch}
              onChange={(e) => setBranchId(e.target.value)}
              className={controlCls}
            >
              <option value="">指定しない</option>
              {branchOptions.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
          <NewToggle
            checked={isNewBranch}
            onChange={(checked) => {
              setIsNewBranch(checked);
              setBranchId("");
              setNewBranch("");
            }}
          />
        </div>
      </Field>

      <Field label="価格（円）" kind="required" htmlFor="price">
        <input
          id="price"
          name="price"
          type="text"
          inputMode="decimal"
          required
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="例：198"
          className={controlCls}
        />
      </Field>

      <fieldset>
        <legend className={labelCls}>
          税の扱い <Badge kind="required" />
        </legend>
        <div className="flex gap-2">
          {TAX_BASES.map((b) => (
            <label
              key={b}
              className="flex h-12 flex-1 cursor-pointer items-center justify-center rounded-xl border border-stone-200 bg-white text-base text-stone-800 has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50 has-[:checked]:font-bold has-[:checked]:text-teal-700 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal-600"
            >
              <input
                type="radio"
                name="tax_basis"
                value={b}
                defaultChecked={b === "unknown"}
                className="sr-only"
              />
              {TAX_RADIO_LABEL[b]}
            </label>
          ))}
        </div>
      </fieldset>

      <ChainExtras chain={selectedChain} />

      <Field label="日時" kind="required" htmlFor="observed_at">
        <input
          id="observed_at"
          name="observed_at"
          type="datetime-local"
          required
          value={observedAt}
          onChange={(e) => setObservedAt(e.target.value)}
          className={controlCls}
        />
      </Field>

      <label className="flex h-12 items-center gap-3 text-base text-stone-800">
        <input type="checkbox" name="is_sale" className="h-5 w-5 accent-teal-600" />
        特売
        <Badge kind="optional" />
      </label>

      <Field label="メモ" kind="optional" htmlFor="notes">
        <input
          id="notes"
          name="notes"
          type="text"
          maxLength={200}
          className={controlCls}
        />
      </Field>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.message && <p className="text-sm text-teal-700">{state.message}</p>}

      <Button
        type="submit"
        disabled={pending || (!isNewPackage && filtered.length === 0)}
        className="h-12 w-full text-base"
      >
        {pending ? "保存中…" : "保存"}
      </Button>
    </form>
  );
}