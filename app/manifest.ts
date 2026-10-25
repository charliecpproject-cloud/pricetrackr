import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PriceTrackr",
    short_name: "PriceTrackr",
    description: "買い物の価格を記録して比較するアプリ",
    start_url: "/",
    display: "standalone",
    lang: "ja",
    background_color: "#f6f7f5",
    theme_color: "#0d9488",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
