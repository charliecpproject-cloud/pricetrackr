import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppNav from "@/components/AppNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PriceTrackr",
  description: "買い物の価格を記録して比較するアプリ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        <main className="mx-auto w-full min-w-0 max-w-xl px-4 pb-28 pt-6 [overflow-wrap:anywhere] [&_input]:min-w-0 [&_select]:min-w-0 [&_textarea]:min-w-0">{children}</main>
        <AppNav />
      </body>
    </html>
  );
}
