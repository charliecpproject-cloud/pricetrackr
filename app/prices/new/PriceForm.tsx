"use client";

import { useActionState } from "react";
import { useEffect, useRef, useState } from "react";
import { addPriceObservation } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Package = { id: string; label: string; search: string };
type Shop = { id: string; label: string };

type Props = {
  packages: Package[];
  shops: Shop[];
};

export default function PriceForm({ packages, shops }: Props) {
  // 初期状態: エラーメッセージと成功メッセージなし
  const initialState = {
    error: null as string | null,
    message: null as string | null,
  };
  const [state, formAction] = useActionState(addPriceObservation, initialState);

  // price フィールドだけをリセットするための ref
  const priceRef = useRef<HTMLInputElement>(null);

  // 成功時に price フィールドをクリア（他は保持）
  useEffect(() => {
    if (state.message) {
      if (priceRef.current) {
        priceRef.current.value = "";
      }
    }
  }, [state.message]);

  // datetime-local のデフォルト値（マウント後に設定）
  const [defaultObservedAt, setDefaultObservedAt] = useState<string>("");

  useEffect(() => {
    // Asia/Tokyo の現在時刻を取得し、分単位で切り捨てる
    const formatter = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Tokyo",
    });

    const parts = formatter.formatToParts(new Date());
    // formatToParts の順序はロケールに依存しないようにキーで取得
    const get = (type: string) =>
      parts.find((p) => p.type === type)?.value ?? "";

    const year = get("year");
    const month = get("month");
    const day = get("day");
    const hour = get("hour");
    const minute = get("minute");

    const defaultValue = `${year}-${month}-${day}T${hour}:${minute}`;
    setDefaultObservedAt(defaultValue);
  }, []);

  // ---------- ここから検索ロジック ----------
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");

  // フィルタリング（大文字小文字を区別しない）
  const filteredPackages = packages.filter((pkg) =>
    pkg.search.includes(searchTerm.trim().toLowerCase()),
  );

  // 選択中のパッケージがフィルタ結果に無い場合はクリア
  useEffect(() => {
    if (
      selectedPackageId &&
      !filteredPackages.some((p) => p.id === selectedPackageId)
    ) {
      setSelectedPackageId("");
    }
  }, [searchTerm, filteredPackages, selectedPackageId]);

  // ---------- ここまで検索ロジック ----------
  return (
    <div className="max-w-xl mx-auto px-4">
      {/* ページ見出し */}
      <h1 className="text-2xl font-bold mb-4">価格入力</h1>

      {state.error && <p className="text-red-500 mb-2">{state.error}</p>}
      {state.message && <p className="text-green-500 mb-2">{state.message}</p>}

      {/* 検索入力 */}
      <Input
        type="text"
        placeholder="商品名・ブランドで絞り込み"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-2"
      />

      <form action={formAction} className="flex flex-col space-y-4">
        {/* 商品・容量 選択 */}
        <Label htmlFor="product_package_id" className="block font-medium">
          商品・容量
        </Label>
        <select
          id="product_package_id"
          name="product_package_id"
          required
          className="border rounded p-2"
          value={selectedPackageId}
          onChange={(e) => setSelectedPackageId(e.target.value)}
        >
          <option value="">商品・容量を選択</option>
          {filteredPackages.length > 0 ? (
            filteredPackages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.label}
              </option>
            ))
          ) : (
            <option disabled>該当する商品がありません</option>
          )}
        </select>

        {/* 店舗 選択 */}
        <Label htmlFor="shop_id" className="block font-medium">
          店舗
        </Label>
        <select
          id="shop_id"
          name="shop_id"
          required
          className="border rounded p-2"
        >
          <option value="">店舗を選択</option>
          {shops.map((shop) => (
            <option key={shop.id} value={shop.id}>
              {shop.label}
            </option>
          ))}
        </select>

        {/* 価格（円）入力 */}
        <Label htmlFor="price" className="block font-medium">
          価格（円）
        </Label>
        <Input
          id="price"
          type="text"
          name="price"
          placeholder="価格（円）"
          inputMode="decimal"
          required
          ref={priceRef}
        />

        {/* 日時 入力 */}
        <Label htmlFor="observed_at" className="block font-medium">
          日時
        </Label>
        <Input
          id="observed_at"
          type="datetime-local"
          name="observed_at"
          defaultValue={defaultObservedAt}
          required
          suppressHydrationWarning={true}
        />

        {/* 特売 チェックボックス */}
        <Label className="flex items-center space-x-2">
          <input type="checkbox" name="is_sale" className="h-4 w-4" />
          <span>特売</span>
        </Label>

        {/* メモ（任意）入力 */}
        <Label htmlFor="notes" className="block font-medium">
          メモ（任意）
        </Label>
        <Input
          id="notes"
          type="text"
          name="notes"
          placeholder="メモ（任意）"
          maxLength={200}
        />

        {/* 送信ボタン */}
        <Button type="submit" disabled={filteredPackages.length === 0}>
          保存
        </Button>
      </form>
    </div>
  );
}
