import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import DemoToggle from "./DemoToggle";

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const isAdmin = profile?.role === "admin";

  const { data: settings } = await supabase
    .from("app_settings")
    .select("demo_mode")
    .eq("id", true)
    .maybeSingle();
  const demoMode = !!settings?.demo_mode;

  const cardCls = "rounded-2xl border border-stone-200 bg-white p-5 shadow-sm";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">設定</h1>
        <p className="mt-1 text-sm text-stone-500">アカウントと管理者設定</p>
      </div>

      <div className={`${cardCls} space-y-2`}>
        <h2 className="text-lg font-bold text-stone-900">アカウント</h2>
        <p className="break-all text-stone-700">{user.email}</p>
        <p className="text-sm text-stone-500">種類：{isAdmin ? "管理者" : "一般"}</p>
      </div>

      {isAdmin && (
        <div className={`${cardCls} space-y-3`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-stone-900">デモモード</h2>
            <span
              className={`rounded-full px-3 py-1 text-sm font-bold ${
                demoMode ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-600"
              }`}
            >
              {demoMode ? "オン" : "オフ"}
            </span>
          </div>
          <p className="text-sm text-stone-600">
            オンにすると、ログインしていない人でも、すべてのページを閲覧できます（閲覧のみ。保存・編集・削除はできません）。オフの間は、ログインした人だけが使えます。
          </p>
          <DemoToggle demoMode={demoMode} />
        </div>
      )}
    </div>
  );
}