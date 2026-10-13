"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addPriceObservation } from "@/app/prices/actions"; import ChainExtras from "./ChainExtras";

type Pkg = { id: string; label: string; search: string };
type Chain = { id: string; name: string; memberPercent: number | null; hasBonusPoints: boolean };
type Branch = { id: string; chainId: string; name: string };

const initialState: { error: string | null; message?: string | null } = {
  error: null,
  message: null,
};

const labelCls = "mb-1.5 block text-sm font-medium text-stone-700";
const controlCls =
  "h-12 w-full rounded-xl border border-stone-200 bg-white px-3 text-base focus:outline-none focus:ring-2 focus:ring-teal-600";

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
  chains,
  branches,
}: {
  packages: Pkg[];
  chains: Chain[];
  branches: Branch[];
}) {
  const [state, formAction, pending] = useActionState(addPriceObservation, initialState);
  const [search, setSearch] = useState("");
  const [packageId, setPackageId] = useState("");
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

  // After a successful save: clear the price, go back to the branch dropdown.
  useEffect(() => {
    if (state.message) {
      setPrice("");
      setIsNewBranch(false);
      setNewBranch("");
    }
  }, [state]);

  const keyword = search.trim().toLowerCase();
  const filtered = keyword
    ? packages.filter((p) => `${p.label} ${p.search}`.toLowerCase().includes(keyword))
    : packages;
  const selectedPackage = filtered.some((p) => p.id === packageId) ? packageId : "";

  const branchOptions = branches.filter((b) => b.chainId === chainId); const selectedChain = chains.find((c) => c.id === chainId);
  const selectedBranch = branchOptions.some((b) => b.id === branchId) ? branchId : "";

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label className={labelCls} htmlFor="search">
          商品を検索
        </label>
        <input
          id="search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="商品名・ブランドで絞り込み"
          className={controlCls}
        />
      </div>

      <div>
        <label className={labelCls} htmlFor="product_package_id">
          商品・容量
        </label>
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
        {filtered.length === 0 && (
          <p className="mt-1.5 text-sm text-stone-500">該当する商品がありません</p>
        )}
      </div>

      <div>
        <label className={labelCls} htmlFor="store_chain_id">
          チェーン
        </label>
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
      </div>

      <div>
        <label className={labelCls} htmlFor={isNewBranch ? "new_shop_name" : "shop_id"}>
          支店（任意）
        </label>
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
          <label
            className={`flex h-12 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border px-3 text-sm font-medium ${
              isNewBranch
                ? "border-teal-600 bg-teal-50 text-teal-700"
                : "border-stone-200 bg-white text-stone-600"
            }`}
          >
            <input
              type="checkbox"
              checked={isNewBranch}
              onChange={(e) => {
                setIsNewBranch(e.target.checked);
                setBranchId("");
                setNewBranch("");
              }}
              className="h-4 w-4 accent-teal-600"
            />
            <Plus className="h-4 w-4" />
            新規
          </label>
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor="price">
          価格（円）
        </label>
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
      </div>

      <div>
        <ChainExtras chain={selectedChain} /><label className={labelCls} htmlFor="observed_at">
          日時
        </label>
        <input
          id="observed_at"
          name="observed_at"
          type="datetime-local"
          required
          value={observedAt}
          onChange={(e) => setObservedAt(e.target.value)}
          className={controlCls}
        />
      </div>

      <label className="flex h-12 items-center gap-3 text-base text-stone-800">
        <input type="checkbox" name="is_sale" className="h-5 w-5 accent-teal-600" />
        特売
      </label>

      <div>
        <label className={labelCls} htmlFor="notes">
          メモ（任意）
        </label>
        <input
          id="notes"
          name="notes"
          type="text"
          maxLength={200}
          className={controlCls}
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.message && <p className="text-sm text-teal-700">{state.message}</p>}

      <Button
        type="submit"
        disabled={pending || filtered.length === 0}
        className="h-12 w-full text-base"
      >
        {pending ? "保存中…" : "保存"}
      </Button>
    </form>
  );
}