"use client";
import { useToastedActionState } from "@/lib/toast/useToastedActionState";

import { startTransition, useEffect, useRef, useState } from "react";
import {
  HelpCircle,
  Clock,
  List,
  Megaphone,
  Repeat,
  Receipt,
  Save,
  Tag,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Collapsible from "@/components/Collapsible";
import { CATEGORY_LABEL, parseCategory, saleLabel } from "@/lib/stores/category";
import { addPriceObservation } from "@/app/prices/actions";
import { TAX_BASES, TAX_RADIO_LABEL, type TaxBasis } from "@/lib/prices/tax";
import { BonusPointsField, MemberPriceCheck } from "./ChainExtras";
import BulkPriceFields, { emptyBulkRows, rowsFromTiers, type BulkRow } from "./BulkPriceFields";
import { lookupBulkDefaults } from "@/app/prices/bulkDefaults";
import { lookupPreviousPrices } from "@/app/prices/previousPrice";
import { parsePriceInput, type PreviousPrices } from "@/lib/prices/previous";
import { suspiciousPrice } from "@/lib/prices/suspicious";
import { taxIncludedEstimate } from "@/lib/prices/taxHint";
import { formatYen } from "@/lib/prices/format";
import PriceWarnings from "./PriceWarnings";
import PreviousPriceLine from "./PreviousPriceLine";
import type { SearchAlias } from "@/lib/search/aliases";
import PackagePicker from "./PackagePicker";
import NewPackageFields, { type ProductOption } from "./NewPackageFields";
import type { CounterUnitOption } from "@/lib/prices/unitWords";
import { Badge, Field, NewToggle, controlCls, labelCls } from "@/components/FormParts";

type Pkg = { id: string; label: string; search: string; taxRate?: number | null };
type Chain = {
  id: string;
  name: string;
  memberPercent: number | null;
  hasBonusPoints: boolean;
  bulkEnabled: boolean;
  category: string | null;
  isTop: boolean;
};
type Branch = { id: string; chainId: string; name: string };

const initialState: {
  error: string | null;
  message?: string | null;
  packageId?: string | null;
  toastLink?: { href: string; label: string } | null;
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

// Today at 12:00 in Japan: the default time of a new price.
function noonInJapan(): string {
  return `${nowInJapan().slice(0, 10)}T12:00`;
}

export default function PriceForm({
  packages,
  products,
  chains,
  branches,
  readOnly = false,
  aliases = [],
  recentIds = [],
  initialChainId = "",
  initialPackageId = "",
  startNew = false,
  defaultProductId = "",
  counterUnits,
}: {
  packages: Pkg[];
  products: ProductOption[];
  chains: Chain[];
  branches: Branch[];
  readOnly?: boolean;
  aliases?: SearchAlias[];
  recentIds?: string[];
  initialChainId?: string;
  initialPackageId?: string;
  startNew?: boolean;
  defaultProductId?: string;
  counterUnits: CounterUnitOption[];
}) {
  const [state, formAction, pending] = useToastedActionState(addPriceObservation, initialState);
  const [search, setSearch] = useState("");
  const [packageId, setPackageId] = useState(initialPackageId);
  const [isNewPackage, setIsNewPackage] = useState(startNew);
  const [chainId, setChainId] = useState(initialChainId);
  const [branchId, setBranchId] = useState("");
  const [isNewBranch, setIsNewBranch] = useState(false);
  const [newBranch, setNewBranch] = useState("");
  const [price, setPrice] = useState("");
  // The price warnings appear once the price field has been left (not while typing).
  const [priceDone, setPriceDone] = useState(false);
  const [isSale, setIsSale] = useState(false);
  const [showAllChains, setShowAllChains] = useState(false);
  const [observedAt, setObservedAt] = useState("");
  const [taxBasis, setTaxBasis] = useState<TaxBasis>("unknown");
  const [isMember, setIsMember] = useState(true);
  const [isBulk, setIsBulk] = useState(false);
  const [bulkTiers, setBulkTiers] = useState<BulkRow[]>(emptyBulkRows());
  const bulkTouchedRef = useRef(false);
  const [bonusPoints, setBonusPoints] = useState("");
  const [notes, setNotes] = useState("");
  const [focusMode, setFocusMode] = useState(false);
  const focusRef = useRef(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const [saveVisible, setSaveVisible] = useState(true);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const saveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    focusRef.current = focusMode;
  }, [focusMode]);

  // Default time is set after mount, so server and browser output match.
  useEffect(() => {
    setObservedAt(noonInJapan());
  }, []);

  // After a successful save: clear the price and go back to the dropdowns,
  // with the package just used (or just created) selected.
  useEffect(() => {
    if (state.message) {
      setPrice("");
      setNotes("");
      setIsBulk(false);
      bulkTouchedRef.current = false;
      if (focusRef.current) {
        // 連続入力: keep chain, branch, tax, sale and member price; start the next item
        setBonusPoints("");
        setObservedAt(noonInJapan());
        setPackageId("");
        setIsNewPackage(false);
        setSearch("");
        setTimeout(() => searchRef.current?.focus(), 0);
      } else {
        // normal mode: same as before (tax, member price and points go back to defaults)
        setTaxBasis("unknown");
        setIsMember(true);
        setBonusPoints("");
      }
      setIsNewBranch(false);
      setNewBranch("");
      if (state.packageId && !focusRef.current) {
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
    // the message is shown by the shared toast now
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [state]);

  const selectedPackage = packages.some((p) => p.id === packageId) ? packageId : "";

  const branchOptions = branches.filter((b) => b.chainId === chainId);
  const selectedBranch = branchOptions.some((b) => b.id === branchId) ? branchId : "";
  const selectedChain = chains.find((c) => c.id === chainId);

  // 税抜き chosen and the product has a tax rate: show the 税込 estimate live under the price box.
  const selectedRate = packages.find((p) => p.id === selectedPackage)?.taxRate ?? null;
  const taxEstimate =
    !isNewPackage && taxBasis === "excl" && selectedRate !== null && selectedRate > 0
      ? taxIncludedEstimate(parsePriceInput(price) ?? NaN, selectedRate)
      : null;

  // The previous price of this 容量 (any chain, and at the chosen chain), fetched when the
  // 容量 or the chain changes and again after each save. Shown only while the key still matches.
  const [previous, setPrevious] = useState<{ key: string; data: PreviousPrices } | null>(null);
  const previousKey = `${selectedPackage}|${chainId}`;
  useEffect(() => {
    if (!selectedPackage || selectedPackage.startsWith("default:")) return;
    let cancelled = false;
    lookupPreviousPrices(selectedPackage, chainId)
      .then((data) => {
        if (!cancelled) setPrevious({ key: previousKey, data });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [selectedPackage, chainId, previousKey, state]);
  const previousPrices = previous && previous.key === previousKey ? previous.data : null;
  // The price to compare with: the newest at the chosen chain, else the newest at any chain.
  const reference = previousPrices ? (previousPrices.atChain ?? previousPrices.latest) : null;
  const priceWarnings =
    !isNewPackage && priceDone && reference
      ? suspiciousPrice(parsePriceInput(price), taxBasis, reference)
      : [];

  // Chains with the bulk option: fill the percent and quantity used last
  // (same product first, then the chain), unless the user already typed something.
  useEffect(() => {
    if (!selectedChain?.bulkEnabled) {
      setIsBulk(false);
      return;
    }
    let cancelled = false;
    lookupBulkDefaults(chainId, selectedPackage)
      .then((found) => {
        if (cancelled || !found || bulkTouchedRef.current) return;
        setBulkTiers(rowsFromTiers(found));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [chainId, selectedChain?.bulkEnabled, selectedPackage]);

  // Dropdown content: the short list (or everything), grouped by category.
  // The chains arrive already sorted, so groups appear in the right order.
  const visibleChains = chains.filter(
    (c) => showAllChains || c.isTop || c.id === chainId
  );
  const chainGroups: { key: string; label: string; items: Chain[] }[] = [];
  for (const c of visibleChains) {
    const category = parseCategory(c.category);
    const key = category ?? "none";
    let group = chainGroups.find((g) => g.key === key);
    if (!group) {
      group = { key, label: category ? CATEGORY_LABEL[category] : "未分類", items: [] };
      chainGroups.push(group);
    }
    group.items.push(c);
  }
  const branchSummary = isNewBranch
    ? newBranch.trim()
    : (branchOptions.find((b) => b.id === selectedBranch)?.name ?? "");

  const saleText = selectedChain ? saleLabel(parseCategory(selectedChain.category)) : "特売";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (readOnly || pending) return;
    const formData = new FormData(e.currentTarget);
    startTransition(() => {
      formAction(formData);
    });
  };

  const saveDisabled =
    readOnly || pending || (!isNewPackage && !selectedPackage);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {focusMode && (
        <p className="rounded-xl bg-teal-50 px-3 py-2 text-sm text-teal-700">
          連続入力モード：保存後も、チェーン・税・特売などの選択を残します。
        </p>
      )}
      {isNewPackage ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className={`${labelCls} mb-0`}>新しい商品・容量を登録</span>
            <NewToggle checked onChange={setIsNewPackage} />
          </div>
          <NewPackageFields
            products={products}
            defaultProductId={defaultProductId}
            counterUnits={counterUnits}
          />
        </div>
      ) : (
        <>
          <Field
            label="商品・容量"
            kind="required"
            htmlFor="package_search"
            hint="リストにない場合は「新規」で商品・容量を登録できます。"
          >
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <PackagePicker
                  packages={packages}
                  aliases={aliases}
                  recentIds={recentIds}
                  selectedId={selectedPackage}
                  onSelect={setPackageId}
                  search={search}
                  onSearchChange={setSearch}
                  inputRef={searchRef}
                />
              </div>
              <NewToggle checked={false} onChange={setIsNewPackage} />
            </div>
          </Field>
        </>
      )}

      <div className="space-y-1">
        <Field label="チェーン" kind="required" htmlFor="store_chain_id">
          <div className="flex gap-2">
            <select
              id="store_chain_id"
              name="store_chain_id"
              required
              value={chainId}
              onChange={(e) => {
                setChainId(e.target.value);
                setIsMember(true);
                setBranchId("");
              }}
              className={controlCls}
            >
              <option value="">チェーンを選択</option>
              {chainGroups.map((g) => (
                <optgroup key={g.key} label={g.label}>
                  {g.items.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <label
              className={`flex h-12 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border px-3 text-sm font-medium ${
                showAllChains
                  ? "border-teal-600 bg-teal-50 text-teal-700"
                  : "border-line bg-panel text-stone-600"
              }`}
            >
              <input
                type="checkbox"
                checked={showAllChains}
                onChange={(e) => setShowAllChains(e.target.checked)}
                className="sr-only"
              />
              <List className="h-4 w-4" />
              すべて
            </label>
          </div>
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
                onChange={(e) => {
                  setPrice(e.target.value);
                  setPriceDone(false);
                }}
                onBlur={() => setPriceDone(true)}
                placeholder="例：198"
                className={controlCls}
              />
            </div>
            <label
              className={`flex h-12 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border px-3 text-sm font-medium ${
                isSale
                  ? "border-amber-500 bg-amber-50 text-amber-700"
                  : "border-line bg-panel text-stone-600"
              }`}
            >
              <input
                type="checkbox"
                name="is_sale"
                checked={isSale}
                onChange={(e) => setIsSale(e.target.checked)}
                className="h-4 w-4 accent-amber-500"
              />
              <Megaphone className="h-4 w-4" />
              {saleText}
            </label>
          </div>
        </Field>
        {taxEstimate !== null && selectedRate !== null && (
          <p className="text-sm text-stone-600">
            税込の目安 <span className="font-bold tabular-nums">{formatYen(taxEstimate)}</span>
            （{selectedRate}%・未確認）
          </p>
        )}
        {!isNewPackage && previousPrices && (
          <PreviousPriceLine
            prices={previousPrices}
            priceText={price}
            basis={taxBasis}
            chainId={chainId}
          />
        )}
        {reference && priceWarnings.length > 0 && (
          <PriceWarnings warnings={priceWarnings} previous={reference} />
        )}
        <MemberPriceCheck
          chain={selectedChain}
          checked={isMember}
          onChange={setIsMember}
        />
        <BulkPriceFields
          chain={selectedChain}
          checked={isBulk}
          onCheckedChange={setIsBulk}
          tiers={bulkTiers}
          onTiersChange={(value) => {
            bulkTouchedRef.current = true;
            setBulkTiers(value);
          }}
        />
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
                className="flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-line bg-panel px-2 text-sm text-stone-600 transition has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50 has-[:checked]:font-bold has-[:checked]:text-teal-700 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal-600"
              >
                <input
                  type="radio"
                  name="tax_basis"
                  value={b}
                  checked={taxBasis === b}
                  onChange={() => setTaxBasis(b)}
                  className="sr-only"
                />
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {TAX_RADIO_LABEL[b]}
              </label>
            );
          })}
        </div>
      </fieldset>

      <BonusPointsField chain={selectedChain} value={bonusPoints} onChange={setBonusPoints} />

      <Field label="日時" kind="required" htmlFor="observed_at">
        <div className="flex gap-2">
          <div className="min-w-0 flex-1">
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
          <button
            type="button"
            aria-label="現在の日時にする"
            onClick={() => setObservedAt(nowInJapan())}
            className="flex h-12 shrink-0 items-center gap-1.5 rounded-xl border border-line bg-panel px-4 text-sm font-medium text-stone-700 active:scale-95"
          >
            <Clock className="h-4 w-4" />
            今
          </button>
        </div>
      </Field>

      <Field label="メモ" kind="optional" htmlFor="notes">
        <input
          id="notes"
          name="notes"
          type="text"
          maxLength={200}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={controlCls}
        />
      </Field>

      {readOnly && (
        <p className="rounded-xl bg-chip px-4 py-3 text-sm text-stone-600">
          デモモード（閲覧のみ）のため、保存できません。ログインすると価格を記録できます。
        </p>
      )}
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.message && (
        <p className="text-sm text-teal-700">
          {state.message}
          {state.toastLink && (
            <Link href={state.toastLink.href} className="ml-2 font-bold underline">
              {state.toastLink.label}
            </Link>
          )}
        </p>
      )}

      <div ref={saveRef}>
        <Button type="submit" disabled={saveDisabled} className="h-12 w-full text-base">
          {pending ? "保存中…" : "保存"}
        </Button>
      </div>

      <button
        type="button"
        onClick={() => setFocusMode((v) => !v)}
        disabled={readOnly}
        aria-pressed={focusMode}
        className={`fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-4 z-40 flex h-12 items-center gap-1.5 rounded-full border px-4 text-sm font-bold shadow-lg transition active:scale-95 disabled:opacity-50 ${
          focusMode
            ? "border-teal-600 bg-teal-600 text-white"
            : "border-line bg-panel text-stone-600"
        }`}
      >
        <Repeat className="h-4 w-4" />
        {focusMode ? "連続入力 ON" : "連続入力"}
      </button>

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