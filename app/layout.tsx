import type { Metadata } from "next";
import "./globals.css";
import AppNav from "@/components/AppNav";
import { ToastProvider } from "@/components/ToastProvider";
import ProfileMenu from "@/components/ProfileMenu";
import { getViewer } from "@/lib/auth/viewer";
import { themeStylesheets } from "@/lib/themes/themes";

export const metadata: Metadata = {
  title: "PriceTrackr",
  description: "買い物の価格を記録して比較するアプリ",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const viewer = await getViewer();

  return (
    <html lang="ja" data-theme={viewer.theme} className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        {themeStylesheets(viewer.theme).map((href) => (
          <link key={href} rel="stylesheet" href={href} precedence="default" />
        ))}
        <ToastProvider>
        <ProfileMenu
          loggedIn={viewer.loggedIn}
          email={viewer.email}
          displayName={viewer.displayName}
        />
        <main className="mx-auto w-full min-w-0 max-w-xl px-4 pb-28 pt-2 [overflow-wrap:anywhere] [&_input]:min-w-0 [&_select]:min-w-0 [&_textarea]:min-w-0">
          {children}
        </main>
        <AppNav />
      </ToastProvider>
      </body>
    </html>
  );
}