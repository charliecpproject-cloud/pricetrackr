import { createSupabaseServerClient } from "@/lib/supabase/server";
import StoreForm from "./StoreForm";
import ShopForm from "./ShopForm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default async function StoresPage() {
  // Supabase client (server side) – reads session from cookies
  const supabase = await createSupabaseServerClient();

  // Fetch all store chains ordered by name
  const { data: chains, error: chainsError } = await supabase
    .from("store_chains")
    .select("id, name")
    .order("name", { ascending: true });

  // Fetch all shops ordered by name
  const { data: shops, error: shopsError } = await supabase
    .from("shops")
    .select("id, store_chain_id, name, region")
    .order("name", { ascending: true });

  // Group shops by their store_chain_id
  const shopsByChain: Record<string, typeof shops> = {};
  if (shops) {
    shops.forEach((shop) => {
      const key = shop.store_chain_id;
      if (!shopsByChain[key]) {
        shopsByChain[key] = [];
      }
      shopsByChain[key]!.push(shop);
    });
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-4">
      {/* ページ見出し */}
      <h1 className="text-2xl font-bold mb-6">店舗</h1>

      {/* エラーメッセージ */}
      {chainsError && (
        <p className="text-red-500 mb-4">
          チェーンの取得エラー: {chainsError.message}
        </p>
      )}

      {shopsError && (
        <p className="text-red-500 mb-4">
          ショップの取得エラー: {shopsError.message}
        </p>
      )}

      {/* 空状態表示 */}
      {(!chains || chains.length === 0) && (
        <p className="text-gray-500 text-center my-8">まだ店舗がありません。</p>
      )}

      {/* チェーンごとのカード表示 */}
      {chains?.map((chain) => (
        <Card
          key={chain.id}
          className="mb-4 bg-white rounded-2xl border border-stone-200 shadow-sm"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">{chain.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1">
              {shopsByChain[chain.id]?.map((shop) => (
                <li key={shop.id} className="text-sm">
                  {shop.name}
                  {shop.region ? (
                    <span className="text-gray-500 text-xs">
                      {" "}
                      ({shop.region})
                    </span>
                  ) : (
                    ""
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}

      {/* フォームセクション */}
      <h2 className="text-xl font-semibold mt-8 mb-4">チェーンを追加</h2>
      <StoreForm />

      <h2 className="text-xl font-semibold mt-8 mb-4">支店を追加</h2>
      <ShopForm chains={chains ?? []} />
    </div>
  );
}
