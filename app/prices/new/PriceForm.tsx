"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  HelpCircle,
  Percent,
  Receipt,
  Save,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Collapsible from "@/components/Collapsible";
import { addPriceObservation } from "@/app/prices/actions";
import { TAX_BASES, TAX_RADIO_LABEL, type TaxBasis } from "@/lib/prices/tax";
import { BonusPointsField, MemberPriceCheck } from "./ChainExtras";
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

const TAX_ICON: Record<TaxBasis, LucideIcon> = {
  excl: Tag,
  incl: Receipt,
  unknown: HelpCircle,
};

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
  const [isSale, setIsSale] = useState(false);
  const [observedAt, setObservedAt] = useState("");
  const [saveVisible, setSaveVisible] = useState(true);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const saveRef = useRef<HTMLDivElement>(null);

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

  // Is the main Save button on screen? The bottom margin ignores the part
  // hidden behind the bottom tab bar.
  useEffect(() => {
    const el = saveRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setSaveVisible(entry.isIntersecting),
      { rootMargin: "0px 0px -80px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // A short message at the top, shown only while the main Save button is off screen.
  useEffect(() => {
    const text = state.error ?? state.message;
    if (!text) return;
    setToast({ text, ok: !state.error });
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [state]);

  const keyword = search.trim().toLowerCase();
  const filtered = keyword
    ? packages.filter((p) => `${p.label} ${p.search}`.toLowerCase().includes(keyword))
    : packages;
  const selectedPackage = filtered.some((p) => p.id === packageId) ? packageId : "";

  const branchOptions = branches.filter((b) => b.chainId === chainId);
  const selectedBranch = branchOptions.some((b) => b.id === branchId) ? branchId : "";
  const selectedChain = chains.find((c) => c.id === chainId);
  const branchSummary = isNewBranch
    ? newBranch.trim()
    : (branchOptions.find((b) => b.id === selectedBranch)?.name ?? "");

  const saveDisabled = pending || (!isNewPackage && filtered.length === 0);

  return (
    <form action={formAction} className="space-y-5">
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

      <div className="space-y-1">
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

        <Collapsible title="支店" badge={<Badge kind="optional" />} summary={branchSummary}>
          <div className="flex gap-2">
            {isNewBranch ? (
              <input
                id="new_shop_name"
                name="new_shop_name"
                type="text"
                aria-label="新しい支店名"
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
                aria-label="支店"
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
        </Collapsible>
      </div>

      <div className="space-y-2">
        <Field label="価格（円）" kind="required" htmlFor="price">
          <div className="flex gap-2">
            <div className="w-40 shrink-0">
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
            <label
              className={`flex h-12 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border px-3 text-sm font-medium ${
                isSale
                  ? "border-amber-500 bg-amber-50 text-amber-700"
                  : "border-stone-200 bg-white text-stone-600"
              }`}
            >
              <input
                type="checkbox"
                name="is_sale"
                checked={isSale}
                onChange={(e) => setIsSale(e.target.checked)}
                className="h-4 w-4 accent-amber-500"
              />
              <Percent className="h-4 w-4" />
              特売
            </label>
          </div>
        </Field>
        <MemberPriceCheck chain={selectedChain} />
      </div>

      <fieldset className="min-w-0">
        <legend className={labelCls}>
          税の扱い <Badge kind="required" />
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {TAX_BASES.map((b) => {
            const Icon = TAX_ICON[b];
            return (
              <label
                key={b}
                className="flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white px-2 text-sm text-stone-600 transition has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50 has-[:checked]:font-bold has-[:checked]:text-teal-700 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal-600"
              >
                <input
                  type="radio"
                  name="tax_basis"
                  value={b}
                  defaultChecked={b === "unknown"}
                  className="sr-only"
                />
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {TAX_RADIO_LABEL[b]}
              </label>
            );
          })}
        </div>
      </fieldset>

      <BonusPointsField chain={selectedChain} />

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

      <div ref={saveRef}>
        <Button type="submit" disabled={saveDisabled} className="h-12 w-full text-base">
          {pending ? "保存中…" : "保存"}
        </Button>
      </div>

      {!saveVisible && (
        <>
          {toast && (
            <div
              role="status"
              className={`fixed inset-x-4 top-4 z-50 mx-auto max-w-xl rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${
                toast.ok ? "bg-teal-700" : "bg-red-600"
              }`}
            >
              {toast.text}
            </div>
          )}
          <button
            type="submit"
            disabled={saveDisabled}
            aria-label="保存"
            className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg transition active:scale-95 disabled:opacity-50"
          >
            <Save className="h-6 w-6" />
          </button>
        </>
      )}
    </form>
  );
}