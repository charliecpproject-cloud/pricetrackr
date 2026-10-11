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
      <h1 className="text-2xl font-bold mb-6">Store Chains</h1>

      {chainsError && (
        <p className="text-red-500 mb-4">
          データ取得エラー (チェーン): {chainsError.message}
        </p>
      )}

      {shopsError && (
        <p className="text-red-500 mb-4">
          データ取得エラー (ショップ): {shopsError.message}
        </p>
      )}

      {/* チェーンごとのカード表示 */}
      {chains?.map((chain) => (
        <Card key={chain.id} className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">{chain.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1">
              {shopsByChain[chain.id]?.map((shop) => (
                <li key={shop.id} className="text-sm">
                  {shop.name}
                  {shop.region ? ` (${shop.region})` : ""}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}

      <h2 className="text-xl font-semibold mt-8 mb-4">Add New Store Chain</h2>
      <StoreForm />

      <h2 className="text-xl font-semibold mt-8 mb-4">Add New Shop</h2>
      <ShopForm chains={chains ?? []} />
    </div>
  );
}
