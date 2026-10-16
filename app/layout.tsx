import type { Metadata } from "next";
import "./globals.css";
import AppNav from "@/components/AppNav";

export const metadata: Metadata = {
  title: "PriceTrackr",
  description: "買い物の価格を記録して比較するアプリ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        <main className="mx-auto w-full min-w-0 max-w-xl px-4 pb-28 pt-6 [overflow-wrap:anywhere] [&_input]:min-w-0 [&_select]:min-w-0 [&_textarea]:min-w-0">
          {children}
        </main>
        <AppNav />
      </body>
    </html>
  );
}