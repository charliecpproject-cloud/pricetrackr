import ScanClient from "./ScanClient";

export const metadata = { title: "バーコード読み取り" };

export default function ScanPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">
          バーコード読み取り
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          登録済みの商品なら、各チェーンの最新の価格を表示します。未登録なら、バーコード入りの商品追加を開きます。
        </p>
      </div>
      <ScanClient />
    </div>
  );
}
