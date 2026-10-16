import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CATEGORY_LABEL, parseCategory } from "@/lib/stores/category";
import StoreForm from "./StoreForm";
import ShopForm from "./ShopForm";
import CouponForm from "./CouponForm";
import ChainPicker from "./ChainPicker";
import { ChainDeleteButton, ChainEditor, ShopRow } from "./ManageForms";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default async function StoresPage({
  searchParams,
}: {
  searchParams: Promise<{ chain?: string }>;
}) {
  const { chain: chainParam } = await searchParams;

  const supabase = await createSupabaseServerClient();

  // All chains (small list), used for the dropdown and the add-branch form
  const { data: chains, error: chainsError } = await supabase
    .from("store_chains")
    .select("id, name, category, coupon_percents")
    .order("name", { ascending: true });

  // The chain chosen in the dropdown (the id must be a valid UUID and exist)
  const parsedId = z.string().uuid().safeParse(chainParam);
  const selected = parsedId.success
    ? (chains ?? []).find((c) => c.id === parsedId.data)
    : undefined;
  const category = selected ? parseCategory(selected.category) : null;

  // Branches are loaded only for the chosen chain
  const { data: shops, error: shopsError } = selected
    ? await supabase
        .from("shops")
        .select("id, name, region, address")
        .eq("store_chain_id", selected.id)
        .order("name", { ascending: true })
    : { data: null, error: null };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">店舗</h1>

      {chainsError && (
        <p className="mb-4 text-red-600">チェーンの取得エラー: {chainsError.message}</p>
      )}
      {shopsError && (
        <p className="mb-4 text-red-600">ショップの取得エラー: {shopsError.message}</p>
      )}

      {!chains || chains.length === 0 ? (
        <p className="my-8 text-center text-stone-500">まだ店舗がありません。</p>
      ) : (
        <div className="space-y-4">
          <ChainPicker
            chains={chains.map((c) => ({ id: c.id, name: c.name, category: c.category }))}
            selectedId={selected?.id ?? ""}
          />

          {selected ? (
            <Card
              key={selected.id}
              className="rounded-2xl border border-stone-200 bg-white shadow-sm"
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex flex-wrap items-center gap-2 text-lg font-semibold">
                  {selected.name}
                  {category && (
                    <span className="rounded bg-stone-100 px-2 py-0.5 text-sm font-medium text-stone-600">
                      {CATEGORY_LABEL[category]}
                    </span>
                  )}
                  {selected.coupon_percents && selected.coupon_percents.length > 0 && (
                    <span className="rounded bg-rose-100 px-2 py-0.5 text-sm font-medium text-rose-600">
                      クーポン{" "}
                      {selected.coupon_percents.map((p: number) => `${p}%`).join(" / ")}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {shops && shops.length > 0 ? (
                  <ul className="space-y-2">
                    {shops.map((shop) => (
                      <ShopRow
                        key={shop.id}
                        shop={{
                          id: shop.id,
                          name: shop.name,
                          region: shop.region,
                          address: shop.address,
                        }}
                      />
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-stone-500">支店はまだありません。</p>
                )}

                {/* クーポン・会員価格・ポイントの設定 */}
                <div className="mt-4">
                  <CouponForm
                    chainId={selected.id}
                    current={selected.coupon_percents ?? []}
                  />
                </div>

                <div className="mt-4 space-y-2 border-t border-stone-100 pt-4">
                  <ChainEditor
                    key={selected.id}
                    chain={{ id: selected.id, name: selected.name, category }}
                  />
                  <ChainDeleteButton id={selected.id} shopCount={shops?.length ?? 0} />
                </div>
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-stone-500">
              チェーンを選ぶと、支店とクーポンの設定が表示されます。
            </p>
          )}
        </div>
      )}

      <details className="mt-8 rounded-2xl border border-stone-200 bg-white p-4">
        <summary className="cursor-pointer text-base font-semibold text-stone-900">
          チェーンを追加
        </summary>
        <div className="mt-4">
          <StoreForm />
        </div>
      </details>

      <details className="mt-4 rounded-2xl border border-stone-200 bg-white p-4">
        <summary className="cursor-pointer text-base font-semibold text-stone-900">
          支店を追加
        </summary>
        <div className="mt-4">
          <ShopForm chains={chains ?? []} selectedChainId={selected?.id} />
        </div>
      </details>
    </div>
  );
}