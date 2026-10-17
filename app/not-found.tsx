import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-panel rounded-2xl border border-line shadow-sm p-6 max-w-xl w-full mx-auto">
        <h2 className="text-xl font-semibold mb-4">ページが見つかりません</h2>
        <Link href="/" className="text-teal-600 hover:underline">
          ホームへ戻る
        </Link>
      </div>
    </div>
  );
}
